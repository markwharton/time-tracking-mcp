// src/tools/log-time.ts
import { registerTool } from './registry.js';
import { MarkdownManager } from '../services/markdown-manager.js';
import { parseDuration } from '../services/duration-parser.js';
import { parseDate, parseTime, formatDate, formatTime, getISOWeek } from '../utils/date-utils.js';
import { createTextResponse, withErrorHandler } from '../utils/tool-response.js';
import { getCompanyForOperation } from '../utils/company-resolver.js';
import { capitalizeName, sanitizeTaskDescription } from '../utils/string-utils.js';
import { SummaryCalculator } from '../services/summary-calculator.js';
import type { LogTimeInput, TimeEntry } from '../types/index.js';

const summaryCalculator = new SummaryCalculator();

const markdownManager = new MarkdownManager();

registerTool({
    name: 'log_time',
    description: `Log a completed time entry. This tool records work you've done.

Natural language examples Claude should parse:
- Single company mode: "2h on security review" → task: "security review", duration: "2h"
- Multi company mode: "hm 2h on security review" → company: "HeliMods", duration: "2h", task: "security review"
- Multi company mode: "2h debugging for stellantis" → duration: "2h", task: "debugging", company: "Stellantis"
- "Client meeting yesterday 90 minutes" → task: "Client meeting", duration: "90m", date: "yesterday"

Claude should extract:
- task: What was worked on
- duration: How long (2h, 90m, 1.5h, etc.)
- time: When (optional, defaults to now)
- date: Which day (optional, defaults to today)
- tags: Inferred or explicit tags
- company: CRITICAL - In multi-company mode, MUST extract from user input using:
  * Prefix pattern: "company/abbrev [duration] [task]" (e.g., "hm 2h debugging", "stellantis 1h meeting")
  * Suffix pattern: "[duration] [task] for company/abbrev" (e.g., "2h debugging for hm", "1h meeting for stellantis")
  * Full company names work (case-insensitive): "HeliMods", "Stellantis", etc.
  * Abbreviations work (case-insensitive): "HM", "STLA", etc.
  * In single-company mode, company is automatic (ignore any company in input)`,
    inputSchema: {
        type: 'object',
        properties: {
            task: {
                type: 'string',
                description: 'Task description (e.g., "Conduit MCP: Security review")'
            },
            duration: {
                type: 'string',
                description: 'Duration (e.g., "2h", "90m", "1.5h")'
            },
            time: {
                type: 'string',
                description: 'Time when work was done (e.g., "14:30", "2 hours ago", omit for now)'
            },
            date: {
                type: 'string',
                description: 'Date of work (e.g., "today", "yesterday", "2025-10-17", omit for today)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags to categorize work (e.g., ["development", "security"])'
            },
            company: {
                type: 'string',
                description: 'Company to log time for (optional, uses default if omitted)'
            }
        },
        required: ['task', 'duration']
    },
    annotations: {
        title: 'Log Time',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
    },
    handler: withErrorHandler('logging time', async (args: LogTimeInput) => {
        // Resolve company (single-company mode auto-selects, multi-company requires explicit)
        const userInput = `${args.task || ''} ${args.duration || ''}`.trim();
        const company = getCompanyForOperation(args.company, userInput);

        // Sanitize and validate task description
        const sanitizedTask = sanitizeTaskDescription(args.task);

        // Parse inputs
        const duration = parseDuration(args.duration);
        const date = parseDate(args.date);
        const time = parseTime(args.time, date);
        const tags = args.tags || [];

        // Create time entry
        const entry: TimeEntry = {
            time: formatTime(time),
            task: sanitizedTask,
            duration: duration.hours,
            tags,
            date: formatDate(date)
        };

        // Save to markdown
        await markdownManager.addEntry(company, entry);

        // Load weekly summary for confirmation
        const { year, week } = getISOWeek(date);
        const summary = await markdownManager.getWeeklySummary(company, year, week);

        // Check for parse issues
        const parseIssues = markdownManager.getParseIssues();

        // Build response
        let response = `✓ Logged ${duration.formatted} for "${sanitizedTask}" at ${entry.time}`;

        if (args.date && args.date !== 'today') {
            response += ` on ${entry.date}`;
        }

        if (tags.length > 0) {
            response += ` [${tags.map(t => '#' + t).join(' ')}]`;
        }

        response += '\n\n';

        if (summary) {
            response += `**Week ${week} Status:**\n`;
            response += `• Total: ${summary.totalHours.toFixed(1)}h`;

            const config = await markdownManager.loadConfig(company);
            if (config.commitments.total) {
                const limit = config.commitments.total.limit;
                const stats = summaryCalculator.getCommitmentStats(summary.totalHours, limit);
                response += ` / ${limit}h (${stats.percentage}%)`;

                if (stats.status === 'over') {
                    response += ` ⚠️ OVER LIMIT`;
                } else if (stats.status === 'approaching') {
                    response += ` ⚠️ Close to limit`;
                }
            }

            response += '\n';

            // Show commitment breakdown
            for (const [commitment, hours] of Object.entries(summary.byCommitment)) {
                const limit = config.commitments[commitment]?.limit;
                if (limit) {
                    const stats = summaryCalculator.getCommitmentStats(hours, limit);
                    const warning = stats.status !== 'within' ? ` ${stats.indicator}` : '';
                    response += `• ${capitalizeName(commitment)}: ${hours.toFixed(1)}h / ${limit}h (${stats.percentage}%)${warning}\n`;
                }
            }
        }

        // Add parse warnings if any
        if (parseIssues.warnings.length > 0) {
            response += '\n\n⚠️ **Parse Warnings:**\n';
            for (const warning of parseIssues.warnings) {
                response += `• ${warning}\n`;
            }
            if (parseIssues.unparsedLines.length > 0 && parseIssues.unparsedLines.length <= 3) {
                response += '\nUnparsed lines:\n';
                for (const { lineNumber, content } of parseIssues.unparsedLines) {
                    response += `  Line ${lineNumber}: ${content}\n`;
                }
            }
        }

        return createTextResponse(response);
    })
});