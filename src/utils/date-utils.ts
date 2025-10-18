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

    // Invalid date - throw error instead of silent fallback
    throw new Error(`Unable to parse date: "${dateStr}". Use format: "today", "yesterday", or "YYYY-MM-DD" (e.g., "2025-10-17")`);
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

    // Invalid time - throw error instead of silent fallback
    throw new Error(`Unable to parse time: "${timeStr}". Use format: "HH:MM" (e.g., "14:30"), "X hours ago", or "morning/afternoon/evening"`);
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
 * Get the number of ISO weeks in a given year
 * Most years have 52 weeks, but some have 53
 * A year has 53 weeks if:
 * - It starts on Thursday, OR
 * - It's a leap year that starts on Wednesday
 */
export function getWeeksInYear(year: number): number {
    // Get January 1 of the year
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay();

    // Check if it's a leap year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    // Year has 53 weeks if it starts on Thursday (4) or if it's a leap year starting on Wednesday (3)
    if (jan1Day === 4 || (isLeap && jan1Day === 3)) {
        return 53;
    }

    return 52;
}

/**
 * Validate that a week number is within valid range for a given year
 * @param year - Year to validate against
 * @param week - Week number to validate
 * @throws Error if week number is invalid
 */
export function validateWeekNumber(year: number, week: number): void {
    // Check for reasonable year range (1900-2200)
    if (year < 1900 || year > 2200) {
        throw new Error(`Year ${year} is outside valid range (1900-2200)`);
    }

    // Check week is a positive integer
    if (!Number.isInteger(week) || week < 1) {
        throw new Error(`Week number must be a positive integer, got: ${week}`);
    }

    // Check week is within valid range for the year
    const maxWeeks = getWeeksInYear(year);
    if (week > maxWeeks) {
        throw new Error(`Week ${week} is invalid for year ${year}. Year ${year} has ${maxWeeks} weeks (valid range: 1-${maxWeeks})`);
    }
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