// src/utils/company-resolver.ts
import { TimeTrackingEnvironment } from '../config/environment.js';

/**
 * Validate company name for path safety
 * Ensures company names don't contain path traversal characters
 * @param company - Company name to validate
 * @throws Error if company name contains unsafe characters
 */
function validateCompanyNameSafety(company: string): void {
    // Disallow path traversal patterns
    if (company.includes('..') || company.includes('/') || company.includes('\\')) {
        throw new Error(`Invalid company name: "${company}". Company names cannot contain path separators or '..'`);
    }

    // Disallow empty or whitespace-only names
    if (!company || company.trim().length === 0) {
        throw new Error('Company name cannot be empty');
    }

    // Disallow names starting with dot (hidden files)
    if (company.startsWith('.')) {
        throw new Error(`Invalid company name: "${company}". Company names cannot start with '.'`);
    }

    // Ensure reasonable length
    if (company.length > 100) {
        throw new Error(`Company name too long: "${company}". Maximum 100 characters.`);
    }
}

/**
 * Resolve company name from input string (case-insensitive)
 * Supports both full company names and abbreviations
 *
 * @param input - Company name or abbreviation to resolve
 * @returns Canonical company name
 * @throws Error if company not found
 */
export function resolveCompany(input: string): string {
    const normalized = input.toLowerCase().trim();
    const companies = TimeTrackingEnvironment.companies;
    const abbreviations = TimeTrackingEnvironment.getCompanyAbbreviations();

    // 1. Check if it matches full company name (case-insensitive)
    for (const company of companies) {
        if (company.toLowerCase() === normalized) {
            return company; // Return canonical name
        }
    }

    // 2. Check if it matches any abbreviation (case-insensitive)
    for (const [company, abbrevs] of Object.entries(abbreviations)) {
        if (abbrevs.some(abbrev => abbrev.toLowerCase() === normalized)) {
            return company;
        }
    }

    // Not found - provide helpful error message
    const validOptions: string[] = [];
    for (const company of companies) {
        const abbrevs = abbreviations[company] || [];
        if (abbrevs.length > 0) {
            validOptions.push(`${company} (${abbrevs.join('/')})`);
        } else {
            validOptions.push(company);
        }
    }

    throw new Error(`Unknown company: "${input}". Valid options: ${validOptions.join(', ')}`);
}

/**
 * Extract company from natural language input
 * Supports prefix pattern: "hm 2h debugging" or "helimods 2h debugging"
 * Supports suffix pattern: "2h debugging for hm" or "2h debugging for helimods"
 *
 * @param input - Natural language input
 * @returns Company name if found, null otherwise
 */
export function extractCompanyFromInput(input: string): string | null {
    const normalized = input.toLowerCase().trim();
    const companies = TimeTrackingEnvironment.companies;
    const abbreviations = TimeTrackingEnvironment.getCompanyAbbreviations();

    // Build list of all possible company identifiers (case-insensitive)
    const allIdentifiers: Array<{ identifier: string; company: string }> = [];

    for (const company of companies) {
        // Add full company name
        allIdentifiers.push({ identifier: company.toLowerCase(), company });

        // Add abbreviations
        const abbrevs = abbreviations[company] || [];
        for (const abbrev of abbrevs) {
            allIdentifiers.push({ identifier: abbrev.toLowerCase(), company });
        }
    }

    // Sort by length (longest first) to match longest identifiers first
    allIdentifiers.sort((a, b) => b.identifier.length - a.identifier.length);

    // 1. Check prefix pattern: "company ..." or "abbrev ..."
    for (const { identifier, company } of allIdentifiers) {
        // Match "identifier " (with space after)
        if (normalized.startsWith(identifier + ' ')) {
            return company;
        }
    }

    // 2. Check suffix pattern: "... for company" or "... for abbrev"
    for (const { identifier, company } of allIdentifiers) {
        // Match " for identifier" (at end or followed by space)
        const pattern = ' for ' + identifier;
        if (normalized.endsWith(pattern) || normalized.includes(pattern + ' ')) {
            return company;
        }
    }

    return null;
}

/**
 * Validate that company is in the allowed list
 * @param company - Company name to validate
 * @throws Error if company not in configured list
 */
export function validateCompany(company: string): void {
    // First check path safety
    validateCompanyNameSafety(company);

    // Then check if it's in the configured list
    const companies = TimeTrackingEnvironment.companies;
    if (!companies.includes(company)) {
        throw new Error(`Company "${company}" is not configured. Configured companies: ${companies.join(', ')}`);
    }
}

/**
 * Check if system is in single-company mode
 * @returns true if only one company is configured
 */
export function isSingleCompanyMode(): boolean {
    return TimeTrackingEnvironment.companies.length === 1;
}

/**
 * Validate all configured companies for path safety
 * Should be called at server startup
 * @throws Error if any configured company has an unsafe name
 */
export function validateConfiguredCompanies(): void {
    const companies = TimeTrackingEnvironment.companies;
    for (const company of companies) {
        try {
            validateCompanyNameSafety(company);
        } catch (error) {
            throw new Error(`Invalid company in configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Get the company to use for an operation
 * - Single company mode: Always return the single company (ignore input)
 * - Multi company mode: Require explicit company specification
 *
 * @param explicitCompany - Company explicitly specified by user/tool
 * @param naturalLanguageInput - Original user input for pattern matching
 * @returns Company name to use
 * @throws Error if multi-company mode and no company specified
 */
export function getCompanyForOperation(
    explicitCompany: string | undefined,
    naturalLanguageInput?: string
): string {
    // Single company mode: always use the single company
    if (isSingleCompanyMode()) {
        return TimeTrackingEnvironment.companies[0];
    }

    // Multi-company mode: require explicit specification
    let company: string | undefined = explicitCompany;

    // Try to extract from natural language if not explicitly provided
    if (!company && naturalLanguageInput) {
        const extracted = extractCompanyFromInput(naturalLanguageInput);
        if (extracted) {
            company = extracted;
        }
    }

    if (!company) {
        const companies = TimeTrackingEnvironment.companies;
        const abbreviations = TimeTrackingEnvironment.getCompanyAbbreviations();

        // Build helpful error message
        const examples: string[] = [];
        for (const comp of companies) {
            const abbrevs = abbreviations[comp] || [];
            if (abbrevs.length > 0) {
                examples.push(`'${comp}/${abbrevs[0]}'`);
            } else {
                examples.push(`'${comp}'`);
            }
        }

        throw new Error(
            `Company required when multiple companies configured. ` +
            `Use prefix pattern (${examples.join(' or ')} 2h task) ` +
            `or suffix pattern (2h task for ${examples.join(' or ')})`
        );
    }

    // Resolve abbreviation to canonical name and validate
    const resolved = resolveCompany(company);
    validateCompany(resolved);
    return resolved;
}
