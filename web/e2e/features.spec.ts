import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function prime(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
    localStorage.setItem('app.lang', 'en')
    localStorage.setItem('app.theme', 'dark')
  })
}

test('screener shows the Sharia audit and the zero-result autopsy', async ({ page }) => {
  await prime(page)
  await page.goto('/screener')
  await expect(page.getByText('Pipeline').first()).toBeVisible()
  await expect(page.getByText('Sharia audit')).toBeVisible()

  await page.getByRole('button', { name: 'Uptrend' }).click()
  await expect(page.getByText('Why zero?')).toBeVisible()
  await expect(page.getByText(/Recovers/)).toBeVisible()
  await expect(page.getByText('What if ranked first?')).toBeVisible()
})

test('strategy receipt, drop ledger, pick list and jar share one demo result', async ({ page }) => {
  await prime(page)
  await page.goto('/strategy/sharia-income')
  await expect(page.getByRole('heading', { name: 'Receipt' })).toBeVisible()
  await expect(page.getByText('Drop ledger')).toBeVisible()
  await expect(page.getByText('Al Rajhi Bank').first()).toBeVisible()
  await expect(page.getByText('Passed every rule').first()).toBeVisible()
  await expect(page.getByText('Dated pick list')).toBeVisible()
  await expect(page.getByText('100-riyal jar')).toBeVisible()
  await expect(page.getByText(/ranked/).first()).toBeVisible()

  await page.getByRole('switch').check({ force: true })
  await expect(page.getByText('Only the words changed. Every number on this screen is unchanged.')).toBeVisible()
})

test('graveyard reveals a rule diff instead of silently reviving', async ({ page }) => {
  await prime(page)
  await page.goto('/strategy/graveyard')
  await expect(page.getByText(/retired/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Revive' }).first().click()
  await expect(page.getByText('Nothing is restored silently')).toBeVisible()
  await expect(page.getByText(/changedDebt to assets/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revive with these rules' })).toBeDisabled()
})

test('confidence book logs a call and glossary unlocks after a screen visit', async ({ page }) => {
  await prime(page)
  await page.goto('/learn')
  await expect(page.getByText('Out of every hundred the company spends')).toHaveCount(0)

  await page.goto('/review')
  await expect(page.getByText('Brier score')).toBeVisible()
  await page.getByRole('button', { name: 'Log this call' }).click()
  await expect(page.getByText('Logged. It settles next week.')).toBeVisible()

  await page.goto('/')
  await page.goto('/learn')
  await expect(page.getByText('Out of every hundred the company spends')).toBeVisible()
})

test('workspace freezes a paper snapshot and walks the route sheet', async ({ page }) => {
  await prime(page)
  await page.goto('/workspace')
  await page.getByRole('tab', { name: 'Paper' }).click()
  await page.getByRole('button', { name: 'Freeze snapshot' }).click()
  const name = page.getByRole('textbox').first()
  await name.fill('Before rebalance')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Before rebalance')).toBeVisible()
  await expect(page.getByText('Local demo snapshots, not a broker record.')).toBeVisible()
  await expect(page.getByText('Next rebalance')).toBeVisible()
  await expect(page.getByText('Entering')).toBeVisible()

  await page.getByRole('tab', { name: 'Scheduled' }).click()
  await page.getByRole('button', { name: 'Run weekly route' }).click()
  await expect(page.getByText('Walking the route…').first()).toBeVisible()
  await expect(page.getByText(/Demo only\. No job is created/)).toBeVisible({ timeout: 10_000 })
})

test('returns dock can re-add a removed name', async ({ page }) => {
  await prime(page)
  await page.goto('/watchlists')
  await expect(page.getByText('Ready to re-add').first()).toBeVisible()
  await page.getByRole('button', { name: 'Re-add' }).first().click()
  await expect(page.getByText('No symbols in this group yet.')).toHaveCount(0)
  await expect(page.getByText('Ready to re-add')).toHaveCount(0)
})

test('demo AI receipts a refusal and marks untraced numbers', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  const box = page.getByRole('textbox', { name: /Try:/ })
  await box.fill('Should I buy Saudi Aramco?')
  await box.press('Enter')
  await expect(page.getByText('Out of scope')).toBeVisible()
  await expect(page.getByText('Compliant rewrite')).toBeVisible()

  await page.goto('/ai?new=1')
  const next = page.getByRole('textbox', { name: /Try:/ })
  await next.fill('Backtest AAPL for 2024')
  await next.press('Enter')
  await expect(page.getByText(/3 numbers \/ 0 traced/)).toBeVisible({ timeout: 10_000 })
})
