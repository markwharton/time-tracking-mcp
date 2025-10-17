// src/utils/date-utils.ts
import { TimeTrackingEnvironment } from '../config/environment.js';
import type { WeekIdentifier } from '../types/index.js';

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Apply timezone offset to convert from server time to display timezone
 * Only applies offset if server timezone differs from configured display timezone
 *
 * Examples:
 * - Server in AEST (UTC+10), Display=AEST (UTC+10): No conversion (local use)
 * - Server in UTC (UTC+0), Display=AEST (UTC+10): Add 10 hours (cloud server use)
 */
export function applyTimezoneOffset(date: Date): Date {
    // Get system's timezone offset in hours (negative of getTimezoneOffset/60)
    const systemOffsetHours = date.getTimezoneOffset() / -60;
    const displayOffsetHours = TimeTrackingEnvironment.displayTimezoneOffset;

    // If system timezone matches display timezone, no conversion needed
    if (systemOffsetHours === displayOffsetHours) {
        return date;
    }

    // Calculate difference and apply conversion
    const offsetDiff = displayOffsetHours - systemOffsetHours;
    return new Date(date.getTime() + (offsetDiff * 60 * 60 * 1000));
}

/**
 * Get current date/time in configured display timezone
 */
export function now(): Date {
    return applyTimezoneOffset(new Date());
}

/**
 * Parse natural language date references
 * Examples: "today", "yesterday", "2025-10-17"
 */
export function parseDate(dateStr?: string): Date {
    if (!dateStr || dateStr === 'today') {
        return now();
    }

    const lower = dateStr.toLowerCase();

    if (lower === 'yesterday') {
        const date = now();
        date.setDate(date.getDate() - 1);
        return date;
    }

    if (lower === 'tomorrow') {
        const date = now();
        date.setDate(date.getDate() + 1);
        return date;
    }

    // Try ISO format: YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Default to today if can't parse
    console.error(`[Time Tracking] Could not parse date: ${dateStr}, defaulting to today`);
    return now();
}

/**
 * Parse natural language time references
 * Examples: "14:30", "2 hours ago", "now"
 */
export function parseTime(timeStr?: string, baseDate?: Date): Date {
    const base = baseDate || now();

    if (!timeStr || timeStr === 'now') {
        return base;
    }

    // Parse HH:MM format
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        const result = new Date(base);
        result.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return result;
    }

    // Parse relative time: "X hours ago", "X minutes ago"
    const relativeMatch = timeStr.match(/^(\d+)\s*(hour|hr|h|minute|min|m)s?\s*ago$/i);
    if (relativeMatch) {
        const [, amount, unit] = relativeMatch;
        const value = parseInt(amount);
        const result = new Date(base);

        if (unit.startsWith('h')) {
            result.setHours(result.getHours() - value);
        } else {
            result.setMinutes(result.getMinutes() - value);
        }

        return result;
    }

    // Parse relative: "this morning" (9am), "afternoon" (2pm), "evening" (6pm)
    if (timeStr.match(/morning/i)) {
        const result = new Date(base);
        result.setHours(9, 0, 0, 0);
        return result;
    }

    if (timeStr.match(/afternoon/i)) {
        const result = new Date(base);
        result.setHours(14, 0, 0, 0);
        return result;
    }

    if (timeStr.match(/evening/i)) {
        const result = new Date(base);
        result.setHours(18, 0, 0, 0);
        return result;
    }

    // Default to current time if can't parse
    console.error(`[Time Tracking] Could not parse time: ${timeStr}, defaulting to now`);
    return base;
}

/**
 * Get ISO week number for a date
 * Returns {year, week} accounting for weeks that span year boundaries
 */
export function getISOWeek(date: Date): { year: number; week: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNum };
}

/**
 * Get start and end dates for an ISO week
 */
export function getWeekBounds(year: number, week: number): WeekIdentifier {
    // January 4 is always in week 1
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const weekStart = new Date(jan4);
    weekStart.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    return {
        year,
        week,
        startDate: weekStart,
        endDate: weekEnd
    };
}

/**
 * Format week identifier as human-readable string
 * Example: "Week 42 (Oct 14-20, 2025)"
 */
export function formatWeekHeader(weekId: WeekIdentifier): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const startMonth = months[weekId.startDate.getMonth()];
    const startDay = weekId.startDate.getDate();
    const endMonth = months[weekId.endDate.getMonth()];
    const endDay = weekId.endDate.getDate();
    const year = weekId.year;

    if (startMonth === endMonth) {
        return `Week ${weekId.week} (${startMonth} ${startDay}-${endDay}, ${year})`;
    }

    return `Week ${weekId.week} (${startMonth} ${startDay}-${endMonth} ${endDay}, ${year})`;
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}