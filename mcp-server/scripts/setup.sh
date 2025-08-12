#!/bin/bash

# Setup script for Hyperledger Bevel MCP Server
# This script helps set up the development environment

set -e

echo "🚀 Setting up Hyperledger Bevel MCP Server..."

# Check Node.js version
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if ! node -pe "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js $REQUIRED_VERSION or higher."
        exit 1
    fi
    
    echo "✅ Node.js version $NODE_VERSION is compatible"
}

# Check Yarn
check_yarn() {
    if ! command -v yarn &> /dev/null; then
        echo "📦 Yarn not found. Installing Yarn..."
        npm install -g yarn
    fi
    echo "✅ Yarn is available"
}

# Check kubectl
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "⚠️  kubectl is not installed. Please install kubectl to interact with Kubernetes clusters."
        echo "   Installation guide: https://kubernetes.io/docs/tasks/tools/"
    else
        echo "✅ kubectl is available"
        
        # Test kubectl connection
        if kubectl cluster-info &> /dev/null; then
            echo "✅ kubectl can connect to a cluster"
        else
            echo "⚠️  kubectl is installed but cannot connect to a cluster"
            echo "   Please configure kubectl to connect to your Kubernetes cluster"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    yarn install
    echo "✅ Dependencies installed"
}

# Create necessary directories
create_directories() {
    echo "📁 Creating necessary directories..."
    mkdir -p logs
    mkdir -p config
    mkdir -p examples
    mkdir -p scripts
    echo "✅ Directories created"
}

# Set up development environment
setup_dev_env() {
    echo "🔧 Setting up development environment..."
    
    # Create a sample .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOF
# Environment configuration for Hyperledger Bevel MCP Server
# Copy this file and customize as needed

# Kubernetes configuration (optional - defaults to ~/.kube/config)
# KUBECONFIG=/path/to/your/kubeconfig

# HashiCorp Vault configuration (for Vault-related operations)
# VAULT_ADDR=http://localhost:8200
# VAULT_TOKEN=your-vault-token

# Development settings
NODE_ENV=development
DEBUG=hyperledger-bevel-mcp*
EOF
        echo "✅ Created sample .env file"
    fi
}

# Test the installation
test_installation() {
    echo "🧪 Testing installation..."
    
    # Test if the server can start
    timeout 10s yarn start &> /dev/null || true
    
    if [ $? -eq 124 ]; then
        echo "✅ Server starts successfully"
    else
        echo "⚠️  Server may have issues starting. Check the logs for details."
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your Kubernetes access:"
    echo "   kubectl config current-context"
    echo ""
    echo "2. Start the MCP server in development mode:"
    echo "   yarn dev"
    echo ""
    echo "3. Or start in production mode:"
    echo "   yarn start"
    echo ""
    echo "4. Test the server with the example client:"
    echo "   node examples/basic-usage.js"
    echo ""
    echo "5. Configure your MCP client (like Claude Desktop) to use this server:"
    echo "   Add the configuration from config/mcp-config.json to your client"
    echo ""
    echo "📖 For more information, see README.md"
}

# Main execution
main() {
    echo "Starting setup process..."
    echo ""
    
    check_node_version
    check_yarn
    check_kubectl
    create_directories
    install_dependencies
    setup_dev_env
    test_installation
    show_next_steps
}

# Run main function
main
