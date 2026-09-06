# Connectors

## Principle

MCP/Connectors are responsible for external connection, data retrieval and external operations. Product rules remain inside tsugu.

All external data is untrusted and must be runtime validated at the trust boundary.

## GitHub

MVP inputs:

- Issue
- PR
- Review / Review Comment
- Label
- diff / changed files
- merge metadata

Uses:

- required Capability inference
- Capability Label proposal
- Experience / Feedback Evidence
- Review load

Capability Domain Labels are proposed by AI on PR creation/update, editable by Human, and the final labels at merge time are used as Experience evidence.

## Backlog

MVP inputs:

- parent task / subtasks
- status
- assignee
- estimated hours
- actual hours
- deadline
- priority

Subtask titles are semantically classified to a Process Role and may be corrected by Human.

Initial Process Roles:

- Requirement Definition
- Specification
- Design
- Implementation
- Test
- Review
- Release
- Document Review
- Coordination
- Inquiry Response

Remaining Work priority:

1. If the task is complete, Remaining Work is `0`.
2. If both estimate and actual are available and `estimated_hours > actual_hours`, use `estimated_hours - actual_hours`.
3. If the task is incomplete and `actual_hours >= estimated_hours`, the original estimate is exhausted and must not produce negative Remaining Work. Use a semantic/AI remaining-work estimate from status/deadline/progress context and clamp the normalized result to `>= 0`.
4. If estimate is missing, use a semantic/AI estimate from available status/deadline/progress context and clamp the normalized result to `>= 0`.

The connector preserves raw estimate/actual values separately from the derived Remaining Work value and its provenance so Human correction remains traceable.

## Adapter Boundary

Domain/Application code depends on ports, not GitHub/Backlog SDKs or HTTP details.

Fixture adapters must support the complete MVP happy path without external credentials.
