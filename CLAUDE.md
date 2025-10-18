# Time Tracking MCP - Documentation for Claude Code

This document provides quick navigation to key documentation for Claude Code when working on this codebase.

## Core Development Principles

**[Development Principles](docs/architecture/development-principles.md)** - Essential principles for working on this codebase:
- Accuracy over speed
- Investigate before fixing
- Test assumptions
- DRY principle
- Code organization standards

## System Architecture

**[Tag System Design](docs/architecture/tag-system.md)** - Understanding the flexible tag-based architecture:
- How tags route to commitments and projects
- Three-layer tagging strategy
- Tag mappings and project configuration
- Common patterns and troubleshooting

**[Multi-Company Patterns](docs/architecture/multi-company-patterns.md)** - Two organizational approaches:
- Pattern 1: Separate configs (per-company limits)
- Pattern 2: Single config (unified tracking)
- How to choose and switch between patterns

## Reference Documentation

**[Format Specification](docs/reference/format-specification.md)** - Markdown file format details:
- File structure and naming conventions
- Entry format and regex patterns
- Tag system implementation
- Format versioning

**[Configuration Schema](docs/example-config.json)** - Example company configuration

## Development Guides

**[Development Guide](docs/guides/development.md)** - For developers working on the codebase:
- Project structure
- Architecture diagrams
- Development workflow
- Testing guidelines

**[Usage Examples](docs/guides/usage-examples.md)** - Natural language examples for time tracking

## Setup Guides

**[Claude Desktop Setup](docs/setup/claude-desktop.md)** - MCP server configuration:
- Claude Desktop vs Claude Code CLI differences
- Environment variables
- Configuration examples

## Quick Links

- [README.md](README.md) - User-facing documentation and quick start
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [docs/README.md](docs/README.md) - Full documentation index

## Working with This Codebase

When starting a task:
1. Review relevant architecture docs to understand the system
2. Follow development principles (especially "investigate before fixing")
3. Use the format specification for markdown file details
4. Check usage examples for expected behavior
5. Test your assumptions before implementing changes

The tag system is the heart of this application - understanding tag-system.md is essential for working on any features related to commitments, projects, or reporting.
