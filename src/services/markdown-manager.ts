// src/services/markdown-manager.ts
import { TimeTrackingEnvironment } from '../config/environment.js';
import { readFileIfExists, writeFileSafe, readJSON } from '../utils/file-utils.js';
import { formatDate, formatWeekHeader, getDayName, getWeekBounds, getISOWeek } from '../utils/date-utils.js';
import { formatDuration } from './duration-parser.js';
import type { TimeEntry, DailySummary, WeeklySummary, CompanyConfig } from '../types/index.js';

export class MarkdownManager {
    /**
     * Load company configuration
     */
    async loadConfig(company: string): Promise<CompanyConfig> {
        const configPath = TimeTrackingEnvironment.getCompanyConfigPath(company);
        const config = await readJSON<CompanyConfig>(configPath);

        if (!config) {
            // Return default config if none exists
            return {
                company: company.charAt(0).toUpperCase() + company.slice(1),
                commitments: {
                    total: { limit: 40, unit: 'hours/week' }
                }
            };
        }

        return config;
    }

    /**
     * Add time entry to markdown file
     */
    async addEntry(company: string, entry: TimeEntry): Promise<void> {
        const date = new Date(entry.date);
        const { year, week } = getISOWeek(date);
        const filePath = TimeTrackingEnvironment.getWeekFilePath(company, year, week);

        // Load existing file or create new
        let content = await readFileIfExists(filePath);

        if (!content) {
            content = await this.createNewWeekFile(company, year, week);
        }

        // Find or create the day section
        const dayHeader = '## ' + entry.date + ' ' + getDayName(date);
        const entryLine = this.formatEntry(entry);

        if (content.includes(dayHeader)) {
            // Insert at the beginning of the day's entries (after the day header line)
            const lines = content.split('\n');
            const dayIndex = lines.findIndex(line => line.startsWith(dayHeader));

            if (dayIndex !== -1) {
                // Insert right after the day header (before any entries or empty lines)
                lines.splice(dayIndex + 2, 0, entryLine);
                content = lines.join('\n');
            }
        } else {
            // Add new day section after summary
            const summaryEndIndex = content.indexOf('\n---\n');
            if (summaryEndIndex !== -1) {
                const beforeSummary = content.substring(0, summaryEndIndex + 5);
                const afterSummary = content.substring(summaryEndIndex + 5);

                content = beforeSummary + '\n' + dayHeader + ' (0h)\n\n' + entryLine + '\n' + afterSummary;
            }
        }

        // Recalculate and update summary AND day totals
        const summary = await this.calculateWeeklySummary(company, year, week, content);
        content = this.updateSummaryInContent(content, summary);
        content = this.updateDayTotalsInContent(content, summary);

        await writeFileSafe(filePath, content);
    }

    /**
     * Format a time entry as markdown line
     */
    private formatEntry(entry: TimeEntry): string {
        const tags = entry.tags.length > 0 ? ' ' + entry.tags.map(t => '#' + t).join(' ') : '';
        return '- ' + entry.time + ' ' + entry.task + ' (' + formatDuration(entry.duration) + ')' + tags;
    }

    /**
     * Create new week file with template
     */
    private async createNewWeekFile(company: string, year: number, week: number): Promise<string> {
        const config = await this.loadConfig(company);
        const weekBounds = getWeekBounds(year, week);
        const weekHeader = formatWeekHeader(weekBounds);

        let content = '# Time Tracking - ' + config.company + ' - ' + weekHeader + '\n\n';
        content += '## Summary\n';
        content += '- **Total:** 0h\n\n';
        content += '---\n\n';

        return content;
    }

    /**
     * Calculate weekly summary from markdown content
     */
    private async calculateWeeklySummary(
        company: string,
        year: number,
        week: number,
        content: string
    ): Promise<WeeklySummary> {
        const config = await this.loadConfig(company);
        const entries = this.parseEntries(content);
        const weekBounds = getWeekBounds(year, week);

        const days: DailySummary[] = [];
        const byCommitment: Record<string, number> = {};
        const byTag: Record<string, number> = {};
        const byProject: Record<string, number> = {};

        // Group entries by date
        const entriesByDate = new Map<string, TimeEntry[]>();
        for (const entry of entries) {
            if (!entriesByDate.has(entry.date)) {
                entriesByDate.set(entry.date, []);
            }
            entriesByDate.get(entry.date)!.push(entry);
        }

        // Build daily summaries
        for (const [date, dayEntries] of entriesByDate) {
            const totalHours = dayEntries.reduce((sum, e) => sum + e.duration, 0);
            days.push({ date, entries: dayEntries, totalHours });

            // Aggregate by tags and commitments
            for (const entry of dayEntries) {
                for (const tag of entry.tags) {
                    byTag[tag] = (byTag[tag] || 0) + entry.duration;

                    // Map tag to commitment
                    const commitment = this.getCommitmentForTag(config, tag);
                    if (commitment) {
                        byCommitment[commitment] = (byCommitment[commitment] || 0) + entry.duration;
                    }
                }
            }
        }

        const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);

        return {
            weekNumber: week,
            year,
            startDate: formatDate(weekBounds.startDate),
            endDate: formatDate(weekBounds.endDate),
            days,
            totalHours,
            byCommitment,
            byTag,
            byProject
        };
    }

    /**
     * Parse time entries from markdown content
     */
    private parseEntries(content: string): TimeEntry[] {
        const entries: TimeEntry[] = [];
        const lines = content.split('\n');
        let currentDate = '';

        for (const line of lines) {
            // Detect date headers: ## 2025-10-17 Thursday
            const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                currentDate = dateMatch[1];
                continue;
            }

            // Parse entry lines: - HH:MM Task (Xh) #tag1 #tag2
            const entryMatch = line.match(/^- (\d{2}:\d{2}) (.+?) \((\d+(?:\.\d+)?)h\)(.*)?$/);
            if (entryMatch && currentDate) {
                const [, time, task, duration, tagsStr] = entryMatch;
                const tags = tagsStr ?
                    tagsStr.match(/#\w+/g)?.map(t => t.substring(1)) || [] :
                    [];

                entries.push({
                    time,
                    task,
                    duration: parseFloat(duration),
                    tags,
                    date: currentDate
                });
            }
        }

        return entries;
    }

    /**
     * Update summary section in markdown content
     */
    private updateSummaryInContent(content: string, summary: WeeklySummary): string {
        const config = this.cachedConfig;
        if (!config) return content;

        let summaryText = '## Summary\n';

        // Total hours
        const totalLimit = config.commitments.total?.limit || 0;
        const totalPercent = totalLimit > 0 ? Math.round((summary.totalHours / totalLimit) * 100) : 0;
        summaryText += '- **Total:** ' + formatDuration(summary.totalHours);
        if (totalLimit > 0) {
            summaryText += ' / ' + totalLimit + 'h limit (' + totalPercent + '%)';
        }
        summaryText += '\n';

        // Commitment breakdown
        for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
            const limit = config.commitments[commitment]?.limit || 0;
            const percent = limit > 0 ? Math.round((hours / limit) * 100) : 0;
            const warning = percent > 100 ? ' ⚠️ OVER' : '';

            summaryText += '- **' + commitment.charAt(0).toUpperCase() + commitment.slice(1) + ':** ' + formatDuration(hours);
            if (limit > 0) {
                summaryText += ' / ' + limit + 'h (' + percent + '%)' + warning;
            }
            summaryText += '\n';
        }

        // Calculate remaining
        if (totalLimit > 0) {
            const remaining = Math.max(0, totalLimit - summary.totalHours);
            summaryText += '- **Remaining:** ' + formatDuration(remaining) + ' available\n';
        }

        summaryText += '\n---\n';

        // Replace existing summary
        const summaryStart = content.indexOf('## Summary\n');
        const summaryEnd = content.indexOf('\n---\n', summaryStart);

        if (summaryStart !== -1 && summaryEnd !== -1) {
            return content.substring(0, summaryStart) +
                summaryText +
                content.substring(summaryEnd + 5);
        }

        return content;
    }

    /**
     * Update day totals in markdown content
     */
    private updateDayTotalsInContent(content: string, summary: WeeklySummary): string {
        let updatedContent = content;

        for (const day of summary.days) {
            const date = new Date(day.date);
            const dayName = getDayName(date);
            const oldHeaderPattern = new RegExp('^## ' + day.date + ' ' + dayName + ' \\([^)]*\\)$', 'm');
            const newHeader = '## ' + day.date + ' ' + dayName + ' (' + formatDuration(day.totalHours) + ')';

            updatedContent = updatedContent.replace(oldHeaderPattern, newHeader);
        }

        return updatedContent;
    }

    private cachedConfig: CompanyConfig | null = null;

    /**
     * Get commitment category for a tag
     */
    private getCommitmentForTag(config: CompanyConfig, tag: string): string | null {
        // Cache config for updateSummaryInContent
        this.cachedConfig = config;

        // Check tag mappings first
        const mappedTag = config.tagMappings?.[tag] || tag;

        // Check if tag directly matches a commitment
        if (config.commitments[mappedTag]) {
            return mappedTag;
        }

        // Check projects
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
     * Read weekly summary from file
     */
    async getWeeklySummary(company: string, year: number, week: number): Promise<WeeklySummary | null> {
        const filePath = TimeTrackingEnvironment.getWeekFilePath(company, year, week);
        const content = await readFileIfExists(filePath);

        if (!content) {
            return null;
        }

        this.cachedConfig = await this.loadConfig(company);
        return this.calculateWeeklySummary(company, year, week, content);
    }
}