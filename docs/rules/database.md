# Database Rules

## Database Access

### MUST

- Database access MUST be performed through repository implementations.
- Domain MUST NOT depend directly on Prisma or other database clients.
- Application MUST NOT depend directly on Prisma or other database clients.
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

Destructive migrations require explicit Human review.

The following changes are considered high risk:

- `DROP TABLE`
- `DROP COLUMN`
- adding `NOT NULL` without a safe backfill strategy
- column type changes
- destructive renames
- large data rewrites
- operations that may lock large tables

Codex MAY generate migration files.

Codex MUST NOT execute migrations against a real database without explicit Human approval.

## API Boundary

Database models and ORM entities are persistence concerns.

Map persistence models to Domain models or API contracts before exposing them outside the repository boundary.
