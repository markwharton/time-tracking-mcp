// test/duration-parser.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../src/services/duration-parser.js';

describe('Duration Parser', () => {
    describe('Valid durations', () => {
        it('should parse hours format', () => {
            const result = parseDuration('2h');
            assert.equal(result.hours, 2);
        });

        it('should parse minutes format', () => {
            const result = parseDuration('90m');
            assert.equal(result.hours, 1.5);
        });

        it('should parse decimal hours', () => {
            const result = parseDuration('2.5h');
            assert.equal(result.hours, 2.5);
        });

        it('should parse natural language - half hour', () => {
            const result = parseDuration('half an hour');
            assert.equal(result.hours, 0.5);
        });

        it('should parse natural language - quarter hour', () => {
            const result = parseDuration('quarter hour');
            assert.equal(result.hours, 0.25);
        });
    });

    describe('Validation - minimum duration', () => {
        it('should reject durations under 5 minutes', () => {
            assert.throws(
                () => parseDuration('1m'),
                /Duration too short.*Minimum duration is 5 minutes/
            );
        });

        it('should accept exactly 5 minutes', () => {
            const result = parseDuration('5m');
            assert.ok(result.hours >= 0.08); // 5 minutes ≈ 0.083h
        });
    });

    describe('Validation - maximum duration', () => {
        it('should reject durations over 24 hours', () => {
            assert.throws(
                () => parseDuration('25h'),
                /Duration too long.*Maximum duration is 24 hours/
            );
        });

        it('should accept exactly 24 hours', () => {
            const result = parseDuration('24h');
            assert.equal(result.hours, 24);
        });
    });

    describe('Validation - invalid values', () => {
        it('should reject negative durations', () => {
            assert.throws(
                () => parseDuration('-5h'),
                /Unable to parse duration/
            );
        });

        it('should reject invalid formats', () => {
            assert.throws(
                () => parseDuration('abc'),
                /Unable to parse duration/
            );
        });

        it('should reject empty strings', () => {
            assert.throws(
                () => parseDuration(''),
                /Unable to parse duration/
            );
        });
    });
});
