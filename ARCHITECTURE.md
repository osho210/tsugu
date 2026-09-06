# Architecture

tsugu explicitly manages dependency direction between applications and architectural layers.

Dependency rules that can be verified deterministically are enforced by `dependency-cruiser`.

## Applications

`apps/web` and `apps/api` are treated as independent applications.

### MUST

- `apps/web` MUST NOT import directly from `apps/api`.
- `apps/api` MUST NOT import directly from `apps/web`.

When types, contracts, or domain concepts need to be shared, place them under `packages/*` only when they represent a meaningful shared responsibility.

Do not move code into `packages/*` only because the same code exists in more than one place.

## API Architecture

The API follows this dependency direction:

```text
Presentation / Controller
        ↓
Application / UseCase
        ↓
Domain
        ↓
Repository Interface

Infrastructure
        ↓ implements
Repository Interface
```

Dependencies should flow inward toward the Domain.

## Layers

### Presentation

The Presentation layer handles external boundaries such as HTTP.

Typical responsibilities include:

- Controllers
- Request / response mapping
- DTO conversion
- Protocol-specific concerns

Presentation MAY depend on Application.

Presentation SHOULD NOT contain business logic.

### Application

The Application layer expresses application use cases.

Typical responsibilities include:

- Coordinating domain behavior
- Executing use cases
- Managing transaction boundaries
- Calling external capabilities through abstractions

Application MAY depend on Domain.

Application MUST NOT depend directly on:

- Presentation
- Infrastructure implementations

When Application requires access to a database, external API, or other infrastructure capability, depend on an interface rather than the concrete implementation.

### Domain

The Domain layer represents business rules and domain concepts.

Typical responsibilities include:

- Domain models
- Value objects
- Domain services
- Business invariants
- Repository interfaces when they represent domain-required capabilities

Domain MUST remain independent from outer layers.

Domain MUST NOT depend on:

- Application
- Presentation
- Infrastructure

Framework-specific and infrastructure-specific concerns should not be introduced into Domain.

### Infrastructure

The Infrastructure layer contains implementation details for external systems.

Typical responsibilities include:

- Database access
- Repository implementations
- External API clients
- Messaging
- File storage
- Framework-specific adapters

Infrastructure MAY depend on Domain abstractions in order to implement them.

Infrastructure SHOULD NOT introduce business rules that belong in Domain or Application.

## Repository Boundary

Database access should be isolated behind repository implementations.

Application and Domain code should not depend directly on database clients or ORM implementations.

Repository interfaces define the capability required by the inner layers, while Infrastructure provides the concrete implementation.

## Shared Packages

`packages/*` is reserved for code with a clear cross-application responsibility.

Appropriate examples include:

- API contracts shared by Web and API
- Shared domain concepts when they are genuinely common
- Reusable libraries with a stable responsibility

Inappropriate reasons to create a shared package include:

- Code duplication alone
- Convenience
- Avoiding local module boundaries

Shared packages should remain intentionally scoped and should not become a general dumping ground.

## Barrel Exports

Barrel exports should primarily be used at package boundaries.

Avoid introducing barrel exports inside application internals when they obscure dependency direction or make architectural boundaries harder to understand.

## Enforcement

Dependency rules are enforced with `dependency-cruiser`.

Run the architecture check with:

```bash
pnpm architecture
```

The current architecture gate checks, among other rules:

- Web must not import API directly.
- API must not import Web directly.
- Domain must not depend on Application, Presentation, or Infrastructure.
- Application must not depend on Presentation or Infrastructure implementations.
- Circular dependencies are not allowed.
- Unresolvable dependencies are not allowed.
- Production code must not depend on test files.

Architecture violations should fail locally and in CI.

## Guardrails

Architecture rules are part of the development harness.

Codex MUST NOT weaken, disable, or bypass architecture checks solely to make a change pass.

Changes to architecture rules, dependency-cruiser configuration, or architecture-related CI gates require Human review.
