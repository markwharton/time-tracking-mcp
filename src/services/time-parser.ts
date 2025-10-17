// src/services/time-parser.ts
import { parseTime, parseDate } from '../utils/date-utils.js';
import type { ParsedTime } from '../types/index.js';

/**
 * Parse natural language time references into structured data
 *
 * Examples:
 * - "14:30" → specific time today
 * - "2 hours ago" → calculated time
 * - "yesterday afternoon" → yesterday at 14:00
 * - "this morning" → today at 09:00
 */
export class TimeParser {
    /**
     * Parse time and date references together
     */
    parse(timeStr?: string, dateStr?: string): ParsedTime {
        const date = parseDate(dateStr);
        const time = parseTime(timeStr, date);

        return {
            hours: time.getHours(),
            minutes: time.getMinutes(),
            absoluteTime: time
        };
    }

    /**
     * Parse relative time reference
     * Examples: "2 hours ago", "30 minutes ago"
     */
    parseRelative(input: string): Date {
        const match = input.match(/^(\d+)\s*(hour|hr|h|minute|min|m)s?\s*ago$/i);

        if (!match) {
            throw new Error(`Cannot parse relative time: "${input}". Try "2 hours ago" or "30 minutes ago"`);
        }

        const [, amount, unit] = match;
        const value = parseInt(amount);
        const now = new Date();

        if (unit.startsWith('h')) {
            now.setHours(now.getHours() - value);
        } else {
            now.setMinutes(now.getMinutes() - value);
        }

        return now;
    }

    /**
     * Parse absolute time (HH:MM format)
     */
    parseAbsolute(input: string, baseDate?: Date): Date {
        const match = input.match(/^(\d{1,2}):(\d{2})$/);

        if (!match) {
            throw new Error(`Invalid time format: "${input}". Use HH:MM format (e.g., "14:30")`);
        }

        const [, hours, minutes] = match;
        const date = baseDate || new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return date;
    }

    /**
     * Parse contextual time references
     * Examples: "morning", "afternoon", "evening"
     */
    parseContextual(input: string, baseDate?: Date): Date {
        const date = baseDate || new Date();
        const lower = input.toLowerCase();

        if (lower.includes('morning')) {
            date.setHours(9, 0, 0, 0);
        } else if (lower.includes('afternoon')) {
            date.setHours(14, 0, 0, 0);
        } else if (lower.includes('evening')) {
            date.setHours(18, 0, 0, 0);
        } else if (lower.includes('night')) {
            date.setHours(20, 0, 0, 0);
        } else {
            throw new Error(`Unknown time context: "${input}". Try "morning", "afternoon", or "evening"`);
        }

        return date;
    }

    /**
     * Smart parse - tries to determine the type of time reference
     */
    smartParse(input: string, baseDate?: Date): Date {
        if (!input || input === 'now') {
            return baseDate || new Date();
        }

        // Try absolute time (HH:MM)
        if (/^\d{1,2}:\d{2}$/.test(input)) {
            return this.parseAbsolute(input, baseDate);
        }

        // Try relative time
        if (/\d+\s*(hour|hr|h|minute|min|m)s?\s*ago/i.test(input)) {
            return this.parseRelative(input);
        }

        // Try contextual
        if (/morning|afternoon|evening|night/i.test(input)) {
            return this.parseContextual(input, baseDate);
        }

        // Fallback to date-utils parseTime
        return parseTime(input, baseDate);
    }

    /**
     * Validate time is reasonable (not in future, not too far in past)
     */
    validate(time: Date, maxHoursInPast: number = 48): boolean {
        const now = new Date();
        const hoursAgo = (now.getTime() - time.getTime()) / (1000 * 60 * 60);

        if (time > now) {
            throw new Error('Time cannot be in the future');
        }

        if (hoursAgo > maxHoursInPast) {
            throw new Error(`Time is more than ${maxHoursInPast} hours in the past. Please specify the date.`);
        }

        return true;
    }
}