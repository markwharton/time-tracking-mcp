// src/services/audit-log.ts
import { TimeTrackingEnvironment } from '../config/environment.js';
import { writeFileSafe } from '../utils/file-utils.js';
import { formatTagsWithDefault } from '../utils/report-formatters.js';
import type { TimeEntry } from '../types/index.js';
import { appendFile } from 'fs/promises';
import { join } from 'path';

/**
 * Append-only audit log for time entries
 * Provides immutable record of all time entry operations
 */
export class AuditLog {
    /**
     * Get audit log file path for a company
     */
    private static getAuditLogPath(company: string): string {
        const baseDir = TimeTrackingEnvironment.getCompanyDir(company);
        return join(baseDir, 'audit.log');
    }

    /**
     * Log a time entry addition
     */
    static async logEntry(company: string, operation: 'ADD' | 'EDIT' | 'DELETE', entry: TimeEntry): Promise<void> {
        const timestamp = new Date().toISOString();
        const logPath = this.getAuditLogPath(company);

        // Format: ISO8601_TIMESTAMP | OPERATION | DATE | TIME | DURATION | TASK | TAGS
        const tags = formatTagsWithDefault(entry.tags, 'no-tags');
        const logLine = `${timestamp} | ${operation} | ${entry.date} | ${entry.time} | ${entry.duration.toFixed(2)}h | ${entry.task} | ${tags}\n`;

        try {
            await appendFile(logPath, logLine, { encoding: 'utf-8' });
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
                // Create file with header if it doesn't exist
                const header = '# Time Tracking Audit Log\n';
                const versionLine = '# Format: ISO8601_TIMESTAMP | OPERATION | DATE | TIME | DURATION | TASK | TAGS\n';
                const versionMarker = '# audit-log-format: v1.0\n\n';
                await writeFileSafe(logPath, header + versionLine + versionMarker + logLine);
            } else {
                throw error;
            }
        }
    }

    /**
     * Log entry addition
     */
    static async logAdd(company: string, entry: TimeEntry): Promise<void> {
        await this.logEntry(company, 'ADD', entry);
    }

    /**
     * Log entry edit
     */
    static async logEdit(company: string, entry: TimeEntry): Promise<void> {
        await this.logEntry(company, 'EDIT', entry);
    }

    /**
     * Log entry deletion
     */
    static async logDelete(company: string, entry: TimeEntry): Promise<void> {
        await this.logEntry(company, 'DELETE', entry);
    }
}
