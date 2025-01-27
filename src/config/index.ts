import { config as dotenv } from "dotenv";

// Load environment variables
dotenv();

export const config = {
  agentId: process.env.AGENT_NAME,
  p2p: {
    address: `localhost:${process.env.GRPC_PORT || "50051"}`,
    port: parseInt(process.env.P2P_PORT || "8000"),
    binaryPath: process.env.P2P_NODE_PATH,
  },
};
