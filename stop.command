#!/bin/bash

# Hockey Team Manager - Stop Script
echo "🏒 Stopping Hockey Team Manager..."
echo ""

# Find and kill the server process
if pgrep -f "node server.js" > /dev/null; then
    pkill -f "node server.js"
    sleep 1

    if pgrep -f "node server.js" > /dev/null; then
        echo "❌ Failed to stop server"
    else
        echo "✅ Server stopped successfully!"
    fi
else
    echo "ℹ️  Server is not running"
fi

echo ""
echo "Press any key to close this window..."
read -n 1
