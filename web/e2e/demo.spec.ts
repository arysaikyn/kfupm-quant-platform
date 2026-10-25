import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function primeDemo(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
    localStorage.setItem('app.lang', 'en')
    localStorage.setItem('app.theme', 'dark')
    localStorage.removeItem('app.ai.mode')
    localStorage.removeItem('app.ai.demo.sessions')
    localStorage.removeItem('app.ai.demo.session')
  })
}

test('demo answers without touching the AI backend', async ({ page }) => {
  let calls = 0
  await page.route('**/api/ai/**', async (route) => {
    calls += 1
    await route.abort()
  })
  await primeDemo(page)
  await page.goto('/ai')
  await expect(page.getByText('Demo mode · pre-recorded replies')).toBeVisible()

  const box = page.getByRole('textbox', { name: /Try:/ })
  await box.fill('Explain Saudi Aramco')
  await box.press('Enter')
  await expect(page.getByText(/pre-recorded|Demo walkthrough|Demo mode returns/)).toBeVisible()
  expect(calls).toBe(0)
})

test('demo workspace has samples and makes no backend calls', async ({ page }) => {
  let calls = 0
  await page.route('**/api/ai/**', async (route) => {
    calls += 1
    await route.abort()
  })
  await primeDemo(page)
  await page.goto('/workspace')
  await expect(page.getByText('Demo: Sharia screen and value rank')).toBeVisible()
  expect(calls).toBe(0)
})

test('the provider form saves and switches to live', async ({ page }) => {
  await primeDemo(page)
  await page.route('**/api/ai/settings/llm', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          provider: 'openai',
          model_name: 'test-model',
          base_url: 'https://example.invalid/v1',
          api_key_configured: true,
          api_key_required: true,
        }),
      })
      return
    }
    await route.continue()
  })
  await page.goto('/ai/provider')
  await page.getByLabel('Base API URL').fill('https://example.invalid/v1')
  await page.getByLabel('Model').fill('test-model')
  await page.getByLabel('API key').fill('test-key')
  await page.getByRole('button', { name: 'Save and go live' }).click()
  await expect(page.getByText('Saved. Live mode is on.')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('app.ai.mode'))).toBe('live')
})
