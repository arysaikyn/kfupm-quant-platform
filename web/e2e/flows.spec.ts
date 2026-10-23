import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function prime(page: Page, lang: 'en' | 'ar' | 'zh' = 'en', theme: 'light' | 'dark' = 'dark') {
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
      localStorage.setItem('app.lang', lang)
      localStorage.setItem('app.theme', theme)
    },
    { lang, theme },
  )
}

test('deep link survives onboarding and lands on the stock', async ({ page }) => {
  await page.goto('/m/2222')
  await expect(page).toHaveURL(/\/welcome\?next=/)
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Continue' }).click()
  }
  await page.getByRole('radio', { name: /Saudi Arabia/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Open markets' }).click()
  await expect(page).toHaveURL(/\/m\/2222$/)
  await expect(page.locator('h1').first()).toHaveText('Saudi Aramco')
})

test('tab navigation moves focus to the new heading', async ({ page }) => {
  await prime(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Strategies' }).click()
  await expect(page).toHaveURL(/\/strategy$/)
  const tag = await page.evaluate(() => document.activeElement?.tagName)
  expect(tag).toBe('H1')
})

test('unknown route renders a real 404', async ({ page }) => {
  await prime(page)
  await page.goto('/this-route-does-not-exist')
  await expect(page.locator('h1').first()).toHaveText('This page does not exist')
  await expect(page).toHaveTitle(/Page not found/)
})

test('offline banner appears and clears', async ({ page, context }) => {
  await prime(page)
  await page.goto('/')
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByRole('status').first()).toContainText(/Offline/)
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.getByRole('status').first()).toBeHidden()
})

test('symbol context and the rule-card handoff', async ({ page }) => {
  await prime(page)
  await page.goto('/m/2010')
  await page.getByRole('button', { name: 'Ask about', exact: true }).click()
  await expect(page).toHaveURL(/\/ai$/)
  await expect(page.getByText('Ask about SABIC')).toBeVisible()
  await expect(page.getByText('SABIC', { exact: true }).first()).toBeVisible()

  // The context sheet is a modal: Escape closes it.
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'New chat' }).click()
  const composer = page.getByRole('textbox', { name: /Try:/ })
  for (const text of ['one', 'two', 'three']) {
    await composer.fill(text)
    await composer.press('Enter')
    await expect(page.getByText(text, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden({ timeout: 10_000 })
  }

  await expect(page.getByText('Value screen (demo)')).toBeVisible()
  await page.getByRole('link', { name: 'Edit in screener' }).click()
  await expect(page).toHaveURL(/\/screener\?preset=value$/)
  await expect(page.getByText(/Matches:/)).toBeVisible()
  await expect(page.getByText(/3.*of.*5/)).toBeVisible()
})

test('thread ids survive a reload without collisions', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  const composer = page.getByRole('textbox', { name: /Try:/ })
  await composer.fill('first')
  await composer.press('Enter')
  await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden({ timeout: 10_000 })
  await page.reload()
  await composer.fill('second')
  await composer.press('Enter')
  await expect(page.getByRole('button', { name: 'Stop' })).toBeHidden({ timeout: 10_000 })

  const ids = await page.evaluate(() => {
    const raw = localStorage.getItem('app.ai.thread.v2')
    if (!raw) return []
    const thread = JSON.parse(raw) as { msgs: { id: number }[] }
    return thread.msgs.map((m) => m.id)
  })
  expect(ids.length).toBe(4)
  expect(new Set(ids).size).toBe(ids.length)
})

test('reset clears app data but keeps language and theme', async ({ page }) => {
  await prime(page)
  await page.goto('/settings')
  await page.evaluate(() => {
    localStorage.setItem('app.ai.thread.v2', '{"version":2,"msgs":[],"chips":[],"turn":0}')
    localStorage.setItem('news.saved.v1', '["n1"]')
    localStorage.setItem('watchlists.v1', '[]')
  })
  await page.getByRole('button', { name: 'Reset local data' }).click()
  await page.getByRole('button', { name: 'Tap again to confirm' }).click()
  await page.waitForLoadState('load')
  const kept = await page.evaluate(() => ({
    thread: localStorage.getItem('app.ai.thread.v2'),
    saved: localStorage.getItem('news.saved.v1'),
    lang: localStorage.getItem('app.lang'),
    theme: localStorage.getItem('app.theme'),
  }))
  expect(kept.thread).toBeNull()
  expect(kept.saved).toBeNull()
  expect(kept.lang).toBe('en')
  expect(kept.theme).toBe('dark')
})

test('active tab follows sub-routes', async ({ page }) => {
  await prime(page)
  await page.goto('/report/low-debt-value')
  await expect(page.locator('nav [aria-current="page"]')).toContainText('Strategies')
  await page.goto('/learn')
  await expect(page.locator('nav [aria-current="page"]')).toContainText('Profile')
})

test('back restores the list scroll offset', async ({ page }) => {
  await prime(page)
  await page.goto('/news')
  await page.evaluate(() => window.scrollTo(0, 300))
  const before = await page.evaluate(() => window.scrollY)
  await page.locator('a[href^="/news/n"]').first().click()
  await expect(page).toHaveURL(/\/news\/n/)
  await page.goBack()
  await expect(page).toHaveURL(/\/news$/)
  const after = await page.evaluate(() => window.scrollY)
  expect(after).toBeGreaterThanOrEqual(Math.min(before, 200))
})
