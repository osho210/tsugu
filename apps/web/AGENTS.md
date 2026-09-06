# Web

This directory contains the frontend application.

Before modifying Web code, read:

- `../../ARCHITECTURE.md`
- `../../docs/rules/architecture.md`
- `../../docs/rules/typescript.md`
- `../../docs/rules/testing.md`

## Rules

- Prefer Server Components by default.
- Use Client Components only when client-side behavior is required.
- Do not import directly from `apps/api`.
- Shared API contracts should live under `packages/*`.
- Keep data-fetching and orchestration separate from presentational components when appropriate.
- Do not bypass architecture checks to make a change pass.
