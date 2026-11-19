import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHabitsStore } from '~/stores/habits'
import type { AppData, Habit } from '~/types/app-data'
import { APP_DATA_SCHEMA_VERSION, DEFAULT_SETTINGS } from '~/types/app-data'
import { buildCurrentHabitsPrompt, buildGettingStartedPrompt } from '~/utils/domain/ai-prompts'
import {
  categoryFilterOptions,
  categoryOptions,
  filterByCategory,
  parseCategoryFilter,
} from '~/utils/domain/categories'
import { generateDemoData } from '~/utils/domain/demo-data-generator'
import { extractImportedHabits, serializeBackup } from '~/utils/persistence/backup'
import { mergeAppData } from '~/utils/persistence/merge-app-data'
import { parseAppData, parseAppDataResult, parseLenientHabit } from '~/utils/persistence/storage-schema'

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: `Habit ${id}`,
    type: 'build',
    identityStatement: 'I am consistent.',
    scheduleWeekdays: [1],
    reminderTime: null,
    startDate: '2026-02-01',
    archived: false,
    pauses: [],
    category: 'other',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  }
}

function envelope(habits: unknown[], schemaVersion = 2): unknown {
  return { schemaVersion, habits, entries: [], suggestions: [], settings: { ...DEFAULT_SETTINGS } }
}

function withoutCategory(h: Habit): Omit<Habit, 'category'> {
  const { category: _category, ...rest } = h
  return rest
}

describe('category filter helpers', () => {
  it('parseCategoryFilter accepts known categories and falls back to all', () => {
    expect(parseCategoryFilter('health')).toBe('health')
    expect(parseCategoryFilter('work')).toBe('work')
    expect(parseCategoryFilter('bogus')).toBe('all')
    expect(parseCategoryFilter(undefined)).toBe('all')
    expect(parseCategoryFilter(null)).toBe('all')
    expect(parseCategoryFilter(['learning', 'work'])).toBe('learning')
    expect(parseCategoryFilter([])).toBe('all')
  })

  it('filterByCategory returns items unchanged for all, otherwise filters', () => {
    const items = [habit('a', { category: 'health' }), habit('b', { category: 'work' }), habit('c')]
    expect(filterByCategory(items, 'all')).toBe(items)
    expect(filterByCategory(items, 'work').map(item => item.id)).toEqual(['b'])
    expect(filterByCategory(items, 'learning')).toEqual([])
  })

  it('exposes four form options and a leading "All categories" filter option', () => {
    expect(categoryOptions.map(option => option.value)).toEqual(['health', 'learning', 'work', 'other'])
    expect(categoryFilterOptions[0]).toMatchObject({ label: 'All categories', value: 'all' })
    expect(categoryFilterOptions).toHaveLength(5)
  })
})

describe('category persistence and migration', () => {
  it('U1: a V2 payload without category parses ok with other', () => {
    const result = parseAppDataResult(envelope([withoutCategory(habit('h1'))]))
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.habits[0]!.category).toBe('other')
      expect(result.data.schemaVersion).toBe(APP_DATA_SCHEMA_VERSION)
    }
  })

  it('U2: an unknown category becomes other and is not quarantined', () => {
    const result = parseAppDataResult(envelope([{ ...habit('h1'), category: 'gaming' }]))
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.habits[0]!.category).toBe('other')
    }
  })

  it('U3: a V1 payload migrates with pauses [] and category other', () => {
    const { pauses: _pauses, ...v1Habit } = withoutCategory(habit('h1'))
    const result = parseAppDataResult(envelope([v1Habit], 1))
    expect(result.status).toBe('migrated')
    if (result.status === 'migrated') {
      expect(result.data.habits[0]).toMatchObject({ pauses: [], category: 'other' })
      expect(result.data.schemaVersion).toBe(2)
    }
  })

  it('U4: a valid category is preserved', () => {
    const data = parseAppData(envelope([habit('h1', { category: 'learning' })]))
    expect(data.habits[0]!.category).toBe('learning')
  })

  it('U5: lenient import handles with, without and bad category', () => {
    const base = withoutCategory(habit('h1'))
    expect(parseLenientHabit({ ...base, category: 'work' })?.category).toBe('work')
    expect(parseLenientHabit(base)?.category).toBe('other')
    expect(parseLenientHabit({ ...base, category: 'nope' })?.category).toBe('other')
    expect(parseLenientHabit({ ...base, category: 7 })?.category).toBe('other')
  })

  it('U5b: habits-only import extracts categories', () => {
    const base = withoutCategory(habit('h1'))
    const habits = extractImportedHabits({ habits: [{ ...base, category: 'work' }, { ...base, id: 'h2' }] })
    expect(habits.map(item => item.category)).toEqual(['work', 'other'])
  })

  it('U6: backup round trip preserves categories', () => {
    const data: AppData = {
      schemaVersion: APP_DATA_SCHEMA_VERSION,
      habits: [habit('a', { category: 'health' }), habit('b', { category: 'work' })],
      entries: [],
      suggestions: [],
      settings: { ...DEFAULT_SETTINGS },
    }
    const parsed = parseAppData(JSON.parse(serializeBackup(data)))
    expect(parsed.habits.map(item => item.category)).toEqual(['health', 'work'])
  })

  it('U13: existing fixtures without category still parse', async () => {
    const fixture = (await import('../public/fixtures/habit-tracker-demo.json')).default
    const parsed = parseAppData(fixture)
    expect(parsed.habits.every(item => item.category === 'other')).toBe(true)
  })
})

describe('category in the habits store', () => {
  const input = {
    name: 'Run',
    type: 'build' as const,
    identityStatement: 'I am a runner.',
    scheduleWeekdays: [1],
    reminderTime: null,
    startDate: '2026-02-01',
  }

  it('U7: create defaults to other, honours explicit category, update keeps or changes it', () => {
    setActivePinia(createPinia())
    const store = useHabitsStore()
    const plain = store.createHabit(input)
    const health = store.createHabit({ ...input, category: 'health' })
    expect(plain.category).toBe('other')
    expect(health.category).toBe('health')

    store.updateHabit(health.id, { ...input, archived: false })
    expect(store.habitById(health.id)!.category).toBe('health')
    store.updateHabit(health.id, { ...input, archived: false, category: 'work' })
    expect(store.habitById(health.id)!.category).toBe('work')
    expect(store.snapshot().map(item => item.category).sort()).toEqual(['other', 'work'])
  })

  it('U8: habitsByCategory returns matching habits', () => {
    setActivePinia(createPinia())
    const store = useHabitsStore()
    store.hydrate([habit('a', { category: 'health' }), habit('b'), habit('c', { category: 'health' })])
    expect(store.habitsByCategory('health').map(item => item.id)).toEqual(['a', 'c'])
    expect(store.habitsByCategory('learning')).toEqual([])
  })
})

describe('category in merge, demo data and prompts', () => {
  it('U10: merge detects a category-only change as an edit', () => {
    const base: AppData = { schemaVersion: 2, habits: [habit('a')], entries: [], suggestions: [], settings: { ...DEFAULT_SETTINGS } }
    const theirs: AppData = { ...base, habits: [habit('a', { category: 'health' })] }
    const result = mergeAppData(base, base, theirs)
    expect(result.status).toBe('merged')
    if (result.status === 'merged') {
      expect(result.data.habits[0]!.category).toBe('health')
    }
  })

  it('U11: demo data has valid, varied categories accepted by parseAppData', () => {
    const data = generateDemoData(new Date(2026, 0, 15))
    expect(new Set(data.habits.map(item => item.category)).size).toBeGreaterThanOrEqual(2)
    expect(parseAppData(data).habits.map(item => item.category)).toEqual(data.habits.map(item => item.category))
  })

  it('U12: AI prompts mention and export category', () => {
    expect(buildGettingStartedPrompt('2026-01-01')).toContain('"health" | "learning" | "work" | "other"')
    const current = buildCurrentHabitsPrompt([habit('a', { category: 'work' })])
    expect(current).toContain('"category": "work"')
    expect(current).toContain('"category": "health|learning|work|other"')
  })
})
