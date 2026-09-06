# MVP API Contract

## Recommendation Generation

### `POST /assignment-recommendations`

Request:

```json
{
  "github": {
    "owner": "example",
    "repository": "example",
    "issueNumber": 123
  },
  "backlogTaskId": "TASK-123",
  "mode": "fixture"
}
```

`mode` is `fixture` or `live`. Fixture mode must not require external credentials.

Response contains:

- recommendation id
- task summary
- Required Capability (`Domain × Role × Level`)
- Experience / EXP / Level summary
- Workload / Coverage / Bottleneck before assignment
- Fast / Balanced / Growth plans
- Reviewer / Support
- seven-axis scores
- predicted completion
- Workload/Coverage/Bottleneck after assignment
- explanation and risk

### `GET /assignment-recommendations/:id`

Returns the immutable recommendation snapshot.

## Human Decision

### `POST /assignment-recommendations/:id/decision`

Stores the Human selection and optional override reason.

Request conceptually contains:

- selected mode
- selected assignee
- selected Reviewer/Support
- override reason when applicable

### `GET /assignment-decisions/:id`

Returns the historical decision snapshot.

## Error Categories

Map implementation/provider failures to stable application errors:

- invalid input
- authentication/authorization failure
- GitHub not found
- Backlog not found
- external rate limit
- external temporary failure / timeout
- invalid external response
- semantic provider invalid output
- persistence failure

Controllers convert HTTP/DTOs only. Business orchestration belongs in Application UseCases.
