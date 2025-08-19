# Operations - Docker Setup

This directory contains Docker configuration files for containerizing and running the Hyperledger Bevel MCP Server.

## Files

- `Dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yml` - Docker Compose service configuration (with Kubernetes)
- `docker-compose.no-k8s.yml` - Docker Compose without Kubernetes functionality
- `manage.sh` - Management script for easy Docker operations
- `.dockerignore` - Files to exclude from Docker build context
- `README.md` - This documentation file

## Quick Start

### Using the Management Script (Recommended)

The `manage.sh` script provides an easy way to control the MCP server:

```bash
# From the operations directory
cd operations

# Make script executable (if needed)
chmod +x manage.sh

# Start the server WITH Kubernetes support
./manage.sh start

# Start the server WITHOUT Kubernetes support (recommended for first time)
./manage.sh start --no-k8s

# Check status
./manage.sh status

# Test the API
./manage.sh test

# View logs
./manage.sh logs

# Stop the server
./manage.sh stop

# See all available commands
./manage.sh help
```

### Manual Docker Compose Commands

```bash
# From the operations directory
cd operations

# Build and start the service
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f mcp-server

# Stop the service
docker-compose down
```

### Build Docker Image Manually

```bash
# From the project root
docker build -f operations/Dockerfile -t hyperledger-bevel-mcp-server .

# Run the container
docker run -p 3000:3000 --name mcp-server hyperledger-bevel-mcp-server
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Node environment (default: production)
- `DOCKER_CONTAINER` - Set to 'true' when running in Docker
- `K8S_DISABLED` - Set to 'true' to disable Kubernetes functionality
- `K8S_SKIP_TLS_VERIFY` - Set to 'true' to skip TLS verification for dev clusters
- `MCP_DEBUG` - Set to 'true' to enable debug logging

### Kubernetes Access Options

You have three options for Kubernetes connectivity:

#### Option 1: No Kubernetes (Recommended for Testing)
Use the no-kubernetes configuration:
```bash
./manage.sh start --no-k8s
```
Or use the dedicated compose file:
```bash
docker-compose -f docker-compose.no-k8s.yml up -d
```

#### Option 2: Mount Local kubeconfig (Default)
The default `docker-compose.yml` mounts your local `~/.kube/config`:
```yaml
volumes:
  - ~/.kube:/app/.kube:ro
```

#### Option 3: Custom Kubernetes Configuration
Set custom environment variables:
```yaml
environment:
  - KUBECONFIG=/app/.kube/config
  - K8S_SKIP_TLS_VERIFY=true  # For dev clusters
```

### Development Mode

For development, uncomment the source code volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - ../src:/app/src:ro
  - ../package.json:/app/package.json:ro
```

## Health Checks

The container includes health checks that verify the MCP server is responding correctly on the `/mcp` endpoint.

## Security Features

- Runs as non-root user (`mcp:nodejs`)
- Uses `dumb-init` for proper signal handling
- Multi-stage build to minimize final image size
- Production-only dependencies in final image

## Networking

The service creates a custom network `hyperledger-bevel-mcp` for isolation and potential integration with other services.

## Troubleshooting

### Common Issues

#### Kubernetes Connection Error
If you see errors like:
```
"connect ECONNREFUSED 0.250.250.254:8080"
```

**Solutions:**
1. **Start without Kubernetes** (recommended for testing):
   ```bash
   ./manage.sh start --no-k8s
   ```

2. **Fix kubeconfig mounting:**
   - Ensure kubectl is working on your host: `kubectl get nodes`
   - Check if ~/.kube/config exists and is readable
   - Verify Docker has permission to mount ~/.kube directory

3. **Use development settings:**
   - Set `K8S_SKIP_TLS_VERIFY=true` for local clusters
   - Enable debug with `MCP_DEBUG=true`

### Debug Commands

#### Check container status
```bash
docker-compose ps
```

#### View logs with debug info
```bash
# Enable debug mode first by editing docker-compose.yml:
# - MCP_DEBUG=true
docker-compose logs mcp-server
```

#### Execute into running container
```bash
docker-compose exec mcp-server sh
```

#### Test the API
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

#### Test Kubernetes connectivity (inside container)
```bash
docker-compose exec mcp-server sh
# Inside container:
ls -la ~/.kube/  # Check if config is mounted
kubectl get nodes  # Test kubectl access
```
