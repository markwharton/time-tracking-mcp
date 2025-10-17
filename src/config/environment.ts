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
     * Get default company when not specified
     * Default: first company in list
     */
    static get defaultCompany(): string {
        return process.env.DEFAULT_COMPANY || this.companies[0];
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
     * Get full path for a company's directory
     */
    static getCompanyDir(company: string): string {
        return join(this.trackingDir, company);
    }

    /**
     * Get full path for a company's config file
     */
    static getCompanyConfigPath(company: string): string {
        return join(this.getCompanyDir(company), 'config.json');
    }

    /**
     * Get full path for a week's markdown file
     */
    static getWeekFilePath(company: string, year: number, week: number): string {
        const filename = `${year}-week-${week.toString().padStart(2, '0')}.md`;
        return join(this.getCompanyDir(company), filename);
    }
}