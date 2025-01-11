import { execSync } from "child_process";
import * as path from "path";
import { AGENT_CONFIG } from "../src/config/agent";

// Map each agent to a region
const AGENT_REGIONS: Record<string, string> = {
  "market-watcher": "lhr", // London
  "trend-spotter": "fra", // Frankfurt
  "news-analyzer": "iad", // Virginia
};

async function deployToFly() {
  try {
    // Check if flyctl is installed
    try {
      execSync("flyctl version");
    } catch {
      console.log("Installing flyctl...");
      execSync("curl -L https://fly.io/install.sh | sh");
    }

    // Verify p2p-node executable exists
    const p2pNodePath = path.resolve(__dirname, "../node/p2p-node");
    try {
      execSync(`test -x "${p2pNodePath}"`, { stdio: "ignore" });
    } catch (error) {
      console.error(
        "p2p-node executable not found or not executable at:",
        p2pNodePath
      );
      process.exit(1);
    }

    // Deploy each agent
    const agents = AGENT_CONFIG as any;
    for (const [agentId, config] of Object.entries(agents.agents)) {
      const region = AGENT_REGIONS[agentId];
      const instanceName = `duck-${agentId}`;

      console.log(`\nDeploying ${(config as any).name} to ${region}...`);

      try {
        // Create machine in specific region with unique env vars
        execSync(
          `flyctl machine run . \
          --region ${region} \
          --name ${instanceName} \
          --env AGENT_NAME=${instanceName} \
          --env AGENT_TYPE=${agentId} \
          --env REGION=${region} \
          --env HOST=0.0.0.0 \
          --env PORT=3000 \
          --env P2P_PORT=8000 \
          --env P2P_NODE_PATH=/app/node/p2p-node \
          --env LOG_LEVEL=info \
          --env OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ""} \
          --env FATDUCK_API_URL=${process.env.FATDUCK_API_URL || ""} \
          --env FATDUCK_API_KEY=${process.env.FATDUCK_API_KEY || ""}`,
          { stdio: "inherit" }
        );

        console.log(`Successfully deployed ${instanceName} to ${region}`);
      } catch (error) {
        console.error(`Failed to deploy ${instanceName}:`, error);
      }
    }

    console.log("\nDeployment complete!");

    // Show running instances
    console.log("\nRunning instances:");
    execSync("flyctl machine list", { stdio: "inherit" });
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deployToFly();
