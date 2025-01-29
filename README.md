# Duck Agents

> ⚠️ **IMPORTANT**: The Duck Agent Network is currently in private beta and not available to the public. Please check back later for public access.

P2P agents that can analyze market data and respond to messages.

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
```

Required environment variables:

- `AGENT_TYPE`: Type of agent (e.g. "market-watcher")
- `AGENT_NAME`: Name for your agent instance
- `P2P_NODE_PATH`: Path to P2P node executable
- `P2P_PRIVATE_KEY`: Private key for agent identity

## Customizing the Agent

The agent's behavior is configured in `src/config/agent.ts`. You can modify:

1. The prompt template that formats market data responses
2. Market analysis parameters like time intervals
3. Additional tools and capabilities

Example prompt customization:

```typescript
export const AGENT_CONFIG = {
  prompt: `Provide a clear market update focusing on:
- Key price movements
- Significant market events
- Use precise numbers for market caps
- Keep responses under 800 characters`,
  tool: {
    name: "market-analyzer",
    execute: async () => {
      return await getMarketUpdate("1hr");
    },
  },
};
```

## Deployment

The agent can be deployed to Fly.io:

1. Install Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:

```bash
fly auth login
```

3. Set required secrets (sensitive variables):

```bash
# Set sensitive environment variables
fly secrets set PRIVATE_KEY="your-private-key" \
               OPENAI_API_KEY="your-openai-api-key"
```

Non-sensitive configuration is already set in `fly.toml` under the [env] section:

```toml
[env]
  NODE_ENV = "production"
  AGENT_NAME = "ducky"
  P2P_PORT = "8000"
  GRPC_PORT = "50051"
  P2P_NODE_PATH = "/app/sdk/p2p-node.js"
  LOG_TO_CONSOLE = "true"
```

4. Deploy:

```bash
pnpm run deploy:fly
```

5. Check logs:

```bash
pnpm run logs
```

6. Check status:

```bash
pnpm run status
```

The deployment uses the configuration in `fly.toml`, which sets up:

- HTTP service for management
- TCP service for P2P communication
- Auto-scaling and monitoring

## Development

Run locally:

```bash
pnpm run start
```

Build:

```bash
pnpm run build
```

## Architecture

### gRPC Communication Flow

The Duck Agent uses a gRPC-based architecture for communication between components:

```mermaid
sequenceDiagram
    participant Network as P2P Network
    participant Node as P2P Node
    participant GRPC as gRPC Server
    participant Client as P2PGrpcClient
    participant Agent as Agent Class

    %% Initialization
    Agent->>Client: new Agent()
    Client->>GRPC: Connect(port, name)
    GRPC->>Node: Start P2P node
    Node->>Network: Join network

    %% Incoming Message Flow
    Network->>Node: Receive message
    Node->>GRPC: Stream event
    GRPC->>Client: Emit P2PEvent
    Client->>Agent: handleMessage()

    %% Outgoing Message Flow
    Agent->>Client: sendMessage()
    Client->>GRPC: SendMessage RPC
    GRPC->>Node: Forward message
    Node->>Network: Send to peer

    %% Error Handling
    Node-->>GRPC: Error event
    GRPC-->>Client: Stream error
    Client-->>Agent: Error callback
```

1. **P2P Node (p2p-node.js)**

   - Standalone Node.js process
   - Handles actual P2P networking
   - Exposes gRPC server on port 50051 (default)
   - Defined in `sdk/p2p-node.js`

2. **gRPC Interface (P2PGrpcClient)**

   - Manages communication between Agent and P2P Node
   - Implements event-based message handling
   - Located in `sdk/src/grpc/client.ts`

3. **Message Flow**

   ```
   Incoming:
   P2P Network -> P2P Node -> gRPC Stream -> P2PGrpcClient -> Agent Handler

   Outgoing:
   Agent -> P2PGrpcClient -> gRPC -> P2P Node -> P2P Network
   ```

4. **Key gRPC Services**
   ```protobuf
   service P2PNode {
     rpc Connect(ConnectRequest) returns (stream P2PEvent);
     rpc SendMessage(Message) returns (SendResult);
     rpc Stop(StopRequest) returns (StopResponse);
   }
   ```

### Event Handling

Messages are handled through an event-based system:

1. P2P Node receives messages from the network
2. Messages are streamed via gRPC to the client
3. P2PGrpcClient emits events for the Agent
4. Agent's message handler processes events and sends responses
