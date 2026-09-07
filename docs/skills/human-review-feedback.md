# Human Review Feedback Skill

Human review feedback is not treated as a one-off patch request. When feedback describes a reusable quality rule, apply it at three levels: the commented code, analogous code in active PRs, and repository guidance.

## Workflow

1. Read the concrete review comment and identify the underlying invariant.
2. Check the invariant against architecture, security, database, and product rules.
3. Apply the smallest local fix to the commented PR.
4. Search active implementation PRs for the same pattern and fix applicable occurrences without crossing unresolved dependencies.
5. Add or update a repository rule when the invariant should affect future work.
6. Keep exceptions explicit when a general rule conflicts with an architecture boundary.
7. If the feedback requires shared configuration, create a prerequisite issue/PR instead of duplicating that configuration across active feature branches.

## High-priority conventions

### Test data

- Prefer typed fixture factories/builders over repeated object literals when the same entity shape appears in multiple tests.
- Keep default test values in one factory so model/contract changes have one primary update point.
- Allow per-test overrides to expose only the field relevant to that test.

### Test cases

- Name unit tests as a condition and an expected result: `〜の場合、〜であること`.
- If one test cannot be described with one condition and one result, split the case or group narrower cases under `describe`.
- For object results, prefer an explicit full-object expectation. Do not use partial matching when the contract is intended to be fully verified.

### Types and persistence

- Do not duplicate persistence types inside Infrastructure when a generated Prisma type already represents the same persistence shape.
- Prisma models are persistence models. Do not import Prisma-generated types into Domain or Application merely to avoid declaring a domain/application contract.
- When a Domain/Application contract intentionally differs from persistence, keep the boundary explicit and map in Infrastructure.

### Imports

- Prefer a project-root alias such as `@/` for cross-directory imports after the repository's shared configuration supports it across typecheck, tests, build, and production runtime.
- Do not make each feature PR add its own alias configuration. Shared tsconfig/Jest/build/runtime configuration is a prerequisite lane.
- Same-directory imports may remain relative when they make locality clearer.

### Validation and normalization

- User-facing validation/error messages are written in Japanese.
- Cross-cutting request normalization such as string trimming belongs at the Presentation/request boundary (for example an interceptor/pipe), not repeated field-by-field in use cases or domain parsing.
- Domain/Application validation may still reject malformed or empty values; it should not silently own request-wide normalization.

### Helpers and guards

- Do not extract a private helper merely to shorten one local sequence when it has no separate concept or reuse value.
- If a helper/guard is genuinely reusable across files, place it in an appropriate shared module and test it there.
- Prefer one shared generic guard over repeated copies of the same structural guard.

## Review completion

A Human review thread is complete only when the concrete issue is fixed or a documented architecture/product constraint explains why the exact requested mechanism is unsafe. In the latter case, preserve the intent with an architecture-compatible implementation and record the reason in the thread.
