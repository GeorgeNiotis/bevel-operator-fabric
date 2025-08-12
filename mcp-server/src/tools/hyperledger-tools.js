export function registerHyperledgerTools(tools, k8sClient) {
  // List Fabric CAs
  tools.set('hlf-list-cas', {
    name: 'hlf-list-cas',
    description: 'List Hyperledger Fabric Certificate Authorities (FabricCA CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list CAs from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabriccas'
        );
        
        const cas = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: cas.items.length,
          cas: cas.items.map(ca => ({
            name: ca.metadata.name,
            namespace: ca.metadata.namespace,
            status: ca.status?.status || 'Unknown',
            url: ca.status?.url || 'N/A',
            caName: ca.spec?.ca?.name || 'N/A',
            tlsCAName: ca.spec?.tlsca?.name || 'N/A',
            version: ca.spec?.version || 'Unknown',
            creationTimestamp: ca.metadata.creationTimestamp,
            labels: ca.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Fabric Peers
  tools.set('hlf-list-peers', {
    name: 'hlf-list-peers',
    description: 'List Hyperledger Fabric Peers (FabricPeer CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list peers from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricpeers'
        );
        
        const peers = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: peers.items.length,
          peers: peers.items.map(peer => ({
            name: peer.metadata.name,
            namespace: peer.metadata.namespace,
            status: peer.status?.status || 'Unknown',
            mspID: peer.spec?.mspID || 'Unknown',
            externalEndpoint: peer.status?.url || 'N/A',
            stateDB: peer.spec?.stateDB || 'leveldb',
            version: peer.spec?.version || 'Unknown',
            creationTimestamp: peer.metadata.creationTimestamp,
            labels: peer.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Fabric Orderers
  tools.set('hlf-list-orderers', {
    name: 'hlf-list-orderers',
    description: 'List Hyperledger Fabric Orderers (FabricOrderer CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list orderers from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricorderers'
        );
        
        const orderers = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: orderers.items.length,
          orderers: orderers.items.map(orderer => ({
            name: orderer.metadata.name,
            namespace: orderer.metadata.namespace,
            status: orderer.status?.status || 'Unknown',
            mspID: orderer.spec?.mspID || 'Unknown',
            externalEndpoint: orderer.status?.url || 'N/A',
            version: orderer.spec?.version || 'Unknown',
            creationTimestamp: orderer.metadata.creationTimestamp,
            labels: orderer.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Fabric Orderer Nodes
  tools.set('hlf-list-ordnodes', {
    name: 'hlf-list-ordnodes',
    description: 'List Hyperledger Fabric Orderer Nodes (FabricOrdererNode CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list orderer nodes from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricorderernodes'
        );
        
        const ordnodes = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: ordnodes.items.length,
          ordererNodes: ordnodes.items.map(node => ({
            name: node.metadata.name,
            namespace: node.metadata.namespace,
            status: node.status?.status || 'Unknown',
            mspID: node.spec?.mspID || 'Unknown',
            externalEndpoint: node.status?.url || 'N/A',
            adminEndpoint: node.status?.adminUrl || 'N/A',
            version: node.spec?.version || 'Unknown',
            creationTimestamp: node.metadata.creationTimestamp,
            labels: node.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Main Channels
  tools.set('hlf-list-main-channels', {
    name: 'hlf-list-main-channels',
    description: 'List Hyperledger Fabric Main Channels (FabricMainChannel CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list main channels from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricmainchannels'
        );
        
        const channels = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: channels.items.length,
          mainChannels: channels.items.map(channel => ({
            name: channel.metadata.name,
            namespace: channel.metadata.namespace,
            channelName: channel.spec?.name || 'Unknown',
            status: channel.status?.status || 'Unknown',
            adminOrdererOrgs: channel.spec?.adminOrdererOrganizations?.map(org => org.mspID) || [],
            adminPeerOrgs: channel.spec?.adminPeerOrganizations?.map(org => org.mspID) || [],
            creationTimestamp: channel.metadata.creationTimestamp,
            labels: channel.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Follower Channels
  tools.set('hlf-list-follower-channels', {
    name: 'hlf-list-follower-channels',
    description: 'List Hyperledger Fabric Follower Channels (FabricFollowerChannel CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list follower channels from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricfollowerchannels'
        );
        
        const channels = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: channels.items.length,
          followerChannels: channels.items.map(channel => ({
            name: channel.metadata.name,
            namespace: channel.metadata.namespace,
            channelName: channel.spec?.name || 'Unknown',
            mspId: channel.spec?.mspId || 'Unknown',
            status: channel.status?.status || 'Unknown',
            anchorPeers: channel.spec?.anchorPeers || [],
            peersToJoin: channel.spec?.peersToJoin?.map(peer => peer.name) || [],
            creationTimestamp: channel.metadata.creationTimestamp,
            labels: channel.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // List Chaincode
  tools.set('hlf-list-chaincode', {
    name: 'hlf-list-chaincode',
    description: 'List Hyperledger Fabric Chaincode (FabricChaincode CRDs)',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace to list chaincode from',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const response = await k8sClient.customObjectsApi.listNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          'fabricchaincodes'
        );
        
        const chaincodes = k8sClient.handleApiResponse(response);
        return {
          namespace,
          count: chaincodes.items.length,
          chaincodes: chaincodes.items.map(cc => ({
            name: cc.metadata.name,
            namespace: cc.metadata.namespace,
            status: cc.status?.status || 'Unknown',
            packageId: cc.spec?.packageId || 'Unknown',
            image: cc.spec?.image || 'Unknown',
            version: cc.spec?.version || 'Unknown',
            creationTimestamp: cc.metadata.creationTimestamp,
            labels: cc.metadata.labels || {}
          }))
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Get detailed info about a specific Fabric resource
  tools.set('hlf-get-resource', {
    name: 'hlf-get-resource',
    description: 'Get detailed information about a specific Hyperledger Fabric resource',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['fabricca', 'fabricpeer', 'fabricorderer', 'fabricorderernodes', 'fabricmainchannels', 'fabricfollowerchannels', 'fabricchaincodes'],
          description: 'Type of Fabric resource',
        },
        name: {
          type: 'string',
          description: 'Name of the resource',
        },
        namespace: {
          type: 'string',
          description: 'Namespace (default: current namespace)',
        },
      },
      required: ['type', 'name'],
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || k8sClient.getCurrentNamespace();
        const pluralMap = {
          'fabricca': 'fabriccas',
          'fabricpeer': 'fabricpeers',
          'fabricorderer': 'fabricorderers',
          'fabricorderernodes': 'fabricorderernodes',
          'fabricmainchannels': 'fabricmainchannels',
          'fabricfollowerchannels': 'fabricfollowerchannels',
          'fabricchaincodes': 'fabricchaincodes'
        };
        
        const plural = pluralMap[args.type] || args.type;
        const response = await k8sClient.customObjectsApi.getNamespacedCustomObject(
          'hlf.kungfusoftware.es',
          'v1alpha1',
          namespace,
          plural,
          args.name
        );
        
        const resource = k8sClient.handleApiResponse(response);
        return {
          metadata: resource.metadata,
          spec: resource.spec,
          status: resource.status || {}
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });

  // Check HLF Operator status
  tools.set('hlf-check-operator', {
    name: 'hlf-check-operator',
    description: 'Check the status of the Hyperledger Fabric Operator',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Namespace where operator is deployed (default: hlf-operator)',
        },
      },
    },
    handler: async (args) => {
      try {
        const namespace = args.namespace || 'hlf-operator';
        
        // Check for operator deployment
        const deploymentResponse = await k8sClient.appsV1Api.listNamespacedDeployment(
          namespace,
          undefined,
          undefined,
          undefined,
          undefined,
          'app.kubernetes.io/name=hlf-operator'
        );
        
        const deployments = k8sClient.handleApiResponse(deploymentResponse);
        
        // Check for operator pods
        const podResponse = await k8sClient.coreV1Api.listNamespacedPod(
          namespace,
          undefined,
          undefined,
          undefined,
          undefined,
          'app.kubernetes.io/name=hlf-operator'
        );
        
        const pods = k8sClient.handleApiResponse(podResponse);
        
        return {
          namespace,
          deployments: deployments.items.map(dep => ({
            name: dep.metadata.name,
            ready: `${dep.status.readyReplicas || 0}/${dep.spec.replicas || 0}`,
            status: dep.status.conditions?.find(c => c.type === 'Available')?.status || 'Unknown'
          })),
          pods: pods.items.map(pod => ({
            name: pod.metadata.name,
            status: pod.status.phase,
            ready: pod.status.containerStatuses ? 
              `${pod.status.containerStatuses.filter(c => c.ready).length}/${pod.status.containerStatuses.length}` : 'Unknown'
          })),
          operatorRunning: deployments.items.length > 0 && pods.items.some(pod => pod.status.phase === 'Running')
        };
      } catch (error) {
        throw new Error(k8sClient.formatError(error));
      }
    },
  });
}
