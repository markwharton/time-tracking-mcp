// src/tools/check-hours.ts
import { registerTool } from './registry.js';
import { MarkdownManager } from '../services/markdown-manager.js';
import { getISOWeek, now, formatDate, getDayName } from '../utils/date-utils.js';
import { createTextResponse, withErrorHandler, MULTI_COMPANY_GUIDANCE } from '../utils/tool-response.js';
import { getCompanyForOperation } from '../utils/company-resolver.js';
import { formatProjectBreakdown, formatTagBreakdown } from '../utils/report-formatters.js';
import type { CheckHoursInput } from '../types/index.js';

const markdownManager = new MarkdownManager();

registerTool({
    name: 'check_hours',
    description: `Check time totals for a period (today, week, or month).

Natural language examples Claude should handle:
- "How many hours today?"
- "Show me this week's breakdown"
- "What did I work on today?"

Returns detailed breakdown of time by tags and projects.${MULTI_COMPANY_GUIDANCE}`,
    inputSchema: {
        type: 'object',
        properties: {
            period: {
                type: 'string',
                enum: ['today', 'week', 'month'],
                default: 'week',
                description: 'Time period to check (default: week)'
            },
            breakdown: {
                type: 'boolean',
                default: true,
                description: 'Include breakdown by tags and projects'
            },
            company: {
                type: 'string',
                description: 'Company to check hours for (optional, uses default if omitted)'
            }
        }
    },
    annotations: {
        title: 'Check Hours',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    },
    handler: withErrorHandler('checking hours', async (args: CheckHoursInput) => {
        // Resolve company (single-company mode auto-selects, multi-company requires explicit)
        const company = getCompanyForOperation(args.company);
        const period = args.period || 'week';
        const breakdown = args.breakdown !== false;

        const currentDate = now();
        const { year, week } = getISOWeek(currentDate);

        if (period === 'today') {
            return handleToday(company, currentDate);
        }

        if (period === 'week') {
            return handleWeek(company, year, week, breakdown);
        }

        // Month not implemented yet
        return createTextResponse('Month view not yet implemented. Try "today" or "week".');
    })
});

async function handleToday(company: string, date: Date): Promise<any> {
    const { year, week } = getISOWeek(date);
    const summary = await markdownManager.getWeeklySummary(company, year, week);

    if (!summary) {
        return createTextResponse('No time logged yet today.');
    }

    const dateStr = formatDate(date);
    const dayName = getDayName(date);
    const daySummary = summary.days.find(d => d.date === dateStr);

    if (!daySummary || daySummary.entries.length === 0) {
        return createTextResponse(`No time logged for ${dayName}, ${dateStr}.`);
    }

    let response = `📅 **${dayName}, ${dateStr}**\n\n`;
    response += `**Total:** ${daySummary.totalHours.toFixed(1)}h\n\n`;
    response += `**Entries:**\n`;

    for (const entry of daySummary.entries) {
        const tags = entry.tags.length > 0 ? ' ' + entry.tags.map(t => '#' + t).join(' ') : '';
        response += `• ${entry.time} ${entry.task} (${entry.duration.toFixed(1)}h)${tags}\n`;
    }

    return createTextResponse(response);
}

async function handleWeek(company: string, year: number, week: number, breakdown: boolean): Promise<any> {
    const summary = await markdownManager.getWeeklySummary(company, year, week);
    const config = await markdownManager.loadConfig(company);

    if (!summary || summary.totalHours === 0) {
        return createTextResponse(`No time logged yet for week ${week}.`);
    }

    let response = `📊 **Week ${week} Summary**\n\n`;
    response += `**Total:** ${summary.totalHours.toFixed(1)}h`;

    const totalLimit = config.commitments.total?.limit;
    if (totalLimit) {
        const percent = Math.round((summary.totalHours / totalLimit) * 100);
        response += ` / ${totalLimit}h (${percent}%)`;
    }
    response += '\n\n';

    // Commitment breakdown
    if (Object.keys(summary.byCommitment).length > 0) {
        response += `**By Commitment:**\n`;
        for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
            const limit = config.commitments[commitment]?.limit;
            const name = commitment.charAt(0).toUpperCase() + commitment.slice(1);

            if (limit) {
                const percent = Math.round((hours / limit) * 100);
                const warning = percent > 100 ? ' ⚠️' : '';
                response += `• ${name}: ${hours.toFixed(1)}h / ${limit}h (${percent}%)${warning}\n`;
            } else {
                response += `• ${name}: ${hours.toFixed(1)}h\n`;
            }
        }
        response += '\n';
    }

    // Project breakdown
    if (breakdown) {
        response += formatProjectBreakdown(summary.byProject);
    }

    // Tag breakdown
    if (breakdown) {
        response += formatTagBreakdown(summary.byTag);
    }

    // Daily breakdown
    response += `**By Day:**\n`;
    for (const day of summary.days.sort((a, b) => b.date.localeCompare(a.date))) {
        const dayName = getDayName(new Date(day.date));
        response += `• ${dayName} ${day.date}: ${day.totalHours.toFixed(1)}h (${day.entries.length} entries)\n`;
    }

    return createTextResponse(response);
}