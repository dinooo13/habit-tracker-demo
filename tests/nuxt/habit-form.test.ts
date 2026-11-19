import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HabitForm from '~/components/HabitForm.vue'
import type { Habit } from '~/types/app-data'

// Hoisted spy so the mocked `useToast` auto-import shares one instance across the
// module factory and the assertions below.
const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }))

mockNuxtImport('useToast', () => () => ({
  add: toastAdd,
  update: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  toasts: [],
}))

function buildInitialHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Read 10 pages',
    type: 'build',
    identityStatement: 'I am a person who reads every day.',
    scheduleWeekdays: [],
    reminderTime: null,
    startDate: '2026-02-08',
    archived: false,
    pauses: [],
    category: 'other',
    createdAt: '2026-02-08T00:00:00.000Z',
    updatedAt: '2026-02-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('HabitForm — weekday validation', () => {
  afterEach(() => {
    toastAdd.mockReset()
  })

  it('warns and does not emit submit when no weekday is selected', async () => {
    // Otherwise-valid habit with an empty schedule exercises the component guard
    // directly through the real UForm/UCheckbox integration.
    const wrapper = await mountSuspended(HabitForm, {
      props: { initial: buildInitialHabit() },
    })

    await wrapper.find('form').trigger('submit')
    // Let UForm run its async Zod validation and the resulting render tick settle.
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(toastAdd).toHaveBeenCalledWith({
      title: 'Select at least one day',
      description: 'A habit needs at least one planned weekday.',
      color: 'warning',
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

describe('HabitForm — category', () => {
  it('defaults to other, preselects an existing category and emits it in the payload', async () => {
    const created = await mountSuspended(HabitForm)
    const createSelect = created.findComponent({ name: 'USelect' })
    expect(createSelect.props('modelValue')).toBe('other')

    const wrapper = await mountSuspended(HabitForm, {
      props: { initial: buildInitialHabit({ category: 'work', scheduleWeekdays: [1] }) },
    })
    expect(wrapper.findComponent({ name: 'USelect' }).props('modelValue')).toBe('work')

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('submit')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]![0]).toMatchObject({ category: 'work' })
  })
})
