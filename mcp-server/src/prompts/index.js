export const prompts = {
  'hlf-deployment-guide': {
    name: 'hlf-deployment-guide',
    description: 'Get guidance for deploying Hyperledger Fabric components',
    arguments: [
      {
        name: 'component',
        description: 'Component to deploy (ca, peer, orderer, channel, chaincode)',
        required: true,
      },
      {
        name: 'environment',
        description: 'Target environment (development, staging, production)',
        required: false,
      },
    ],
    handler: async (args) => {
      const component = args.component?.toLowerCase();
      const environment = args.environment?.toLowerCase() || 'development';
      
      const guides = {
        ca: {
          title: 'Certificate Authority Deployment Guide',
          steps: [
            '1. Ensure HashiCorp Vault is configured and running',
            '2. Set up PKI secrets engine in Vault',
            '3. Create root certificates for signing and TLS',
            '4. Configure roles for different certificate types',
            '5. Deploy FabricCA custom resource with Vault integration',
            '6. Verify CA is running and accessible'
          ],
          considerations: environment === 'production' 
            ? ['Use external Vault cluster', 'Enable audit logging', 'Configure backup policies']
            : ['Development Vault server is sufficient', 'Focus on functionality over security']
        },
        peer: {
          title: 'Peer Node Deployment Guide',
          steps: [
            '1. Ensure Certificate Authority is deployed and running',
            '2. Configure storage class for persistent volumes',
            '3. Set up Vault credentials and roles',
            '4. Deploy FabricPeer custom resource',
            '5. Configure Istio ingress for external access',
            '6. Verify peer is running and certificates are valid'
          ],
          considerations: environment === 'production'
            ? ['Use multiple peers for HA', 'Configure resource limits', 'Set up monitoring']
            : ['Single peer is sufficient', 'Use minimal resources']
        },
        orderer: {
          title: 'Orderer Node Deployment Guide',
          steps: [
            '1. Set up OrdererMSP Certificate Authority',
            '2. Configure Vault for orderer certificates',
            '3. Deploy multiple orderer nodes for Raft consensus',
            '4. Configure external endpoints and admin endpoints',
            '5. Verify orderer cluster is healthy',
            '6. Test connectivity from peers'
          ],
          considerations: environment === 'production'
            ? ['Deploy minimum 3 orderers', 'Use anti-affinity rules', 'Configure TLS properly']
            : ['Single orderer acceptable', 'Focus on basic functionality']
        },
        channel: {
          title: 'Channel Creation Guide',
          steps: [
            '1. Create admin identities for all organizations',
            '2. Prepare channel configuration with proper MSPs',
            '3. Deploy FabricMainChannel custom resource',
            '4. Create FabricFollowerChannel for peer organizations',
            '5. Join peers to the channel',
            '6. Set anchor peers for organizations'
          ],
          considerations: environment === 'production'
            ? ['Carefully plan channel policies', 'Set up proper governance', 'Configure lifecycle policies']
            : ['Use simple policies', 'Single organization acceptable']
        },
        chaincode: {
          title: 'Chaincode Deployment Guide',
          steps: [
            '1. Package chaincode with proper metadata',
            '2. Install chaincode on all required peers',
            '3. Approve chaincode for your organization',
            '4. Commit chaincode definition to channel',
            '5. Deploy chaincode container (for external chaincode)',
            '6. Test chaincode functionality'
          ],
          considerations: environment === 'production'
            ? ['Use external chaincode pattern', 'Implement proper error handling', 'Set up monitoring']
            : ['Simple chaincode is sufficient', 'Focus on functionality']
        }
      };

      const guide = guides[component];
      if (!guide) {
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please specify a valid component: ca, peer, orderer, channel, or chaincode`
            }
          }
        ];
      }

      const content = `# ${guide.title}

## Environment: ${environment.charAt(0).toUpperCase() + environment.slice(1)}

## Deployment Steps:
${guide.steps.map(step => `${step}`).join('\n')}

## ${environment === 'production' ? 'Production' : 'Development'} Considerations:
${guide.considerations.map(consideration => `• ${consideration}`).join('\n')}

## Next Steps:
- Use the available MCP tools to check current cluster state
- Follow the Hyperledger Bevel documentation for detailed configurations
- Test each component thoroughly before proceeding to the next step

Would you like specific commands or configurations for any of these steps?`;

      return [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: content
          }
        }
      ];
    }
  },

  'hlf-troubleshooting': {
    name: 'hlf-troubleshooting',
    description: 'Get troubleshooting guidance for Hyperledger Fabric issues',
    arguments: [
      {
        name: 'issue',
        description: 'Type of issue (connection, certificate, deployment, performance)',
        required: true,
      },
      {
        name: 'component',
        description: 'Affected component (ca, peer, orderer, channel, chaincode)',
        required: false,
      },
    ],
    handler: async (args) => {
      const issue = args.issue?.toLowerCase();
      const component = args.component?.toLowerCase();

      const troubleshooting = {
        connection: `# Connection Issues Troubleshooting

## Common Causes:
1. **Network connectivity**: Check if pods can reach each other
2. **TLS certificate issues**: Verify certificates are valid and properly configured
3. **Service discovery**: Ensure services are properly exposed
4. **Firewall/Security groups**: Check if required ports are open

## Diagnostic Steps:
1. Check pod status: Use k8s-list-pods tool
2. Verify service endpoints: Use k8s-list-services tool  
3. Test TLS connectivity: openssl s_client -connect <endpoint>
4. Check pod logs: Use k8s-get-logs tool
5. Verify DNS resolution within cluster

## Solutions:
- Restart affected pods
- Regenerate certificates if expired
- Check Istio/ingress configuration
- Verify Vault connectivity for certificate management`,

        certificate: `# Certificate Issues Troubleshooting

## Common Causes:
1. **Expired certificates**: Check certificate validity dates
2. **Wrong CA chain**: Verify certificate chain is complete
3. **Vault connectivity**: Ensure Vault is accessible and tokens are valid
4. **Certificate rotation**: Old certificates may still be cached

## Diagnostic Steps:
1. Check Vault status and connectivity
2. Verify certificate expiration dates
3. Check CA certificate chain
4. Review Vault audit logs
5. Verify certificate roles and policies in Vault

## Solutions:
- Regenerate certificates through Vault
- Update certificate chains
- Rotate Vault tokens
- Restart components to reload certificates`,

        deployment: `# Deployment Issues Troubleshooting

## Common Causes:
1. **Resource constraints**: Insufficient CPU/memory/storage
2. **Image pull issues**: Cannot pull container images
3. **Configuration errors**: Invalid YAML or missing required fields
4. **Dependency issues**: Required components not ready

## Diagnostic Steps:
1. Check pod events: kubectl describe pod <pod-name>
2. Verify resource availability: Use k8s-resource-usage tool
3. Check operator logs: Use hlf-check-operator tool
4. Validate CRD specifications
5. Check storage class availability

## Solutions:
- Increase resource limits/requests
- Fix image repository access
- Correct configuration errors
- Ensure dependencies are deployed first`,

        performance: `# Performance Issues Troubleshooting

## Common Causes:
1. **Resource bottlenecks**: CPU/memory/disk I/O limits
2. **Network latency**: Slow network between components
3. **Database performance**: StateDB (CouchDB/LevelDB) issues
4. **Chaincode efficiency**: Inefficient smart contract code

## Diagnostic Steps:
1. Monitor resource usage: Use k8s-resource-usage tool
2. Check database performance metrics
3. Analyze transaction throughput
4. Profile chaincode execution
5. Review network latency between nodes

## Solutions:
- Scale up resources
- Optimize chaincode logic
- Tune database configuration
- Implement connection pooling
- Use read replicas for queries`
      };

      const guidance = troubleshooting[issue];
      if (!guidance) {
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please specify a valid issue type: connection, certificate, deployment, or performance'
            }
          }
        ];
      }

      let content = guidance;
      if (component) {
        content += `\n\n## Component-Specific Notes for ${component.toUpperCase()}:
Use the hlf-list-${component}s and hlf-get-resource tools to get detailed information about your ${component} components.`;
      }

      content += `\n\n## Available Diagnostic Tools:
- k8s-test-connection: Test cluster connectivity
- hlf-check-operator: Verify operator status
- k8s-get-logs: Get component logs
- hlf-list-* tools: List Fabric components
- k8s-resource-usage: Check resource utilization

Run these tools to gather more information about your specific issue.`;

      return [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: content
          }
        }
      ];
    }
  },

  'vault-integration': {
    name: 'vault-integration',
    description: 'Get guidance for HashiCorp Vault integration with Hyperledger Fabric',
    arguments: [
      {
        name: 'setup_type',
        description: 'Type of setup (initial, ca-setup, peer-setup, orderer-setup)',
        required: true,
      },
    ],
    handler: async (args) => {
      const setupType = args.setup_type?.toLowerCase();

      const vaultGuides = {
        initial: `# Initial Vault Setup for Hyperledger Fabric

## Prerequisites:
- Vault server running and accessible
- Vault CLI installed and configured
- VAULT_ADDR and VAULT_TOKEN environment variables set

## Setup Steps:

### 1. Enable PKI Secrets Engine
\`\`\`bash
vault secrets enable -path=pki pki
vault secrets tune -max-lease-ttl=87600h pki
\`\`\`

### 2. Generate Root CA Certificates
\`\`\`bash
# For signing certificates
vault write pki/root/generate/internal \\
    common_name="Organization Root Sign CA" \\
    ttl=87600h \\
    issuer_name="signing-ca" \\
    key_type="ec" \\
    key_bits=256

# For TLS certificates  
vault write pki/root/generate/internal \\
    common_name="Organization TLS Root CA" \\
    ttl=87600h \\
    issuer_name="tls-ca" \\
    key_type="ec" \\
    key_bits=256
\`\`\`

### 3. Create Kubernetes Secret for Vault Token
\`\`\`bash
kubectl create secret generic vault-token --from-literal=token=your-vault-token
\`\`\`

### 4. Verify Setup
Use the k8s-test-connection tool to verify Kubernetes connectivity, then test Vault access.`,

        'ca-setup': `# Certificate Authority Setup with Vault

## Create Roles for Different Certificate Types:

### 1. Signing Certificate Roles
\`\`\`bash
vault write pki/roles/peer-sign \\
    allow_subdomains=true \\
    allow_any_name=true \\
    max_ttl="87600h" \\
    key_type="ec" \\
    key_bits=256 \\
    ou="peer" \\
    organization="YourMSP" \\
    issuer_ref="signing-ca"

vault write pki/roles/admin-sign \\
    allow_subdomains=true \\
    allow_any_name=true \\
    max_ttl="87600h" \\
    key_type="ec" \\
    key_bits=256 \\
    ou="admin" \\
    organization="YourMSP" \\
    issuer_ref="signing-ca"
\`\`\`

### 2. TLS Certificate Roles  
\`\`\`bash
vault write pki/roles/peer-tls \\
    issuer_ref="tls-ca" \\
    allow_subdomains=true \\
    allow_any_name=true \\
    max_ttl="87600h" \\
    key_type="ec" \\
    key_bits=256 \\
    ou="peer" \\
    organization="YourMSP"
\`\`\`

### 3. Deploy CA with Vault Integration
Use the kubectl hlf ca create command with vault parameters as shown in the documentation.`,

        'peer-setup': `# Peer Setup with Vault Integration

## Vault Configuration Parameters for Peers:

### Required Environment Variables:
\`\`\`bash
export VAULT_ADDR="http://vault-server:8200"
export VAULT_TOKEN_NAME="vault-token"
export VAULT_TOKEN_NS="default" 
export VAULT_TOKEN_KEY="token"
export VAULT_CA_PATH="pki"
export VAULT_ROLE_SIGN="peer-sign"
export VAULT_ROLE_TLS="peer-tls"
\`\`\`

### Peer Creation Command:
\`\`\`bash
kubectl hlf peer create \\
    --credential-store=vault \\
    --vault-address="$VAULT_ADDR" \\
    --vault-token-secret="$VAULT_TOKEN_NAME" \\
    --vault-token-secret-namespace="$VAULT_TOKEN_NS" \\
    --vault-token-secret-key="$VAULT_TOKEN_KEY" \\
    --vault-pki-path="$VAULT_CA_PATH" \\
    --vault-role="$VAULT_ROLE_SIGN" \\
    --vault-ttl="8760h" \\
    --tls-vault-address="$VAULT_ADDR" \\
    --tls-vault-token-secret="$VAULT_TOKEN_NAME" \\
    --tls-vault-token-secret-namespace="$VAULT_TOKEN_NS" \\
    --tls-vault-token-secret-key="$VAULT_TOKEN_KEY" \\
    --tls-vault-pki-path="$VAULT_CA_PATH" \\
    --tls-vault-role="$VAULT_ROLE_TLS" \\
    --tls-vault-ttl="8760h" \\
    [other peer parameters...]
\`\`\`

## Verification:
Use hlf-list-peers tool to verify peer deployment and certificate status.`,

        'orderer-setup': `# Orderer Setup with Vault Integration

## 1. Create Separate PKI Path for Orderers:
\`\`\`bash
vault secrets enable -path=pki_orderer pki
vault secrets tune -max-lease-ttl=87600h pki_orderer
\`\`\`

## 2. Generate Orderer Root Certificates:
\`\`\`bash
vault write pki_orderer/root/generate/internal \\
    common_name="OrdererMSP Signing Root CA" \\
    ttl=87600h \\
    issuer_name="signing-ca" \\
    key_type="ec" \\
    key_bits=256

vault write pki_orderer/root/generate/internal \\
    common_name="OrdererMSP TLS Root CA" \\
    ttl=87600h \\
    issuer_name="tls-ca" \\
    key_type="ec" \\
    key_bits=256
\`\`\`

## 3. Create Orderer Roles:
\`\`\`bash
vault write pki_orderer/roles/orderer-sign \\
    allow_subdomains=true \\
    allow_any_name=true \\
    max_ttl="87600h" \\
    key_type="ec" \\
    key_bits=256 \\
    ou="orderer" \\
    organization="OrdererMSP" \\
    issuer_ref="signing-ca"

vault write pki_orderer/roles/orderer-tls \\
    issuer_ref="tls-ca" \\
    allow_subdomains=true \\
    allow_any_name=true \\
    max_ttl="87600h" \\
    key_type="ec" \\
    key_bits=256 \\
    ou="orderer" \\
    organization="OrdererMSP"
\`\`\`

## 4. Deploy Orderer Nodes:
Use kubectl hlf ordnode create with vault parameters pointing to pki_orderer path.

## Verification:
Use hlf-list-ordnodes tool to verify orderer deployment.`
      };

      const guide = vaultGuides[setupType];
      if (!guide) {
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please specify a valid setup type: initial, ca-setup, peer-setup, or orderer-setup'
            }
          }
        ];
      }

      return [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: guide
          }
        }
      ];
    }
  }
};
