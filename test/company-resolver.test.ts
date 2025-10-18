// test/company-resolver.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mock the environment for testing
process.env.COMPANIES = 'TestCompany,AnotherCompany';

// Import after setting env vars
import { resolveCompany, validateCompany } from '../src/utils/company-resolver.js';

describe('Company Resolver', () => {
    describe('Path Safety Validation', () => {
        it('should reject company names with path traversal (..)', () => {
            assert.throws(
                () => validateCompany('../etc'),
                /Company names cannot contain path separators/
            );
        });

        it('should reject company names with forward slash', () => {
            assert.throws(
                () => validateCompany('company/test'),
                /Company names cannot contain path separators/
            );
        });

        it('should reject company names with backslash', () => {
            assert.throws(
                () => validateCompany('company\\test'),
                /Company names cannot contain path separators/
            );
        });

        it('should reject company names starting with dot', () => {
            assert.throws(
                () => validateCompany('.hidden'),
                /Company names cannot start with/
            );
        });

        it('should reject empty company names', () => {
            assert.throws(
                () => validateCompany(''),
                /Company name cannot be empty/
            );
        });

        it('should reject whitespace-only company names', () => {
            assert.throws(
                () => validateCompany('   '),
                /Company name cannot be empty/
            );
        });

        it('should reject company names over 100 characters', () => {
            const longName = 'a'.repeat(101);
            assert.throws(
                () => validateCompany(longName),
                /Company name too long.*Maximum 100 characters/
            );
        });

        it('should accept company names exactly 100 characters', () => {
            // Note: This will fail if company is not in configured list,
            // but we're testing the path safety validation runs first
            const name = 'a'.repeat(100);
            assert.throws(
                () => validateCompany(name),
                /not configured/  // Fails on second check, not path safety
            );
        });
    });

    describe('resolveCompany', () => {
        it('should resolve exact company name (case-insensitive)', () => {
            const result = resolveCompany('TestCompany');
            assert.equal(result, 'TestCompany');
        });

        it('should resolve company name with different case', () => {
            const result = resolveCompany('testcompany');
            assert.equal(result, 'TestCompany');
        });

        it('should throw error for unknown company', () => {
            assert.throws(
                () => resolveCompany('UnknownCompany'),
                /Unknown company/
            );
        });

        it('should provide helpful error with valid options', () => {
            try {
                resolveCompany('Invalid');
                assert.fail('Should have thrown error');
            } catch (error) {
                const message = (error as Error).message;
                assert.match(message, /Valid options/);
                assert.match(message, /TestCompany/);
            }
        });
    });

    describe('validateCompany', () => {
        it('should accept valid configured companies', () => {
            assert.doesNotThrow(() => validateCompany('TestCompany'));
            assert.doesNotThrow(() => validateCompany('AnotherCompany'));
        });

        it('should reject companies not in configuration', () => {
            assert.throws(
                () => validateCompany('NotConfigured'),
                /not configured/
            );
        });
    });
});
