# Human Review Feedback Skill

Human review feedback is not treated as a one-off patch request. When feedback describes a reusable quality rule, apply it at three levels: the commented code, analogous code in active PRs, and repository guidance.

Durable TypeScript conventions are defined in `docs/rules/typescript.md`. This skill describes how Human feedback is investigated and propagated; it does not duplicate the canonical TypeScript rule set.

## Workflow

1. Read the concrete review comment and identify the underlying invariant.
2. Check the invariant against architecture, security, database, product, migration, and other governing repository rules, and verify that the concrete issue is still applicable to the current head.
3. If the investigation confirms an applicable issue, apply the smallest local fix to the commented PR. If the feedback is already satisfied, stale, or factually inapplicable, do not make an unnecessary local code change; record the evidence, then continue the remaining workflow for any still-valid reusable invariant.
4. Search active implementation PRs for the same pattern when the underlying invariant remains valid. Treat each applicable PR as a separate lane: switch to that PR's own isolated worktree/task/branch and create a separate commit there. Never modify another PR from the current PR checkout. If an isolated lane is unavailable or the occurrence depends on an unresolved prerequisite, record the occurrence and leave that PR unchanged until it is safe to address.
5. Add or update the canonical repository rule when the invariant should affect future work. For TypeScript conventions, update `docs/rules/typescript.md` rather than maintaining a second normative copy in this skill.
6. Keep exceptions explicit when a general rule conflicts with any governing repository constraint.
7. If the feedback requires shared configuration, create a prerequisite issue/PR instead of duplicating that configuration across active feature branches.

## Review completion

A Human review thread is complete when one of the following is verified and recorded:

- the concrete issue is fixed;
- investigation shows the requested behavior is already satisfied or the feedback is factually inapplicable to the current head, with the evidence recorded in the thread; or
- a documented governing repository constraint explains why the exact requested mechanism is unsafe.

Governing constraints include architecture, product, security, database, migration, privacy, permissions, and quality gates. When a governing constraint prevents the requested mechanism, preserve the reviewer's intent with the safest compatible implementation where possible and record the reason in the thread. Never make an unnecessary code change merely to close stale or factually invalid feedback, and never weaken or bypass a governing constraint merely to close a review thread.
