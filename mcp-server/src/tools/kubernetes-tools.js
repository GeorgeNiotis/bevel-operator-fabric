// Helper function to check if Kubernetes client is available
function checkK8sAvailable(k8sClient) {
  if (k8sClient.disabled) {
    return {
      success: false,
      error: 'Kubernetes functionality is disabled. Set K8S_DISABLED=false or mount kubeconfig to enable.'
    };
  }
  return null;
}

export function registerKubernetesTools(tools, k8sClient) {
  // Test Kubernetes connection
  tools.set('k8s-test-connection', {
    name: 'k8s-test-connection',
    description: 'Test connection to Kubernetes cluster and get basic info',
    inputSchema: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['random_string']
    },
    handler: async () => {
      return await k8sClient.testConnection();
    },
  });

  // List namespaces
  tools.set('k8s-list-namespaces', {
    name: 'k8s-list-namespaces',
    description: 'List all namespaces in the cluster',
    inputSchema: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['random_string']
    },
    handler: async () => {
      const k8sCheck = checkK8sAvailable(k8sClient);
      if (k8sCheck) return k8sCheck;
      
      try {
        const response = await k8sClient.coreV1Api.listNamespace();
        const namespaces = k8sClient.handleApiResponse(response);
        return {
          count: namespaces.items.length,
          namespaces: namespaces.items.map(ns => ({
            name: ns.metadata.name,
            status: ns.status.phase,
            creationTimestamp: ns.metadata.creationTimestamp,
            labels: ns.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List pods
  tools.set('k8s-list-pods', {
    name: 'k8s-list-pods',
    description: 'List pods in a namespace (default: current namespace)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list pods from',
        },
        labelSelector: {
          type: 'string',
          description: 'Label selector to filter pods',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const options = {};
        if (args.labelSelector) {
          options.labelSelector = args.labelSelector;
        }

        const response = await k8sClient.coreV1Api.listNamespacedPod({
          namespace: namespace,
          labelSelector: options.labelSelector
        });
        const pods = k8sClient.handleApiResponse(response);
        
        return {
          namespace,
          count: pods.items.length,
          pods: pods.items.map(pod => ({
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            status: pod.status.phase,
            ready: pod.status.containerStatuses ? 
              `${pod.status.containerStatuses.filter(c => c.ready).length}/${pod.status.containerStatuses.length}` : 'Unknown',
            restarts: pod.status.containerStatuses ? 
              pod.status.containerStatuses.reduce((sum, c) => sum + c.restartCount, 0) : 0,
            age: pod.metadata.creationTimestamp,
            node: pod.spec.nodeName,
            labels: pod.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Get pod details
  tools.set('k8s-get-pod', {
    name: 'k8s-get-pod',
    description: 'Get detailed information about a specific pod',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Pod name',
        },
        namespace: {
          type: 'string',
          description: 'Namespace (default: current namespace)',
        },
      },
      required: ['name'],
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.coreV1Api.readNamespacedPod({
          name: args.name,
          namespace: namespace
        });
        const pod = k8sClient.handleApiResponse(response);
        
        return {
          metadata: {
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            labels: pod.metadata.labels || {},
            annotations: pod.metadata.annotations || {},
            creationTimestamp: pod.metadata.creationTimestamp,
          },
          spec: {
            containers: pod.spec.containers.map(c => ({
              name: c.name,
              image: c.image,
              ports: c.ports || [],
              env: c.env || [],
            })),
            nodeName: pod.spec.nodeName,
            restartPolicy: pod.spec.restartPolicy,
          },
          status: {
            phase: pod.status.phase,
            podIP: pod.status.podIP,
            hostIP: pod.status.hostIP,
            containerStatuses: pod.status.containerStatuses || [],
            conditions: pod.status.conditions || [],
          }
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List services
  tools.set('k8s-list-services', {
    name: 'k8s-list-services',
    description: 'List services in a namespace',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list services from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.coreV1Api.listNamespacedService({
          namespace: namespace
        });
        const services = k8sClient.handleApiResponse(response);
        
        return {
          namespace,
          count: services.items.length,
          services: services.items.map(svc => ({
            name: svc.metadata.name,
            namespace: svc.metadata.namespace,
            type: svc.spec.type,
            clusterIP: svc.spec.clusterIP,
            externalIPs: svc.spec.externalIPs || [],
            ports: svc.spec.ports || [],
            selector: svc.spec.selector || {},
            labels: svc.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List deployments
  tools.set('k8s-list-deployments', {
    name: 'k8s-list-deployments',
    description: 'List deployments in a namespace',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list deployments from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.appsV1Api.listNamespacedDeployment({
          namespace: namespace
        });
        const deployments = k8sClient.handleApiResponse(response);
        
        return {
          namespace,
          count: deployments.items.length,
          deployments: deployments.items.map(dep => ({
            name: dep.metadata.name,
            namespace: dep.metadata.namespace,
            ready: `${dep.status.readyReplicas || 0}/${dep.spec.replicas || 0}`,
            upToDate: dep.status.updatedReplicas || 0,
            available: dep.status.availableReplicas || 0,
            age: dep.metadata.creationTimestamp,
            labels: dep.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Get pod logs
  tools.set('k8s-get-logs', {
    name: 'k8s-get-logs',
    description: 'Get logs from a pod',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Pod name',
        },
        namespace: {
          type: 'string',
          description: 'Namespace (default: current namespace)',
        },
        container: {
          type: 'string',
          description: 'Container name (for multi-container pods)',
        },
        tailLines: {
          type: 'number',
          description: 'Number of lines to tail (default: 100)',
        },
        follow: {
          type: 'boolean',
          description: 'Follow log output',
        },
      },
      required: ['name'],
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const options = {
          tailLines: args.tailLines || 100,
          follow: args.follow || false,
        };
        
        if (args.container) {
          options.container = args.container;
        }

        const response = await k8sClient.coreV1Api.readNamespacedPodLog({
          name: args.name,
          namespace: namespace,
          container: options.container,
          follow: options.follow,
          tailLines: options.tailLines
        });
        
        return {
          podName: args.name,
          namespace,
          container: args.container || 'default',
          logs: response.body || 'No logs available'
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Execute command in pod
  tools.set('k8s-exec', {
    name: 'k8s-exec',
    description: 'Execute a command in a pod (Note: This is a simplified version)',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Pod name',
        },
        namespace: {
          type: 'string',
          description: 'Namespace (default: current namespace)',
        },
        container: {
          type: 'string',
          description: 'Container name (for multi-container pods)',
        },
        command: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command to execute (as array)',
        },
      },
      required: ['name', 'command'],
    },
    handler: async (args) => {
      // Note: This is a placeholder. Actual exec implementation requires WebSocket handling
      // which is complex in this context. This would need to be implemented with proper
      // streaming support for production use.
      return {
        message: 'Exec functionality requires WebSocket implementation',
        podName: args.name,
        namespace: args.namespace || k8sClient.getCurrentNamespace(),
        command: args.command,
        note: 'Use kubectl exec directly for now: kubectl exec -it ' + args.name + ' -- ' + args.command.join(' ')
      };
    },
  });
}
