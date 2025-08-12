#!/bin/bash

# Test script to verify MCP server works with Cursor's expected format
echo "Testing MCP Server for Cursor compatibility..."

# Test 1: Basic server startup
echo "1. Testing server startup..."
cd /Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server
timeout 3s /Users/georgeniotis/.nvm/versions/node/v22.17.1/bin/node src/index.js &
PID=$!
sleep 1
if ps -p $PID > /dev/null; then
    echo "✅ Server starts successfully"
    kill $PID 2>/dev/null
else
    echo "❌ Server failed to start"
fi

# Test 2: JSON-RPC communication
echo "2. Testing JSON-RPC communication..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}' | /Users/georgeniotis/.nvm/versions/node/v22.17.1/bin/node src/index.js > /tmp/mcp-test.log 2>&1 &
PID=$!
sleep 2
kill $PID 2>/dev/null

if grep -q "result" /tmp/mcp-test.log; then
    echo "✅ JSON-RPC communication works"
else
    echo "❌ JSON-RPC communication failed"
    echo "Log output:"
    cat /tmp/mcp-test.log
fi

# Test 3: Configuration validation
echo "3. Testing Cursor configuration..."
CONFIG_FILE="/Users/georgeniotis/.cursor/mcp.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Configuration file exists"
    if /Users/georgeniotis/.nvm/versions/node/v22.17.1/bin/node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'))" 2>/dev/null; then
        echo "✅ Configuration JSON is valid"
    else
        echo "❌ Configuration JSON is invalid"
    fi
else
    echo "❌ Configuration file not found"
fi

# Cleanup
rm -f /tmp/mcp-test.log

echo ""
echo "Recommendations:"
echo "1. Restart Cursor completely (Cmd+Q then reopen)"
echo "2. Check Cursor's developer console for MCP errors"
echo "3. Try toggling the MCP server off/on in Cursor settings"
echo "4. Check if Cursor has specific MCP logs in ~/Library/Logs/Cursor/"
