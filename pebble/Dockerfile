FROM --platform=linux/amd64 python:3.11-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libfreetype6 \
    libpng16-16 \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install pebble-tool
RUN pip install pebble-tool

# Install Pebble SDK
RUN pebble sdk install latest

# Set working directory
WORKDIR /app

# Build command
CMD ["sh", "-c", "cp package.json appinfo.json && pebble build"]
