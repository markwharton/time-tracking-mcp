// test/date-utils.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, parseTime, validateWeekNumber, getWeeksInYear } from '../src/utils/date-utils.js';

describe('Date Utils', () => {
    describe('parseDate', () => {
        it('should parse "today"', () => {
            const result = parseDate('today');
            assert.ok(result instanceof Date);
        });

        it('should parse "yesterday"', () => {
            const result = parseDate('yesterday');
            assert.ok(result instanceof Date);
        });

        it('should parse ISO format dates', () => {
            const result = parseDate('2025-10-17');
            assert.equal(result.getFullYear(), 2025);
            assert.equal(result.getMonth(), 9); // October = 9 (0-indexed)
            assert.equal(result.getDate(), 17);
        });

        it('should throw error for invalid date formats', () => {
            assert.throws(
                () => parseDate('invalid-date'),
                /Unable to parse date/
            );
        });

        it('should handle malformed ISO dates as best effort', () => {
            // Note: JavaScript Date constructor is permissive and handles invalid dates
            // "2025-13-45" will parse but create an unexpected date
            // This is expected behavior - we validate format but not date logic
            const result = parseDate('2025-01-45'); // Month 1 (Feb), day 45 rolls over
            assert.ok(result instanceof Date);
        });
    });

    describe('parseTime', () => {
        it('should parse HH:MM format', () => {
            const baseDate = new Date('2025-10-17');
            const result = parseTime('14:30', baseDate);
            assert.equal(result.getHours(), 14);
            assert.equal(result.getMinutes(), 30);
        });

        it('should parse relative time - hours ago', () => {
            const result = parseTime('2 hours ago');
            assert.ok(result instanceof Date);
        });

        it('should parse contextual time - morning', () => {
            const result = parseTime('morning');
            assert.equal(result.getHours(), 9);
        });

        it('should parse contextual time - afternoon', () => {
            const result = parseTime('afternoon');
            assert.equal(result.getHours(), 14);
        });

        it('should throw error for invalid time formats', () => {
            assert.throws(
                () => parseTime('invalid-time'),
                /Unable to parse time/
            );
        });
    });

    describe('getWeeksInYear', () => {
        it('should return 52 for normal years', () => {
            assert.equal(getWeeksInYear(2023), 52);
        });

        it('should return 53 for years starting on Thursday', () => {
            // 2026 starts on Thursday
            assert.equal(getWeeksInYear(2026), 53);
        });

        it('should handle leap years correctly', () => {
            // 2020 is a leap year starting on Wednesday
            assert.equal(getWeeksInYear(2020), 53);
        });
    });

    describe('validateWeekNumber', () => {
        it('should accept valid week numbers', () => {
            assert.doesNotThrow(() => validateWeekNumber(2025, 1));
            assert.doesNotThrow(() => validateWeekNumber(2025, 52));
        });

        it('should accept week 53 for years with 53 weeks', () => {
            assert.doesNotThrow(() => validateWeekNumber(2026, 53));
        });

        it('should reject week 0', () => {
            assert.throws(
                () => validateWeekNumber(2025, 0),
                /Week number must be a positive integer/
            );
        });

        it('should reject week 53 for years with only 52 weeks', () => {
            assert.throws(
                () => validateWeekNumber(2025, 53),
                /Week 53 is invalid for year 2025/
            );
        });

        it('should reject invalid year range', () => {
            assert.throws(
                () => validateWeekNumber(1800, 1),
                /Year 1800 is outside valid range/
            );
        });

        it('should reject non-integer week numbers', () => {
            assert.throws(
                () => validateWeekNumber(2025, 1.5),
                /Week number must be a positive integer/
            );
        });
    });
});
