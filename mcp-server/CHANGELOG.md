# Changelog

All notable changes to the Hyperledger Bevel MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Hyperledger Bevel MCP Server
- Kubernetes cluster management tools
  - Connection testing and cluster info
  - Namespace, pod, service, and deployment management
  - Pod log retrieval and resource monitoring
- Hyperledger Fabric integration
  - Certificate Authority (CA) management
  - Peer node operations and monitoring
  - Orderer service management
  - Channel operations (main and follower channels)
  - Chaincode lifecycle monitoring
  - HLF Operator health checking
- HashiCorp Vault integration support
  - Certificate management through Vault PKI
  - Secure credential storage capabilities
- Utility tools
  - YAML parsing and generation
  - Network configuration generation
  - Kubernetes manifest application (with dry-run)
  - Resource state monitoring
- Comprehensive prompt system
  - Deployment guidance for all Fabric components
  - Troubleshooting assistance
  - Vault integration setup guidance
- Development and deployment tools
  - Automated setup script
  - Example usage client
  - Comprehensive documentation
- MCP protocol compliance
  - Full tool and prompt support
  - Error handling and validation
  - Extensible architecture

### Features
- **20+ Kubernetes management tools** for complete cluster operations
- **10+ Hyperledger Fabric tools** for network management
- **3 comprehensive prompt systems** for guidance and troubleshooting
- **Production-ready** with proper error handling and logging
- **Extensible architecture** for easy addition of new tools and prompts
- **HashiCorp Vault integration** for secure certificate management
- **Development-friendly** with hot reload and example code

### Documentation
- Complete README with usage examples
- Inline code documentation
- Setup and installation guide
- Troubleshooting section
- Architecture overview

### Dependencies
- @modelcontextprotocol/sdk: ^0.4.0
- @kubernetes/client-node: ^0.21.0
- yaml: ^2.3.4
- commander: ^11.1.0
- inquirer: ^9.2.12

### Requirements
- Node.js 18.0.0 or higher
- Yarn package manager
- kubectl configured and working
- Kubernetes cluster access
- Hyperledger Fabric Operator (optional, for HLF features)
