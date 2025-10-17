// src/utils/file-utils.ts
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { dirname } from 'path';

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Ensure directory exists (create if it doesn't)
 */
export async function ensureDir(path: string): Promise<void> {
    try {
        await mkdir(path, { recursive: true });
    } catch (error) {
        // Ignore error if directory already exists
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Read file as string, return null if doesn't exist
 */
export async function readFileIfExists(path: string): Promise<string | null> {
    try {
        return await readFile(path, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Write file, ensuring directory exists
 */
export async function writeFileSafe(path: string, content: string): Promise<void> {
    await ensureDir(dirname(path));
    await writeFile(path, content, 'utf-8');
}

/**
 * Read JSON file, return null if doesn't exist
 */
export async function readJSON<T>(path: string): Promise<T | null> {
    const content = await readFileIfExists(path);
    if (!content) {
        return null;
    }
    return JSON.parse(content) as T;
}

/**
 * Write JSON file with pretty printing
 */
export async function writeJSON(path: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await writeFileSafe(path, content);
}