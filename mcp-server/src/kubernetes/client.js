import * as k8s from '@kubernetes/client-node';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class KubernetesClient {
  constructor() {
    this.disabled = process.env.K8S_DISABLED === 'true';
    
    if (this.disabled) {
      console.warn('Kubernetes client disabled via K8S_DISABLED environment variable');
      return;
    }
    
    this.kc = new k8s.KubeConfig();
    this.initializeConfig();
    this.setupClients();
  }

  initializeConfig() {
    if (this.disabled) {
      console.log('Kubernetes client disabled - skipping configuration');
      return;
    }
    
    try {
      // Try to load from default locations
      this.kc.loadFromDefault();
      
      // Handle TLS settings for development environments
      this.configureTLSSettings();
    } catch (error) {
      console.error('Failed to load Kubernetes config:', error.message);
      
      // Check if we're in Docker and suggest solutions
      if (process.env.DOCKER_CONTAINER === 'true') {
        console.error('Running in Docker container. To fix Kubernetes connectivity:');
        console.error('1. Mount your kubeconfig: add "- ~/.kube:/app/.kube:ro" to volumes in docker-compose.yml');
        console.error('2. Or disable Kubernetes: set K8S_DISABLED=true environment variable');
        console.error('3. Or skip TLS verification: set K8S_SKIP_TLS_VERIFY=true');
      }
      
      throw new Error('Unable to initialize Kubernetes client. Please ensure kubectl is configured or set K8S_DISABLED=true.');
    }
  }

  configureTLSSettings() {
    try {
      // Check if user explicitly wants to skip TLS verification
      const forceSkipTLS = process.env.K8S_SKIP_TLS_VERIFY === 'true' || 
                           process.env.KUBERNETES_SKIP_TLS_VERIFY === 'true';

      // Get current cluster info
      const currentContext = this.kc.getCurrentContext();
      if (!currentContext) return;

      const contexts = this.kc.getContexts();
      const context = contexts.contexts ? 
        contexts.contexts.find(ctx => ctx.name === currentContext) :
        contexts.find(ctx => ctx.name === currentContext);
      
      if (!context) return;

      const clusters = this.kc.getClusters();
      const cluster = clusters.find(c => c.name === context.cluster);
      
      if (cluster && cluster.server) {
        const serverUrl = new URL(cluster.server);
        
        // For local development clusters (like minikube, k3s, orbstack)
        // or HTTP endpoints, configure appropriate TLS settings
        const isDevelopmentCluster = serverUrl.protocol === 'http:' || 
            serverUrl.hostname === 'localhost' || 
            serverUrl.hostname === '127.0.0.1' ||
            serverUrl.hostname.includes('.local') ||
            cluster.name.includes('orbstack') ||
            cluster.name.includes('minikube') ||
            cluster.name.includes('k3s') ||
            cluster.name.includes('docker-desktop');
        
        // Check if we're running inside Docker and need to access host services
        const isInDocker = process.env.DOCKER_CONTAINER === 'true' || 
                          process.env.NODE_ENV === 'docker' ||
                          process.env.HOSTNAME?.includes('docker') ||
                          existsSync('/.dockerenv');
        
        if (isInDocker && (serverUrl.hostname === 'localhost' || serverUrl.hostname === '127.0.0.1')) {
          if (process.env.MCP_DEBUG === 'true') {
            console.error('Detected Docker environment, updating server URL to use host.docker.internal');
          }
          cluster.server = cluster.server.replace(/localhost|127\.0\.0\.1/, 'host.docker.internal');
        }
        
        if (forceSkipTLS || isDevelopmentCluster) {
          if (process.env.MCP_DEBUG === 'true') {
            console.error(`Configuring TLS settings for cluster: ${cluster.name} (server: ${cluster.server})`);
          }
          
          // Set skip TLS verify for development environments
          cluster.skipTLSVerify = true;
          
          // Also set insecure skip TLS verify
          cluster['insecure-skip-tls-verify'] = true;
        }
      }
    } catch (error) {
      console.warn('Could not configure TLS settings:', error.message);
    }
  }

  setupClients() {
    if (this.disabled) {
      console.log('Kubernetes client disabled - skipping client setup');
      return;
    }
    
    // Core API client
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    
    // Apps API client
    this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    
    // Custom Objects API client for CRDs
    this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
    
    // Network API client
    this.networkingV1Api = this.kc.makeApiClient(k8s.NetworkingV1Api);
    
    // RBAC API client
    this.rbacV1Api = this.kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  }

  getCurrentContext() {
    if (this.disabled) return 'disabled';
    return this.kc.getCurrentContext();
  }

  getCurrentCluster() {
    if (this.disabled) return 'disabled';
    
    const currentContext = this.kc.getCurrentContext();
    if (!currentContext) return null;
    
    try {
      const contexts = this.kc.getContexts();
      const context = contexts.contexts ? 
        contexts.contexts.find(ctx => ctx.name === currentContext) :
        contexts.find(ctx => ctx.name === currentContext);
      return context ? context.cluster : null;
    } catch (error) {
      console.error('Error getting current cluster:', error.message);
      return null;
    }
  }

  getCurrentNamespace() {
    if (this.disabled) return 'disabled';
    
    const currentContext = this.kc.getCurrentContext();
    if (!currentContext) return 'default';
    
    try {
      const contexts = this.kc.getContexts();
      const context = contexts.contexts ? 
        contexts.contexts.find(ctx => ctx.name === currentContext) :
        contexts.find(ctx => ctx.name === currentContext);
      return context?.namespace || 'default';
    } catch (error) {
      console.error('Error getting current namespace:', error.message);
      return 'default';
    }
  }

  async testConnection() {
    if (this.disabled) {
      return {
        success: false,
        error: 'Kubernetes client is disabled via K8S_DISABLED environment variable'
      };
    }
    
    try {
      const response = await this.coreV1Api.listNamespace();
      const body = this.handleApiResponse(response);
      return {
        success: true,
        namespaces: body.items ? body.items.length : 0,
        currentContext: this.getCurrentContext(),
        currentCluster: this.getCurrentCluster(),
        currentNamespace: this.getCurrentNamespace()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to handle API responses
  handleApiResponse(response) {
    if (response && response.body) {
      return response.body;
    }
    return response;
  }

  // Helper method to format errors
  formatError(error) {
    if (error.response && error.response.body) {
      return `${error.response.statusCode}: ${error.response.body.message || error.message}`;
    }
    return error.message;
  }
}
