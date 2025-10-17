// src/tools/registry.ts
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
    annotations?: ToolAnnotations;
    handler: (args: any) => Promise<any>;
}

export const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition) {
    toolRegistry.set(tool.name, tool);
    console.error(`[Time Tracking MCP] Registered tool: ${tool.name}`);
}