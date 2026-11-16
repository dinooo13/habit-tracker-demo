# Verification: CSV export of check-ins

Branch: kurs/csv-export @ 4615071  ·  Verdict: Pass

## Acceptance criteria
| AC | Code + test | Browser | Result |
| --- | --- | --- | --- |
| AC1 button downloads `habit-checkins-<date>.csv` | `exportCheckinsCsv` in `app/pages/app/settings.vue`, `checkinsCsvFilename`; `e2e/specs/csv-export.spec.ts` | Demo data: `habit-checkins-2026-11-16.csv`, 61 KB, 918 rows | met |
| AC2 date, habit, status, reason, note per row | `serializeCheckinsCsv` in `app/utils/persistence/checkins-csv.ts`; `tests/checkins-csv.test.ts` | File: 747 done, 140 missed, 31 skipped; missed rows carry reason label and note | met |
| AC3 escaping and umlauts | RFC 4180 quoting, CRLF, UTF-8 BOM, formula prefix; unit tests and the e2e byte check | File starts with `EF BB BF`; notes with commas are quoted | met |
| AC4 no check-ins: disabled button and hint | `hasCheckins` in `settings.vue`; e2e "is disabled with a hint" | After "Delete all data" and after reload: disabled, hint shown | met |
| AC5 unit and e2e tests | `tests/checkins-csv.test.ts` (11), `e2e/specs/csv-export.spec.ts` (2 x 2 projects) | n/a | met |

No scope creep: one pure module, one button with hint on the settings page, one page-object
method, and tests. JSON backup, import and data schema are unchanged.

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green | 3 s |
| `npm run typecheck` | green | 6 s |
| `npm test` | green, 459 tests | 8 s |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | green, 115 passed, 1 skipped (mobile-only PWA test on desktop) | 43 s |

## Review findings
A fresh subagent reviewed the diff against the spec. Fixed in 4615071: the formula prefix was
only tested for `=` and `+`.

### Blocking
None.

### Non-blocking
- Excel with a German locale splits on `;`, so a double-clicked comma CSV lands in one column
  there. Numbers, LibreOffice and English Excel are fine; the import wizard works everywhere.
  Changing the separator is a spec decision, not a bug.
- Rows on the same date are sorted with `localeCompare` without a fixed locale, so the order of
  names with umlauts can differ between machines.
- Auto-filled `missed` entries count as check-ins, so the button is enabled even if the user
  never checked in by hand; the export then lists those missed days.
- No e2e case for archived or deleted habits; the unit tests cover both.

## Not verified
- Opening the file in Excel and Numbers by hand (no Office on this machine); the BOM and the
  quoting are checked byte by byte instead.
- Dark mode only; light mode not checked. Desktop 1280x800 (buttons in one row) and mobile
  390x844 (buttons wrap, no horizontal scroll) checked, no console errors.
