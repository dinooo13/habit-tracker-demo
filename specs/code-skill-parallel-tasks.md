# Parallel task delegation in the Code Skill

Issue: none  ·  Status: approved  ·  Approved-by: Philip Rekers, 2026-11-19

## Context

The Code Skill implements every task in specification order, even when two tasks can be completed and tested independently. Parallel delegation lets course participants run independent tasks concurrently while retaining the existing test-first workflow and reviewable task commits.

## Research

| File | Why it matters |
| --- | --- |
| `.claude/skills/code/SKILL.md:23`, `.agents/skills/code/SKILL.md:30` | The skill requires a clean baseline, sequential tasks, visible Red evidence before implementation, one commit per task, and final gates. `AGENTS.md:28` requires byte-identical copies. |
| Task 4 in `specs/kategorien.md:72` | Adds category selection to the create/edit form and badges to `app/pages/app/habits/index.vue`. |
| Task 5 in `specs/kategorien.md:75` | Adds the category filter to the same Habits list page. |
| Task 6 in `specs/kategorien.md:77` | Adds the Today category filter and updates its counters. |
| `e2e/specs/categories.spec.ts:24` | Tasks 4, 5 and 6 also share this browser test file. |
| `vitest.config.ts:5`, `docs/TESTING.md:28`, `playwright.config.ts:65` | Nuxt checks generate local output. Local Playwright can reuse a running server, and worktrees still share host ports. |

ADR-0012 defines the `unit` and `nuxt` Vitest projects. The new workflow uses the existing projects and commands. This is a change to the course's implementation instructions and requires no app architecture ADR.

Clarification decisions: delegate automatically when independence is clear, use a separate Git worktree for each writing subagent, and continue sequentially when safe parallel execution is unavailable. Codex is the target platform. The `.claude` copy stays in the repo for the exercises.

## Requirements

### Must

- Keep spec approval and baseline checks before dispatch. Review the unfinished tasks against the actual files and contracts. Run tasks concurrently when at least two are ready, have disjoint write sets including tests and fixtures, and can pass their own checks against the same integrated baseline. Honor explicit ordering constraints and wait for prerequisite commits before dispatch. Integrate independent results in spec order within each batch.
- Use the available Codex subagent tools. Assign each worker a task, acceptance criteria, relevant contracts, exclusive file paths, test commands, and its own worktree. Give each worktree separate generated outputs. Serialize checks that need the same host resource, including E2E on port 3110, and verify that the server serves the checkout being tested.
- Preserve Red → Green → Refactor per task. The worker returns the failing command and assertion, or the existing `No test: <reason>` for work without testable behavior. The coordinator surfaces Red evidence before releasing the worker to edit production code. The worker returns its diff, test results, and blockers.
- The coordinator reviews changes against the task and owned files, integrates and verifies each result, records one Conventional Commit per task with the existing `Red:` body line, and updates the spec checklist only after the task is integrated. It runs the existing gates on the integrated branch and reports delegated tasks, fallbacks, and gate results.
- Run the relevant tasks sequentially when their dependencies or file ownership overlap, available workers cannot be isolated, or tooling cannot support the required handoff. If a worker is blocked or discovers overlap, stop its writes, preserve its work, and resolve the dependency before retrying or taking over. Require the same evidence and checks before marking the task done.

### Should

- Keep dispatch instructions in the shared skill and use its existing TDD cycle and gate definitions. Remove temporary worktrees created by the run after their changes are integrated and their contents are clean.

### Won't (this time)

- Nested delegation, new required spec metadata, or a separate orchestration script.

## Non-goals

App behavior, UI, persisted data, backups, test framework configuration, and publication remain outside this change.

## Tasks

1. [x] Define the independent-task and overlap scenarios below against the current `.claude/skills/code/SKILL.md`. Record which expectations its strictly sequential workflow fails, then add dispatch criteria, worktree ownership, Red handoff, and sequential recovery to that skill. Check coordination and final gates in the same scenarios.
2. [x] Mirror the revised skill to `.agents/skills/code/SKILL.md`. Check byte equality, validate both skill folders, and run the workflow scenarios in disposable local fixtures with the available subagent tools.

## Acceptance criteria

- [x] AC1: Two ready tasks with disjoint writes start concurrently in separate worktrees. A task with an unfinished prerequisite or overlapping files stays queued.
- [x] AC2: A worker's failing command and assertion reach the user before its production edit. The coordinator verifies each integrated result, creates one commit per task, and updates the checklist after integration.
- [x] AC3: When subagents or worktree isolation are unavailable, the run proceeds sequentially. A blocked or overlapping worker leaves its work available for review and its task unchecked until integration succeeds.
- [x] AC4: The coordinator records integrated gate results, with required E2E targeting the integrated checkout on 3110. Both skill copies are byte-identical and pass skill validation.

## Verification plan

| AC | How we prove it | Type (unit / e2e / browser) |
| --- | --- | --- |
| AC1 | Use a disposable approved spec with two independent tasks and a third dependent task. Inspect assignment order, active worktree paths and diffs. Walk through the overlapping Habits page and shared E2E file in `specs/kategorien.md` as a counterexample. | Skill workflow |
| AC2 | Follow worker and coordinator output on the disposable spec. Compare the Red output with the first production edit. Inspect the integrated diff, commit messages, and checklist. | Skill workflow |
| AC3 | Run the scenario with worker isolation unavailable and exercise a worker handoff that reports a conflicting file. Check task status and whether work remains recoverable. | Skill workflow |
| AC4 | Inspect where gates ran and how the checkout serving port 3110 was verified. Run `quick_validate.py` on both skill folders and compare SHA-256 hashes. | Repository checks |

Gates: `npm run lint`, `npm run typecheck`, `npm test`, `PORT=3110 E2E_PORT=3110 npm run test:e2e`.

Verification on Node 22 passed lint, typecheck, 452 Vitest tests, and 117 Playwright tests against a fresh server on port 3110. The mobile-only Playwright test was skipped in the desktop project. In the disposable fixture, two Codex subagents reported Red before Green in separate worktrees. The coordinator integrated one commit per task before running the dependent task. A blocked worker preserved its test draft, and a failed worktree setup triggered sequential execution.

`quick_validate.py` passes directly on both byte-identical skill copies. Codex discovers its copy under `.agents/skills/` and can select it automatically for approved-spec implementation requests. An explicit `$code` invocation is also available.

Browser walk: the skill has no browser-facing behavior. Browser verification applies to UI tasks delegated by the skill.
