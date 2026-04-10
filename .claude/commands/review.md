---
description: Code review of current changes against CalorIa standards (security, conventions, API contracts, test coverage)
argument-hint: Optional — specific files or area to review
---

# Code Review — CalorIa

Scope: **$ARGUMENTS** (default: `git diff` of staged + unstaged changes)

Launch 3 **code-reviewer** agents in parallel:

**Agent 1 — Backend correctness & security:**
"Review the backend changes for: security vulnerabilities (JWT bypass, missing auth checks, injection), incorrect HTTP status codes, missing input validation, exception handling gaps, and Spring Boot conventions. Files: [backend files from diff]"

**Agent 2 — Frontend correctness & types:**
"Review the frontend changes for: TypeScript type safety (no `any`), missing error/loading states, Zod validation gaps, hardcoded API keys or sensitive data, and Expo Router navigation issues. Files: [frontend files from diff]"

**Agent 3 — Architecture & contracts:**
"Use the api-validator agent approach to check: do frontend API calls match backend DTOs? Are new DTOs consistent with `md/07-api-contratos.md`? Does any new DB column lack a Flyway migration? Files: [all changed files]"

---

Consolidate findings by severity:

### Critical (must fix before merge)
- Security vulnerabilities
- Data loss risks
- Breaking API contract changes

### Important (should fix)
- Missing tests for new behavior
- Convention violations
- Unhandled error states

### Minor (consider fixing)
- Code style
- Optimization opportunities
