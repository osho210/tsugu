# Codex Author Harness

Codex acts as the primary implementation agent in this repository.

## Before implementation

1. Understand the requested behavior.
2. Inspect the relevant existing implementation.
3. Read only the rules relevant to the files being changed.
4. For complex changes, create a short implementation plan.

Do not modify code before understanding the existing behavior and constraints.

## During implementation

Prefer the smallest change that satisfies the requirement.

Follow the dependency boundaries and project rules relevant to the modified code.

Behavior-changing code SHOULD include appropriate tests.

Do not make unrelated refactoring unless it is necessary for the requested change.

## Verification

Before completing the task:

1. Run the relevant deterministic checks.
2. Review the final diff.
3. Confirm that no unrelated changes were introduced.
4. Confirm that behavioral changes have appropriate tests.

## Guardrails

Codex MUST NOT weaken or disable:

- ESLint rules
- TypeScript checks
- tests
- CI gates
- security checks
- architecture checks
- migration safeguards

solely to make implementation pass.

Changes to these controls require Human approval.
