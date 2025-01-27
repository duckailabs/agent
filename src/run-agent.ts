import { P2PClient } from "../sdk/src/p2p";
import { Message } from "../sdk/src/p2p/types";
import { config } from "./config";
import { Logger } from "./utils/logger";

// Initialize client variable in broader scope
let client: P2PClient;

async function handleMessage(message: Message) {
  try {
    Logger.info("agent", "Got message", {
      from: message.fromAgentId,
      content: message.content,
    });

    // Echo back to sender
    await client.sendMessage(message.fromAgentId, `Echo: ${message.content}`);
  } catch (error) {
    Logger.error("agent", "Failed to handle message", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function main() {
  try {
    // Initialize logger
    await Logger.init("agent", { useStdout: true });

    // Initialize P2P client
    client = new P2PClient({
      address: config.p2p.address || "localhost:50051",
      binaryPath: config.p2p.binaryPath,
      timeout: 5000,
    });

    // Register message handler before connecting
    client.onMessage(handleMessage);

    // Connect to P2P network
    await client.connect({
      port: config.p2p.port,
      agentId: config.agentId || "default-agent",
    });

    Logger.info("agent", "Agent started", {
      agentId: config.agentId,
      p2pAddress: config.p2p.address,
    });

    // Handle shutdown
    process.on("SIGINT", async () => {
      Logger.info("agent", "Shutting down");
      await client.disconnect();
      process.exit(0);
    });
  } catch (error) {
    Logger.error("agent", "Failed to start agent", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
