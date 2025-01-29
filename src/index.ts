import { config as dotenv } from "dotenv";
import { P2PClient } from "../sdk/src/p2p";
import { Message } from "../sdk/src/p2p/types";
import { processMessage } from "./agent";
import { Logger } from "./utils/logger";

// Load environment variables
dotenv();

// Initialize client variable in broader scope
let client: P2PClient;

async function handleMessage(message: Message) {
  try {
    Logger.info("agent", "Got message", {
      from: message.fromAgentId,
      content: message.content,
    });

    // Process message with LLM
    const response = await processMessage(message.content);

    // Send response back to sender
    await client.sendMessage(message.fromAgentId, response);
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

    const p2pAddress = `localhost:${process.env.GRPC_PORT || "50051"}`;
    const p2pPort = parseInt(process.env.P2P_PORT || "8000");
    const agentId = process.env.AGENT_NAME || "default-agent";

    // Initialize P2P client
    client = new P2PClient({
      address: p2pAddress,
      binaryPath: process.env.P2P_NODE_PATH,
      timeout: 5000,
    });

    // Register message handler before connecting
    client.onMessage(handleMessage);

    // Connect to P2P network
    await client.connect({
      port: p2pPort,
      agentId: agentId,
    });

    Logger.info("agent", "Agent started", {
      agentId,
      p2pAddress,
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
