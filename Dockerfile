FROM node:18-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code (which includes the p2p-node executable)
COPY . .

# Make p2p-node executable
RUN chmod +x /app/sdk/p2p-node.js

# Build the project
RUN pnpm run build

# Start the agent
CMD ["pnpm", "run", "agent"] 