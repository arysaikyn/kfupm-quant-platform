import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function prime(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
    localStorage.setItem('app.lang', 'en')
    localStorage.setItem('app.theme', 'dark')
  })
}

test('workspace exposes runs, paper, portfolio, alphas, schedule and model', async ({ page }) => {
  await prime(page)
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible()
  await expect(page.getByText('run_1')).toBeVisible()
  await page.getByRole('tab', { name: 'Paper' }).click()
  await expect(page.getByText('Core paper')).toBeVisible()
  await page.getByRole('tab', { name: 'Portfolio' }).click()
  await expect(page.getByText('54,321.09').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Alphas' }).click()
  await expect(page.getByText('alpha101_001')).toBeVisible()
  await page.getByRole('tab', { name: 'Scheduled' }).click()
  await expect(page.getByText('Weekly US review')).toBeVisible()
  await page.getByRole('tab', { name: 'Model' }).click()
  await expect(page.getByText('test-model')).toBeVisible()
})

test('AI header opens the workspace', async ({ page }) => {
  await prime(page)
  await page.goto('/ai')
  await page.getByRole('link', { name: 'Workspace' }).click()
  await expect(page).toHaveURL(/\/workspace$/)
  await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible()
})

test('workspace uploads a file and hands it to the agent', async ({ page }) => {
  await prime(page)
  await page.goto('/workspace')
  await page.locator('input[type=file]').setInputFiles({
    name: 'note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  await expect(page.getByText('mock.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Ask AI' }).last().click()
  await expect(page).toHaveURL(/\/ai$/)
  await expect(page.getByRole('textbox', { name: /Try:/ })).toHaveValue(/mock\.pdf/)
})
