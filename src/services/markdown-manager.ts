// src/services/markdown-manager.ts
import { TimeTrackingEnvironment } from '../config/environment.js';
import { readFileIfExists, writeFileSafe, readJSON } from '../utils/file-utils.js';
import { formatDate, formatWeekHeader, getDayName, getWeekBounds, getISOWeek } from '../utils/date-utils.js';
import { formatDuration, parseDuration } from './duration-parser.js';
import { SummaryCalculator } from './summary-calculator.js';
import { AuditLog } from './audit-log.js';
import type { TimeEntry, DailySummary, WeeklySummary, CompanyConfig, ParseIssues } from '../types/index.js';

export class MarkdownManager {
    private summaryCalculator = new SummaryCalculator();
    private static readonly CURRENT_FORMAT_VERSION = 'v1.0';
    private parseIssues: ParseIssues = { unparsedLines: [], formatVersion: null, warnings: [] };

    /**
     * Detect format version from markdown content
     */
    private detectFormatVersion(content: string): string | null {
        const versionMatch = content.match(/<!-- time-tracking-format: (v[\d.]+) -->/);
        return versionMatch ? versionMatch[1] : null;
    }

    /**
     * Get parse issues from last parse operation
     */
    getParseIssues(): ParseIssues {
        return this.parseIssues;
    }

    /**
     * Reset parse issues
     */
    private resetParseIssues(content: string): void {
        this.parseIssues = {
            unparsedLines: [],
            formatVersion: this.detectFormatVersion(content),
            warnings: []
        };
    }

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

        // Normalize entry durations to standard format if flexible parsing is enabled
        if (TimeTrackingEnvironment.flexibleDurationParsing) {
            content = this.normalizeEntryDurations(content);
        }

        await writeFileSafe(filePath, content);

        // Log to audit log
        await AuditLog.logAdd(company, entry);
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

        let content = '<!-- time-tracking-format: v1.0 -->\n';
        content += '# Time Tracking - ' + config.company + ' - ' + weekHeader + '\n\n';
        content += '## Summary\n';
        content += '- **Total:** 0h\n\n';
        content += '---\n\n';

        return content;
    }

    /**
     * Calculate weekly summary from markdown content
     * Delegates to SummaryCalculator to avoid duplication
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

        // Cache config for updateSummaryInContent
        this.cachedConfig = config;

        // Group entries by date to build daily summaries
        const entriesByDate = new Map<string, TimeEntry[]>();
        for (const entry of entries) {
            if (!entriesByDate.has(entry.date)) {
                entriesByDate.set(entry.date, []);
            }
            entriesByDate.get(entry.date)!.push(entry);
        }

        // Build daily summaries
        const days: DailySummary[] = [];
        for (const [date, dayEntries] of entriesByDate) {
            days.push(this.summaryCalculator.calculateDaily(date, dayEntries));
        }

        // Use SummaryCalculator for weekly aggregation (DRY - single source of truth)
        return this.summaryCalculator.calculateWeekly(
            week,
            year,
            formatDate(weekBounds.startDate),
            formatDate(weekBounds.endDate),
            days,
            config
        );
    }

    /**
     * Parse time entries from markdown content
     */
    private parseEntries(content: string): TimeEntry[] {
        const entries: TimeEntry[] = [];
        const lines = content.split('\n');
        let currentDate = '';
        this.resetParseIssues(content);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Detect date headers FIRST (before skipping headers): ## 2025-10-17 Thursday
            const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                currentDate = dateMatch[1];
                continue;
            }

            // Skip empty lines, headers, summary sections, and comment lines
            if (!line.trim() ||
                line.startsWith('#') ||
                line.startsWith('---') ||
                line.startsWith('<!--') ||
                line.startsWith('**') ||
                line.startsWith('•')) {
                continue;
            }

            // Skip if not an entry line (doesn't start with '- ')
            if (!line.startsWith('- ')) {
                continue;
            }

            let parsed = false;

            // Try flexible parsing first (if enabled)
            if (TimeTrackingEnvironment.flexibleDurationParsing) {
                const flexMatch = line.match(/^- (\d{2}:\d{2}) (.+) \((.+?)\)(.*)?$/);
                if (flexMatch && currentDate) {
                    const [, time, task, durationStr, tagsStr] = flexMatch;

                    try {
                        const { hours } = parseDuration(durationStr);
                        const tags = tagsStr ?
                            tagsStr.match(/#\w+/g)?.map(t => t.substring(1)) || [] :
                            [];

                        entries.push({
                            time,
                            task,
                            duration: hours,
                            tags,
                            date: currentDate
                        });
                        parsed = true;
                    } catch (e) {
                        // Fall through to strict parsing
                    }
                }
            }

            // Strict parsing: - HH:MM Task (Xh) #tag1 #tag2
            if (!parsed) {
                const entryMatch = line.match(/^- (\d{2}:\d{2}) (.+) \((\d+(?:\.\d+)?)h\)(.*)?$/);
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
                    parsed = true;
                }
            }

            // Track unparsed entry lines
            if (!parsed && currentDate) {
                this.parseIssues.unparsedLines.push({ lineNumber, content: line });
            }
        }

        // Add warnings
        if (this.parseIssues.unparsedLines.length > 0) {
            this.parseIssues.warnings.push(
                `Found ${this.parseIssues.unparsedLines.length} unparsed entry line(s)`
            );
        }

        if (this.parseIssues.formatVersion === null) {
            this.parseIssues.warnings.push('No format version marker found (pre-v1.0 file)');
        } else if (this.parseIssues.formatVersion !== MarkdownManager.CURRENT_FORMAT_VERSION) {
            this.parseIssues.warnings.push(
                `Format version ${this.parseIssues.formatVersion} differs from current ${MarkdownManager.CURRENT_FORMAT_VERSION}`
            );
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

        // Total hours with overflow detection
        const totalLimit = config.commitments.total?.limit || 0;
        const totalMax = config.commitments.total?.max;
        const totalPercent = totalLimit > 0 ? Math.round((summary.totalHours / totalLimit) * 100) : 0;

        summaryText += '- **Total:** ' + formatDuration(summary.totalHours);
        if (totalLimit > 0) {
            summaryText += ' / ' + totalLimit + 'h limit (' + totalPercent + '%)';
        }

        // Add overflow warning if over limit but under max
        if (totalMax && summary.totalHours > totalLimit && summary.totalHours <= totalMax) {
            const overflow = summary.totalHours - totalLimit;
            summaryText += ' ⚠️ OVERFLOW (' + formatDuration(overflow) + ' into ' + totalMax + 'h max buffer)';
        }

        // Add danger warning if over max
        if (totalMax && summary.totalHours > totalMax) {
            const over = summary.totalHours - totalMax;
            summaryText += ' 🚨 EXCEEDED MAX (' + formatDuration(over) + ' over ' + totalMax + 'h maximum)';
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

    /**
     * Normalize entry durations to standard format (Xh)
     * Converts entries like "- 06:01 task (30m)" to "- 06:01 task (0.5h)"
     */
    private normalizeEntryDurations(content: string): string {
        const lines = content.split('\n');
        const normalizedLines: string[] = [];

        for (const line of lines) {
            // Try to match entry with any duration format
            const match = line.match(/^(- \d{2}:\d{2} .+) \((.+?)\)(.*)$/);
            if (match) {
                const [, prefix, durationStr, suffix] = match;
                try {
                    const { hours } = parseDuration(durationStr);
                    // Rewrite in standard format
                    normalizedLines.push(prefix + '(' + formatDuration(hours) + ')' + suffix);
                    continue;
                } catch (e) {
                    // Keep original if parsing fails
                }
            }
            normalizedLines.push(line);
        }

        return normalizedLines.join('\n');
    }

    private cachedConfig: CompanyConfig | null = null;

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