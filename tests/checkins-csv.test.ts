import { describe, expect, it } from 'vitest'
import type { Habit, HabitEntry } from '~/types/app-data'
import { checkinsCsvFilename, CHECKINS_CSV_HEADER, serializeCheckinsCsv } from '~/utils/persistence/checkins-csv'

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Morning run',
    type: 'build',
    identityStatement: 'I am a runner.',
    scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: null,
    startDate: '2026-01-01',
    archived: false,
    pauses: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildEntry(overrides: Partial<HabitEntry> = {}): HabitEntry {
  return {
    id: 'entry_1',
    habitId: 'habit_1',
    date: '2026-02-08',
    status: 'done',
    completedAt: '2026-02-08T10:00:00.000Z',
    missReasonCode: null,
    missReasonNote: null,
    ...overrides,
  }
}

/** Strip the BOM and split into lines. */
function lines(csv: string): string[] {
  return csv.replace(/^\uFEFF/, '').split('\r\n')
}

describe('serializeCheckinsCsv (#3)', () => {
  it('starts with a UTF-8 BOM and the header row, and ends with CRLF', () => {
    const csv = serializeCheckinsCsv([buildHabit()], [buildEntry()])

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(lines(csv)[0]).toBe(CHECKINS_CSV_HEADER.join(','))
    expect(lines(csv)[0]).toBe('date,habit,status,reason,note,completed_at')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('writes one row per check-in with status, readable reason and note', () => {
    const csv = serializeCheckinsCsv(
      [buildHabit()],
      [
        buildEntry({ id: 'e1', date: '2026-02-08', status: 'done' }),
        buildEntry({ id: 'e2', date: '2026-02-09', status: 'missed', completedAt: null, missReasonCode: 'no_time', missReasonNote: 'Late meeting' }),
        buildEntry({ id: 'e3', date: '2026-02-10', status: 'skipped', completedAt: null }),
      ],
    )

    expect(lines(csv).slice(1, 4)).toEqual([
      '2026-02-08,Morning run,done,,,2026-02-08T10:00:00.000Z',
      '2026-02-09,Morning run,missed,I had no time,Late meeting,',
      '2026-02-10,Morning run,skipped,,,',
    ])
  })

  it('sorts by date, then habit name, and keeps archived and unknown habits', () => {
    const habits = [buildHabit({ id: 'b', name: 'Bike' }), buildHabit({ id: 'a', name: 'Archery', archived: true })]
    const entries = [
      buildEntry({ id: 'e1', habitId: 'b', date: '2026-02-09', completedAt: null }),
      buildEntry({ id: 'e2', habitId: 'b', date: '2026-02-08', completedAt: null }),
      buildEntry({ id: 'e3', habitId: 'a', date: '2026-02-08', completedAt: null }),
      buildEntry({ id: 'e4', habitId: 'gone', date: '2026-02-07', completedAt: null }),
    ]

    expect(lines(serializeCheckinsCsv(habits, entries)).slice(1, 5).map(line => line.split(',').slice(0, 2).join(','))).toEqual([
      '2026-02-07,Unknown habit',
      '2026-02-08,Archery',
      '2026-02-08,Bike',
      '2026-02-09,Bike',
    ])
  })

  it('quotes values with commas, quotes and line breaks and keeps umlauts', () => {
    const csv = serializeCheckinsCsv(
      [buildHabit({ name: 'Read, then "reflect"' })],
      [buildEntry({ status: 'missed', completedAt: null, missReasonCode: 'other', missReasonNote: 'Zu müde\r\nnächstes Mal früher' })],
    )

    expect(csv.replace(/^\uFEFF/, '')).toContain(
      '2026-02-08,"Read, then ""reflect""",missed,Other,"Zu müde\r\nnächstes Mal früher",\r\n',
    )
  })

  it('neutralizes cells that a spreadsheet would run as a formula', () => {
    const csv = serializeCheckinsCsv(
      [buildHabit({ name: '=HYPERLINK("http://x","y")' })],
      [buildEntry({ status: 'missed', completedAt: null, missReasonCode: 'other', missReasonNote: '+1 more rep' })],
    )
    const row = lines(csv)[1]!

    expect(row).toContain('"\'=HYPERLINK(""http://x"",""y"")"')
    expect(row).toContain(',\'+1 more rep,')
  })

  it.each([
    ['-2 reps', '\'-2 reps'],
    ['@SUM(A1)', '\'@SUM(A1)'],
    ['\tTabbed', '\'\tTabbed'],
    ['@a,b', '"\'@a,b"'],
  ])('prefixes formula-like note %j', (note, cell) => {
    const csv = serializeCheckinsCsv(
      [buildHabit()],
      [buildEntry({ status: 'missed', completedAt: null, missReasonCode: 'forgot', missReasonNote: note })],
    )

    expect(lines(csv)[1]).toBe(`2026-02-08,Morning run,missed,I forgot,${cell},`)
  })

  it('returns only the header for no check-ins', () => {
    expect(lines(serializeCheckinsCsv([], []))).toEqual(['date,habit,status,reason,note,completed_at', ''])
  })
})

describe('checkinsCsvFilename (#3)', () => {
  it('names the file after the date', () => {
    expect(checkinsCsvFilename('2026-11-17')).toBe('habit-checkins-2026-11-17.csv')
  })
})
