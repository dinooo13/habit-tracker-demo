import { DEFAULT_HABIT_CATEGORY, HABIT_CATEGORIES, type HabitCategory } from '~/types/app-data'

export interface HabitCategoryMeta {
  label: string
  icon: string
}

export const HABIT_CATEGORY_META: Record<HabitCategory, HabitCategoryMeta> = {
  health: { label: 'Health', icon: 'i-lucide-heart-pulse' },
  learning: { label: 'Learning', icon: 'i-lucide-book-open' },
  work: { label: 'Work', icon: 'i-lucide-briefcase' },
  other: { label: 'Other', icon: 'i-lucide-tag' },
}

export type CategoryFilter = 'all' | HabitCategory

/** Items for the category `USelect` in the habit form. */
export const categoryOptions: { label: string, value: HabitCategory, icon: string }[] = HABIT_CATEGORIES.map(value => ({
  label: HABIT_CATEGORY_META[value].label,
  value,
  icon: HABIT_CATEGORY_META[value].icon,
}))

/** Items for the filter `USelect` (adds "All categories" first). */
export const categoryFilterOptions: { label: string, value: CategoryFilter, icon?: string }[] = [
  { label: 'All categories', value: 'all' },
  ...categoryOptions,
]

export function isHabitCategory(value: unknown): value is HabitCategory {
  return typeof value === 'string' && (HABIT_CATEGORIES as readonly string[]).includes(value)
}

export function categoryLabel(category: HabitCategory = DEFAULT_HABIT_CATEGORY): string {
  return HABIT_CATEGORY_META[category].label
}

/** Parse an untrusted value (e.g. a route query param) into a filter; unknown -> 'all'. */
export function parseCategoryFilter(value: unknown): CategoryFilter {
  const candidate = Array.isArray(value) ? value[0] : value
  return isHabitCategory(candidate) ? candidate : 'all'
}

export function filterByCategory<T extends { category: HabitCategory }>(items: T[], filter: CategoryFilter): T[] {
  return filter === 'all' ? items : items.filter(item => item.category === filter)
}
