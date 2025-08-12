#!/usr/bin/env node

/**
 * Basic usage examples for the Hyperledger Bevel MCP Server
 * 
 * This file demonstrates how to interact with the MCP server programmatically.
 * Note: This is for demonstration purposes. In practice, MCP servers are typically
 * used through MCP-compatible clients like Claude Desktop or other AI assistants.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

class MCPClientExample {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  async connect() {
    // Get the current file's directory (ES module equivalent of __dirname)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Start the MCP server
    const serverProcess = spawn('node', ['../src/index.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Create transport
    this.transport = new StdioClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout
    });

    // Create client
    this.client = new Client({
      name: 'example-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Connect
    await this.client.connect(this.transport);
    console.log('Connected to MCP server');
  }

  async listTools() {
    console.log('\n=== Available Tools ===');
    const response = await this.client.request(
      { method: 'tools/list' },
      {}
    );

    response.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
  }

  async testKubernetesConnection() {
    console.log('\n=== Testing Kubernetes Connection ===');
    try {
      const response = await this.client.request(
        { method: 'tools/call' },
        {
          name: 'k8s-test-connection',
          arguments: {}
        }
      );

      console.log('Connection result:', JSON.stringify(response.content[0].text, null, 2));
    } catch (error) {
      console.error('Failed to test connection:', error.message);
    }
  }

  async listNamespaces() {
    console.log('\n=== Listing Namespaces ===');
    try {
      const response = await this.client.request(
        { method: 'tools/call' },
        {
          name: 'k8s-list-namespaces',
          arguments: {}
        }
      );

      const result = JSON.parse(response.content[0].text);
      console.log(`Found ${result.count} namespaces:`);
      result.namespaces.forEach(ns => {
        console.log(`  - ${ns.name} (${ns.status})`);
      });
    } catch (error) {
      console.error('Failed to list namespaces:', error.message);
    }
  }

  async listPods(namespace = 'default') {
    console.log(`\n=== Listing Pods in ${namespace} ===`);
    try {
      const response = await this.client.request(
        { method: 'tools/call' },
        {
          name: 'k8s-list-pods',
          arguments: { namespace }
        }
      );

      const result = JSON.parse(response.content[0].text);
      console.log(`Found ${result.count} pods in ${result.namespace}:`);
      result.pods.forEach(pod => {
        console.log(`  - ${pod.name}: ${pod.status} (${pod.ready})`);
      });
    } catch (error) {
      console.error('Failed to list pods:', error.message);
    }
  }

  async listHyperledgerPeers(namespace = 'default') {
    console.log(`\n=== Listing Hyperledger Fabric Peers in ${namespace} ===`);
    try {
      const response = await this.client.request(
        { method: 'tools/call' },
        {
          name: 'hlf-list-peers',
          arguments: { namespace }
        }
      );

      const result = JSON.parse(response.content[0].text);
      console.log(`Found ${result.count} Fabric peers in ${result.namespace}:`);
      result.peers.forEach(peer => {
        console.log(`  - ${peer.name}: ${peer.status} (MSP: ${peer.mspID})`);
        console.log(`    Endpoint: ${peer.externalEndpoint}`);
        console.log(`    StateDB: ${peer.stateDB}, Version: ${peer.version}`);
      });
    } catch (error) {
      console.error('Failed to list Hyperledger peers:', error.message);
    }
  }

  async checkHLFOperator() {
    console.log('\n=== Checking HLF Operator Status ===');
    try {
      const response = await this.client.request(
        { method: 'tools/call' },
        {
          name: 'hlf-check-operator',
          arguments: {}
        }
      );

      const result = JSON.parse(response.content[0].text);
      console.log(`Operator running: ${result.operatorRunning}`);
      console.log(`Deployments: ${result.deployments.length}`);
      console.log(`Pods: ${result.pods.length}`);
    } catch (error) {
      console.error('Failed to check HLF operator:', error.message);
    }
  }

  async getDeploymentGuidance() {
    console.log('\n=== Getting Deployment Guidance ===');
    try {
      const response = await this.client.request(
        { method: 'prompts/get' },
        {
          name: 'hlf-deployment-guide',
          arguments: {
            component: 'peer',
            environment: 'development'
          }
        }
      );

      console.log('Deployment guidance:');
      console.log(response.messages[0].content.text);
    } catch (error) {
      console.error('Failed to get deployment guidance:', error.message);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('\nDisconnected from MCP server');
    }
  }
}

// Example usage
async function main() {
  const example = new MCPClientExample();

  try {
    await example.connect();
    
    // List available tools
    await example.listTools();
    
    // Test Kubernetes connection
    await example.testKubernetesConnection();
    
    // List namespaces
    await example.listNamespaces();
    
    // List pods in default namespace
    await example.listPods('default');
    
    // List Hyperledger Fabric peers
    await example.listHyperledgerPeers('default');
    
    // Check HLF Operator status
    await example.checkHLFOperator();
    
    // Get deployment guidance
    await example.getDeploymentGuidance();
    
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await example.disconnect();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPClientExample };
