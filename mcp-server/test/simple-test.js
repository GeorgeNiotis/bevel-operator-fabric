#!/usr/bin/env node

/**
 * Simple test script for the Hyperledger Bevel MCP Server
 * This directly tests the server startup and basic functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testServerStartup() {
  console.log('🧪 Testing MCP Server Startup...');
  
  return new Promise((resolve, reject) => {
    // Start the MCP server
    const serverPath = join(__dirname, '../src/index.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    let resolved = false;

    // Capture stdout
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Capture stderr (where the server logs go)
    serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      
      // Look for the startup message
      if (text.includes('Hyperledger Bevel MCP Server running on stdio') && !resolved) {
        resolved = true;
        console.log('✅ Server started successfully!');
        console.log('📝 Server message:', text.trim());
        
        // Kill the server after successful startup
        serverProcess.kill();
        resolve(true);
      }
    });

    // Handle process exit
    serverProcess.on('exit', (code) => {
      if (!resolved) {
        if (code === 0) {
          console.log('✅ Server exited cleanly');
          resolve(true);
        } else {
          console.log('❌ Server exited with code:', code);
          console.log('Output:', output);
          console.log('Error output:', errorOutput);
          reject(new Error(`Server exited with code ${code}`));
        }
      }
    });

    // Handle errors
    serverProcess.on('error', (error) => {
      if (!resolved) {
        console.log('❌ Server error:', error.message);
        reject(error);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!resolved) {
        console.log('❌ Server startup timeout');
        serverProcess.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 10000);
  });
}

async function testKubernetesConnection() {
  console.log('\n🔍 Testing Kubernetes Connection...');
  
  try {
    // Import the Kubernetes client directly
    const { KubernetesClient } = await import('../src/kubernetes/client.js');
    const k8sClient = new KubernetesClient();
    
    const result = await k8sClient.testConnection();
    
    if (result.success) {
      console.log('✅ Kubernetes connection successful!');
      console.log(`   Current context: ${result.currentContext}`);
      console.log(`   Current cluster: ${result.currentCluster}`);
      console.log(`   Current namespace: ${result.currentNamespace}`);
      console.log(`   Namespaces found: ${result.namespaces}`);
    } else {
      console.log('⚠️  Kubernetes connection failed:', result.error);
      console.log('   This is expected if kubectl is not configured or cluster is not accessible');
    }
    
    return result.success;
  } catch (error) {
    console.log('⚠️  Kubernetes test error:', error.message);
    console.log('   This is expected if kubectl is not configured');
    return false;
  }
}

async function testToolsImport() {
  console.log('\n📦 Testing Tool Imports...');
  
  try {
    // Test importing all tool modules
    const { registerKubernetesTools } = await import('../src/tools/kubernetes-tools.js');
    const { registerHyperledgerTools } = await import('../src/tools/hyperledger-tools.js');
    const { registerUtilityTools } = await import('../src/tools/utility-tools.js');
    const { prompts } = await import('../src/prompts/index.js');
    
    console.log('✅ All tool modules imported successfully');
    console.log(`   Available prompts: ${Object.keys(prompts).length}`);
    
    // Test tool registration
    const tools = new Map();
    const mockK8sClient = { getCurrentNamespace: () => 'default' };
    
    registerKubernetesTools(tools, mockK8sClient);
    registerHyperledgerTools(tools, mockK8sClient);
    registerUtilityTools(tools, mockK8sClient);
    
    console.log(`✅ Tools registered successfully: ${tools.size} tools available`);
    
    // List some tools
    const toolNames = Array.from(tools.keys()).slice(0, 5);
    console.log(`   Sample tools: ${toolNames.join(', ')}`);
    
    return true;
  } catch (error) {
    console.log('❌ Tool import error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Hyperledger Bevel MCP Server Test Suite');
  console.log('==========================================\n');
  
  const results = {
    serverStartup: false,
    kubernetesConnection: false,
    toolsImport: false
  };
  
  try {
    // Test 1: Server startup
    results.serverStartup = await testServerStartup();
    
    // Test 2: Kubernetes connection
    results.kubernetesConnection = await testKubernetesConnection();
    
    // Test 3: Tools import
    results.toolsImport = await testToolsImport();
    
  } catch (error) {
    console.error('Test suite error:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Server Startup: ${results.serverStartup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Kubernetes Connection: ${results.kubernetesConnection ? '✅ PASS' : '⚠️  SKIP (no cluster)'}`);
  console.log(`Tools Import: ${results.toolsImport ? '✅ PASS' : '❌ FAIL'}`);
  
  const criticalTests = [results.serverStartup, results.toolsImport];
  const allCriticalPassed = criticalTests.every(test => test);
  
  if (allCriticalPassed) {
    console.log('\n🎉 All critical tests passed! The MCP server is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Start the server: yarn start');
    console.log('2. Configure your MCP client with the server');
    console.log('3. If you have kubectl configured, test Kubernetes features');
  } else {
    console.log('\n❌ Some critical tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
