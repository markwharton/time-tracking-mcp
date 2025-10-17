// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { toolRegistry } from './tools/registry.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

// Import all tools (they self-register)
import './tools/log-time.js';
// Import other tools as you create them:
// import './tools/check-hours.js';
// import './tools/weekly-report.js';
// import './tools/status.js';

class TimeTrackingMCPServer {
    private server: Server;

    constructor() {
        console.error(`[Time Tracking MCP] Initializing server v${packageJson.version}...`);

        this.server = new Server(
            {
                name: packageJson.name,
                version: packageJson.version,
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        console.error('[Time Tracking MCP] Server initialized with registry pattern');
    }

    private setupHandlers() {
        console.error('[Time Tracking MCP] Setting up handlers...');

        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.error(`[Time Tracking MCP] Listing ${toolRegistry.size} tools`);

            const tools = Array.from(toolRegistry.values())
                .sort((a, b) => a.name.localeCompare(b.name));

            return {
                tools: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    annotations: tool.annotations
                }))
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const tool = toolRegistry.get(name);
                if (!tool) {
                    throw new Error(`Unknown tool: ${name}`);
                }

                console.error(`[Time Tracking MCP] Executing tool: ${name}`);
                const result = await tool.handler(args);

                return {
                    content: result.content
                };
            } catch (error) {
                console.error(`[Time Tracking MCP] Error in tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        });

        console.error('[Time Tracking MCP] Handlers set up');
    }

    async run() {
        try {
            console.error('[Time Tracking MCP] Starting server...');
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.error('[Time Tracking MCP] Server running on stdio');

            process.stdin.resume();

            process.on('SIGINT', () => {
                console.error('[Time Tracking MCP] Received SIGINT, shutting down...');
                process.exit(0);
            });

            process.on('SIGTERM', () => {
                console.error('[Time Tracking MCP] Received SIGTERM, shutting down...');
                process.exit(0);
            });

        } catch (error) {
            console.error('[Time Tracking MCP] Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Initialize and run server
try {
    const server = new TimeTrackingMCPServer();
    server.run().catch(error => {
        console.error('[Time Tracking MCP] Fatal error:', error);
        process.exit(1);
    });
} catch (error) {
    console.error('[Time Tracking MCP] Failed to initialize server:', error);
    process.exit(1);
}