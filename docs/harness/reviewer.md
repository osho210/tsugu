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
- dependency vulnerabilities already reported by audit tooling
- secret patterns already reported by secret scanning
- deterministic CI failures

These are Tool responsibilities.

## Review behavior

For each issue found:

- Explain the concrete risk.
- Identify the affected behavior or boundary.
- Prefer actionable feedback over stylistic preference.
- Do not request changes solely because another implementation style is preferred.
- Distinguish a deterministic Tool failure from a contextual review finding.

## Severity

Prioritize comments that could cause:

- incorrect user-visible behavior
- broken business rules
- security vulnerabilities
- data corruption or loss
- architecture boundary erosion
- difficult-to-detect regressions

## High-risk changes

The following changes require explicit Human review before approval:

- `AGENTS.md` and scoped `AGENTS.md` files
- `docs/harness/**`
- `docs/rules/**`
- ESLint or TypeScript gate configuration
- architecture gate configuration
- `.github/workflows/**`
- security checks or permission configuration
- database migrations or migration safety gates
- dependency update automation configuration

Codex MUST NOT approve weakening, disabling, bypassing, or reducing the coverage of a quality or safety gate solely to make CI pass.

## Human approval boundary

Human approval is required when a change intentionally modifies a harness rule, CI gate, security boundary, migration safeguard, or permission boundary.

Codex may explain the trade-off and recommend an approach, but the final decision belongs to the Human.

## PR context

Use the PR body as the primary review context.

A well-formed PR should provide:

- Why
- What
- Test
- Risk
- Related Issue

Read `How` only when the author needs to explain a non-obvious design decision.

Use `Screenshot` only for UI changes where visual evidence helps review.
