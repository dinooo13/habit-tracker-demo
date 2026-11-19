---
name: code
description: Implement tasks from approved specifications in specs/ using TDD. Delegate independent tasks to parallel subagents, integrate one Conventional Commit per task, and run the repository checks.
---

# Code

Use this skill when the user asks to implement an approved specification. It can
also be invoked explicitly with `$code specs/<slug>.md`.

## 1. Load the spec

- Identify the spec from the request or conversation context. If the spec is
  unclear, list `specs/*.md` and ask which one to implement.
- Read the whole spec. It is the source of truth for scope: build what it asks
  for, no more and no less.
- Check that the human approved it. If the status still says "draft" and the user
  did not approve it in this conversation, ask before you write code.
- Read the files listed under Research and the ADRs it names. Respect every
  accepted ADR. If the spec asks for a new ADR, write it as part of the tasks:
  next free number in `docs/adr/`, and add it to `docs/adr/README.md`.

## 2. Prepare the branch

- Never work on `main`. If you are on `main`, create a branch first, for example
  `feat/<slug>` (include the issue number if there is one: `feat/12-<slug>`).
- Start from a clean working tree. Run `npm test` once so you know the baseline is
  green before you change anything.

## 3. Plan task order and delegate independent work

- Review unfinished tasks against the current code, interfaces, tests, and fixtures.
  A task is ready when its prerequisites are committed on the integration branch.
  Honor explicit ordering constraints. Delegate automatically when at least two
  ready tasks have disjoint write sets and can be tested on the same baseline
  without each other's changes. Queue tasks with overlapping writes or unfinished
  prerequisites. Recheck the remaining tasks after each batch.
- Use Codex's subagent tools. Set up a separate Git worktree at the same
  integrated commit for each writing subagent. Give each
  worker its exact worktree path, task, acceptance criteria, relevant contracts,
  exclusive write paths, test commands and Red handoff instructions. Keep
  delegation at the coordinator level. Prepare each checkout for its checks and
  keep generated outputs in its worktree. Serialize checks that share host
  resources. For Playwright on port 3110, confirm the server serves the checkout
  being tested, since it can reuse an existing server.
- Start the ready workers concurrently. Each worker completes Red and returns the
  failing command and assertion, or `No test: <reason>`, then waits for the
  coordinator. Surface each Red result to the user before authorizing that task's
  Green step. Resume or reassign the worker in the same worktree for Green and
  Refactor. Ask for a complete diff including new files, test results, and any
  blockers. The coordinator handles commits on the integration branch and edits
  the spec checklist.
- Review each result against the task, owned paths, and Red evidence. Integrate
  independent results in spec order, rerun their checks on the integration branch,
  and commit each task separately. Mark it done only after its changes are
  integrated and checked. Remove only the clean temporary worktrees you created
  whose work has been integrated.
- Continue sequentially when fewer than two tasks are ready for safe delegation,
  or when tools, worktree isolation, or the Red handoff are unavailable. If a
  worker is blocked or finds new overlap, stop its writes and preserve its work.
  Resolve the blocker or dependency before resuming or taking over, and require
  the same TDD evidence and checks before marking the task done.

## 4. Work each task in a TDD cycle

Use this cycle for both direct and delegated tasks:

1. **Red.** Write or extend a test that describes the task's behavior and run it.
   It must fail for the right reason. **Hard rule: no production code for a task
   before you have seen its test fail.** Show the command and the failing
   assertion in a user-facing update before you implement. If a task has no testable
   behavior (an ADR, docs, config), say so explicitly: `No test: <reason>`. Unit tests go to `tests/` (rendered
   components under `tests/nuxt/`), user flows go to `e2e/specs/`.
2. **Green.** Write the smallest change that makes the test pass. Follow the
   surrounding patterns: `<script setup>`, Pinia stores with `hydrate`/`snapshot`,
   Zod validation for everything loaded or imported, date keys from
   `app/utils/domain/date.ts`, Nuxt UI components.
3. **Refactor.** Clean up while the tests stay green.
4. **Commit.** One small commit per task in Conventional Commits format:
   `feat(categories): add category field to habit schema`,
   `test(e2e): cover category filter after reload`, `fix: …`, `docs(adr): …`.
   The message says what and why. Add a body line `Red: <test name>` for the
   test you saw fail first (or `Red: none - <reason>`). Never commit a red state.

Update the spec's task list as you go (`- [x]`) so a new session can resume.

If a task turns out wrong or impossible, stop and tell the user. Do not change the
scope on your own. Small details the spec left open are fine to decide; note them
in the final report.

## 5. Gates

When all tasks are done, run and make green:

```bash
npm run lint
npm run typecheck
npm test
```

Run `PORT=3110 E2E_PORT=3110 npm run test:e2e` as well when you touched UI or
flows. Verify the server on port 3110 serves the integrated checkout. Never use
port 3000 (the Playwright default). Fix failures at the cause. Never weaken,
skip or delete a test to get green.

## 6. Report

Tell the user:

- the branch and the list of commits,
- which tasks are done and which decisions you made on the way,
- which tasks were delegated and where you continued sequentially,
- the gate results,
- anything open or risky.

When the verify skill is available, suggest `$verify specs/<slug>.md` as the next
step. Do not push, open a PR or merge; that happens after verification.
