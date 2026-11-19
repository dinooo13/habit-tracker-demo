---
name: quick
description: Run the whole flow for a small task or ticket in one session. Short
  interview, short spec via /spec, stop for human approval, then /code and /verify
  each in a fresh subagent. Use when the user types /quick.
argument-hint: "[issue-number | task description]"
disable-model-invocation: true
---

# Quick

Take this task through spec, code and verify: **$ARGUMENTS**

You orchestrate. You write no production code yourself.

## 1. Interview
- Ask at most three short questions about scope, acceptance and edge cases.
- If the argument is an issue number, read it first (`gh issue view <n>`).

## 2. Short spec
- Run `/spec` with the task and the answers. Ask for a short spec:
  few acceptance criteria, at most five tasks.

## 3. Stop for approval
- Show the spec path and a five-line summary. Then **stop and wait**.
- Only the human approves. When they do, set the header to
  `Status: approved  ·  Approved-by: <name>, <YYYY-MM-DD>` and commit only the
  spec: `docs(spec): approve <slug>`. Never approve on your own.

## 4. Code in a fresh subagent
- Start one new subagent (Agent tool) with only this prompt:
  `Run /code specs/<slug>.md and report branch, commits and gate results.`
- Do not pass this conversation. The spec is the context.

## 5. Verify in a fresh subagent
- Start another new subagent with only:
  `Run /verify specs/<slug>.md and report the verdict and the report path.`

## 6. Report
- Overall verdict (Pass or Issues found), branch, commits, report path,
  open findings. Do not push, open a PR or merge.
