# Use the official Bun image
FROM oven/bun:1.0

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb (if it exists)
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Expose the port (Vite default is 5173)
EXPOSE 5173

# Start the application
CMD ["bun", "run", "dev", "--host"] 