// src/utils/company-resolver.ts
import { TimeTrackingEnvironment } from '../config/environment.js';

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
