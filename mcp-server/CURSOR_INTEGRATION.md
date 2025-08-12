# Connecting Cursor to Your Hyperledger Bevel MCP Server

## Method 1: Cursor Settings (Recommended)

1. **Open Cursor Settings**:
   - Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Or go to `Cursor > Settings`

2. **Navigate to Extensions/MCP**:
   - Look for "MCP" or "Model Context Protocol" in settings
   - Or search for "mcp" in the settings search bar

3. **Add Server Configuration**:
   Add this configuration:
   ```json
   {
     "mcpServers": {
       "hyperledger-bevel": {
         "command": "node",
         "args": ["src/index.js"],
         "cwd": "/Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server",
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

## Method 2: Configuration File

If Cursor supports MCP config files, you can use the provided config:

1. **Copy the configuration**:
   ```bash
   cp config/cursor-mcp-config.json ~/.cursor/mcp-config.json
   ```
   
   Or manually create `~/.cursor/mcp-config.json` with the contents from `config/cursor-mcp-config.json`.

## Method 3: Environment Variables

Set up environment variables for the MCP server:

```bash
# Add to your shell profile (.zshrc, .bashrc, etc.)
export MCP_SERVER_PATH="/Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server"
export KUBECONFIG="$HOME/.kube/config"  # If using non-default kubeconfig
export VAULT_ADDR="http://localhost:8200"  # If using Vault
```

## Verification Steps

1. **Test the server first**:
   ```bash
   cd /Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server
   yarn test
   ```

2. **Start the server manually** to ensure it works:
   ```bash
   yarn start
   ```
   You should see: "Hyperledger Bevel MCP Server running on stdio"

3. **Restart Cursor** after adding the configuration

4. **Check Cursor's MCP status**:
   - Look for MCP indicators in Cursor's UI
   - Check if new tools/commands appear
   - Try using MCP features in chat

## Using the MCP Server in Cursor

Once connected, you can use the tools through Cursor's AI assistant:

### Example Prompts:

**Kubernetes Management**:
```
"Check my Kubernetes cluster status and list all namespaces"
```

**Hyperledger Fabric Monitoring**:
```
"Show me all Hyperledger Fabric peers in my cluster and their status"
```

**Troubleshooting**:
```
"Help me troubleshoot connection issues with my Fabric network"
```

**Deployment Guidance**:
```
"Guide me through deploying a new peer node in production environment"
```

**Resource Monitoring**:
```
"Check resource usage across my Kubernetes cluster"
```

## Available Tools in Cursor

Once connected, these tools will be available:

### Kubernetes Tools (11):
- `k8s-test-connection` - Test cluster connectivity
- `k8s-list-namespaces` - List all namespaces
- `k8s-list-pods` - List pods with filtering
- `k8s-get-pod` - Get detailed pod information
- `k8s-list-services` - List services
- `k8s-list-deployments` - List deployments
- `k8s-get-logs` - Get pod logs
- `k8s-resource-usage` - Check resource utilization
- And more...

### Hyperledger Fabric Tools (10):
- `hlf-list-peers` - List Fabric peer nodes
- `hlf-list-cas` - List Certificate Authorities
- `hlf-list-ordnodes` - List orderer nodes
- `hlf-list-chaincode` - List deployed chaincode
- `hlf-check-operator` - Check HLF Operator status
- And more...

### Utility Tools (2):
- `parse-yaml` - Parse YAML content
- `generate-yaml` - Generate YAML from JSON
- `hlf-generate-network-config` - Generate Fabric network configs

### Prompts (3):
- `hlf-deployment-guide` - Deployment guidance
- `hlf-troubleshooting` - Troubleshooting help
- `vault-integration` - Vault setup guidance

## Troubleshooting Connection Issues

### Server Won't Start:
```bash
# Check if dependencies are installed
cd /Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server
yarn install

# Test the server
yarn test
```

### Cursor Can't Find Server:
1. Verify the `cwd` path in config is correct
2. Ensure Node.js is in your PATH
3. Check Cursor's MCP logs/console for errors

### Tools Not Working:
1. Ensure `kubectl` is configured and working
2. Check if you have proper Kubernetes permissions
3. For HLF tools, verify the Bevel Operator is installed

### Permission Issues:
```bash
# Make sure the server directory is accessible
ls -la /Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server

# Check Node.js permissions
which node
node --version
```

## Advanced Configuration

### Custom Environment Variables:
```json
{
  "mcpServers": {
    "hyperledger-bevel": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server",
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "hyperledger-bevel-mcp*",
        "KUBECONFIG": "/path/to/your/kubeconfig",
        "VAULT_ADDR": "http://localhost:8200",
        "VAULT_TOKEN": "your-vault-token"
      }
    }
  }
}
```

### Multiple Environments:
```json
{
  "mcpServers": {
    "hyperledger-bevel-dev": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server",
      "env": {
        "NODE_ENV": "development",
        "KUBECONFIG": "/path/to/dev/kubeconfig"
      }
    },
    "hyperledger-bevel-prod": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/Users/georgeniotis/Documents/bevel-operator-fabric/mcp-server",
      "env": {
        "NODE_ENV": "production",
        "KUBECONFIG": "/path/to/prod/kubeconfig"
      }
    }
  }
}
```

## Success! 🎉

Once connected, you'll have access to all 23 tools and 3 intelligent prompts directly through Cursor's AI assistant. The AI can help you manage your Kubernetes cluster and Hyperledger Fabric network with context-aware assistance!

