# Verification: Habit categories with filter

Branch: stufe/08-verify-browser @ 1cbcdbb  ·  Verdict: Pass

## Acceptance criteria
| AC | Code + test | Browser | Result |
| --- | --- | --- | --- |
| AC1 select in create and edit, default Other, survives reload | `HabitForm.vue:41,54,221`, `new.vue`, `[id].vue`, `stores/habits.ts:62,84`; `habit-form.test.ts` "defaults to other, preselects …", `categories.test.ts` U7 and "exposes four form options", e2e E1, E2/E5 | walk 2: Other preselected, created as Learning, edited to Health, both survive a reload | met |
| AC2 badge on list and Today cards | `habits/index.vue:200`, `index.vue:599,695`; e2e E1 (list), E4 (Today) | walk 2, 4, 5: badges on list and Today cards, also at 390 px | met |
| AC3 list filter in `?category=`, reload, shared link, reset, unknown value, page 1 | `use-category-filter.ts`, `habits/index.vue:30,61`; `categories.test.ts` `parseCategoryFilter`, `filterByCategory`; e2e E3 (URL, reload, reset, `?category=work`, `?category=bogus`), E3b (page 1) | walk 3: `?category=learning`, reload, reset, `?category=work`, `?category=bogus` | met |
| AC4 Today filter scopes lists and counter, strip and paused alert unfiltered | `index.vue:136` (filtered `dueHabitModels`), `:122` and `:165` unfiltered; e2e E4 (`0 of 2 reviewed`, `4 habits`, `1 habit is paused today` under Health and Work, filter kept after reload) | walk 4: `0 of 2 reviewed`, strip still "8 habits", filter kept after reload | met |
| AC5 empty states name the category and reset | `habits/index.vue:145`, `index.vue:549` and `:659` (Open tab counts open habits in other categories); e2e E3 ("No habits in Other"), E4 ("No open habits in Health", "1 open habit is in other categories.", no "Everything due today …", "No due habits in Work", both resets) | walk 3 and 4: "No habits in Other", "No open habits in Learning" + "6 open habits are in other categories.", "No due habits in Other", resets work | met |
| AC6 old data, V1, unknown values, habits-only import | `storage-schema.ts:68,72,114,211`; `categories.test.ts` U1 (status `ok`, no quarantine), U2, U3, U4, U5, U5b, U6, U13 | n/a (unit) | met |
| AC7 cross-tab merge, demo data, AI prompts | `merge-app-data.ts:82`, `demo-data-generator.ts`, `ai-prompts.ts:31,55,78,110`; `categories.test.ts` U10, U11, U12 | demo data shows Health, Learning and Work | met |
| AC8 ADR-0026, tests for assignment, URL filter and reload | `docs/adr/0026-habit-category-additive-defaulted-field.md`, index in `docs/adr/README.md`; tests above | n/a | met |

All Must requirements are covered by AC1 to AC7. The Should items are in: page reset
(E3b) and `habitsByCategory` (U8).

Scope creep: none in behavior. `categories.ts` exports `categoryLabel`, which nothing uses
yet. Outside the feature the diff carries the course material (`.claude/skills/`,
`AGENTS.md`, `KURS.md`, `specs/`).

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green | 3 s |
| `npm run typecheck` | green | 5 s |
| `npm test` | green, 452 tests in 50 files | 8 s |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | green, 117 passed, 1 skipped (mobile-only bottom-nav test in the desktop project); `categories.spec.ts` 5 tests x 2 projects | 45 s |

## Review findings
The `reviewer` subagent got only the spec path and the branch and reviewed
`git diff main...HEAD` (2.5 min). I checked every finding in the code; all of them hold.

### Blocking
None.

### Non-blocking
- `docs/adr/0026-habit-category-additive-defaulted-field.md:34` calls a rollback "safe".
  An older build or a stale PWA tab strips `category` on load and its next save writes
  the habits without it, so all categories fall back to Other. The ADR should name that
  data loss.
- `app/pages/app/habits/index.vue:29-31`: with the filter on `all`, `filterByCategory`
  returns its input, so `.sort()` sorts the cached `visibleHabits` array in place.
  Harmless today (nothing else reads it), but a side effect inside a computed.
- `e2e/specs/categories.spec.ts:48`: E2 opens the legacy path `/habits/<id>`, which the
  auth middleware maps to `/app/habits/<id>`. The list's own Edit button uses the same
  path, so it mirrors the app, but E2 also depends on that mapping.
- `e2e/specs/categories.spec.ts:57`: E2 waits a fixed 1.5 s for the debounced save before
  the reload; E4 polls the persisted store instead. The fixed wait can flake on slow CI.
- `app/utils/domain/categories.ts:34`: `categoryLabel` is exported but unused.
- AC1 reload is proven for an edited habit (E2), not for a newly created one (E1).

## Browser walk
`PORT=3110 npm run dev`, `playwright-cli` in a fresh profile, 1280x800. Gates ran before
the dev server started; browser and server were stopped afterwards.

1. `/login` → "Continue with demo login" → Settings → "Load demo data" (7 habits:
   Health, Learning, Work).
2. AC1: Habits → "Create habit". Category shows **Other**; options Health, Learning,
   Work, Other. Pick Learning, name "Study Spanish", identity, "Create habit". Card badge
   **Learning**. Reload: still Learning. "Edit": Learning preselected; pick Health, "Save
   changes", reload: badge **Health**.
3. AC3/AC5 list: "Filter by category" → Learning. URL `/app/habits?category=learning`,
   cards "Evening journal", "Read 20 pages". Reload: same two cards, select still says
   Learning. Pick Other: "No habits in Other" with "Show all categories"; click it: URL
   `/app/habits`, 6 cards and "Page 2". Open page 2, pick Health: page 1 with all 5 Health
   habits. Open `?category=work`: only "No social media before 18:00". Open
   `?category=bogus`: all habits, select says "All categories".
4. AC4/AC5 Today: `/app` shows "0 of 8 reviewed", strip "8 habits". Pick Learning: URL
   `?category=learning`, "0 of 2 reviewed", two cards with badge Learning, strip still
   "8 habits". "Done" on both: "2 of 2 reviewed", Open tab says **"No open habits in
   Learning"** and "6 open habits are in other categories." (no "Everything due today …").
   Reload: filter and text unchanged. "Show all categories": URL `/app`, "2 of 8
   reviewed", six open cards. Pick Other: "No due habits in Other", the normal "No habits
   due today" state does not show.
5. 390x844: Today with `?category=health` and Habits with `?category=health`; badges
   visible under the identity line, bottom nav present, `scrollWidth` 390 = viewport, no
   horizontal scroll. 1280x800: no horizontal scroll either.
6. Console: 0 errors. 16 warnings, all `[Vue Router warn] No match found for location
   with path "/habits/<id>"` from the existing Edit links (legacy path, mapped by the auth
   middleware; on `main` already).

Observation, non-blocking: with a filter that matches no due habit the counter reads
"0 of 0 reviewed". It does not claim anything is done, but it adds no information.

## Not verified
- The paused alert under a filter was not walked in the browser (demo data has no pause
  today); e2e E4 covers it.
- AC6 "without a recovery banner" is proven by the parse status `ok` (U1, U2), not in the UI.
