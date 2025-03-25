# Stage 1: Dependencies
FROM oven/bun:1 as deps
WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install

# Stage 2: Development
FROM oven/bun:1
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run as root
RUN chown -R bun:bun /app
USER bun

# Expose the port
EXPOSE 5173

# Start the application in development mode
ENV NODE_ENV=development
CMD ["bun", "run", "dev", "--host"]

# Stage 3: Builder
FROM oven/bun:1 as builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN bun run build

# Stage 4: Runner
FROM oven/bun:1-slim as runner
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Don't run as root
RUN chown -R bun:bun /app
USER bun

# Copy built assets from builder stage
COPY --from=builder --chown=bun:bun /app/package.json ./package.json
COPY --from=builder --chown=bun:bun /app/bun.lockb ./bun.lockb
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/src ./src
COPY --from=builder --chown=bun:bun /app/index.html ./index.html
COPY --from=builder --chown=bun:bun /app/vite.config.ts ./vite.config.ts
COPY --from=builder --chown=bun:bun /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=bun:bun /app/tsconfig.node.json ./tsconfig.node.json

# Expose the port
EXPOSE 5173

# Start the application in development mode
ENV NODE_ENV=development
CMD ["bun", "run", "dev", "--host"] 