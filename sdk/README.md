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

## Installation

```bash
npm install @duckai/agents-sdk
```

The SDK will automatically download the required p2p-node files during installation. By default, it uses version 0.1.5 of the p2p-node.

### Updating P2P Node Version

If you need to use a different version of the p2p-node:

```bash
# Update to a specific version
P2P_VERSION=0.1.4 npm run update-p2p
```

Or update the `p2pNodeVersion` in package.json and run:

```bash
npm run update-p2p
```

## Files Downloaded

During installation, the SDK will download:

- `p2p-node.js` - The bundled node executable
- Proto files for GRPC communication

These files are downloaded from the GitHub releases at: https://github.com/duckailabs/node/releases
