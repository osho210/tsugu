<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Web

This directory contains the frontend application.

Before modifying Web code, read:

- `../../ARCHITECTURE.md`
- `../../docs/rules/architecture.md`
- `../../docs/rules/typescript.md`

## Rules

- Prefer Server Components by default.
- Use Client Components only when client-side behavior is required.
- Do not import directly from `apps/api`.
- Shared API contracts should live under `packages/*`.
- Keep data-fetching and orchestration separate from presentational components when appropriate.
- Do not bypass architecture checks to make a change pass.
