# Security Rules

## External Input

### MUST

Treat all data that crosses a trust boundary as untrusted input.

This includes, but is not limited to:

- HTTP request bodies
- query parameters
- path parameters
- headers
- GitHub webhook payloads
- environment variables
- external API responses
- messages received from external systems

Validate untrusted input before using it in business logic, persistence, authorization decisions, or external commands.

TypeScript types alone do not provide runtime validation.

## Secrets and Credentials

### MUST

- Secrets, tokens, passwords, credentials, private keys, and authorization headers MUST NOT be committed to the repository.
- Sensitive values MUST NOT be written to application logs.
- Use environment variables or an approved secret store for runtime credentials.
- Do not copy production credentials into test fixtures, examples, documentation, or local configuration committed to Git.

High-confidence secret patterns are checked by `pnpm check:secrets` in CI.

GitHub-native secret scanning should also remain enabled when it is available for the repository. The repository-level CI check is intentionally kept because it can run locally and does not depend on repository settings.

## Dependency Vulnerabilities

### MUST

Dependency vulnerabilities are a Tool responsibility.

Production dependencies are a blocking security gate:

```bash
pnpm security:audit
```

CI fails on high or critical vulnerabilities in production dependencies.

Development dependencies are audited separately:

```bash
pnpm security:audit:dev
```

Development audit findings remain visible in CI, but do not block the PR by themselves. This separation prevents vulnerabilities in non-production tooling from making every unrelated PR permanently unmergeable while still surfacing them for remediation.

Dependabot and the audit gates have separate responsibilities:

- Dependabot proposes dependency updates and security fixes for production and development dependencies.
- the production audit blocks known high or critical runtime dependency vulnerabilities
- the development audit surfaces known vulnerabilities in build, test, migration, and other development tooling
- Codex reviews whether a dependency change creates contextual security or compatibility risk that the tools cannot determine

Existing development-tool vulnerabilities MUST NOT be silently added to an ignore list merely to make CI pass. Resolve them through an upstream update when available, or document an explicit Human-approved exception when necessary.

## Codex Review

Codex should focus on contextual security risks such as:

- missing validation at a trust boundary
- authorization or authentication mistakes
- unsafe use of validated data
- sensitive data exposure through application behavior
- SSRF, injection, path traversal, or command execution risks
- insecure defaults or permission changes

Codex should not duplicate deterministic findings already reported by secret scanning, dependency audit, lint, or CI.

## Security Gate Changes

Changes that weaken, disable, bypass, or reduce the coverage of security checks require explicit Human review.

Codex MUST NOT weaken a security rule or gate solely to make a task pass.
