# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 0.1.1 (2025-10-17)


### Features

* add flexible duration parsing with feature flag ([d3f7996](https://github.com/markwharton/time-tracking-mcp/commit/d3f79966ba719d7e75a3daa67a1c5331c46c1139))
* add format robustness improvements ([e33e0dc](https://github.com/markwharton/time-tracking-mcp/commit/e33e0dc312f2de09318ff992846ca32ea45530dd))
* add interactive company selection using AskUserQuestion tool ([746ac19](https://github.com/markwharton/time-tracking-mcp/commit/746ac19f55ab28d2471fa817a15b5b0533f63161))
* add multi-company support with intelligent company resolution ([11b7a12](https://github.com/markwharton/time-tracking-mcp/commit/11b7a128027962599cf26a59eac207419d948dc3))
* add overflow tracking with configurable max hours limit ([c3e883a](https://github.com/markwharton/time-tracking-mcp/commit/c3e883aee8385cea8980119644268482b8ccbba2))
* implement natural language time tracking MCP ([8df3b41](https://github.com/markwharton/time-tracking-mcp/commit/8df3b4130dfdeb9a5ea670f1d82a6f71b326ee9a))


### Bug Fixes

* correct parse order to detect date headers before skipping them ([6e09c0f](https://github.com/markwharton/time-tracking-mcp/commit/6e09c0f814fe095a23cc74fde53860a94a53f58c))
* correct timezone offset logic to prevent date/time errors ([c68dde7](https://github.com/markwharton/time-tracking-mcp/commit/c68dde749cda934ab54ac0abc9cd9e3c968560a0))
* import all tools to enable full functionality ([2f457bc](https://github.com/markwharton/time-tracking-mcp/commit/2f457bcebeadba1d5b41ab801167ccbb90f2e3f3))
* restore double spaces in markdown formatting example ([b1fde0c](https://github.com/markwharton/time-tracking-mcp/commit/b1fde0c1636da4e673217f03d41d7ad0ca202bc4))
* update setup.sh with company abbreviations and Claude Code CLI support ([268249e](https://github.com/markwharton/time-tracking-mcp/commit/268249e81e56e9ba4a2343c51e48c9c20ab06350))
* use greedy matching for task text to handle parentheses ([8d4f511](https://github.com/markwharton/time-tracking-mcp/commit/8d4f5114938483032c207255bf3ffccdc070339d))


### Code Refactoring

* apply DRY principle to entry parsing regex patterns ([338564a](https://github.com/markwharton/time-tracking-mcp/commit/338564aa53fc91fc79104a059734a82b1e06c020))
* apply DRY principle to report formatting ([58a78b1](https://github.com/markwharton/time-tracking-mcp/commit/58a78b1d32c189a462f31a4208a0c4e9f3488cfe))
* consolidate summary calculation to eliminate duplication ([2dc3e22](https://github.com/markwharton/time-tracking-mcp/commit/2dc3e22b205271ffa6a0fa9f818a99688a722c10))
* standardize file naming to ISO 8601 format and remove dead code ([0681ee7](https://github.com/markwharton/time-tracking-mcp/commit/0681ee78c38e58c9cbd6819d4b004d788d7a3846))

## 0.1.0 (2025-10-17)

### Features

* Initial release of Time Tracking MCP
* Natural language time logging
* Multi-company support
* Markdown-based storage
* Auto-calculated summaries and commitment tracking