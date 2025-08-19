#!/usr/bin/env node

/**
 * Test script to verify Kubernetes connectivity from Docker environment
 */

import { KubernetesClient } from './src/kubernetes/client.js';
import { existsSync } from 'fs';

async function testDockerK8sConnection() {
  console.log('🐳 Testing Kubernetes connection from Docker environment');
  console.log('=====================================================\n');

  // Show environment info
  console.log('Environment Info:');
  console.log(`- DOCKER_CONTAINER: ${process.env.DOCKER_CONTAINER}`);
  console.log(`- K8S_SKIP_TLS_VERIFY: ${process.env.K8S_SKIP_TLS_VERIFY}`);
  console.log(`- KUBERNETES_SKIP_TLS_VERIFY: ${process.env.KUBERNETES_SKIP_TLS_VERIFY}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- HOSTNAME: ${process.env.HOSTNAME}`);
  console.log(`- Docker env file exists: ${existsSync('/.dockerenv')}`);
  console.log('');

  try {
    // Initialize Kubernetes client
    console.log('1️⃣ Initializing Kubernetes client...');
    const k8sClient = new KubernetesClient();
    
    // Test connection
    console.log('2️⃣ Testing connection...');
    const result = await k8sClient.testConnection();
    
    if (result.success) {
      console.log('✅ Connection successful!');
      console.log(`   - Context: ${result.currentContext}`);
      console.log(`   - Cluster: ${result.currentCluster}`);
      console.log(`   - Namespace: ${result.currentNamespace}`);
      console.log(`   - Namespaces found: ${result.namespaces}`);
    } else {
      console.log('❌ Connection failed:');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.log('❌ Test failed with error:');
    console.log(`   ${error.message}`);
    
    if (error.message.includes('localhost') || error.message.includes('127.0.0.1')) {
      console.log('\n💡 Tip: Make sure you\'re using host.docker.internal for localhost connections in Docker');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Check if Kubernetes cluster is accessible from Docker container');
      console.log('   - Verify kubectl config is mounted correctly');
      console.log('   - Check if cluster endpoint is reachable');
    }
  }
}

testDockerK8sConnection().catch(console.error);
