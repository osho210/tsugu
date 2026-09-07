# MVP Verification

This document is the executable verification entry point for the tsugu MVP.

Product requirements and scoring values are sourced from the Notion page `tsugu｜要求定義・要件定義・機能要件 v0.2`. GitHub `docs/design/*` is a technical snapshot only. Values marked `要レビュー` in Notion are intentionally not finalized here.

## Verification branch

Current documentation lane:

```text
docs/issue-73-mvp-verification
```

The final integration branch name will be recorded here when the integration lane is created. Do not treat this documentation branch as the final integration branch.

## Current repository gates

Run from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm check:todo
pnpm check:secrets
pnpm security:audit
pnpm lint
pnpm architecture
pnpm check:migration
pnpm deadCode
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
pnpm --filter web build
```

Expected result: every command exits with status `0`. Migration commands that execute a real database migration are not part of MVP verification.

## Final automated MVP command

The verification design requires the following command:

```bash
pnpm verify:mvp
```

Status: **not implemented on `main` yet**. Do not report this command as available until the final fixture/verification implementation adds it.

When implemented, it must verify at least:

1. Required Capability is represented as `Domain × Role × Level`.
2. Experience, EXP and Capability Level remain distinct concepts.
3. Coverage Risk boundaries match the configured golden fixture.
4. Workload and Process Role bottleneck metrics match the configured golden fixture.
5. Fast, Balanced and Growth expose deterministic score breakdowns and expected candidates.
6. Assignee and Reviewer/Support are different people.
7. Human Decision / override reason can be persisted and read back.

## Product values already safe to use as golden configuration

These values are already specified by the Product Source of Truth and may be used by fixtures without inventing a new product decision.

### Capability

- Capability identity: `Domain × Role`.
- GitHub Capability Label exposes Domain only.
- Difficulty / Autonomy / EXP are internal values and are not GitHub labels.
- Capability Level is `Lv1` through `Lv5`.

### EXP

- Base EXP: `100`.
- Minimum EXP: `20`.
- Maximum EXP: `250`.
- Initial `required_experience_count`: `10` (**仮置き**; keep configurable).

Difficulty correction:

| Level | Correction |
| --- | ---: |
| Lv1 | -20 |
| Lv2 | -10 |
| Lv3 | 0 |
| Lv4 | +30 |
| Lv5 | +60 |

Autonomy correction:

| Level | Correction |
| --- | ---: |
| Lv1 | -30 |
| Lv2 | -10 |
| Lv3 | 0 |
| Lv4 | +30 |
| Lv5 | +50 |

Review feedback penalty configuration starts from the Notion-defined provisional values. `required_fix` / `design_issue` are the normal penalty targets, duplicate comments on the same issue are not double-counted, and the exact important-comment penalty remains configurable where Notion marks it provisional.

### Workload

Initial team-configurable thresholds:

| Threshold | Initial value |
| --- | ---: |
| Target | 80% |
| Warning | 90% |
| Limit | 100% |

Assignment should prefer candidates at or below Target, strongly penalize Warning overflow, and normally exclude Limit overflow. These thresholds are configuration, not hard-coded product constants.

## Human-review boundaries

Do not add golden expected values here when their source item is `要レビュー` in Notion. In particular, a fixture must not silently finalize unresolved scoring formulas, Capability Level promotion thresholds, destructive migration behavior, or other Human-decision boundaries.

For an unresolved value, record:

```text
Status: BLOCKED_BY_HUMAN_DECISION
Source: <Notion section / GitHub decision issue>
Required decision: <exact missing decision>
```

## Required credential-free fixture scenario

The final fixture set must provide stable local data for:

- authenticated internal user
- GitHub Issue
- merged PRs and Review Feedback
- Capability labels and Human overrides
- Backlog Task and subtasks
- member availability
- semantic classifications

The fixture must intentionally include:

- different Experience / Capability Level profiles by member
- Critical, High, Medium and Low Coverage examples
- uneven Workload
- at least one Process Role bottleneck
- a case where Fast, Balanced and Growth prefer different candidates
- a Reviewer/Support-assisted candidate
- a Human override of the highest-scoring recommendation

External GitHub, Backlog, Clerk and AI credentials must not be required for this happy path.

## Manual UI happy path

When the corresponding UI lanes are merged into the final integration branch, verify this exact flow:

```text
Login with fixture auth
 -> Select fixture task
 -> Generate recommendation
 -> Compare Fast / Balanced / Growth
 -> Inspect Workload / Coverage / Bottleneck before and after assignment
 -> Inspect Reviewer / Support and risks
 -> Select one option
 -> Save Human Decision
 -> Re-open Decision Log
```

Record the exact local URLs here once those routes exist. Do not invent URLs before the routes are implemented.

## Golden-value completion checklist

The final integration lane must replace each pending item below with fixture-specific exact input/output values only after its prerequisite implementation is merged:

| Verification area | Current status | Prerequisite |
| --- | --- | --- |
| GitHub Issue / PR fixture | pending integration | GitHub connector/fixture implementation |
| Backlog Task / subtasks fixture | pending integration | Backlog fixture implementation |
| Capability Label | partial | Capability + GitHub label lanes |
| Experience / EXP | pending | Experience engine |
| Capability Level | blocked where promotion threshold is `要レビュー` | Human decision + Level implementation |
| Workload | thresholds documented | Workload implementation |
| Coverage Risk | pending | Coverage implementation |
| Fast / Balanced / Growth | blocked on unresolved scoring decisions where applicable | Recommendation implementation + Human decisions |
| Reviewer recommendation | pending | Reviewer recommendation implementation |
| Decision Log | pending | Decision Log implementation |
| Capability / Assignment Dashboard | pending | Dashboard implementation |

This table is a progress ledger, not permission to substitute guessed values for pending product decisions.
