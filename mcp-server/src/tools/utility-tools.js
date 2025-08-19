import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';

export function registerUtilityTools(tools, k8sClient) {
  // Parse YAML content
  tools.set('parse-yaml', {
    name: 'parse-yaml',
    description: 'Parse YAML content and return as JSON',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'YAML content to parse',
        },
      },
      required: ['content'],
    },
    handler: async (args) => {
      try {
        const parsed = yaml.parse(args.content);
        return {
          success: true,
          parsed,
          type: typeof parsed,
        };
      } catch (error) {
        throw new Error(`YAML parsing failed: ${error.message}`);
      }
    },
  });

  // Generate YAML from JSON
  tools.set('generate-yaml', {
    name: 'generate-yaml',
    description: 'Generate YAML content from JSON object',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'JSON object to convert to YAML',
        },
      },
      required: ['data'],
    },
    handler: async (args) => {
      try {
        const yamlContent = yaml.stringify(args.data, {
          indent: 2,
          lineWidth: 0,
        });
        return {
          success: true,
          yaml: yamlContent,
        };
      } catch (error) {
        throw new Error(`YAML generation failed: ${error.message}`);
      }
    },
  });

  // Apply Kubernetes manifest
  tools.set('k8s-apply-manifest', {
    name: 'k8s-apply-manifest',
    description: 'Apply a Kubernetes manifest (Note: This creates/updates resources)',
    inputSchema: {
      type: 'object',
      properties: {
        manifest: {
          type: 'string',
          description: 'YAML manifest content',
        },
        dryRun: {
          type: 'boolean',
          description: 'Perform a dry run (default: true for safety)',
        },
      },
      required: ['manifest'],
    },
    handler: async (args) => {
      try {
        const dryRun = args.dryRun !== false; // Default to true for safety
        const manifests = yaml.parseAllDocuments(args.manifest);
        const results = [];

        for (const doc of manifests) {
          const resource = doc.toJSON();
          if (!resource || !resource.kind || !resource.apiVersion) {
            continue;
          }

          if (dryRun) {
            results.push({
              kind: resource.kind,
              name: resource.metadata?.name || 'unnamed',
              namespace: resource.metadata?.namespace || 'default',
              action: 'dry-run',
              status: 'would be applied'
            });
          } else {
            // Note: Actual application would require proper API group/version handling
            // This is a simplified implementation
            results.push({
              kind: resource.kind,
              name: resource.metadata?.name || 'unnamed',
              namespace: resource.metadata?.namespace || 'default',
              action: 'apply',
              status: 'not implemented - use kubectl apply directly'
            });
          }
        }

        return {
          dryRun,
          results,
          message: dryRun ? 'Dry run completed - no resources were modified' : 'Apply not fully implemented - use kubectl apply directly'
        };
      } catch (error) {
        throw new Error(`Manifest application failed: ${error.message}`);
      }
    },
  });

  // Get resource usage
  tools.set('k8s-resource-usage', {
    name: 'k8s-resource-usage',
    description: 'Get resource usage information for the cluster',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to check (default: all namespaces)',
        },
      },
    },
    handler: async (args) => {
      try {
        // Get nodes
        const nodesResponse = await k8sClient.coreV1Api.listNode();
        const nodes = k8sClient.handleApiResponse(nodesResponse);

        // Get pods
        const namespace = args.namespace;
        const podsResponse = namespace 
          ? await k8sClient.coreV1Api.listNamespacedPod(namespace)
          : await k8sClient.coreV1Api.listPodForAllNamespaces();
        const pods = k8sClient.handleApiResponse(podsResponse);

        const nodeInfo = nodes.items.map(node => ({
          name: node.metadata.name,
          ready: node.status.conditions?.find(c => c.type === 'Ready')?.status === 'True',
          capacity: {
            cpu: node.status.capacity?.cpu || 'Unknown',
            memory: node.status.capacity?.memory || 'Unknown',
            pods: node.status.capacity?.pods || 'Unknown',
          },
          allocatable: {
            cpu: node.status.allocatable?.cpu || 'Unknown',
            memory: node.status.allocatable?.memory || 'Unknown',
            pods: node.status.allocatable?.pods || 'Unknown',
          },
        }));

        const podsByNamespace = {};
        pods.items.forEach(pod => {
          const ns = pod.metadata.namespace;
          if (!podsByNamespace[ns]) {
            podsByNamespace[ns] = [];
          }
          podsByNamespace[ns].push({
            name: pod.metadata.name,
            status: pod.status.phase,
            node: pod.spec.nodeName,
            containers: pod.spec.containers?.length || 0,
          });
        });

        return {
          cluster: {
            nodes: nodeInfo.length,
            totalPods: pods.items.length,
            runningPods: pods.items.filter(p => p.status.phase === 'Running').length,
          },
          nodes: nodeInfo,
          podsByNamespace,
          namespace: namespace || 'all-namespaces',
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Watch resources (simplified version)
  tools.set('k8s-watch-resources', {
    name: 'k8s-watch-resources',
    description: 'Get current state of resources (simplified watch)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          enum: ['pods', 'services', 'deployments', 'fabricpeers', 'fabriccas', 'fabricorderers'],
          description: 'Resource type to watch',
        },
        namespace: {
          type: 'string',
          description: 'Namespace to watch (default: current namespace)',
        },
      },
      required: ['resource'],
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        let response;

        switch (args.resource) {
          case 'pods':
            response = await k8sClient.coreV1Api.listNamespacedPod(namespace);
            break;
          case 'services':
            response = await k8sClient.coreV1Api.listNamespacedService(namespace);
            break;
          case 'deployments':
            response = await k8sClient.appsV1Api.listNamespacedDeployment(namespace);
            break;
          case 'fabricpeers':
            response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
              'hlf.kungfusoftware.es', // group
              'v1alpha1', // version
              namespace, // namespace
              'fabricpeers' // plural
            );
            break;
          case 'fabriccas':
            response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
              'hlf.kungfusoftware.es', // group
              'v1alpha1', // version
              namespace, // namespace
              'fabriccas' // plural
            );
            break;
          case 'fabricorderers':
            response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
              'hlf.kungfusoftware.es', // group
              'v1alpha1', // version
              namespace, // namespace
              'fabricorderers' // plural
            );
            break;
          default:
            throw new Error(`Unsupported resource type: ${args.resource}`);
        }

        const resources = k8sClient.handleApiResponse(response);
        return {
          resource: args.resource,
          namespace,
          timestamp: new Date().toISOString(),
          count: resources.items.length,
          items: resources.items.map(item => ({
            name: item.metadata.name,
            namespace: item.metadata.namespace,
            status: item.status?.phase || item.status?.status || 'Unknown',
            creationTimestamp: item.metadata.creationTimestamp,
            labels: item.metadata.labels || {},
          })),
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Generate Fabric network config
  tools.set('hlf-generate-network-config', {
    name: 'hlf-generate-network-config',
    description: 'Generate a network configuration template for Hyperledger Fabric',
    inputSchema: {
      type: 'object',
      properties: {
        organizationName: {
          type: 'string',
          description: 'Name of the organization',
        },
        mspId: {
          type: 'string',
          description: 'MSP ID for the organization',
        },
        domain: {
          type: 'string',
          description: 'Domain for the organization (e.g., org1.example.com)',
        },
      },
      required: ['organizationName', 'mspId', 'domain'],
    },
    handler: async (args) => {
      const networkConfig = {
        name: `${args.organizationName}-network`,
        version: '1.0.0',
        client: {
          organization: args.organizationName,
          connection: {
            timeout: {
              peer: {
                endorser: '300',
                eventHub: '300',
                eventReg: '300'
              },
              orderer: '300'
            }
          }
        },
        organizations: {
          [args.organizationName]: {
            mspid: args.mspId,
            peers: [
              `peer0.${args.domain}`,
              `peer1.${args.domain}`
            ],
            certificateAuthorities: [
              `ca.${args.domain}`
            ]
          }
        },
        orderers: {
          [`orderer.${args.domain}`]: {
            url: `grpcs://orderer.${args.domain}:7050`,
            grpcOptions: {
              'ssl-target-name-override': `orderer.${args.domain}`,
              'hostnameOverride': `orderer.${args.domain}`
            },
            tlsCACerts: {
              path: `crypto-config/ordererOrganizations/${args.domain}/orderers/orderer.${args.domain}/msp/tlscacerts/tlsca.${args.domain}-cert.pem`
            }
          }
        },
        peers: {
          [`peer0.${args.domain}`]: {
            url: `grpcs://peer0.${args.domain}:7051`,
            grpcOptions: {
              'ssl-target-name-override': `peer0.${args.domain}`,
              'hostnameOverride': `peer0.${args.domain}`
            },
            tlsCACerts: {
              path: `crypto-config/peerOrganizations/${args.domain}/peers/peer0.${args.domain}/msp/tlscacerts/tlsca.${args.domain}-cert.pem`
            }
          },
          [`peer1.${args.domain}`]: {
            url: `grpcs://peer1.${args.domain}:7051`,
            grpcOptions: {
              'ssl-target-name-override': `peer1.${args.domain}`,
              'hostnameOverride': `peer1.${args.domain}`
            },
            tlsCACerts: {
              path: `crypto-config/peerOrganizations/${args.domain}/peers/peer1.${args.domain}/msp/tlscacerts/tlsca.${args.domain}-cert.pem`
            }
          }
        },
        certificateAuthorities: {
          [`ca.${args.domain}`]: {
            url: `https://ca.${args.domain}:7054`,
            httpOptions: {
              verify: false
            },
            tlsCACerts: {
              path: `crypto-config/peerOrganizations/${args.domain}/ca/ca.${args.domain}-cert.pem`
            },
            registrar: [
              {
                enrollId: 'admin',
                enrollSecret: 'adminpw'
              }
            ]
          }
        }
      };

      const yamlConfig = yaml.stringify(networkConfig, { indent: 2 });
      
      return {
        organizationName: args.organizationName,
        mspId: args.mspId,
        domain: args.domain,
        config: networkConfig,
        yaml: yamlConfig
      };
    },
  });
}
