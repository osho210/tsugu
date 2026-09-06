# Persistence and Decision History

## Provenance

Store value provenance explicitly. Do not overwrite one category with another.

Required categories include:

- observed
- AI-calculated
- self-reported
- Human override

For an override, preserve original value, effective value, actor, timestamp and reason.

## Main Aggregates

The MVP persists enough information to reproduce a recommendation later:

- Task reference (GitHub Issue / Backlog Task)
- Required Capability / Level
- Experience / EXP / Level snapshot
- Workload snapshot
- Coverage Risk snapshot
- Bottleneck snapshot
- Fast / Balanced / Growth recommendation snapshot
- Reviewer / Support snapshot
- score weights/version

## Decision Log

Human assignment decision is separate from recommendation generation.

Store:

- recommendation version/id
- all three option snapshots
- selected option
- selected assignee
- selected Reviewer/Support
- whether the AI/top-score recommendation was overridden
- override reason
- decided by internal User ID
- decided at
- before/after metrics at decision time

Historical decisions must remain stable even when future scoring weights change.

## Authentication Identity

Use an internal Domain User ID. Clerk's external authentication ID is stored separately and must not become the Domain primary identity.

## Database Boundary

Prisma models are persistence models, not Domain entities. Database access occurs through Repository implementations in Infrastructure.

A single recommendation/decision aggregate should be persisted atomically where partial writes would produce an invalid state.
