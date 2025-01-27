export interface P2PClientOptions {
  address: string;
  timeout?: number;
  binaryPath?: string; // Path to P2P node binary
}

export interface Message {
  messageId: string;
  fromAgentId: string;
  content: string;
  timestamp: number;
}

export type MessageHandler = (message: Message) => void;

export interface P2PNodeOptions {
  port?: number;
  agentId?: string;
}
