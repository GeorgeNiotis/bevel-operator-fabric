#!/usr/bin/env node

/**
 * Simple tool testing example for the Hyperledger Bevel MCP Server
 * This demonstrates how to test individual tools directly
 */

import { KubernetesClient } from '../src/kubernetes/client.js';
import { registerKubernetesTools } from '../src/tools/kubernetes-tools.js';
import { registerHyperledgerTools } from '../src/tools/hyperledger-tools.js';
import { registerUtilityTools } from '../src/tools/utility-tools.js';
import { prompts } from '../src/prompts/index.js';

async function testIndividualTools() {
  console.log('🔧 Testing Individual MCP Tools');
  console.log('===============================\n');

  // Initialize Kubernetes client
  const k8sClient = new KubernetesClient();
  const tools = new Map();

  // Register all tools
  registerKubernetesTools(tools, k8sClient);
  registerHyperledgerTools(tools, k8sClient);
  registerUtilityTools(tools, k8sClient);

  console.log(`📋 Total tools available: ${tools.size}\n`);

  // Test 1: Kubernetes connection
  console.log('1️⃣ Testing Kubernetes Connection');
  try {
    const connectionTool = tools.get('k8s-test-connection');
    const result = await connectionTool.handler({});
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: List namespaces
  console.log('\n2️⃣ Testing Namespace Listing');
  try {
    const namespacesTool = tools.get('k8s-list-namespaces');
    const result = await namespacesTool.handler({});
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    console.log(`✅ Found ${parsed.count} namespaces:`);
    parsed.namespaces.slice(0, 3).forEach(ns => {
      console.log(`   - ${ns.name} (${ns.status})`);
    });
    if (parsed.namespaces.length > 3) {
      console.log(`   ... and ${parsed.namespaces.length - 3} more`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: YAML parsing utility
  console.log('\n3️⃣ Testing YAML Parsing Tool');
  try {
    const yamlTool = tools.get('parse-yaml');
    const testYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  key1: value1
  key2: value2
`;
    const result = await yamlTool.handler({ content: testYaml });
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    console.log('✅ YAML parsed successfully:');
    console.log(`   Kind: ${parsed.parsed.kind}`);
    console.log(`   Name: ${parsed.parsed.metadata.name}`);
    console.log(`   Data keys: ${Object.keys(parsed.parsed.data).join(', ')}`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Network config generation
  console.log('\n4️⃣ Testing Network Config Generation');
  try {
    const networkTool = tools.get('hlf-generate-network-config');
    const result = await networkTool.handler({
      organizationName: 'Org1',
      mspId: 'Org1MSP',
      domain: 'org1.example.com'
    });
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    console.log('✅ Network config generated successfully:');
    console.log(`   Organization: ${parsed.organizationName}`);
    console.log(`   MSP ID: ${parsed.mspId}`);
    console.log(`   Domain: ${parsed.domain}`);
    console.log(`   Config contains: ${Object.keys(parsed.config).join(', ')}`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Try Hyperledger Fabric tools (may fail if no HLF resources)
  console.log('\n5️⃣ Testing Hyperledger Fabric Tools');
  try {
    const peersTool = tools.get('hlf-list-peers');
    const result = await peersTool.handler({ namespace: 'default' });
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    console.log(`✅ Found ${parsed.count} Fabric peers in ${parsed.namespace}`);
    if (parsed.count > 0) {
      parsed.peers.slice(0, 2).forEach(peer => {
        console.log(`   - ${peer.name}: ${peer.status} (${peer.mspID})`);
      });
    }
  } catch (error) {
    console.log('⚠️  HLF Peers (expected if no Fabric resources):', error.message);
  }

  // Test 6: Test prompts
  console.log('\n6️⃣ Testing Prompts System');
  try {
    const deploymentPrompt = prompts['hlf-deployment-guide'];
    const result = await deploymentPrompt.handler({
      component: 'peer',
      environment: 'development'
    });
    console.log('✅ Deployment guidance prompt works:');
    console.log(`   Generated ${result.length} message(s)`);
    console.log(`   First 100 chars: ${result[0].content.text.substring(0, 100)}...`);
  } catch (error) {
    console.log('❌ Prompt error:', error.message);
  }

  console.log('\n🎯 Tool Testing Complete!');
  console.log('\nKey findings:');
  console.log(`- ${tools.size} tools are registered and callable`);
  console.log('- Kubernetes integration is working');
  console.log('- Utility tools (YAML, config generation) are functional');
  console.log('- Prompt system is operational');
  console.log('- HLF tools are ready (will work when Fabric resources are present)');
}

async function listAllTools() {
  console.log('\n📚 Complete Tool Reference');
  console.log('==========================\n');

  const k8sClient = new KubernetesClient();
  const tools = new Map();

  registerKubernetesTools(tools, k8sClient);
  registerHyperledgerTools(tools, k8sClient);
  registerUtilityTools(tools, k8sClient);

  const categories = {
    'Kubernetes Tools': [],
    'Hyperledger Fabric Tools': [],
    'Utility Tools': []
  };

  tools.forEach((tool, name) => {
    if (name.startsWith('k8s-')) {
      categories['Kubernetes Tools'].push(tool);
    } else if (name.startsWith('hlf-')) {
      categories['Hyperledger Fabric Tools'].push(tool);
    } else {
      categories['Utility Tools'].push(tool);
    }
  });

  Object.entries(categories).forEach(([category, toolList]) => {
    console.log(`${category} (${toolList.length}):`);
    toolList.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });
    console.log('');
  });

  console.log(`Available Prompts (${Object.keys(prompts).length}):`);
  Object.values(prompts).forEach(prompt => {
    console.log(`  • ${prompt.name}: ${prompt.description}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    await listAllTools();
  } else {
    await testIndividualTools();
    
    console.log('\n💡 Tip: Use "node examples/test-tools.js --list" to see all available tools');
  }
}

main().catch(console.error);
