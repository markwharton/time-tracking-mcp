// src/config/environment.ts
import { homedir } from 'os';
import { join } from 'path';

/**
 * Environment configuration for Time Tracking MCP
 */
export class TimeTrackingEnvironment {
    /**
     * Get base directory for time tracking files
     * Default: ~/Documents/time-tracking
     */
    static get trackingDir(): string {
        return process.env.TIME_TRACKING_DIR ||
            join(homedir(), 'Documents', 'time-tracking');
    }

    /**
     * Get list of configured companies
     * Default: ['default']
     */
    static get companies(): string[] {
        const companies = process.env.COMPANIES;
        if (!companies) {
            return ['default'];
        }
        return companies.split(',').map(c => c.trim()).filter(c => c);
    }

    /**
     * Check if running in single-company mode (no COMPANIES env var set)
     * In single-company mode:
     * - config.json is at root of tracking dir
     * - week files are at root of tracking dir
     * - companies = ['default']
     */
    static get isSingleCompanyMode(): boolean {
        return !process.env.COMPANIES;
    }

    /**
     * Get timezone display string (e.g., "AEST", "UTC", "PST")
     */
    static get displayTimezoneString(): string {
        return process.env.DISPLAY_TIMEZONE_STRING || 'UTC';
    }

    /**
     * Get timezone offset in hours from UTC
     * Positive for east of UTC, negative for west
     */
    static get displayTimezoneOffset(): number {
        const offset = process.env.DISPLAY_TIMEZONE_OFFSET;
        return offset ? parseInt(offset, 10) : 0;
    }

    /**
     * Check if displaying in UTC (no timezone conversion needed)
     */
    static get isUTC(): boolean {
        return this.displayTimezoneString === 'UTC' || this.displayTimezoneOffset === 0;
    }

    /**
     * Enable flexible duration parsing in markdown files
     * When enabled, allows entries like "- 06:01 task (30m)" or "- 06:01 task (2 hours)"
     * which are normalized to standard format on next recalculation
     * Default: false (strict parsing for safety)
     */
    static get flexibleDurationParsing(): boolean {
        const value = process.env.FLEXIBLE_DURATION_PARSING;
        return value === 'true' || value === '1';
    }

    /**
     * Get company abbreviations mapping
     * Format: "CompanyName:abbrev1:abbrev2,Company2:abbrev3"
     * Returns: { "CompanyName": ["abbrev1", "abbrev2"], "Company2": ["abbrev3"] }
     */
    static getCompanyAbbreviations(): Record<string, string[]> {
        const abbrevString = process.env.COMPANY_ABBREVIATIONS;
        if (!abbrevString) {
            return {};
        }

        const result: Record<string, string[]> = {};

        // Parse "CompanyName:abbrev1:abbrev2,Company2:abbrev3"
        const companyParts = abbrevString.split(',');
        for (const part of companyParts) {
            const tokens = part.split(':').map(t => t.trim()).filter(t => t);
            if (tokens.length < 1) continue;

            const company = tokens[0];
            const abbreviations = tokens.slice(1);
            result[company] = abbreviations;
        }

        return result;
    }

    /**
     * Get full path for a company's directory
     * In single-company mode, returns the tracking dir root
     */
    static getCompanyDir(company: string): string {
        if (this.isSingleCompanyMode) {
            return this.trackingDir;
        }
        return join(this.trackingDir, company);
    }

    /**
     * Get full path for a company's config file
     * In single-company mode: ~/Documents/time-tracking/config.json
     * In multi-company mode: ~/Documents/time-tracking/{company}/config.json
     */
    static getCompanyConfigPath(company: string): string {
        return join(this.getCompanyDir(company), 'config.json');
    }

    /**
     * Get full path for a week's markdown file
     * In single-company mode: ~/Documents/time-tracking/{year}-W{week}.md
     * In multi-company mode: ~/Documents/time-tracking/{company}/{year}-W{week}.md
     */
    static getWeekFilePath(company: string, year: number, week: number): string {
        const filename = `${year}-W${week.toString().padStart(2, '0')}.md`;
        return join(this.getCompanyDir(company), filename);
    }
}