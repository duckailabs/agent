import { config as dotenv } from "dotenv";
import { P2PClient } from "../sdk/src/p2p/client";
import { ListAgentsResponse } from "../sdk/src/p2p/types";
import { Logger } from "./utils/logger";

// Load environment variables
dotenv();

// Initialize client variable in broader scope
let client: P2PClient;

export class P2PMonitor {
  private intervalId?: NodeJS.Timeout;
  private lastAgentCount: number = 0;

  constructor(private client: P2PClient) {}

  /**
   * Start monitoring agents with periodic checks
   */
  async startMonitoring(intervalMs: number = 10000) {
    if (this.intervalId) {
      Logger.warn("monitor", "Monitor is already running");
      return;
    }

    // Do initial check
    await this.checkAgents();

    // Set up periodic checks
    this.intervalId = setInterval(async () => {
      await this.checkAgents();
    }, intervalMs);

    Logger.info("monitor", "Started agent monitoring", {
      intervalMs,
    });
  }

  /**
   * Stop monitoring agents
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      Logger.info("monitor", "Stopped agent monitoring");
    }
  }

  /**
   * Check and log current agents
   */
  private async checkAgents() {
    try {
      const response = (await this.client.listAgents()) as ListAgentsResponse;
      const agents = response.agents || [];
      const agentCount = agents.length;

      // Only log when count changes or on first check
      if (agentCount !== this.lastAgentCount) {
        Logger.info("monitor", "Connected agents", {
          count: agentCount,
          agents: agents.map((a) => ({
            name: a.agent_name,
            peerId: a.peer_id,
            ethAddr: a.agent_id,
            connectedSince: a.connected_since,
          })),
        });
      }

      this.lastAgentCount = agentCount;
    } catch (error) {
      Logger.error("monitor", "Failed to check agents", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function main() {
  try {
    // Initialize logger
    await Logger.init("agent", { useStdout: true });

    const p2pAddress = `localhost:${process.env.GRPC_PORT || "50051"}`;
    const p2pPort = parseInt(process.env.P2P_PORT || "8000");
    const agentId = process.env.AGENT_NAME || "default-agent";

    // Initialize P2P client
    client = new P2PClient({
      address: p2pAddress,
      binaryPath: process.env.P2P_NODE_PATH,
      timeout: 5000,
    });

    // Connect to P2P network
    await client.connect({
      port: p2pPort,
      agentId: agentId,
    });
    const monitor = new P2PMonitor(client);
    await monitor.startMonitoring();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      monitor.stopMonitoring();
      await client.disconnect();
      process.exit(0);
    });
  } catch (error) {
    Logger.error("monitor", "Failed to start monitoring", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
