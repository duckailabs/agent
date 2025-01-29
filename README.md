# Duck Agents

> ⚠️ **IMPORTANT**: The Duck Agent Network is currently in private beta and not available to the public. Please check back later for public access.

P2P agents that can communicate and process messages using LLM capabilities.

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

- `AGENT_NAME`: Name for your agent instance
- `P2P_NODE_PATH`: Path to P2P node executable
- `PRIVATE_KEY`: Private key for P2P network identity
- `OPENAI_API_KEY`: OpenAI API key for LLM processing

## Development

Run locally:

```bash
pnpm run start
```

## Deployment

The agent can be deployed to Fly.io easily:

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

- TCP service on port 8000 for P2P network communication
- Internal gRPC service on port 50051 for P2P node communication
- Auto-scaling and monitoring

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

### Components

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

4. **Message Processing**
   - Each incoming message is processed using OpenAI's LLM
   - Responses are automatically sent back to the message sender
   - Error handling and logging is built in
