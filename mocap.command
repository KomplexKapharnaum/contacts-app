#!/bin/bash

# Usage: ./serve.sh /path/to/your/static-folder [port]
# Example: ./serve.sh ~/Projects/my-website 8080

PORT="${1:-8000}"  # Default to port 8000 if not specified

# Kill any existing Python HTTP server on the specified port
PID=$(lsof -ti tcp:$PORT)
if [ -n "$PID" ]; then
  echo "Killing existing Python HTTP server on port $PORT (PID: $PID)"
  kill "$PID"
fi

cd "$(dirname "$0")/www/mocap/"
echo "Serving $TARGET_DIR at http://localhost:$PORT"

# Start Python HTTP server in the background
python3 -m http.server $PORT &
SERVER_PID=$!

# Ensure server is killed on script exit
trap "echo 'Stopping server...'; kill $SERVER_PID" EXIT

# Wait a moment to ensure the server starts
sleep 1

# Open Chrome with the local page
open -a "Google Chrome" "http://localhost:$PORT?w=512&h=512"

# Wait for the server process
wait $SERVER_PID