import * as k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import { join } from 'path';

export class KubernetesClient {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.initializeConfig();
    this.setupClients();
  }

  initializeConfig() {
    try {
      // Try to load from default locations
      this.kc.loadFromDefault();
    } catch (error) {
      console.error('Failed to load Kubernetes config:', error.message);
      throw new Error('Unable to initialize Kubernetes client. Please ensure kubectl is configured.');
    }
  }

  setupClients() {
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
    return this.kc.getCurrentContext();
  }

  getCurrentCluster() {
    const currentContext = this.kc.getCurrentContext();
    if (!currentContext) return null;
    
    const context = this.kc.getContexts().find(ctx => ctx.name === currentContext);
    return context ? context.cluster : null;
  }

  getCurrentNamespace() {
    const currentContext = this.kc.getCurrentContext();
    if (!currentContext) return 'default';
    
    const context = this.kc.getContexts().find(ctx => ctx.name === currentContext);
    return context?.namespace || 'default';
  }

  async testConnection() {
    try {
      const response = await this.coreV1Api.listNamespace();
      return {
        success: true,
        namespaces: response.body.items.length,
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
