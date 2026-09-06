# MVP Verification Design

## Goal

A developer pulling the final integration branch must be able to verify the complete Notion MVP happy path without GitHub, Backlog, Clerk or AI credentials.

## Fixture Scenario

Provide stable fixture data for:

- authenticated internal user
- GitHub Issue
- merged PRs and Review Feedback
- Capability labels and Human overrides
- Backlog Task/subtasks
- member availability
- semantic classifications

The fixture must intentionally contain:

- different Experience/Level profiles by member
- Critical, High, Medium and Low Coverage examples
- uneven Workload
- at least one Process Role bottleneck
- a case where Fast, Balanced and Growth prefer different candidates
- a Reviewer/Support-assisted candidate
- a Human override of the highest-scoring recommendation

## Automated Command

The final implementation provides:

```bash
pnpm verify:mvp
```

It must verify at least:

1. Required Capability (`Domain × Role × Level`) matches golden expectations.
2. Experience / EXP / Level matches expected values.
3. Coverage Risk boundaries match expected values.
4. Workload / Bottleneck metrics match expected values.
5. Fast / Balanced / Growth produce the expected score breakdown and candidates.
6. Assignee and Reviewer/Support are not the same person.
7. A Human Decision and override reason can be persisted and read back.

## Manual UI Happy Path

```text
Login (fixture auth)
 -> Select fixture task
 -> Generate recommendation
 -> Compare Fast / Balanced / Growth
 -> Inspect Workload / Coverage / Bottleneck before/after
 -> Inspect Reviewer / Support and risks
 -> Select one option
 -> Save Human Decision
 -> Re-open Decision Log
```

`docs/verification/mvp.md` created by the final verification issue must contain exact commands, branch name, URLs and golden expected values.
