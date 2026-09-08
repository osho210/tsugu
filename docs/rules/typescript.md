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
- Prefer typed fixture factories/builders over repeated entity object literals across tests. Keep shared default values in the factory and expose narrow per-test overrides so each test changes only fields relevant to its condition.
- Name unit tests as `〜の場合、〜であること`; split broad cases or group narrower cases with `describe`.
- Prefer full-object expectations when a test verifies an object contract. Use partial matching only when the omitted fields are intentionally irrelevant.
- Reuse generated Prisma types for persistence-layer code when they exactly represent the persistence shape instead of duplicating those types.
- Normalize request strings only at a Presentation/request boundary that knows the field semantics. Use field-aware DTO transforms or an explicit allowlist for fields where trimming is part of the contract; never apply generic request-wide trimming to opaque or whitespace-significant values such as passwords, tokens, signatures, encoded data, or content whose whitespace can carry meaning.
- Avoid extracting one-use private helpers that do not represent a separate concept. Put genuinely reusable helpers/guards in an appropriate shared module, prefer one shared generic guard over repeated copies of the same structural guard, and directly test the shared helper/guard at that boundary.
- After the API alias foundation is available, use `@/` for cross-directory imports so imports do not depend on directory depth. Same-directory imports may remain relative when they improve local readability.

## MAY

- `enum` may be used when it clearly models the domain.
