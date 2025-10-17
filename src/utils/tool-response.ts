// src/utils/tool-response.ts

/**
 * Standard guidance for multi-company mode interactions
 * DRY: Single source of truth for company selection guidance
 */
export const MULTI_COMPANY_GUIDANCE = `

**Multi-company mode**: When company is not specified and multiple companies are configured,
Claude should use AskUserQuestion tool to present available companies as interactive options,
including an option to show "Both companies" for comparison.`;

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