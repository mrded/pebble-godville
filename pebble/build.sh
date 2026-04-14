#!/bin/bash
set -e

# Build the Docker image (x86_64 for stpyv8 compatibility)
docker build --platform linux/amd64 -t pebble-builder .

# Run the build with source mounted
docker run --rm --platform linux/amd64 \
  -v "$(pwd)/src:/app/src:ro" \
  -v "$(pwd)/resources:/app/resources:ro" \
  -v "$(pwd)/package.json:/app/package.json:ro" \
  -v "$(pwd)/wscript:/app/wscript:ro" \
  -v "$(pwd)/build:/app/build" \
  pebble-builder

echo "Build complete! Output in ./build/"
