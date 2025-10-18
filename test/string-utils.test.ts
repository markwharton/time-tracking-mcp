// test/string-utils.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTaskDescription } from '../src/utils/string-utils.js';

describe('String Utils', () => {
    describe('sanitizeTaskDescription', () => {
        it('should preserve normal task descriptions', () => {
            const result = sanitizeTaskDescription('Review pull request');
            assert.equal(result, 'Review pull request');
        });

        it('should trim leading and trailing whitespace', () => {
            const result = sanitizeTaskDescription('  Task with spaces  ');
            assert.equal(result, 'Task with spaces');
        });

        it('should remove newlines and replace with spaces', () => {
            const result = sanitizeTaskDescription('Task\nwith\nnewlines');
            assert.equal(result, 'Task with newlines');
        });

        it('should replace multiple spaces with single space', () => {
            const result = sanitizeTaskDescription('Task    with    spaces');
            assert.equal(result, 'Task with spaces');
        });

        it('should remove leading markdown headers', () => {
            const result = sanitizeTaskDescription('## Header Task');
            assert.equal(result, 'Header Task');
        });

        it('should remove leading list markers', () => {
            const result = sanitizeTaskDescription('- List item task');
            assert.equal(result, 'List item task');
        });

        it('should preserve parentheses in task descriptions', () => {
            const result = sanitizeTaskDescription('Fix bug (issue #123)');
            assert.equal(result, 'Fix bug (issue #123)');
        });

        it('should throw error for empty task after sanitization', () => {
            assert.throws(
                () => sanitizeTaskDescription(''),
                /Task description cannot be empty/
            );
        });

        it('should throw error for whitespace-only task', () => {
            assert.throws(
                () => sanitizeTaskDescription('   '),
                /Task description cannot be empty after sanitization/
            );
        });

        it('should throw error for tasks over 500 characters', () => {
            const longTask = 'a'.repeat(501);
            assert.throws(
                () => sanitizeTaskDescription(longTask),
                /Task description too long.*Maximum 500 characters/
            );
        });

        it('should accept tasks exactly 500 characters', () => {
            const task = 'a'.repeat(500);
            const result = sanitizeTaskDescription(task);
            assert.equal(result.length, 500);
        });

        it('should preserve markdown markers without space', () => {
            // Note: Sanitization only removes "## " (with space), not "##" alone
            // This is intentional - we only block heading markers with space
            const result = sanitizeTaskDescription('##ticket-123');
            assert.equal(result, '##ticket-123');
        });
    });
});
