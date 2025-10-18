// src/utils/report-formatters.ts
/**
 * Shared formatting utilities for report generation
 * Following DRY principle - single source of truth for report formatting
 */

import type { CompanyConfig, DailySummary } from '../types/index.js';
import { SummaryCalculator } from '../services/summary-calculator.js';
import { capitalizeName } from './string-utils.js';

// Note: We lazily create SummaryCalculator instances instead of a singleton
// to avoid circular dependency issues with string-utils

/**
 * Sort daily summaries in descending order by date
 * @param days - Array of daily summaries
 * @returns New sorted array (does not mutate input)
 */
export function sortDaysDescending(days: DailySummary[]): DailySummary[] {
    return [...days].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Format total hours with limit and percentage
 * @param totalHours - Total hours worked
 * @param config - Company configuration containing limits
 * @param options - Formatting options
 * @returns Formatted total hours string
 */
export function formatTotalHours(
    totalHours: number,
    config: CompanyConfig,
    options?: { showRemaining?: boolean }
): string {
    let output = `**Total:** ${totalHours.toFixed(1)}h`;

    const totalLimit = config.commitments.total?.limit;
    if (totalLimit) {
        const percent = Math.round((totalHours / totalLimit) * 100);
        output += ` / ${totalLimit}h (${percent}%)`;

        if (options?.showRemaining) {
            const remaining = Math.max(0, totalLimit - totalHours);
            output += ` (${remaining.toFixed(1)}h remaining)`;
        }
    }

    return output + '\n\n';
}

/**
 * Format commitment breakdown with hours, limits, and status indicators
 * @param byCommitment - Map of commitment names to hours
 * @param config - Company configuration containing limits
 * @returns Formatted commitment breakdown string, or empty string if no commitments
 */
export function formatCommitmentBreakdown(
    byCommitment: Record<string, number>,
    config: CompanyConfig
): string {
    if (Object.keys(byCommitment).length === 0) {
        return '';
    }

    const summaryCalculator = new SummaryCalculator();
    let output = `**By Commitment:**\n`;

    for (const [commitment, hours] of Object.entries(byCommitment)) {
        const limit = config.commitments[commitment]?.limit;
        const name = capitalizeName(commitment);

        if (limit) {
            const stats = summaryCalculator.getCommitmentStats(hours, limit);
            output += `• ${name}: ${hours.toFixed(1)}h / ${limit}h (${stats.percentage}%)`;

            // Add status emoji only for approaching or over
            if (stats.status !== 'within') {
                output += ` ${stats.emoji}`;
            }
            output += '\n';
        } else {
            output += `• ${name}: ${hours.toFixed(1)}h\n`;
        }
    }

    return output + '\n';
}

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
