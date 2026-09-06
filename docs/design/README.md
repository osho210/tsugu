# tsugu Technical Design

## Product Source of Truth

The authoritative product requirements are maintained in Notion:

- `tsugu｜要求定義・要件定義・機能要件 v0.2`
- https://app.notion.com/p/tsugu-v0-2-3c7289d8d63f8180b8cbd2fa4a514b61

The files in `docs/design/` are implementation-oriented snapshots derived from that page. They do not replace the product requirements.

## Requirement Status

When synchronizing the Notion design:

- **確定**: implement as specified.
- **仮置き**: use the documented initial value. Keep values configurable when the product design says they should be editable.
- **要レビュー**: do not silently finalize the decision. Stop at Human approval if implementation depends on the unresolved choice.
- A later detailed section that explicitly refines an earlier provisional value takes precedence in this technical snapshot.

## MVP Goal

Create a reproducible team by recommending not only who can finish a task fastest, but who can complete it while improving team capability and reducing structural risk.

AI proposes options and evidence. Human makes the final assignment decision.

## Design Files

- `mvp.md` — MVP scope and happy path
- `domain.md` — Capability, Experience, EXP, Level and evidence
- `connectors.md` — external data boundaries
- `workload-flow.md` — workload and flow metrics
- `assignment.md` — coverage, constraints and recommendation scoring
- `persistence.md` — source/value separation and decision history
- `api.md` — application/API contracts
- `verification.md` — fixture-based local verification

## Implementation Principle

```text
Product Requirement (Notion)
        ↓
Technical Snapshot (docs/design)
        ↓
GitHub Issue
        ↓
Code / Test / Tool Gate
        ↓
Codex Review
        ↓
Human Decision
```

Machine-decidable calculations belong in deterministic code. Semantic classification may use AI when the Notion design requires meaning understanding. Observed, AI-calculated, self-reported, and Human-overridden values must remain distinguishable.
