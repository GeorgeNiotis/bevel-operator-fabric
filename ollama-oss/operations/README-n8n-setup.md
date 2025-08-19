# n8n + MCP Server Setup Guide

## Issue Resolution: "request to http://localhost:8080/api/v1/namespaces failed"

This error occurs when the MCP server running inside the n8n Docker container cannot access the Kubernetes cluster on the host machine.

## ✅ Solution Applied

The Docker Compose configuration has been updated to:

1. **Mount kubectl config**: Maps your local `~/.kube` directory to the container
2. **Set environment variables**: Configures TLS skip verification
3. **Enable host access**: Allows container to reach host services
4. **Auto-detect Docker environment**: MCP server automatically adjusts for Docker

## 🚀 Setup Steps

### 1. Restart the Docker Compose Stack

```bash
cd ollama-oss/operations
docker-compose down
docker-compose up -d
```

### 2. Verify kubectl Config is Accessible

```bash
# Check if your kubectl config exists
ls -la ~/.kube/config

# Test kubectl access from your host
kubectl get nodes
```

### 3. Test MCP Server in Docker

```bash
# Run the Docker test script
docker-compose exec n8n-oss node /home/mcp-server/test-docker-k8s.js
```

### 4. Configure n8n MCP Client

In n8n, configure the MCP Client node with:

- **Command**: `node`
- **Arguments**: `/home/mcp-server/src/index.js`
- **Environment Variables**: (automatically set via docker-compose)
  - `K8S_SKIP_TLS_VERIFY=true`
  - `KUBERNETES_SKIP_TLS_VERIFY=true`
  - `DOCKER_CONTAINER=true`

## 🔧 What Changed

### Docker Compose Updates:
```yaml
environment:
  # Kubernetes configuration
  K8S_SKIP_TLS_VERIFY: "true"
  KUBERNETES_SKIP_TLS_VERIFY: "true"
  DOCKER_CONTAINER: "true"
volumes:
  # Mount kubectl config from host
  - ${HOME}/.kube:/home/node/.kube:ro
extra_hosts:
  # Allow access to host services
  - "host.docker.internal:host-gateway"
```

### MCP Server Updates:
- ✅ Auto-detects Docker environment
- ✅ Replaces localhost/127.0.0.1 with host.docker.internal
- ✅ Configures TLS settings for development clusters
- ✅ Handles orbstack, minikube, k3s clusters

## 🧪 Testing

### Test 1: Connection Test
```bash
docker-compose exec n8n-oss node /home/mcp-server/test-docker-k8s.js
```

Expected output:
```
✅ Connection successful!
   - Context: orbstack
   - Cluster: orbstack  
   - Namespace: default
   - Namespaces found: 6
```

### Test 2: List Peers via MCP
In n8n, test the `hlf-list-peers` tool with:
- **namespace**: `default`

Expected response:
```json
{
  "namespace": "default",
  "count": 2,
  "peers": [...]
}
```

## 🐛 Troubleshooting

### Error: "Connection refused"
- Check if Kubernetes cluster is running: `kubectl get nodes`
- Verify Docker has access to host network
- Try: `docker-compose restart n8n-oss`

### Error: "Config not found"
- Verify kubectl config exists: `ls ~/.kube/config`
- Check mount permissions: `docker-compose exec n8n-oss ls -la /home/node/.kube/`

### Error: "TLS handshake failed"
- Environment variables should be set automatically
- Verify: `docker-compose exec n8n-oss env | grep K8S`

### Still getting localhost:8080 error?
- Restart the entire stack: `docker-compose down && docker-compose up -d`
- Check logs: `docker-compose logs n8n-oss`

## 📝 Notes

- The setup automatically handles orbstack, minikube, k3s, and docker-desktop clusters
- TLS verification is safely skipped for development environments
- kubectl config is mounted read-only for security
- All changes are backward compatible with direct (non-Docker) usage
