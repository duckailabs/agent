import { config as dotenv } from "dotenv";
import express, { Request, Response } from "express";
import { P2PClient } from "../sdk/src/p2p";
import { Message } from "../sdk/src/p2p/types";
import { processMessage } from "./agent";
import { Logger } from "./utils/logger";

// Load environment variables
dotenv();

// Initialize client variable in broader scope
let client: P2PClient;

// Initialize Express app
const app = express();
app.use(express.json());

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

// HTTP endpoint to send messages to the agent - Ollama compatible format
app.post("/api/chat", (req: Request, res: Response) => {
  (async () => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: { message: "Messages array is required" },
        });
      }

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content) {
        return res.status(400).json({
          error: { message: "Invalid message format" },
        });
      }

      Logger.info("http", "Received chat message", {
        content: lastMessage.content,
      });

      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Process message with LLM
      const response = await processMessage(lastMessage.content);

      // Send the response as a single message
      const data = {
        model: process.env.AGENT_NAME || "default-agent",
        created_at: new Date().toISOString(),
        response: response,
        done: false,
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // Send final chunk to indicate completion
      const finalData = {
        model: process.env.AGENT_NAME || "default-agent",
        created_at: new Date().toISOString(),
        response: "",
        done: true,
      };
      res.write(`data: ${JSON.stringify(finalData)}\n\n`);
      res.end();
    } catch (error) {
      Logger.error("http", "Failed to handle chat message", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: { message: "Failed to process message" },
      });
    }
  })();
});

async function main() {
  try {
    // Initialize logger
    await Logger.init("agent", { useStdout: true });

    const p2pAddress = `localhost:${process.env.GRPC_PORT || "50051"}`;
    const p2pPort = parseInt(process.env.P2P_PORT || "8000");
    const httpPort = parseInt(process.env.HTTP_PORT || "3000");
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

    // Start HTTP server
    app.listen(httpPort, () => {
      Logger.info("http", "HTTP server started", { port: httpPort });
    });

    Logger.info("agent", "Agent started", {
      agentId,
      p2pAddress,
      httpPort,
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
