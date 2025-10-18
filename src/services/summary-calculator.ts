// src/services/summary-calculator.ts
import { capitalizeName } from '../utils/string-utils.js';
import type { TimeEntry, DailySummary, WeeklySummary, CompanyConfig, CommitmentStatus, StatusIndicators } from '../types/index.js';
import { STATUS_THEMES } from '../types/index.js';

/**
 * Calculate summaries and aggregations from time entries
 */
export class SummaryCalculator {
    /**
     * Calculate daily summary from entries
     */
    calculateDaily(date: string, entries: TimeEntry[]): DailySummary {
        const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

        return {
            date,
            entries,
            totalHours
        };
    }

    /**
     * Calculate weekly summary from daily summaries
     */
    calculateWeekly(
        weekNumber: number,
        year: number,
        startDate: string,
        endDate: string,
        days: DailySummary[],
        config: CompanyConfig
    ): WeeklySummary {
        const totalHours = days.reduce((sum, day) => sum + day.totalHours, 0);
        const byCommitment: Record<string, number> = {};
        const byTag: Record<string, number> = {};
        const byProject: Record<string, number> = {};

        // Aggregate by tags
        for (const day of days) {
            for (const entry of day.entries) {
                for (const tag of entry.tags) {
                    byTag[tag] = (byTag[tag] || 0) + entry.duration;

                    // Map tag to commitment using config
                    const commitment = this.mapTagToCommitment(tag, config);
                    if (commitment) {
                        byCommitment[commitment] = (byCommitment[commitment] || 0) + entry.duration;
                    }

                    // Map to project if applicable
                    const project = this.mapTagToProject(tag, config);
                    if (project) {
                        byProject[project] = (byProject[project] || 0) + entry.duration;
                    }
                }
            }
        }

        return {
            weekNumber,
            year,
            startDate,
            endDate,
            days,
            totalHours,
            byCommitment,
            byTag,
            byProject
        };
    }

    /**
     * Map tag to commitment category using config
     */
    private mapTagToCommitment(tag: string, config: CompanyConfig): string | null {
        // Check tag mappings first
        const mappedTag = config.tagMappings?.[tag] || tag;

        // Check if tag directly matches a commitment
        if (config.commitments[mappedTag]) {
            return mappedTag;
        }

        // Check projects to find which commitment this tag belongs to
        if (config.projects) {
            for (const [, projectConfig] of Object.entries(config.projects)) {
                if (projectConfig.tags.includes(mappedTag)) {
                    return projectConfig.commitment;
                }
            }
        }

        return null;
    }

    /**
     * Map tag to project name using config
     */
    private mapTagToProject(tag: string, config: CompanyConfig): string | null {
        if (!config.projects) {
            return null;
        }

        const mappedTag = config.tagMappings?.[tag] || tag;

        for (const [projectName, projectConfig] of Object.entries(config.projects)) {
            if (projectConfig.tags.includes(mappedTag)) {
                return projectName;
            }
        }

        return null;
    }

    /**
     * Threshold for approaching limit (percentage)
     */
    private static readonly APPROACHING_THRESHOLD = 90;
    private static readonly OVER_THRESHOLD = 100;

    /**
     * Calculate commitment status (within limit, approaching, over)
     */
    calculateCommitmentStatus(
        hours: number,
        limit: number
    ): CommitmentStatus {
        const percent = (hours / limit) * 100;

        if (percent > SummaryCalculator.OVER_THRESHOLD) return 'over';
        if (percent > SummaryCalculator.APPROACHING_THRESHOLD) return 'approaching';
        return 'within';
    }

    /**
     * Calculate percentage of limit used
     */
    calculatePercentage(hours: number, limit: number): number {
        return Math.round((hours / limit) * 100);
    }

    /**
     * Calculate remaining hours
     */
    calculateRemaining(hours: number, limit: number): number {
        return Math.max(0, limit - hours);
    }

    /**
     * Get summary statistics for a commitment
     * @param hours - Hours worked
     * @param limit - Hour limit
     * @param theme - Status indicator theme (defaults to 'emoji')
     */
    getCommitmentStats(
        hours: number,
        limit: number,
        theme: StatusIndicators = STATUS_THEMES.emoji
    ): {
        hours: number;
        limit: number;
        percentage: number;
        remaining: number;
        status: CommitmentStatus;
        indicator: string;
    } {
        const status = this.calculateCommitmentStatus(hours, limit);
        return {
            hours,
            limit,
            percentage: this.calculatePercentage(hours, limit),
            remaining: this.calculateRemaining(hours, limit),
            status,
            indicator: theme[status]
        };
    }

    /**
     * Format summary for display
     */
    formatSummary(summary: WeeklySummary, config: CompanyConfig): string {
        let output = `## Summary\n`;

        // Total hours
        const totalLimit = config.commitments.total?.limit;
        if (totalLimit) {
            const stats = this.getCommitmentStats(summary.totalHours, totalLimit, STATUS_THEMES.emoji);
            output += `- **Total:** ${summary.totalHours.toFixed(1)}h / ${totalLimit}h (${stats.percentage}%) ${stats.indicator}\n`;
            output += `- **Remaining:** ${stats.remaining.toFixed(1)}h available\n`;
        } else {
            output += `- **Total:** ${summary.totalHours.toFixed(1)}h\n`;
        }

        output += '\n';

        // Commitment breakdown
        if (Object.keys(summary.byCommitment).length > 0) {
            for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
                const limit = config.commitments[commitment]?.limit;
                const name = capitalizeName(commitment);

                if (limit) {
                    const stats = this.getCommitmentStats(hours, limit, STATUS_THEMES.emoji);
                    const warning = stats.status === 'over' ? ' OVER' : '';
                    output += `- **${name}:** ${hours.toFixed(1)}h / ${limit}h (${stats.percentage}%)${warning} ${stats.indicator}\n`;
                } else {
                    output += `- **${name}:** ${hours.toFixed(1)}h\n`;
                }
            }
        }

        return output;
    }

    /**
     * Calculate statistics for a tag
     */
    getTagStatistics(
        summary: WeeklySummary
    ): Array<{ tag: string; hours: number; percentage: number }> {
        const stats: Array<{ tag: string; hours: number; percentage: number }> = [];

        for (const [tag, hours] of Object.entries(summary.byTag)) {
            stats.push({
                tag,
                hours,
                percentage: Math.round((hours / summary.totalHours) * 100)
            });
        }

        // Sort by hours descending
        return stats.sort((a, b) => b.hours - a.hours);
    }

    /**
     * Get top N tags by hours
     */
    getTopTags(summary: WeeklySummary, n: number = 5): string[] {
        const stats = this.getTagStatistics(summary);
        return stats.slice(0, n).map(s => s.tag);
    }

    /**
     * Calculate average hours per day
     */
    calculateAveragePerDay(summary: WeeklySummary): number {
        if (summary.days.length === 0) return 0;
        return summary.totalHours / summary.days.length;
    }

    /**
     * Find busiest day
     */
    findBusiestDay(summary: WeeklySummary): DailySummary | null {
        if (summary.days.length === 0) return null;
        return summary.days.reduce((max, day) =>
            day.totalHours > max.totalHours ? day : max
        );
    }

    /**
     * Find lightest day
     */
    findLightestDay(summary: WeeklySummary): DailySummary | null {
        if (summary.days.length === 0) return null;
        return summary.days.reduce((min, day) =>
            day.totalHours < min.totalHours ? day : min
        );
    }
}