// src/utils/tool-response.ts

/**
 * MCP tool response structure
 */
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
}

/**
 * Create a success response with formatted text
 */
export function createTextResponse(text: string): ToolResponse {
    return {
        content: [{
            type: 'text',
            text
        }]
    };
}

/**
 * Create an error response with formatted error message
 */
export function createErrorResponse(error: unknown, context: string): ToolResponse {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Time Tracking MCP] Error ${context}: ${message}`);
    return createTextResponse(`Error ${context}: ${message}`);
}

/**
 * Wrap a tool handler with standard error handling
 */
export function withErrorHandler(
    context: string,
    handler: (args: any) => Promise<ToolResponse>
): (args: any) => Promise<ToolResponse> {
    return async (args: any) => {
        try {
            return await handler(args);
        } catch (error) {
            return createErrorResponse(error, context);
        }
    };
}