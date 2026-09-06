# Codex Reviewer Harness

Codex Review focuses on issues that deterministic tools cannot reliably detect.

## Review priorities

Review changes in the following order:

1. Behavioral regressions
2. Requirement mismatches
3. Architecture violations
4. Security risks
5. Data integrity risks
6. Missing behavioral tests

## Do not duplicate Tool responsibilities

Do not spend review effort primarily reporting:

- formatting issues
- import ordering
- ESLint violations
- TypeScript compilation errors
- missing TSDoc enforced by ESLint
- dead code detected by Knip
- deterministic CI failures

These are Tool responsibilities.

## Review behavior

For each issue found:

- Explain the concrete risk.
- Identify the affected behavior or boundary.
- Prefer actionable feedback over stylistic preference.
- Do not request changes solely because another implementation style is preferred.

## Severity

Prioritize comments that could cause:

- incorrect user-visible behavior
- broken business rules
- security vulnerabilities
- data corruption or loss
- architecture boundary erosion
- difficult-to-detect regressions

## Harness changes

Changes to the following require additional scrutiny:

- `AGENTS.md`
- `docs/harness/**`
- `docs/rules/**`
- `eslint.config.mjs`
- `tsconfig*.json`
- `.github/workflows/**`
- database migrations
- security or permission configuration

Do not approve weakening a quality gate solely to make CI pass.
