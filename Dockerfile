# Use the official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Expose the port (Vite default is 5173)
EXPOSE 5173

# Start the application in development mode with host configuration
CMD ["bun", "run", "dev", "--host", "--port", "5173"] 