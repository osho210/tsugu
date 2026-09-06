# TypeScript

## MUST

- Validate untrusted external input before treating it as a domain type.
- Do not use type assertions as a substitute for runtime validation.

## SHOULD

- Avoid type assertions when narrowing, validation, or type guards can express the behavior safely.
- Prefer `type` for project-defined type declarations.

## MAY

- `enum` may be used when it clearly models the domain.
