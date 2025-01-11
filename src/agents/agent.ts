import { AGENT_CONFIG } from "../config/agent";
import { P2PNode } from "../services/p2p";
import { Logger } from "../utils/logger";

export class Agent {
  private node: P2PNode;

  constructor(
    private name: string,
    private port: number,
    private nodePath: string,
    private privateKey?: string
  ) {
    this.node = new P2PNode(nodePath, port, name, privateKey);

    // Handle P2P events
    this.node.on("message", this.handleMessage.bind(this));
    this.node.on("error", this.handleError.bind(this));
  }

  public async start(): Promise<void> {
    try {
      Logger.info(this.name, "Starting agent...");
      await this.node.start();
      Logger.info(this.name, "Agent started successfully", {
        peerId: this.node.getPeerId(),
      });
    } catch (error) {
      Logger.error(this.name, "Failed to start agent", { error });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    await this.node.stop();
  }

  private async handleMessage(from: string, data: any): Promise<void> {
    try {
      Logger.info(this.name, "Received message", { from, data });

      // Try to execute market analysis tool
      let marketData = null;
      try {
        const result = await AGENT_CONFIG.tool.execute();
        if (result.success) {
          marketData = result.data;
        } else {
          Logger.error(this.name, "Failed to get market analysis", result);
        }
      } catch (toolError) {
        Logger.error(this.name, "Market analysis tool execution failed", {
          error: toolError,
        });
      }

      // Send response with prompt regardless of market data
      try {
        await this.node.sendMessage(from, {
          type: "response",
          data: marketData,
          prompt: AGENT_CONFIG.prompt,
        });
        Logger.info(this.name, "Sent response", { to: from });
      } catch (sendError) {
        Logger.error(this.name, "Failed to send response", {
          error: sendError,
        });
      }
    } catch (error) {
      Logger.error(this.name, "Failed to handle message", { error });
    }
  }

  private handleError(error: Error): void {
    Logger.error(this.name, "P2P node error", { error });
  }
}
