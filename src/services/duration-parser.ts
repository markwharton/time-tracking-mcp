// src/services/duration-parser.ts
import type { Duration } from '../types/index.js';

/**
 * Duration validation constants
 */
const MIN_DURATION_HOURS = 0.05; // 3 minutes minimum
const MAX_DURATION_HOURS = 24;   // 24 hours maximum per entry

/**
 * Validate duration is within reasonable bounds
 */
function validateDuration(hours: number, input: string): void {
    if (hours < MIN_DURATION_HOURS) {
        throw new Error(`Duration too short: "${input}". Minimum duration is 3 minutes (0.05h)`);
    }
    if (hours > MAX_DURATION_HOURS) {
        throw new Error(`Duration too long: "${input}". Maximum duration is 24 hours per entry`);
    }
    if (hours < 0) {
        throw new Error(`Duration cannot be negative: "${input}"`);
    }
    if (!isFinite(hours)) {
        throw new Error(`Invalid duration value: "${input}"`);
    }
}

/**
 * Parse duration string into decimal hours
 * Supports multiple formats:
 * - "2h", "2 hours", "2.5h"
 * - "90m", "90 minutes"
 * - "PT2H30M" (ISO 8601)
 * - "half an hour", "quarter hour"
 */
export function parseDuration(input: string): Duration {
    const normalized = input.toLowerCase().trim();

    // Handle natural language
    if (normalized.match(/half\s*(an?\s*)?hour/)) {
        const hours = 0.5;
        validateDuration(hours, input);
        return { hours, formatted: '0.5h' };
    }

    if (normalized.match(/quarter\s*(of\s*an?\s*)?hour/)) {
        const hours = 0.25;
        validateDuration(hours, input);
        return { hours, formatted: '0.25h' };
    }

    // Parse hours: "2h", "2 hours", "2.5h"
    const hoursMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*(hour|hr|h)s?$/);
    if (hoursMatch) {
        const hours = parseFloat(hoursMatch[1]);
        validateDuration(hours, input);
        return { hours, formatted: `${hours}h` };
    }

    // Parse minutes: "90m", "90 minutes"
    const minutesMatch = normalized.match(/^(\d+)\s*(minute|min|m)s?$/);
    if (minutesMatch) {
        const minutes = parseInt(minutesMatch[1]);
        const hours = minutes / 60;
        validateDuration(hours, input);
        return { hours, formatted: `${hours.toFixed(2)}h` };
    }

    // Parse ISO 8601 duration: PT2H30M
    const isoMatch = normalized.match(/^pt(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
    if (isoMatch) {
        const [, hoursStr, minutesStr, secondsStr] = isoMatch;
        let totalHours = 0;

        if (hoursStr) totalHours += parseInt(hoursStr);
        if (minutesStr) totalHours += parseInt(minutesStr) / 60;
        if (secondsStr) totalHours += parseFloat(secondsStr) / 3600;

        validateDuration(totalHours, input);
        return { hours: totalHours, formatted: `${totalHours.toFixed(2)}h` };
    }

    // Try just a number (assume hours)
    const numberMatch = normalized.match(/^(\d+(?:\.\d+)?)$/);
    if (numberMatch) {
        const hours = parseFloat(numberMatch[1]);
        validateDuration(hours, input);
        return { hours, formatted: `${hours}h` };
    }

    throw new Error(`Unable to parse duration: "${input}". Try formats like "2h", "90m", or "1.5h"`);
}

/**
 * Format hours as readable duration
 * Examples: 2.5 → "2.5h", 0.75 → "0.75h"
 */
export function formatDuration(hours: number): string {
    // Use 1 decimal place if needed, otherwise no decimals
    if (hours % 1 === 0) {
        return `${hours}h`;
    }
    return `${hours.toFixed(1)}h`;
}

/**
 * Convert hours to hours and minutes
 * Example: 2.5 → "2h 30m"
 */
export function formatDurationDetailed(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
        return `${wholeHours}h`;
    }

    if (wholeHours === 0) {
        return `${minutes}m`;
    }

    return `${wholeHours}h ${minutes}m`;
}