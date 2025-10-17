// src/utils/report-formatters.ts
/**
 * Shared formatting utilities for report generation
 * Following DRY principle - single source of truth for report formatting
 */

/**
 * Format project breakdown section
 * @param byProject - Map of project names to hours
 * @returns Formatted project breakdown string, or empty string if no projects
 */
export function formatProjectBreakdown(byProject: Record<string, number>): string {
    if (Object.keys(byProject).length === 0) {
        return '';
    }

    let output = `**By Project:**\n`;
    const sortedProjects = Object.entries(byProject)
        .sort((a, b) => b[1] - a[1]); // Sort by hours descending

    for (const [project, hours] of sortedProjects) {
        output += `• ${project}: ${hours.toFixed(1)}h\n`;
    }

    return output + '\n';
}

/**
 * Format tag breakdown section
 * @param byTag - Map of tag names to hours
 * @returns Formatted tag breakdown string, or empty string if no tags
 */
export function formatTagBreakdown(byTag: Record<string, number>): string {
    if (Object.keys(byTag).length === 0) {
        return '';
    }

    let output = `**By Tag:**\n`;
    const sortedTags = Object.entries(byTag)
        .sort((a, b) => b[1] - a[1]); // Sort by hours descending

    for (const [tag, hours] of sortedTags) {
        output += `• #${tag}: ${hours.toFixed(1)}h\n`;
    }

    return output + '\n';
}
