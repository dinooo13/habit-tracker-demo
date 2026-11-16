import type { Habit, HabitEntry } from '~/types/app-data'
import { MISS_REASON_LABELS } from '~/utils/domain/atomic-rules'

/**
 * Pure CSV export of all check-ins (issue #3). Framework-free like
 * `backup.ts`, so the format is unit-testable in the Node project; the settings
 * page keeps the download side effect.
 *
 * Format: RFC 4180 with a comma separator and CRLF line ends, prefixed with a
 * UTF-8 BOM so Excel reads umlauts correctly. Cells that a spreadsheet would
 * evaluate as a formula get a leading `'` (CSV injection).
 */

export const CHECKINS_CSV_HEADER = ['date', 'habit', 'status', 'reason', 'note', 'completed_at'] as const

const UNKNOWN_HABIT = 'Unknown habit'
const BOM = '\uFEFF'
const LINE_END = '\r\n'
const FORMULA_START = /^[=+\-@\t\r]/
const NEEDS_QUOTES = /[",\r\n]/

function escapeCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * Serialize `entries` as CSV, one row per check-in, sorted by date and then by
 * habit name. Archived habits stay in; an entry whose habit no longer exists is
 * labelled "Unknown habit". Returns only the header row for no entries.
 */
export function serializeCheckinsCsv(habits: Habit[], entries: HabitEntry[]): string {
  const habitNames = new Map(habits.map(habit => [habit.id, habit.name]))

  const rows = entries
    .map(entry => ({ entry, habit: habitNames.get(entry.habitId) ?? UNKNOWN_HABIT }))
    .sort((left, right) => left.entry.date.localeCompare(right.entry.date) || left.habit.localeCompare(right.habit))
    .map(({ entry, habit }) => [
      entry.date,
      habit,
      entry.status,
      entry.missReasonCode ? MISS_REASON_LABELS[entry.missReasonCode] : '',
      entry.missReasonNote ?? '',
      entry.completedAt ?? '',
    ])

  return BOM + [[...CHECKINS_CSV_HEADER], ...rows].map(row => row.map(escapeCell).join(',') + LINE_END).join('')
}

/** The download filename for a check-in export taken on the given local date key. */
export function checkinsCsvFilename(dateKey: string): string {
  return `habit-checkins-${dateKey}.csv`
}
