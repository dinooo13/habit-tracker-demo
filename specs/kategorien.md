# Habit categories with filter

Issue: #1  ·  Status: approved  ·  Approved-by: Philip Rekers, 2026-11-18

## Context
With many habits the Habits list and the Today queue get hard to scan. Users want to
give every habit a category (health, learning, work) and filter both views by it, while
all data stays local in the browser. The filter must be shareable as a link and must not
pretend that everything is done when other categories still have open habits.

## Research
| File | Why it matters |
| --- | --- |
| `app/types/app-data.ts:63` | `Habit` and `HabitCreateInput` (`:134`) get the new field; `APP_DATA_SCHEMA_VERSION = 2` |
| `app/utils/persistence/storage-schema.ts:65` | Strict `HabitSchema`, `LenientHabitImportSchema` (`:90`, `AssertSameKeys` keeps it in sync), `migrateToV2` (`:201`) |
| `app/utils/persistence/merge-app-data.ts:73` | `habitsEqualIgnoringId` compares field by field; a missing field loses cross-tab edits |
| `app/stores/habits.ts:47` | `createHabit` / `updateHabit` (`:66`) build the stored habit |
| `app/utils/persistence/backup.ts:31` | `extractImportedHabits` (habits-only import) uses the lenient schema |
| `app/components/HabitForm.vue:35` | Form Zod schema and state; used by `pages/app/habits/new.vue` and `[id].vue` |
| `app/pages/app/habits/index.vue:23` | `filteredHabits`, archived checkbox, pagination with 6 per page |
| `app/pages/app/index.vue:124` | `dueHabitModels` feeds Open/Reviewed lists and the "x of y reviewed" counter; "No open habits" alert at `:609` |
| `app/utils/domain/demo-data-generator.ts:55` | `HABIT_DEFS` build the demo habits |
| `app/utils/domain/ai-prompts.ts:15` | Both prompts list every habit field |
| `e2e/support/data.ts:46` | `makeHabit` builder for seeded e2e data |
| `tests/*.test.ts`, `tests/nuxt/*.test.ts` | About 20 hand-written `Habit` literals must get the field |

ADRs: ADR-0006 (versioned, Zod-validated envelope) and ADR-0022 (migration registry) say a
shape change bumps `schemaVersion`. ADR-0024 (cross-tab merge) needs the field in the
equality check. Precedent for a defaulted field without a bump: `lastExportedAt` in
`SettingsSchema` (`storage-schema.ts:171`). A new ADR records the exception.

Decisions from the clarification round:
| Question | Decision |
| --- | --- |
| "Leave empty" in the issue | Fixed default category **Other** instead of `null`. One filter value, no null state. |
| Category set | Fixed: Health, Learning, Work, Other. No user-defined categories. |
| Schema version | No bump. `category` is an additive field, missing or unknown values become `other`. New ADR-0026. |
| Filter state | Only in the URL (`?category=`), not persisted. Invalid value means all. |
| Today scope | Open and Reviewed lists and the counters follow the filter; streak strip and paused alert stay unfiltered. |

## Requirements
### Must
- `Habit.category: 'health' | 'learning' | 'work' | 'other'`, default `other`.
- Category select in the create and edit form.
- Category badge on Habits list cards and Today queue cards.
- Category filter on the Habits list and the Today queue, synced to `?category=`.
- Filter-aware empty states with a "Show all categories" action.
- Old data, V1 data, old backups and imports load with `other`; `schemaVersion` stays 2.
- Cross-tab merge, demo data and AI prompts know the field.
### Should
- Changing the filter on the Habits list jumps back to page 1.
- `habitsByCategory` getter on the habits store for later features.
### Won't (this time)
- User-defined, renamed or multiple categories per habit.
- Category filter on Review and Insights.

## Non-goals
No Dexie store or index change (filtering is in memory). No `schemaVersion` 3. No change to
coaching, reminders or stats. UI texts stay English.

## Tasks
- [x] **Task 1** ADR-0026 "Habit category as an additive defaulted field", index in `docs/adr/README.md`,
  `docs/glossary.md`, `docs/architecture.md`.
- [x] **Task 2** Data model: `HABIT_CATEGORIES` and `Habit.category` in `app/types/app-data.ts`;
  `HabitCategorySchema` with `.catch('other')` in the strict and lenient schema and in
  `migrateToV2`; `habitsEqualIgnoringId`; default in `createHabit`/`updateHabit`; demo data
  categories; `makeHabit` and the test literals. Tests first: `tests/categories.test.ts`
  (old V2, unknown value, V1, lenient import, backup round trip, fixture, store, merge, demo).
- [x] **Task 3** Pure helpers in `app/utils/domain/categories.ts` (labels, icons, options,
  `parseCategoryFilter`, `filterByCategory`), `habitsByCategory` getter,
  `app/composables/use-category-filter.ts` for the URL sync. Unit tests first.
- [x] **Task 4** Form: category select in `HabitForm.vue`, payload in `new.vue` and `[id].vue`, badge
  on the cards in `app/pages/app/habits/index.vue`. Tests: `tests/nuxt/habit-form.test.ts`,
  e2e create and edit with reload.
- [x] **Task 5** Habits list: filter, filtered empty state, page reset in
  `app/pages/app/habits/index.vue`. Test: e2e list filter with deep link.
- [x] **Task 6** Today: filter, filtered counters, badges, filtered empty states (including the Open tab)
  in `app/pages/app/index.vue`. Keep E4 as a regression test for reviewing the last open
  habit in the selected category while a habit in another category is still open.
- [x] **Task 7** AI prompts: `category` in both prompts and the habit export. Unit test first.

## Acceptance criteria
- [ ] AC1: The create and edit form have a "Category" select with Health, Learning, Work and Other. A new habit defaults to Other. The choice is saved and survives a reload.
- [ ] AC2: Habit cards on the Habits list and in the Today queue show the category as a badge.
- [ ] AC3: The Habits list filters by category. The filter is in `?category=`, survives a reload and a shared link, "All categories" removes the param, an unknown value shows all habits, and a filter change jumps to page 1.
- [ ] AC4: The Today queue filters by category via `?category=`. Open and Reviewed lists and the "x of y reviewed" counter count only the filtered habits. Streak strip and paused alert stay unfiltered.
- [ ] AC5: With an active filter, empty states name the category: "No habits in <Category>" (list), "No due habits in <Category>" (Today), and "No open habits in <Category>" on the Open tab when the selected category has due habits and all of them have been reviewed. If any other category still has an open due habit, the global message "Everything due today has already been reviewed." must be absent. Each category-specific empty state offers "Show all categories". Choosing it removes `category` from the URL and shows any remaining open habits.
- [ ] AC6: Stored data and backups without `category`, V1 data, and imports with an unknown value load with `other`, without a recovery banner. `schemaVersion` stays 2. A habits-only import keeps valid categories.
- [ ] AC7: The cross-tab merge treats `category` as a habit field. Demo data has at least two categories, and both AI prompts include the field.
- [ ] AC8: ADR-0026 records the decision. Unit and e2e tests cover assignment, URL filter and reload.

## Verification plan
| AC | How we prove it | Type (unit / e2e / browser) |
| --- | --- | --- |
| AC1 | `habit-form.test.ts` (default, preselect, payload); `categories.spec.ts` E1 create, E2 edit + reload | unit, e2e, browser |
| AC2 | E1 (list badge), E4 (Today badge) | e2e, browser |
| AC3 | `categories.test.ts` (`parseCategoryFilter`, `filterByCategory`); E3 (filter, URL, reset, deep link, `bogus`) | unit, e2e, browser |
| AC4 | E4 (counters `0 of 2 reviewed`, mark done under filter) | e2e, browser |
| AC5 | E3 (list); E4 seeds two due Health habits and one due Learning habit, filters to Health, reviews both Health habits, and checks the Health empty state, the reported open habit outside the filter, and the absence of the global completion message. Reload keeps Health selected. Reset reveals the open Learning habit. E4 also checks the no-due Work state. | e2e, browser |
| AC6 | `categories.test.ts` U1 to U6, U13 | unit |
| AC7 | `categories.test.ts` U10, U11, U12 | unit |
| AC8 | ADR file and index; all gates | review |

Gates: `npm run lint`, `npm run typecheck`, `npm test`, `PORT=3110 E2E_PORT=3110 npm run test:e2e`.

Browser walk (`PORT=3110 npm run dev`, clean profile, demo login on `/login`):
1. AC1: Habits → New habit. Category shows Other; pick Learning, save. Edit the habit, pick
   Health, save. Reload: badge says Health.
2. AC2/AC3: Load demo data. Habits list: pick Learning in "Filter by category". Only
   Learning cards, URL has `?category=learning`. Reload: still filtered. Pick All
   categories: param gone. Open `/app/habits?category=bogus`: all habits.
3. AC5: On the list pick Other (no demo habit is Other): "No habits in Other", click
   "Show all categories".
4. AC4/AC5: Today: ensure Health has two open due habits and Learning has one.
   Pick Health and confirm the counter shows only those two habits. Mark both Health
   habits done. The Open tab says "No open habits in Health" and shows that one habit
   is open in another category. The global completion message is absent. Reload and
   confirm Health is still selected. Choose "Show all categories" to remove the query
   parameter and reveal the open Learning habit. The streak strip shows all habits.
5. Check the Today cards at 390x844: badge visible, no horizontal scroll.
