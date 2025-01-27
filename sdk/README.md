# DuckAI P2P SDK

Simple SDK for interacting with the DuckAI P2P node.

## Usage

```typescript
import { P2PNode } from "./sdk";

// Create node instance
const node = new P2PNode({
  name: "my-agent",
  port: 8000,
  privateKey: "optional-private-key",
});

// Start the node
await node.start();

// Listen for messages
node.on("message", (message) => {
  console.log(`Got message from ${message.from}: ${message.content}`);
});

// Send a message
await node.sendMessage("0x123...", "Hello!");

// Cleanup
await node.stop();
```

## Features

- Simple message sending/receiving
- Automatic binary management
- Type-safe API
- Event-based communication
