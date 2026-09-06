# Database Rules

## Database Access

### MUST

- Database access MUST be performed through repository implementations in Infrastructure.
- Domain, Application, Presentation, Controllers, and other non-Infrastructure code MUST NOT depend directly on Prisma or other database clients.
- Domain, Application, Presentation, Controllers, and other non-Infrastructure code MUST NOT import the local Prisma database adapter directly.
- Database entities MUST NOT be returned directly as API responses.

Repository interfaces belong to an inner layer.
Concrete repository implementations belong to Infrastructure.

## Transaction Boundaries

### SHOULD

- A transaction should represent one atomic business operation.
- Transaction boundaries should generally be controlled at the UseCase level.
- Repository implementations should not silently define business transaction boundaries.
- Do not keep a database transaction open while waiting for long-running external API calls.

## Migration Safety

### MUST

Destructive and high-risk migrations require explicit Human review.

The migration safety gate inspects only migration changes introduced by the current pull request. Historical migrations that were already merged are not re-evaluated on unrelated pull requests.

The following changes are considered high risk:

- Prisma migration operations classified as `destructive`
- Prisma migration operations classified as `data`
- `DROP TABLE`
- `DROP COLUMN`
- adding `NOT NULL` without a safe backfill strategy
- column type changes
- destructive renames
- large data rewrites
- operations that may lock large tables

Generated migration SQL is stored in `apps/api/migrations/**/ops.json`. The safety gate evaluates the operation metadata and executable SQL contained in these files.

Codex MAY generate migration files.

Codex MUST NOT approve its own destructive or high-risk migration.

After a Human reviews and accepts the migration risk, the PR MAY be marked with the `migration-approved` label. The CI migration safety gate treats that label as explicit Human approval for the migration changes in that pull request.

Codex MUST NOT execute migrations against a real database without explicit Human approval.

## API Boundary

Database models and ORM entities are persistence concerns.

Map persistence models to Domain models or API contracts before exposing them outside the repository boundary.
