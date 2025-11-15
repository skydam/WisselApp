#!/bin/bash

# Hockey Team Manager - Startup Script
cd "$(dirname "$0")"

echo "🏒 Starting Hockey Team Manager..."
echo ""

# Check if server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server is already running on http://localhost:3000"
    echo ""
    echo "Opening in browser..."
    open http://localhost:3000
else
    echo "Starting server on http://localhost:3000..."
    echo ""

    # Start the server
    node server.js &
    SERVER_PID=$!

    # Wait a moment for server to start
    sleep 2

    # Check if it started successfully
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ Server started successfully!"
        echo ""
        echo "Opening in browser..."
        open http://localhost:3000
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🏒 Hockey Team Manager is now running!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Access at: http://localhost:3000"
        echo "Server PID: $SERVER_PID"
        echo ""
        echo "To stop the server, run:"
        echo "  ./stop.command"
        echo ""
        echo "Or manually with:"
        echo "  kill $SERVER_PID"
        echo ""
    else
        echo "❌ Failed to start server"
        echo "Check for errors above"
        exit 1
    fi
fi

# Keep terminal open
echo "Press any key to close this window..."
read -n 1
