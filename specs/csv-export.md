# CSV export of check-ins

Issue: #3  ·  Status: approved

## Context
Users want to analyse their own history in a spreadsheet. Next to the JSON backup, the
settings page gets a read-only export of all check-ins as a CSV file. It changes no data.

## Research
| File | Why it matters |
| --- | --- |
| `app/pages/app/settings.vue` | "Backup and restore" card with "Export JSON"; inline Blob/anchor download; security log and toasts at the call site. |
| `app/utils/persistence/backup.ts` | Pure, framework-free `serializeBackup` / `backupFilename`; the CSV serializer sits next to it. |
| `app/types/app-data.ts` | `HabitEntry` (`date`, `status`, `completedAt`, `missReasonCode`, `missReasonNote`), `Habit.name`. |
| `app/utils/domain/atomic-rules.ts` | `MISS_REASON_LABELS` for readable reasons. |
| `app/utils/domain/date.ts` | `todayDateKey()` for the file name. |
| `app/stores/entries.ts`, `app/stores/habits.ts` | Source of the data (`entries`, `habits`). |
| `tests/backup.test.ts`, `e2e/specs/settings.spec.ts`, `e2e/support/pages/settings.ts` | Unit and download test patterns (`page.waitForEvent('download')`). |

ADRs: ADR-0014 (pure helpers in `app/utils/persistence/` next to the backup serializer,
explicit imports), ADR-0012 (pure logic in the Node `unit` project). No data change, no new ADR.

Decisions (made by the author, no open questions left):
1. Columns: `date,habit,status,reason,note,completed_at`. `reason` is the readable label
   (e.g. "I had no time"), `status` the stored value (`done`, `missed`, `skipped`).
2. Rows sorted by date, then habit name. Archived habits stay in; an entry whose habit is
   gone gets `Unknown habit`.
3. RFC 4180: comma separator, CRLF line ends, fields with comma, quote, CR or LF are quoted
   and inner quotes doubled. A UTF-8 BOM makes Excel read umlauts correctly.
4. Cells that start with `=`, `+`, `-`, `@`, tab or CR get a leading `'`, so a spreadsheet
   does not run them as a formula (CSV injection).
5. Without check-ins the button is disabled and a hint explains why. No empty file.
6. Button text in English like the rest of the UI: "Export check-ins (CSV)". File name
   `habit-checkins-<YYYY-MM-DD>.csv`. The export is logged as `data.export`; it does not
   count as a backup for the backup reminder.

## Requirements
### Must
- Button in Settings → Backup and restore that downloads `habit-checkins-<date>.csv`.
- One row per check-in with date, habit name, status, reason and note.
- Correct escaping and readable umlauts in Excel and Numbers.
- Disabled button with a hint when there are no check-ins.
### Should
- `completed_at` column for done check-ins.
- Protection against formula injection.
### Won't (this time)
- Filters (date range, habit), other formats, export of coaching suggestions.

## Non-goals
No change to the JSON backup, the import, the data schema or the stores.

## Tasks
1. `serializeCheckinsCsv(habits, entries)` and `checkinsCsvFilename(dateKey)` in
   `app/utils/persistence/checkins-csv.ts`, tests in `tests/checkins-csv.test.ts`.
2. Button, disabled state and hint in `app/pages/app/settings.vue`; page object method in
   `e2e/support/pages/settings.ts`.
3. E2E `e2e/specs/csv-export.spec.ts`: download name and content, escaping, empty state.

## Acceptance criteria
- [x] AC1: Settings has a button that downloads `habit-checkins-<date>.csv`.
- [x] AC2: Each row has date, habit name, status (done, missed, skipped) and, if present, reason and note.
- [x] AC3: Values with commas, quotes or line breaks are escaped; the file starts with a UTF-8 BOM so umlauts show correctly.
- [x] AC4: Without check-ins the button is disabled and a hint is shown.
- [x] AC5: CSV generation has unit tests, the download an e2e test.

## Verification plan
| AC | How we prove it | Type (unit / e2e / browser) |
| --- | --- | --- |
| AC1 | Download event, file name pattern | e2e, browser |
| AC2 | Header and rows for done / missed with reason and note / skipped | unit, e2e |
| AC3 | Commas, quotes, line breaks, umlauts, BOM, formula prefix | unit, e2e |
| AC4 | No entries → disabled button and hint | e2e, browser |
| AC5 | `tests/checkins-csv.test.ts`, `e2e/specs/csv-export.spec.ts` | unit, e2e |

Gates: `npm run lint`, `npm run typecheck`, `npm test`, `PORT=3110 E2E_PORT=3110 npm run test:e2e`.

Browser walk: `/login` → Settings with no data: the CSV button is disabled and the hint
shows. "Load demo data", reload: the button is enabled; click it, the file
`habit-checkins-<today>.csv` downloads; open it and check header, a missed row with reason
and note. Check at 1280x800 and 390x844.
