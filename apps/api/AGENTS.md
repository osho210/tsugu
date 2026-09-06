# API

This directory contains the backend application.

Before modifying API code, read:

- `../../ARCHITECTURE.md`
- `../../docs/rules/architecture.md`
- `../../docs/rules/typescript.md`

## Architecture

Follow the dependency direction defined in `ARCHITECTURE.md`.

Presentation / Controller
→ Application / UseCase
→ Domain
→ Repository Interface

Infrastructure implements repository interfaces.

## Rules

- Controllers must not contain business logic.
- Application logic should be organized around use cases.
- Domain must remain independent from framework and infrastructure details.
- Database access must go through repository implementations.
- Do not bypass architecture checks to make a change pass.

## Database and Migrations

Before modifying database access or migrations, read:

- `../../docs/rules/database.md`

Codex MAY generate migration files.

Codex MUST NOT approve its own destructive or high-risk migration.

The `migration-approved` PR label represents explicit Human approval and MUST only be applied after Human review.

Codex MUST NOT execute migrations against a real database without explicit Human approval.

Do not weaken migration safety checks solely to make a change pass.
