// src/utils/string-utils.ts
/**
 * String utility functions
 */

/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeName(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitize task description to prevent markdown injection
 * Removes/replaces characters that could break markdown structure
 * @param task - Task description to sanitize
 * @returns Sanitized task description
 */
export function sanitizeTaskDescription(task: string): string {
    if (!task) {
        throw new Error('Task description cannot be empty');
    }

    // Remove leading/trailing whitespace
    let sanitized = task.trim();

    // Replace newlines with spaces (tasks should be single line)
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');

    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Escape markdown header markers at start of string
    sanitized = sanitized.replace(/^#{1,6}\s/, '');

    // Remove leading list markers that could break structure
    sanitized = sanitized.replace(/^[-*+]\s/, '');

    // Check for minimum length after sanitization
    if (sanitized.length === 0) {
        throw new Error('Task description cannot be empty after sanitization');
    }

    // Check for maximum reasonable length
    if (sanitized.length > 500) {
        throw new Error(`Task description too long (${sanitized.length} chars). Maximum 500 characters.`);
    }

    return sanitized;
}

/**
 * Format tags array as space-separated hashtags
 * @param tags - Array of tag strings
 * @returns Formatted tags string (e.g., "#dev #testing")
 */
export function formatTags(tags: string[]): string {
    return tags.map(t => '#' + t).join(' ');
}

/**
 * Format tags with default value if empty
 * @param tags - Array of tag strings
 * @param defaultValue - Value to return if tags array is empty
 * @returns Formatted tags string or default value
 */
export function formatTagsWithDefault(tags: string[], defaultValue: string = ''): string {
    return tags.length > 0 ? formatTags(tags) : defaultValue;
}
