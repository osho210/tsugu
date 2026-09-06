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
  "backlogTaskId": "TASK-123"
}
```

The client does not select `fixture` or `live` mode. Adapter mode is a server-side runtime configuration.

- local/CI verification may boot the application with fixture adapters and must not require external credentials.
- production must not register fixture adapters for assignment requests.
- configuration that attempts to enable fixture adapters in production must fail closed at startup or be explicitly rejected before handling requests.

This prevents fixture-derived recommendation/decision snapshots from being mixed with live production data through caller-controlled input.

Response contains:

- recommendation id
- task summary
- Required Capability (`Domain × Role × Level`)
- Experience / EXP / Level summary
- Workload / Coverage / Bottleneck before assignment
- Fast / Balanced / Growth mode results, each with `available` or `unavailable` state
- Reviewer / Support for available plans
- seven-axis scores for available plans
- predicted completion for available plans
- Workload/Coverage/Bottleneck after assignment for available plans
- explanation and risk/blocking reasons

If no mode has a feasible plan, the response carries overall status `no_feasible_plan`; hard constraints are not silently relaxed.

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

A decision cannot select a recommendation mode whose state is `unavailable`.

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
