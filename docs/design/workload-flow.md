# Workload and Flow

## Workload

Normalize workload into time and compare it with available working time.

```text
Workload % = predicted workload hours / available hours × 100
```

Both `predicted workload hours` and `available hours` must be non-negative.

When `available hours <= 0`, do not divide. Classify the member as `unavailable` for new assignment and exclude the member from assignment candidates until positive availability is restored. Persist/API snapshots represent this as an explicit state, not `Infinity` or `NaN`.

MVP workload includes:

- Backlog remaining work
- Process Role workload
- predicted Review workload

Slack inquiry and Meeting workload are later sources; the model must allow adding them without changing Domain semantics.

Example:

```text
available = 40h
predicted workload = 32h
workload = 80%
```

## Team Workload Thresholds

The thresholds are team-configurable. Initial values from the Product Source of Truth are:

- Target: 80%
- Warning: 90%
- Limit: 100%

Assignment behavior:

- at or below Target: preferred load range
- above Target and at or below Warning: allowed with reduced Load Fitness
- above Warning and at or below Limit: allowed only with a strong penalty/warning
- above Limit: ineligible by default before weighted scoring

## Load Fitness Initial Mapping

Intervals are intentionally non-overlapping:

- `0% <= workload <= 50%`: 100
- `50% < workload <= 70%`: 80
- `70% < workload <= 85%`: 50
- `85% < workload <= 100%`: 20
- `workload > 100%`: 0

The boundary values 50%, 70%, 85% and 100% require explicit unit tests.

## Bottleneck Score

Calculate a 0–100 score per Process Role using:

- waiting time
- concentration ratio
- assigned member workload
- number of replacement-capable members

Coverage and Bottleneck are different.

- **Coverage Value**: whether the team gains more people capable of the important work.
- **Bottleneck Impact**: whether actual flow improves after assignment.

Recommendation calculation compares Bottleneck Score before and after assignment.

## Determinism

Time normalization, workload percentage, load fitness, concentration and score composition must be deterministic functions with boundary tests.
