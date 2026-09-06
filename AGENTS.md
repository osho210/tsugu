# tsugu

## Development Harness

This repository uses Codex as the primary authoring and review agent.

Responsibilities are separated between:

- Tool: deterministic verification
- Codex: contextual reasoning and implementation
- Human: final decisions and approvals

## Source of truth

Project rules live under `docs/rules/`.

Harness behavior lives under `docs/harness/`.

Read only the documentation relevant to the files being changed.

## Before implementation

- Understand the requirement.
- Inspect the relevant existing code.
- For complex changes, create a short implementation plan.

## Before completion

- Run relevant verification commands.
- Review the final diff.
- Confirm behavior-changing code has appropriate tests.

## Guardrails

Do not weaken or disable:

- ESLint rules
- tests
- CI gates
- architecture checks
- security checks

solely to make a task pass.

Changes to quality gates require Human approval.

## Harness

When implementing changes, follow:

- `docs/harness/principles.md`
- `docs/harness/author.md`

When reviewing changes, follow:

- `docs/harness/principles.md`
- `docs/harness/reviewer.md`

Project-specific implementation rules live under `docs/rules/`.

Read only the rules relevant to the current task.
