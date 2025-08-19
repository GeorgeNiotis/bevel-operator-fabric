#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 */

import { KubernetesClient } from './src/kubernetes/client.js';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server Components...\n');
  
  try {
    // Test Kubernetes client initialization
    console.log('1. Testing Kubernetes Client...');
    const k8sClient = new KubernetesClient();
    console.log('   ✅ Kubernetes client initialized successfully');
    
    // Test connection
    console.log('2. Testing Kubernetes connection...');
    const connectionTest = await k8sClient.testConnection();
    if (connectionTest.success) {
      console.log('   ✅ Kubernetes connection successful');
      console.log(`   📊 Found ${connectionTest.namespaces} namespaces`);
      console.log(`   🎯 Current context: ${connectionTest.currentContext}`);
      console.log(`   🏗️  Current cluster: ${connectionTest.currentCluster}`);
      console.log(`   📦 Current namespace: ${connectionTest.currentNamespace}`);
    } else {
      console.log('   ❌ Kubernetes connection failed:', connectionTest.error);
    }
    
    // Test tool imports
    console.log('3. Testing tool imports...');
    const { registerKubernetesTools } = await import('./src/tools/kubernetes-tools.js');
    const { registerHyperledgerTools } = await import('./src/tools/hyperledger-tools.js');
    const { registerUtilityTools } = await import('./src/tools/utility-tools.js');
    console.log('   ✅ All tool modules imported successfully');
    
    // Test prompts import
    console.log('4. Testing prompts import...');
    const { prompts } = await import('./src/prompts/index.js');
    console.log(`   ✅ Prompts loaded: ${Object.keys(prompts).length} available`);
    console.log(`   📋 Available prompts: ${Object.keys(prompts).join(', ')}`);
    
    // Test tool registration
    console.log('5. Testing tool registration...');
    const toolsMap = new Map();
    registerKubernetesTools(toolsMap, k8sClient);
    registerHyperledgerTools(toolsMap, k8sClient);
    registerUtilityTools(toolsMap, k8sClient);
    console.log(`   ✅ Tools registered: ${toolsMap.size} total tools`);
    
    // List all available tools
    console.log('6. Available MCP Tools:');
    for (const [name, tool] of toolsMap) {
      console.log(`   🛠️  ${name}: ${tool.description}`);
    }
    
    console.log('\n🎉 MCP Server test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Run: npm start (to start the MCP server)');
    console.log('   - Configure your MCP client to connect to this server');
    console.log('   - Use the available tools to manage your Hyperledger Fabric network');
    
  } catch (error) {
    console.error('\n❌ MCP Server test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPServer();
