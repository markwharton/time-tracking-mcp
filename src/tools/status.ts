// src/tools/status.ts
import { registerTool } from './registry.js';
import { MarkdownManager } from '../services/markdown-manager.js';
import { getISOWeek, now } from '../utils/date-utils.js';
import { createTextResponse, withErrorHandler, MULTI_COMPANY_GUIDANCE } from '../utils/tool-response.js';
import { getCompanyForOperation } from '../utils/company-resolver.js';
import { capitalizeName } from '../utils/string-utils.js';
import { SummaryCalculator } from '../services/summary-calculator.js';
import type { StatusInput } from '../types/index.js';

const summaryCalculator = new SummaryCalculator();

const markdownManager = new MarkdownManager();

registerTool({
    name: 'status',
    description: `Quick status check showing current week's time totals and commitment tracking.

Natural language examples Claude should handle:
- "How am I doing this week?"
- "Status check"
- "Am I over my hours?"
- "How many hours this week?"

Returns a brief summary of the current week's time.${MULTI_COMPANY_GUIDANCE}`,
    inputSchema: {
        type: 'object',
        properties: {
            company: {
                type: 'string',
                description: 'Company to check status for (optional, uses default if omitted)'
            }
        }
    },
    annotations: {
        title: 'Status Check',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    },
    handler: withErrorHandler('checking status', async (args: StatusInput) => {
        // Resolve company (single-company mode auto-selects, multi-company requires explicit)
        const company = getCompanyForOperation(args.company);
        const currentDate = now();
        const { year, week } = getISOWeek(currentDate);

        const summary = await markdownManager.getWeeklySummary(company, year, week);
        const config = await markdownManager.loadConfig(company);

        if (!summary || summary.totalHours === 0) {
            return createTextResponse(`No time logged yet for week ${week}.`);
        }

        let response = `📊 **Week ${week} Status**\n\n`;

        // Total hours with status-specific formatting
        const totalLimit = config.commitments.total?.limit || 0;
        if (totalLimit > 0) {
            const stats = summaryCalculator.getCommitmentStats(summary.totalHours, totalLimit);

            response += `**Total:** ${summary.totalHours.toFixed(1)}h / ${totalLimit}h (${stats.percentage}%)`;

            if (stats.status === 'over') {
                response += ` 🚫 OVER LIMIT\n`;
            } else if (stats.status === 'approaching') {
                response += ` ⚠️ Almost at limit\n`;
            } else {
                response += ` ✓\n`;
            }

            response += `**Remaining:** ${stats.remaining.toFixed(1)}h available\n\n`;
        } else {
            response += `**Total:** ${summary.totalHours.toFixed(1)}h\n\n`;
        }

        // Commitment breakdown - using shared formatter
        // Note: status.ts uses different emoji logic (shows ✓ for within)
        // so we'll keep custom formatting here for status consistency
        if (Object.keys(summary.byCommitment).length > 0) {
            response += `**By Commitment:**\n`;
            for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
                const limit = config.commitments[commitment]?.limit;
                const name = capitalizeName(commitment);

                if (limit) {
                    const stats = summaryCalculator.getCommitmentStats(hours, limit);
                    const emoji = stats.status === 'over' ? '🚫' : stats.status === 'approaching' ? '⚠️' : '✓';
                    response += `• ${name}: ${hours.toFixed(1)}h / ${limit}h (${stats.percentage}%) ${emoji}\n`;
                } else {
                    response += `• ${name}: ${hours.toFixed(1)}h\n`;
                }
            }
        }

        return createTextResponse(response);
    })
});