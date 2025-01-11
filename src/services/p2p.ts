import { spawn } from "child_process";
import { EventEmitter } from "events";
import { Logger } from "../utils/logger";

type LogLevel = "debug" | "info" | "warn" | "error";
type NodeEvent = {
  type: "ready" | "message" | "error" | "log" | "peer_discovered";
  peerId?: string;
  from?: string;
  data?: any;
  message?: string;
  level?: LogLevel;
  namespace?: string;
  meta?: any;
  topics?: string[];
};

export class P2PNode extends EventEmitter {
  private process: ReturnType<typeof spawn> | null = null;
  private peerId: string | null = null;

  constructor(
    private execPath: string,
    private port: number,
    private name: string,
    private privateKey?: string
  ) {
    super();
  }

  public async start(): Promise<void> {
    const args = ["--port", this.port.toString(), "--name", this.name];

    if (this.privateKey) {
      args.push("--private-key", this.privateKey);
    }

    Logger.info("p2p", "Starting P2P node", { args });
    this.process = spawn(this.execPath, args);

    if (!this.process.stdout || !this.process.stderr) {
      throw new Error("Failed to start P2P node: no stdout/stderr");
    }

    // Handle process errors
    this.process.on("error", (error) => {
      Logger.error("p2p", "Process error", { error });
      this.emit("error", error);
    });

    this.process.on("exit", (code) => {
      Logger.info("p2p", "Process exited", { code });
      if (code !== 0) {
        this.emit("error", new Error(`Process exited with code ${code}`));
      }
    });

    // Handle stderr
    this.process.stderr.on("data", (data) => {
      Logger.error("p2p", "Process stderr", { data: data.toString() });
    });

    // Handle stdout
    this.process.stdout.on("data", (data) => {
      const events = data.toString().split("\n").filter(Boolean);
      for (const eventStr of events) {
        try {
          const event = JSON.parse(eventStr) as NodeEvent;
          switch (event.type) {
            case "ready":
              if (event.peerId) {
                this.peerId = event.peerId;
                Logger.info("p2p", "Node ready", { peerId: this.peerId });
              }
              break;
            case "message":
              if (event.from && event.data) {
                this.emit("message", event.from, event.data);
              }
              break;
            case "error":
              if (event.message) {
                this.emit("error", new Error(event.message));
              }
              break;
            case "log":
              if (event.level && event.namespace) {
                switch (event.level.toLowerCase()) {
                  case "info":
                    Logger.info(
                      event.namespace,
                      event.message || "",
                      event.meta
                    );
                    break;
                  case "error":
                    Logger.error(
                      event.namespace,
                      event.message || "",
                      event.meta
                    );
                    break;
                  case "warn":
                    Logger.warn(
                      event.namespace,
                      event.message || "",
                      event.meta
                    );
                    break;
                  case "debug":
                    Logger.debug(
                      event.namespace,
                      event.message || "",
                      event.meta
                    );
                    break;
                }
              }
              break;
            case "peer_discovered":
              if (event.peerId) {
                Logger.info("p2p", "Discovered peer", {
                  peerId: event.peerId,
                  topics: event.topics,
                });
              }
              break;
          }
        } catch (error) {
          // Only log parse errors if it's not empty or whitespace
          if (eventStr.trim()) {
            Logger.error("p2p", "Failed to parse P2P node output", {
              error,
              data: eventStr,
            });
          }
        }
      }
    });

    // Send connect command
    this.sendCommand({ type: "connect", port: this.port });
  }

  public async stop(): Promise<void> {
    if (this.process) {
      this.sendCommand({ type: "shutdown" });
      this.process = null;
    }
  }

  public async sendMessage(peerId: string, data: any): Promise<void> {
    this.sendCommand({ type: "send", peerId, data });
  }

  public getPeerId(): string | null {
    return this.peerId;
  }

  private sendCommand(command: any): void {
    if (!this.process?.stdin) {
      throw new Error("P2P node not started");
    }
    this.process.stdin.write(JSON.stringify(command) + "\n");
  }
}
