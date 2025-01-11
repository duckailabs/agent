import { config } from "dotenv";
import { Agent } from "./agents/agent";
import { Logger } from "./utils/logger";

// Load environment variables

async function main() {
  config();
  // Required configuration
  const nodePath = process.env.P2P_NODE_PATH;
  const privateKey = process.env.P2P_PRIVATE_KEY;

  if (!nodePath || !privateKey) {
    console.error("Error: P2P_NODE_PATH and P2P_PRIVATE_KEY are required");
    process.exit(1);
  }

  // Optional configuration with defaults
  const port = parseInt(process.env.P2P_PORT || "8000");
  const agentName = process.env.AGENT_NAME || "duck-agent";
  try {
    // Initialize logger with both stdout and file logging
    await Logger.init(agentName, { useStdout: true, useFile: true });

    // Create and start agent
    const agent = new Agent(agentName, port, nodePath, privateKey as string);
    await agent.start();

    // Handle process signals
    process.on("SIGINT", () => agent.stop());
    process.on("SIGTERM", () => agent.stop());
  } catch (error) {
    Logger.error("run-agent", "Failed to start agent", { error });
    process.exit(1);
  }
}

main();
