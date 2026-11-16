import { test, expect } from '../support/fixtures'
import { SettingsPage } from '../support/pages/settings'
import { addDaysKey, makeAppData, makeEntry, makeHabit, todayKey } from '../support/data'

test.describe('Settings: check-ins CSV export (#3)', () => {
  test('downloads all check-ins as an escaped CSV file', async ({ authedPage: page, seed }) => {
    const habit = makeHabit({ name: 'Read, then "reflect"', startDate: addDaysKey(todayKey(), -2) })
    const missedDay = addDaysKey(todayKey(), -2)
    const doneDay = addDaysKey(todayKey(), -1)
    await seed(makeAppData({
      habits: [habit],
      entries: [
        makeEntry({ habitId: habit.id, date: missedDay, status: 'missed', missReasonCode: 'no_time', missReasonNote: 'Zu müde,\nmorgen früher' }),
        makeEntry({ habitId: habit.id, date: doneDay, status: 'done' }),
      ],
    }))
    await page.goto('/app/settings')
    const settings = new SettingsPage(page)

    await expect(settings.exportCsvButton()).toBeEnabled()
    const downloadPromise = page.waitForEvent('download')
    await settings.exportCsvButton().click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^habit-checkins-\d{4}-\d{2}-\d{2}\.csv$/)

    const chunks: Buffer[] = []
    for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer)
    const bytes = Buffer.concat(chunks)

    // UTF-8 BOM so Excel reads the umlauts.
    expect([...bytes.subarray(0, 3)]).toEqual([0xEF, 0xBB, 0xBF])
    const csv = bytes.toString('utf8').slice(1)
    expect(csv.split('\r\n')[0]).toBe('date,habit,status,reason,note,completed_at')
    expect(csv).toContain(`${missedDay},"Read, then ""reflect""",missed,I had no time,"Zu müde,\nmorgen früher",\r\n`)
    expect(csv).toContain(`${doneDay},"Read, then ""reflect""",done,,,`)
  })

  test('is disabled with a hint when there are no check-ins', async ({ authedPage: page, seed }) => {
    await seed(makeAppData({ habits: [makeHabit({ name: 'Brand new', startDate: todayKey() })] }))
    await page.goto('/app/settings')
    const settings = new SettingsPage(page)

    await expect(settings.exportCsvButton()).toBeDisabled()
    await expect(page.getByText('No check-ins yet. The CSV export becomes available after your first check-in.')).toBeVisible()
  })
})
