# TLS Configuration for MCP Server

## Issue: HTTP protocol is not allowed when skipTLSVerify is not set

This error occurs when the Kubernetes client tries to connect to an HTTP endpoint or has TLS verification issues.

## Solutions

### 1. Environment Variables (Recommended)

Set one of these environment variables to skip TLS verification:

```bash
export K8S_SKIP_TLS_VERIFY=true
# OR
export KUBERNETES_SKIP_TLS_VERIFY=true
```

### 2. Automatic Detection

The MCP server automatically detects development clusters and configures TLS settings:

- **HTTP endpoints** (protocol: `http://`)
- **Localhost/127.0.0.1** connections
- **Local domains** (*.local)
- **Known development clusters**:
  - orbstack
  - minikube  
  - k3s
  - docker-desktop

### 3. Manual kubectl Configuration

If you need to configure kubectl directly:

```bash
# Check current cluster info
kubectl config view

# Set insecure-skip-tls-verify for your cluster
kubectl config set-cluster your-cluster-name --insecure-skip-tls-verify=true

# Or set it for your current context
kubectl config set-context --current --insecure-skip-tls-verify=true
```

### 4. For n8n Integration

When using with n8n, you can:

1. Set environment variables in your n8n environment
2. Use the automatic detection (should work for most local clusters)
3. Configure your kubectl context before starting n8n

## Troubleshooting

1. **Check your cluster endpoint**:
   ```bash
   kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
   ```

2. **Verify TLS settings**:
   ```bash
   kubectl config view --minify -o jsonpath='{.clusters[0].cluster.insecure-skip-tls-verify}'
   ```

3. **Test connection**:
   ```bash
   kubectl get nodes
   ```

## Security Note

⚠️ **Warning**: Skipping TLS verification should only be used in development environments. Never use this in production clusters with sensitive data.
