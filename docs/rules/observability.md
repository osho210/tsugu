# Observability Rules

## Logging

### MUST

- Production application logs MUST use the shared application logger.
- Production code MUST NOT call `console.log`, `console.debug`, `console.info`, `console.warn`, or `console.error` directly.
- Log entries MUST be structured so fields can be queried independently from the message.
- Secrets, tokens, passwords, credentials, authorization headers, cookies, and other sensitive values MUST NOT be written to logs.

The API logging entry point is `AppLogger` under `apps/api/src/infrastructure/logging/`.

Nest system logs use the same logger instance through `app.useLogger()`.

## Sensitive Data

`AppLogger` redacts metadata values whose keys represent sensitive data before they are written.

Automatic redaction is a defense in depth mechanism, not permission to log arbitrary request objects.

Prefer explicitly selecting safe fields for logging.

Do not log entire:

- HTTP request or response objects
- headers
- environment objects
- authentication payloads
- external API responses

## Events and Metadata

Prefer stable event messages with structured metadata.

Examples of useful metadata include:

- operation name
- entity identifier
- request identifier
- duration
- result or status

Avoid embedding searchable values only inside free-form message strings.

## Request and Trace Correlation

The logging boundary must remain compatible with future request ID and OpenTelemetry trace correlation.

When request ID or trace ID support is introduced, attach correlation identifiers as structured metadata rather than changing application log call sites to depend directly on an observability vendor.

## OpenTelemetry Boundary

Application code should depend on the shared logging entry point rather than a concrete telemetry backend.

OpenTelemetry or another exporter may later enrich or forward logs without requiring business code to adopt vendor-specific APIs.

## Review Boundary

Tool responsibilities include:

- rejecting direct `console` usage in production API source
- linting and type checking logging code

Codex Review should focus on contextual issues such as:

- logging excessive personal or sensitive information
- missing useful operational context
- unstable or misleading event semantics
- incorrect request/trace correlation

Changes that weaken logging or sensitive-data safeguards require Human review.
