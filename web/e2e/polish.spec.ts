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

test('the AI composer is a real surface on a phone', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  const surface = await page.locator('.composer').evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      background: style.backgroundColor,
      border: style.borderTopWidth,
      radius: style.borderTopLeftRadius,
    }
  })
  expect(surface.background).not.toBe('rgba(0, 0, 0, 0)')
  expect(surface.border).not.toBe('0px')
  expect(Number.parseFloat(surface.radius)).toBeGreaterThan(0)
})

test('new question from history opens an empty thread', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  const box = page.getByRole('textbox', { name: /Try:/ })
  await box.fill('Explain Saudi Aramco')
  await box.press('Enter')
  await expect(page).toHaveURL(/session=/)
  await expect(page.getByText('Explain Saudi Aramco').first()).toBeVisible()

  await page.goto('/ai?new=1')
  await expect(page).not.toHaveURL(/session=/)
  await expect(page.getByText('Ask in plain words. See what fits and why.')).toBeVisible()
})

test('search gives a first-time visitor something to open', async ({ page }) => {
  await prime(page)
  await page.goto('/search')
  await expect(page.getByRole('heading', { name: 'Popular now' })).toBeVisible()
  await expect(page.getByRole('link', { name: /SABIC/ }).first()).toBeVisible()
})

test('a story focuses its headline and review has a way back', async ({ page }) => {
  await prime(page)
  await page.goto('/news')
  await page.locator('a[href^="/news/n"]').first().click()
  await expect(page).toHaveURL(/\/news\/n/)
  await expect(page.locator('h1').first()).toBeFocused()

  await page.goto('/review')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/news$/)
})

test('stop keeps the partial answer without adding a second one', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  const box = page.getByRole('textbox', { name: /Try:/ })
  await box.fill('Explain Saudi Aramco')
  await box.press('Enter')
  await page.waitForTimeout(280)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByText('Stopped').first()).toBeVisible()
  await expect(page.getByText('Backtest complete for the test universe.')).toHaveCount(1)
})

test('empty session history offers one clear next step', async ({ page }) => {
  await prime(page)
  await page.route('**/api/ai/sessions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto('/runs')
  await expect(page.getByText('No conversations yet.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ask a question' })).toHaveCount(1)
})

test('a failed send restores the question instead of duplicating it', async ({ page }) => {
  await prime(page)
  let fail = true
  await page.route('**/api/ai/sessions/*/messages', async (route) => {
    if (route.request().method() === 'POST' && fail) {
      fail = false
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'upstream down' }),
      })
      return
    }
    await route.continue()
  })
  await page.goto('/ai')
  const question = 'Explain Saudi Aramco'
  await page.getByRole('textbox', { name: /Try:/ }).fill(question)
  await page.getByRole('textbox', { name: /Try:/ }).press('Enter')
  await expect(page.getByText('The message did not send. Try again.')).toBeVisible()
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('textbox', { name: /Try:/ })).toHaveValue(question)
  await expect(page.getByRole('log').getByText(question, { exact: true })).toHaveCount(0)
})

test('the seeded watchlist is localised', async ({ page }) => {
  await prime(page)
  await page.goto('/watchlists')
  await expect(page.getByRole('heading', { name: 'Main list' })).toBeVisible()
  await expect(page.getByText('默认', { exact: true })).toHaveCount(0)
})
