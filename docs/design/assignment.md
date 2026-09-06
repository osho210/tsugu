# Assignment Recommendation

## Principle

Always provide multiple options. Human makes the final selection.

- **Fast**: prioritize fastest/safest completion.
- **Balanced**: balance deadline, workload, growth and coverage.
- **Growth**: maximize capability coverage while remaining feasible.

A member with a Capability gap may remain a candidate if appropriate Reviewer/Support makes completion safe.

## Required Capability

A task is classified into required:

```text
Domain × Role × Required Level
```

Semantic classification must retain Reason and Confidence.

## Hard Constraints

Apply before weighted scoring.

- Exclude plans predicted to miss the deadline by default.
- Security-critical work may exclude candidates lacking required Capability.
- Exclude candidates whose post-assignment Workload exceeds the allowed limit.
- Exclude plans that require Reviewer/Support when none can be secured.
- Extremely high Coverage Risk may allow a warned exception plan when the product rule permits it.

## Coverage Risk

Initial criterion: number of members with Level 3 or higher for the Capability.

- 0: Critical
- 1: High
- 2: Medium
- 3 or more: Low

`last_used_at` contributes to readiness/freshness but does not change the raw qualified-member count.

## Seven Axes

Normalize each axis to 0–100.

1. Execution Readiness
2. Growth Value
3. Coverage Value
4. Load Fitness
5. Deadline Safety
6. Support Safety
7. Bottleneck Impact

### Fast initial weights

- Execution Readiness: 30
- Deadline Safety: 25
- Load Fitness: 15
- Support Safety: 10
- Bottleneck Impact: 10
- Coverage Value: 5
- Growth Value: 5

### Balanced initial weights

- Execution Readiness: 18
- Deadline Safety: 18
- Load Fitness: 14
- Support Safety: 14
- Coverage Value: 14
- Growth Value: 12
- Bottleneck Impact: 10

### Growth initial weights

- Growth Value: 25
- Coverage Value: 22
- Bottleneck Impact: 18
- Support Safety: 13
- Deadline Safety: 12
- Execution Readiness: 7
- Load Fitness: 3

Each mode must validate that weights total 100. The model must support team-configurable weights later.

## Recommendation Output

Each plan must include:

- assignee candidate
- Reviewer / Support candidate
- predicted completion date
- post-assignment Workload
- Required Capability fulfillment
- Coverage before/after
- Bottleneck Score before/after
- seven-axis breakdown
- risk/warning
- explanation

Weighted score calculation is deterministic. AI may assist semantic classification and Explanation, but does not perform the final arithmetic or Human decision.
