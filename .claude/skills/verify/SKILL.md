---
name: verify
description: Verify an implementation against its spec. Checks every acceptance criterion, runs the gates, gets a review from a fresh reviewer subagent, walks the criteria in a real browser with playwright-cli and writes a verification report.
argument-hint: "[specs/<slug>.md]"
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

## Fresh review

Start the **reviewer** subagent (`.claude/agents/reviewer.md`) with the Agent tool. It
begins with an empty context, so the review is not anchored on your own view. Give it
only the spec path and the branch, not your conclusions. It reviews
`git diff main...HEAD` and returns findings with file, line and severity. Check each
finding yourself in the code before you put it in the report, and drop the ones that
do not hold.

## Browser walk

Walk each user-facing acceptance criterion in a real browser, like a user would. Use
the browser walk from the spec's verification plan.

1. Start the app in the background: `PORT=3110 npm run dev`, and wait until
   `curl -sf http://localhost:3110/login` answers. Never use port 3000.
2. Drive it with `playwright-cli`: `playwright-cli open http://localhost:3110/login`,
   then `snapshot` for element refs, `click <ref>`, `fill <ref> <text>`,
   `goto <url>`, `reload`, `resize <w> <h>` and `console error`.
3. Log in with the demo login. Load demo data or create the habits a criterion needs.
4. For every criterion: do the steps, check the result in the snapshot, then `reload`
   and check again. Check the console for errors.
5. Look at the affected screens at 1280x800 and at 390x844 (mobile bottom nav).
6. Note every step and what you saw. The report lists them.
7. `playwright-cli close` and stop the dev server when you are done. A dev server left
   running on 3110 would be reused by the next `test:e2e` run instead of the build.

If `playwright-cli` is missing or no browser starts, say so in the report. Never mark a
criterion as verified in the browser when you only read the code.

## Report

Write `specs/<slug>.verification.md` and show it to the user:

```markdown
# Verification: <Title>

Branch: <branch> @ <sha>  ·  Verdict: Pass | Issues found

## Acceptance criteria
| AC | Code + test | Browser | Result |

## Gates
| Gate | Result | Duration |

## Review findings
### Blocking
### Non-blocking

## Browser walk
Numbered steps per criterion: what you clicked and what you saw, including the reload.

## Not verified
What you could not check, and why.

## Fix list
- [ ] F1 (AC3 not met) <what is missing>
- [ ] F2 (Gate) `npm run typecheck` red: <first error>
- [ ] F3 (Review) <blocking finding, file:line>
- [ ] F4 (Browser AC2) <step and what you saw>
```

The fix list holds every criterion that is `not met` or `partly met`, every red gate,
every blocking review finding and every failure in the browser walk, each with its
source in brackets. Non-blocking findings
stay in the report only. If nothing is open, write `none`. A human adds findings the
same way, e.g. `- [ ] F5 (Review human) <comment>`.

The verdict is **Pass** only when
- every gate is green,
- every acceptance criterion is `met`,
- no blocking review finding is open,
- every user-facing criterion passed in the browser.

Commit only the report: `docs(spec): add verification report for <slug>`.
