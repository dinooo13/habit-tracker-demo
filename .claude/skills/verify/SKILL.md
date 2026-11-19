---
name: verify
description: Verify an implementation against its spec. Checks every acceptance criterion, runs the gates and writes a verification report.
argument-hint: "[specs/<slug>.md]"
disable-model-invocation: true
---

# Verify

Verify the implementation of: **$ARGUMENTS**

You check, you do not build. Do not fix anything in this skill. Findings go to the
report, and fixes go back to `/code` through the fix list.

## Load

- Read the spec (if the argument is empty, use the spec in `specs/` that matches the
  current branch, or ask).
- Collect the diff: `git diff main...HEAD --stat` and `git log main..HEAD --oneline`.

## Spec against implementation

For **every** acceptance criterion and every Must requirement, find the code and the
test that prove it. Record per criterion: `met`, `partly met`, or `not met`, with the
file and the test name as evidence. A criterion without a test is at most `partly met`.
Also flag scope creep: changes the spec did not ask for.

## Gates

Run them and record the result, the test counts and the duration of each:

```bash
npm run lint
npm run typecheck
npm test
PORT=3110 E2E_PORT=3110 npm run test:e2e
```

The e2e run builds the app, serves it and drives it with Playwright. Never use port
3000 (the Playwright default). `PORT` is the port the app listens on, `E2E_PORT` the
one Playwright waits for, so set both to the same free port. If 3110 is taken, pick
another free port. A dev server already running on that port would be reused instead
of the build, so stop it first.

A red gate is a blocking finding. Never rerun a failing test until it passes by luck;
report it.

## Report

Write `specs/<slug>.verification.md` and show it to the user:

```markdown
# Verification: <Title>

Branch: <branch> @ <sha>  ·  Verdict: Pass | Issues found

## Acceptance criteria
| AC | Code + test | Result |

## Gates
| Gate | Result | Duration |

## Not verified
What you could not check, and why.

## Fix list
- [ ] F1 (AC3 not met) <what is missing>
- [ ] F2 (Gate) `npm run typecheck` red: <first error>
```

The fix list holds every criterion that is `not met` or `partly met`, every red gate
and every blocking finding, each with its source in brackets. Non-blocking findings
stay in the report only. If nothing is open, write `none`. A human adds findings the
same way, e.g. `- [ ] F5 (Review human) <comment>`.

The verdict is **Pass** only when
- every gate is green,
- every acceptance criterion is `met`.

Commit only the report: `docs(spec): add verification report for <slug>`.
