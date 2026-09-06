# Domain Model

## Capability

Capability represents what work a member can perform and is identified primarily by `Domain × Role`.

GitHub labels represent only the Domain. Role, Difficulty, Autonomy and Level are internal data.

## Experience vs Capability Level

These are different concepts.

- **Experience**: what a person experienced, in which Role, Difficulty and Autonomy.
- **Capability Level**: up to what Difficulty a task can be entrusted to the person autonomously.

Do not treat a single observed Experience as proof of Capability Level.

## Levels

- Lv1: can handle with guidance/support
- Lv2: can independently handle routine tasks
- Lv3: can autonomously complete normal-difficulty tasks
- Lv4: can autonomously handle high-difficulty or uncertain tasks
- Lv5: can define direction and complete complex/unknown problems

## EXP Initial Model

- Base EXP: 100
- Minimum EXP: 20
- Maximum EXP: 250
- Initial required experience count for level progression: 10

Difficulty correction:

- Lv1: -20
- Lv2: -10
- Lv3: 0
- Lv4: +30
- Lv5: +60

Autonomy correction:

- Lv1: -30
- Lv2: -10
- Lv3: 0
- Lv4: +30
- Lv5: +50

Feedback penalty initial values:

- `nit`: 0
- `question`: 0
- `suggestion`: 0
- `required_fix`: -5
- `design_issue`: -10

## Capability Promotion

The Product Source of Truth defines the approval boundary:

- Lv1 → Lv2: automatic after configured conditions are satisfied
- Lv2 → Lv3: automatic after configured conditions are satisfied
- Lv3 → Lv4: Human approval required
- Lv4 → Lv5: Human approval required

Approver is a Manager or a member holding a higher Level in the same Capability; when no Lv5 holder exists, Manager approval may be used.

Per-Level `required_exp` and `required_experience_count` are configuration persisted in the database and editable by an authorized Human. The initial `required_experience_count` is 10.

### Human decision still required

The current Product Source of Truth marks Level EXP thresholds as reviewed but does not contain the actual numeric `required_exp` values or enough detail to determine whether EXP/Experience counters reset at promotion or remain cumulative. Those semantics materially change Capability Level and recommendation results, so implementation must not invent them. The promotion engine remains blocked until those values and counter semantics are explicitly decided.

## Feedback Evidence Rule

If a reviewer points out an issue and it is fixed inside the same PR, that corrected behavior is not counted as new Experience for the author.

The review comment is stored as `Feedback Evidence`. If a later independent PR demonstrates the same concern autonomously, that later PR can contribute Experience.

## AI Classification

Semantic classification may produce:

- Capability allocation
- allocation ratio totaling 100%
- EXP allocation
- Difficulty
- Autonomy
- Reason
- Confidence

AI outputs are not immutable truth. Human correction must preserve:

- original AI value
- corrected value
- actor
- corrected timestamp
- correction reason

## Value Provenance

At minimum, the data model must distinguish:

- observed value
- AI-calculated value
- self-reported value
- Human override value

The effective value must remain traceable to its provenance.
