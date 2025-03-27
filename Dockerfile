# Stage 1: Base with Bun and Curl
FROM oven/bun:1 as base
# Install curl for healthcheck in later stages
RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base as deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies (--frozen-lockfile ensures consistency)
RUN bun install --frozen-lockfile

# Stage 3: Builder
FROM deps as builder
WORKDIR /app

# Copy source code
# Use .dockerignore to control what's copied
COPY . .

# Declare ARGs for Firebase variables needed at build time
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
# Add other VITE_ prefixed variables needed during build here

# Build the application
# Set NODE_ENV for the build process
ENV NODE_ENV=production
# Pass ARGs explicitly as environment variables to the build command
# This ensures Vite picks them up via import.meta.env
RUN VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    bun run build

# Prune development dependencies after build
RUN bun install --production --frozen-lockfile

# Stage 4: Runner (Production)
# Use the slim image for a smaller final size
FROM base as runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy necessary files from the builder stage
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json
COPY --from=builder --chown=bun:bun /app/bun.lockb ./bun.lockb
# Copy Vite config to ensure preview server uses allowedHosts etc.
COPY --from=builder --chown=bun:bun /app/vite.config.ts ./vite.config.ts
# Copy tsconfig if needed by Vite/plugins during preview (less common)
COPY --from=builder --chown=bun:bun /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=bun:bun /app/tsconfig.node.json ./tsconfig.node.json

# Don't run as root
USER bun

# Expose the port Vite preview will run on
EXPOSE 5173

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Start the application using Vite's preview server
# This serves the static files from the 'dist' directory
CMD ["bunx", "--bun", "vite", "preview", "--host", "--port", "5173"]

# Note: For a pure development setup without building,
# use docker-compose.yml which mounts the source code
# and runs `bun run dev`.