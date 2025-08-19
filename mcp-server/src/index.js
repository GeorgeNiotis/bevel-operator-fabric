#!/usr/bin/env node

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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

  getServer() {
    return this.server;
  }

  async setupServer() {
    // Setup is already done in constructor
    return Promise.resolve();
  }
}

// Create server instance
const mcpServerInstance = new HyperledgerBevelMCPServer();

// Express app setup
const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.
  
  try {
    const server = mcpServerInstance.getServer(); 
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      // Note: Don't close the server instance as it's shared
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (req, res) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Session termination not needed in stateless mode
app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Start the server
const PORT = process.env.PORT || 3000;
mcpServerInstance.setupServer().then(() => {
  app.listen(PORT, (error) => {
    if (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to set up the server:', error);
  process.exit(1);
});
