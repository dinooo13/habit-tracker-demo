import { test, expect } from '../support/fixtures'
import { HabitFormPage } from '../support/pages/habit-form'
import { DashboardPage } from '../support/pages/dashboard'
import { readPersistedStore } from '../support/seed'
import { addDaysKey, makeAppData, makeHabit, todayKey } from '../support/data'
import { appRoutePattern } from '../support/url'

function dailyHabit(name: string, category: 'health' | 'learning' | 'work' | 'other', extra = {}) {
  return makeHabit({
    name,
    category,
    scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
    startDate: addDaysKey(todayKey(), -3),
    reminderTime: null,
    ...extra,
  })
}

async function chooseFilter(page: import('@playwright/test').Page, testId: string, label: string) {
  await page.getByTestId(testId).click()
  await page.getByRole('option', { name: label }).click()
}

test.describe('Habit categories', () => {
  test('E1: create with a category shows its badge; default is Other', async ({ authedPage: page }) => {
    const form = new HabitFormPage(page)
    await form.gotoNew()
    await expect(page.getByTestId('habit-category')).toContainText('Other')

    await form.fill({ name: 'Study Spanish', identityStatement: 'I am a learner.', weekdays: [1], category: 'learning' })
    await form.submit()
    await expect(page).toHaveURL(appRoutePattern('/app/habits'))
    await expect(
      page.locator('.habit-card').filter({ hasText: 'Study Spanish' }).getByTestId('habit-category-badge'),
    ).toContainText('Learning')

    await form.gotoNew()
    await form.fill({ name: 'Plain habit', identityStatement: 'I am plain.', weekdays: [1] })
    await form.submit()
    await expect(
      page.locator('.habit-card').filter({ hasText: 'Plain habit' }).getByTestId('habit-category-badge'),
    ).toContainText('Other')
  })

  test('E2/E5: editing the category persists across reload', async ({ authedPage: page, seed }) => {
    const habit = dailyHabit('Run 5k', 'other')
    await seed(makeAppData({ habits: [habit] }))
    await page.goto(`/habits/${habit.id}`)
    const form = new HabitFormPage(page)
    await expect(page.getByTestId('habit-category')).toContainText('Other')
    await form.chooseCategory('Health')
    await form.submit()

    const badge = () => page.locator('.habit-card').filter({ hasText: 'Run 5k' }).getByTestId('habit-category-badge')
    await expect(badge()).toContainText('Health')
    // Let the debounced save flush, then reload.
    await page.waitForTimeout(1500)
    await page.reload()
    await expect(badge()).toContainText('Health')
  })

  test('E3: the Habits list filters by category via ?category=', async ({ authedPage: page, seed }) => {
    await seed(makeAppData({
      habits: [
        dailyHabit('Run', 'health'),
        dailyHabit('Read', 'learning'),
        dailyHabit('Plan sprint', 'work'),
      ],
    }))
    await page.goto('/app/habits')
    await expect(page.locator('.habit-card')).toHaveCount(3)

    await chooseFilter(page, 'habit-category-filter', 'Learning')
    await expect(page.locator('.habit-card')).toHaveCount(1)
    await expect(page.locator('.habit-card')).toContainText('Read')
    await expect(page).toHaveURL(/category=learning/)
    await page.reload()
    await expect(page.locator('.habit-card')).toHaveCount(1)

    await chooseFilter(page, 'habit-category-filter', 'Other')
    await expect(page.getByText('No habits in Other')).toBeVisible()
    await page.getByRole('button', { name: 'Show all categories' }).click()
    await expect(page.locator('.habit-card')).toHaveCount(3)
    await expect(page).not.toHaveURL(/category=/)

    await page.goto('/app/habits?category=work')
    await expect(page.locator('.habit-card')).toHaveCount(1)
    await page.goto('/app/habits?category=bogus')
    await expect(page.locator('.habit-card')).toHaveCount(3)
  })

  test('E3b: changing the filter jumps back to page 1', async ({ authedPage: page, seed }) => {
    const health = Array.from({ length: 7 }, (_, index) => dailyHabit(`Health ${index + 1}`, 'health'))
    await seed(makeAppData({ habits: [...health, dailyHabit('Plan sprint', 'work')] }))
    await page.goto('/app/habits')
    await expect(page.locator('.habit-card')).toHaveCount(6)

    await page.getByRole('button', { name: 'Page 2' }).click()
    await expect(page.locator('.habit-card')).toHaveCount(2)

    await chooseFilter(page, 'habit-category-filter', 'Health')
    await expect(page.locator('.habit-card')).toHaveCount(6)
  })

  test('E4: the Today queue and counters follow the category filter', async ({ authedPage: page, seed }) => {
    await seed(makeAppData({
      habits: [
        dailyHabit('Run', 'health'),
        dailyHabit('Stretch', 'health'),
        dailyHabit('Read', 'learning'),
        dailyHabit('Yoga', 'health', { pauses: [{ start: addDaysKey(todayKey(), -1), end: addDaysKey(todayKey(), 1) }] }),
      ],
    }))
    await page.goto('/app')
    const dash = new DashboardPage(page)
    await expect(dash.progressText()).toContainText('0 of 3 reviewed')

    await dash.filterCategory('Health')
    await expect(dash.progressText()).toContainText('0 of 2 reviewed')
    await expect(dash.cards).toHaveCount(2)
    await expect(dash.card('Run').getByTestId('habit-category-badge')).toContainText('Health')
    // The streak strip and the paused alert ignore the filter.
    await expect(page.getByText('4 habits')).toBeVisible()
    await expect(page.getByText('1 habit is paused today')).toBeVisible()

    await dash.markDone('Run')
    await expect(dash.progressText()).toContainText('1 of 2 reviewed')
    await expect(page.getByTestId('today-category-filter')).toContainText('Health')

    // All Health habits reviewed while Read (Learning) is still open: the Open tab must
    // not claim that everything due today is reviewed.
    await dash.markDone('Stretch')
    await expect(dash.progressText()).toContainText('2 of 2 reviewed')
    await expect(page.getByTestId('today-open-filtered-empty')).toContainText('No open habits in Health')
    await expect(page.getByTestId('today-open-filtered-empty')).toContainText('1 open habit is in other categories.')
    await expect(page.getByText('Everything due today has already been reviewed.')).toHaveCount(0)
    await expect
      .poll(async () => (await readPersistedStore<{ status: string }>(page, 'entries')).filter(entry => entry.status === 'done').length)
      .toBe(2)
    await page.reload()
    await expect(page.getByTestId('today-category-filter')).toContainText('Health')
    await expect(dash.progressText()).toContainText('2 of 2 reviewed')
    await page.getByTestId('today-open-filtered-empty').getByRole('button', { name: 'Show all categories' }).click()
    await expect(page.getByTestId('today-category-filter')).toContainText('All categories')
    await expect(dash.card('Read')).toBeVisible()

    await dash.filterCategory('Work')
    await expect(page.getByText('1 habit is paused today')).toBeVisible()
    await expect(page.getByText('No due habits in Work')).toBeVisible()
    await expect(page.getByText('No habits due today')).toHaveCount(0)
    await page.getByRole('button', { name: 'Show all categories' }).click()
    await expect(dash.progressText()).toContainText('2 of 3 reviewed')
  })
})
