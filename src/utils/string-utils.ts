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
