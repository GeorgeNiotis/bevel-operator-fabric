#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { KubernetesClient } from './kubernetes/client.js';
import { registerKubernetesTools } from './tools/kubernetes-tools.js';
import { registerHyperledgerTools } from './tools/hyperledger-tools.js';
import { registerUtilityTools } from './tools/utility-tools.js';
import { prompts } from './prompts/index.js';

class HyperledgerBevelMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hyperledger-bevel-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.k8sClient = new KubernetesClient();
    this.tools = new Map();
    this.setupHandlers();
    this.registerAllTools();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (!this.tools.has(name)) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const tool = this.tools.get(name);
      try {
        const result = await tool.handler(args || {});
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: Object.values(prompts),
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (!prompts[name]) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      const prompt = prompts[name];
      return {
        messages: await prompt.handler(args || {}),
      };
    });
  }

  registerAllTools() {
    // Register Kubernetes tools
    registerKubernetesTools(this.tools, this.k8sClient);
    
    // Register Hyperledger Fabric tools
    registerHyperledgerTools(this.tools, this.k8sClient);
    
    // Register utility tools
    registerUtilityTools(this.tools, this.k8sClient);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hyperledger Bevel MCP Server running on stdio');
  }
}

// Start the server
const server = new HyperledgerBevelMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
