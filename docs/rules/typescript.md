# TypeScript

## MUST

- Validate untrusted external input before treating it as a domain type.
- Do not use type assertions as a substitute for runtime validation.
- User-facing validation and exception messages must be written in Japanese.
- Do not import Prisma-generated persistence types into Domain or Application. Map persistence shapes at the Infrastructure boundary instead.
- Do not introduce project-root aliases in an individual feature PR before the shared alias configuration supports typecheck, tests, build, and production runtime.

## SHOULD

- Avoid type assertions when narrowing, validation, or type guards can express the behavior safely.
- Prefer `type` for project-defined type declarations.
- Prefer typed fixture factories/builders over repeated entity object literals across tests.
- Name unit tests as `〜の場合、〜であること`; split broad cases or group narrower cases with `describe`.
- Prefer full-object expectations when a test verifies an object contract. Use partial matching only when the omitted fields are intentionally irrelevant.
- Reuse generated Prisma types for persistence-layer code when they exactly represent the persistence shape instead of duplicating those types.
- Keep cross-cutting request normalization such as trimming in Presentation/request-boundary infrastructure rather than repeating it field-by-field in Application or Domain.
- Avoid extracting one-use private helpers that do not represent a separate concept. Put genuinely reusable helpers/guards in an appropriate shared module.
- After the API alias foundation is available, use `@/` for cross-directory imports so imports do not depend on directory depth. Same-directory imports may remain relative when they improve local readability.

## MAY

- `enum` may be used when it clearly models the domain.
