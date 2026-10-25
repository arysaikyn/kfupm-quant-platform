import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function prime(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
    localStorage.setItem('app.lang', 'en')
    localStorage.setItem('app.theme', 'dark')
    localStorage.setItem('app.ai.mode', 'live')
  })
}

async function resetSession(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('app.ai.session'))
}

async function ask(page: Page, text: string) {
  const composer = page.getByRole('textbox', { name: /Try:/ })
  await composer.fill(text)
  await composer.press('Enter')
}

test('agent stream renders tools, markdown and the run card', async ({ page }) => {
  await prime(page)
  await resetSession(page)
  await page.goto('/ai')
  await expect(page.getByText('Local agent connected')).toBeVisible()
  await ask(page, 'Backtest AAPL for 2024')

  await expect(page.getByText('Get Market Data')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Backtest result')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Total return').first()).toBeVisible()
  await expect(page.locator('.agent-md').getByText('12.30%')).toBeVisible()
  await expect(page.getByText('test-model').first()).toBeVisible()
  await expect(page.locator('.agent-md table')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible()

  // The composer is usable again and the session is in the URL.
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(page).toHaveURL(/session=mock-session/)

  // Reload restores the durable transcript from the server.
  await page.reload()
  await expect(page.getByText('Backtest AAPL for 2024', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Backtest result')).toBeVisible({ timeout: 10_000 })
})

test('history lists server sessions and opens one', async ({ page }) => {
  await prime(page)
  await resetSession(page)
  await page.request.post('/api/ai/sessions', { data: { title: 'History session' } })
  await page.goto('/runs')
  await expect(page.getByText('History session').first()).toBeVisible()
  await page.getByText('History session').first().click()
  await expect(page).toHaveURL(/\/ai\?session=mock-session/)
})

test('stop cancels and leaves a stopped marker', async ({ page }) => {
  await prime(page)
  await resetSession(page)
  await page.goto('/ai')
  await ask(page, 'slow test run')
  const stop = page.getByRole('button', { name: 'Stop' })
  await expect(stop).toBeVisible({ timeout: 10_000 })
  await stop.click()
  await expect(page.getByText('Stopped')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
})

test('new chat clears the transcript and the URL session', async ({ page }) => {
  await prime(page)
  await resetSession(page)
  await page.request.post('/api/ai/sessions', { data: { title: 'Clear me' } })
  await page.request.post('/api/ai/sessions/mock-session/messages', {
    data: { content: 'Backtest AAPL for 2024' },
  })
  await page.goto('/ai?session=mock-session')
  await expect(page.getByText('Backtest AAPL for 2024', { exact: true })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'New chat' }).click()
  await expect(page).toHaveURL(/\/ai$/)
  await expect(page.getByText('Backtest AAPL for 2024', { exact: true })).toBeHidden()
  await expect(page.getByText('Ask in plain words. See what fits and why.')).toBeVisible()
})

test('a reload during a run resumes and keeps the answer', async ({ page }) => {
  await prime(page)
  await resetSession(page)
  await page.goto('/ai')
  // A prior assistant turn makes the polling baseline non-zero; the resumed
  // turn must not be mistaken for that older answer.
  await ask(page, 'first quick turn')
  await expect(page.getByText(/Ask: first quick turn/)).toBeVisible({ timeout: 15_000 })
  await ask(page, 'slow resume test')
  await expect(page.getByText('slow resume test', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText(/Ask: slow resume test/)).toBeVisible({ timeout: 20_000 })
})
