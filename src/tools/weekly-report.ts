// src/tools/weekly-report.ts
import { registerTool } from './registry.js';
import { MarkdownManager } from '../services/markdown-manager.js';
import { getISOWeek, now, getDayName, formatWeekHeader, getWeekBounds } from '../utils/date-utils.js';
import { createTextResponse, withErrorHandler, MULTI_COMPANY_GUIDANCE } from '../utils/tool-response.js';
import { getCompanyForOperation } from '../utils/company-resolver.js';
import {
    formatProjectBreakdown,
    formatTagBreakdown,
    formatTagsWithDefault,
    sortDaysDescending,
    capitalizeName
} from '../utils/report-formatters.js';
import { SummaryCalculator } from '../services/summary-calculator.js';
import type { WeeklyReportInput } from '../types/index.js';

const summaryCalculator = new SummaryCalculator();

const markdownManager = new MarkdownManager();

registerTool({
    name: 'weekly_report',
    description: `Generate a formatted weekly time report.

Natural language examples Claude should handle:
- "Show me this week's report"
- "Weekly summary"
- "What did I work on this week?"
- "Last week's report"

Returns a complete weekly report with all entries organized by day.${MULTI_COMPANY_GUIDANCE}`,
    inputSchema: {
        type: 'object',
        properties: {
            week: {
                type: 'string',
                default: 'current',
                description: 'Which week: "current", "last", or ISO week like "2025-W42"'
            },
            company: {
                type: 'string',
                description: 'Company to generate report for (optional, uses default if omitted)'
            }
        }
    },
    annotations: {
        title: 'Weekly Report',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    },
    handler: withErrorHandler('generating weekly report', async (args: WeeklyReportInput) => {
        // Resolve company (single-company mode auto-selects, multi-company requires explicit)
        const company = getCompanyForOperation(args.company);
        const currentDate = now();
        let { year, week } = getISOWeek(currentDate);

        // Parse week parameter
        if (args.week === 'last') {
            week -= 1;
            if (week < 1) {
                year -= 1;
                week = 52; // Approximate, ISO weeks can be 52 or 53
            }
        } else if (args.week && args.week !== 'current') {
            // Parse ISO week format: 2025-W42
            const match = args.week.match(/^(\d{4})-W(\d{1,2})$/);
            if (match) {
                year = parseInt(match[1]);
                week = parseInt(match[2]);
            }
        }

        const summary = await markdownManager.getWeeklySummary(company, year, week);
        const config = await markdownManager.loadConfig(company);

        if (!summary || summary.totalHours === 0) {
            return createTextResponse(`No time logged for week ${week} of ${year}.`);
        }

        const weekBounds = getWeekBounds(year, week);
        const weekHeader = formatWeekHeader(weekBounds);

        let response = `# 📊 Time Report - ${config.company}\n`;
        response += `## ${weekHeader}\n\n`;
        response += `---\n\n`;

        // Summary section
        response += `## Summary\n\n`;
        response += `**Total Time:** ${summary.totalHours.toFixed(1)}h`;

        const totalLimit = config.commitments.total?.limit;
        if (totalLimit) {
            const stats = summaryCalculator.getCommitmentStats(summary.totalHours, totalLimit);
            response += ` / ${totalLimit}h (${stats.percentage}%)\n`;
            response += `**Remaining:** ${stats.remaining.toFixed(1)}h available\n`;
        } else {
            response += '\n';
        }

        response += '\n';

        // Commitment breakdown - weekly report uses different emoji (OVER/Close/✓)
        if (Object.keys(summary.byCommitment).length > 0) {
            response += `**Commitment Breakdown:**\n`;
            for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
                const limit = config.commitments[commitment]?.limit;
                const name = capitalizeName(commitment);

                if (limit) {
                    const stats = summaryCalculator.getCommitmentStats(hours, limit);
                    const status = stats.status === 'over' ? '🚫 OVER' : stats.status === 'approaching' ? '⚠️ Close' : '✓';
                    response += `• **${name}:** ${hours.toFixed(1)}h / ${limit}h (${stats.percentage}%) ${status}\n`;
                } else {
                    response += `• **${name}:** ${hours.toFixed(1)}h\n`;
                }
            }
            response += '\n';
        }

        // Project breakdown
        response += formatProjectBreakdown(summary.byProject);

        // Tag breakdown
        response += formatTagBreakdown(summary.byTag);

        response += `---\n\n`;

        // Daily entries
        response += `## Daily Breakdown\n\n`;

        // Sort days in reverse chronological order (newest first)
        const sortedDays = sortDaysDescending(summary.days);

        for (const day of sortedDays) {
            const dayName = getDayName(new Date(day.date));
            response += `### ${day.date} ${dayName} (${day.totalHours.toFixed(1)}h)\n\n`;

            for (const entry of day.entries) {
                const tags = formatTagsWithDefault(entry.tags, '');
                const tagsStr = tags ? ' ' + tags : '';
                response += `- ${entry.time} ${entry.task} (${entry.duration.toFixed(1)}h)${tagsStr}\n`;
            }

            response += '\n';
        }

        response += `---\n\n`;
        response += `*Report generated: ${new Date().toISOString().split('T')[0]}*\n`;

        return createTextResponse(response);
    })
});