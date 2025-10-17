// src/types/index.ts

/**
 * Time entry in markdown file
 */
export interface TimeEntry {
    time: string;           // HH:MM format
    task: string;           // Task description
    duration: number;       // Duration in hours (decimal)
    tags: string[];         // Tags like #development, #meeting
    date: string;           // YYYY-MM-DD
}

/**
 * Daily summary
 */
export interface DailySummary {
    date: string;           // YYYY-MM-DD
    entries: TimeEntry[];
    totalHours: number;
}

/**
 * Weekly summary
 */
export interface WeeklySummary {
    weekNumber: number;
    year: number;
    startDate: string;      // YYYY-MM-DD
    endDate: string;        // YYYY-MM-DD
    days: DailySummary[];
    totalHours: number;
    byCommitment: Record<string, number>;  // e.g., { development: 18, meeting: 5 }
    byTag: Record<string, number>;
    byProject: Record<string, number>;
}

/**
 * Company configuration
 */
export interface CompanyConfig {
    company: string;
    commitments: Record<string, CommitmentLimit>;
    projects?: Record<string, ProjectConfig>;
    tagMappings?: Record<string, string>;
}

export interface CommitmentLimit {
    limit: number;
    max?: number;           // Optional hard maximum (for overflow tracking)
    unit: string;           // "hours/week"
}

export interface ProjectConfig {
    tags: string[];
    commitment: string;     // Maps to commitment key
}

/**
 * Tool input/output types
 */
export interface LogTimeInput {
    task: string;
    duration: string;       // "2h", "90m", "1.5h", etc.
    time?: string;          // "14:30", "2 hours ago", omit for now
    date?: string;          // "today", "yesterday", "2025-10-17"
    tags?: string[];
    company?: string;
}

export interface CheckHoursInput {
    period?: 'today' | 'week' | 'month';
    breakdown?: boolean;
    company?: string;
}

export interface WeeklyReportInput {
    week?: 'current' | 'last' | string;  // "2025-W42"
    company?: string;
}

export interface StatusInput {
    company?: string;
}

/**
 * Parsed time reference
 */
export interface ParsedTime {
    hours: number;
    minutes: number;
    absoluteTime: Date;
}

/**
 * Duration in hours (always normalized to decimal)
 */
export interface Duration {
    hours: number;          // Decimal hours (2.5 = 2h 30m)
    formatted: string;      // "2.5h"
}

/**
 * Week identifier
 */
export interface WeekIdentifier {
    year: number;
    week: number;
    startDate: Date;
    endDate: Date;
}

/**
 * Parse validation issues
 */
export interface ParseIssues {
    unparsedLines: Array<{ lineNumber: number; content: string }>;
    formatVersion: string | null;
    warnings: string[];
}