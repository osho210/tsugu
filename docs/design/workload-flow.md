# Workload and Flow

## Workload

Normalize workload into time and compare it with available working time.

```text
Workload % = predicted workload hours / available hours × 100
```

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

## Load Fitness Initial Mapping

- 0–50%: 100
- 50–70%: 80
- 70–85%: 50
- 85–100%: 20
- over 100%: 0

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
