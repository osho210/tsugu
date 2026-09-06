# MVP

## Product Value

The MVP validates whether tsugu can explain **who should take a task so that the team becomes stronger**, not only who is fastest today.

Primary data sources are GitHub and Backlog.

## Required Scope

1. GitHub Issue / PR integration
2. Backlog Task / subtask integration
3. Capability Labels
4. Experience / EXP / Capability Level
5. Workload calculation
6. Coverage Risk
7. Fast / Balanced / Growth recommendations
8. Reviewer / Support recommendation
9. Decision Log
10. Capability / Assignment Dashboard

Authentication uses Clerk in the MVP. Domain user IDs remain separate from external authentication IDs.

## Capability Model

Capability is modeled as:

```text
Domain × Role
```

Examples:

- Database × Implementation
- Database × Design
- Database × Review
- API × Implementation
- Domain × Design

GitHub exposes only the Domain as `capability:*` labels. Difficulty, Autonomy and EXP stay internal.

## Happy Path

```text
Login
 -> Select GitHub Issue / Backlog Task
 -> Infer Required Capability / Level
 -> Load Experience / EXP / Capability Level
 -> Calculate Workload / Coverage / Bottleneck
 -> Generate Fast / Balanced / Growth
 -> Compare Reviewer / Support
 -> Human Decision
 -> Persist Decision Log
```

## MVP Demo Mode

The complete happy path must be reproducible without external credentials by using fixture adapters for:

- Authentication
- GitHub
- Backlog
- Semantic/AI classifications

Live adapters may use external credentials, but fixture mode is the acceptance path for local verification and CI.

## Out of Scope for Initial MVP

Unless explicitly pulled forward by a product decision:

- Slack inquiry workload
- Calendar / meeting workload
- Meeting Standard evaluation
- Standard natural-language generation
- automatic assignment
- automatic PR merge
- production migration execution

The architecture should allow later connectors without coupling the Domain to specific providers.
