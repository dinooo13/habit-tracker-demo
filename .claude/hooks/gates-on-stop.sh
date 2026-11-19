#!/usr/bin/env bash
# Stop hook: the general gate pattern.
#
# When Claude ends its turn, run the fast gates (npm run lint, npm test; no e2e),
# but only if files changed since the last run. Red -> {"decision": "block"}, so
# Claude keeps working and fixes the gates. Green -> no output, Claude stops.
#
# Loop guard: if stop_hook_active is true, Claude is already continuing because of
# a stop hook. Then we let it stop instead of blocking again on a gate it may not be
# able to fix. The fingerprint of the red run stays, so the end of the next turn
# runs the gates again if files changed in between.
#
# Input: the hook JSON on stdin (we read stop_hook_active and cwd).
# State: a fingerprint of the working tree in .git (per worktree, never committed).
# jq is optional; without it the script falls back to node for JSON.

set -uo pipefail

input="$(cat)"

json_get() {
  # $1 = jq path, e.g. .stop_hook_active
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null
  else
    printf '%s' "$input" | KEY="${1#.}" node -e '
      let s = ""; process.stdin.on("data", d => (s += d)).on("end", () => {
        try { const v = JSON.parse(s)?.[process.env.KEY]; if (v != null) process.stdout.write(String(v)) } catch {}
      })' 2>/dev/null
  fi
}

[ "$(json_get .stop_hook_active)" = "true" ] && exit 0

cwd="$(json_get .cwd)"
repo_root="$(git -C "${cwd:-${CLAUDE_PROJECT_DIR:-$PWD}}" rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0
[ -d node_modules ] || exit 0

# Fingerprint: HEAD, tracked changes and untracked files (not ignored ones).
fingerprint() {
  {
    git rev-parse HEAD 2>/dev/null
    git diff HEAD --binary 2>/dev/null
    git ls-files --others --exclude-standard -z 2>/dev/null \
      | while IFS= read -r -d '' f; do printf '%s ' "$f"; git hash-object -- "$f" 2>/dev/null; done
  } | git hash-object --stdin
}

state_file="$(git rev-parse --git-path claude-gates-on-stop)"
current="$(fingerprint)"
[ "$current" = "$(cat "$state_file" 2>/dev/null)" ] && exit 0
printf '%s\n' "$current" > "$state_file"

failed=""
log=""
for gate in lint test; do
  out="$(BROWSERSLIST_IGNORE_OLD_DATA=1 npm run --silent "$gate" 2>&1)"
  if [ $? -ne 0 ]; then
    failed="${failed:+$failed, }npm run $gate"
    log="$log
--- npm run $gate (last lines) ---
$(printf '%s\n' "$out" | sed 's/\x1b\[[0-9;]*m//g' | grep -v -i browserslist | grep -v '✓' | tail -n 40)"
  fi
done

[ -z "$failed" ] && exit 0

reason="Not done: the gates are red ($failed). Fix the cause, do not skip or weaken tests, then end your turn again.$log"
if command -v jq >/dev/null 2>&1; then
  jq -n --arg r "$reason" --arg m "gates-on-stop: $failed red" '{decision: "block", reason: $r, systemMessage: $m}'
else
  REASON="$reason" MSG="gates-on-stop: $failed red" node -e '
    process.stdout.write(JSON.stringify({ decision: "block", reason: process.env.REASON, systemMessage: process.env.MSG }))'
fi
exit 0
