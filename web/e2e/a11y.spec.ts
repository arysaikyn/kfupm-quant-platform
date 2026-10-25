import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const ROUTES = ['/', '/news', '/ai', '/screener', '/m/2222', '/strategy/low-debt-value', '/me', '/workspace']

async function prime(page: Page, lang: 'en' | 'ar' | 'zh', theme: 'light' | 'dark') {
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
      localStorage.setItem('app.lang', lang)
      localStorage.setItem('app.theme', theme)
      localStorage.removeItem('app.ai.thread.v2')
    },
    { lang, theme },
  )
}

for (const lang of ['en', 'ar'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`axe ${lang} ${theme}`, async ({ page }) => {
      test.setTimeout(120_000)
      await prime(page, lang, theme)
      const failures: string[] = []
      for (const route of ROUTES) {
        await page.goto(route)
        await page.locator('h1').first().waitFor()
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        for (const violation of results.violations) {
          if (violation.impact === 'critical' || violation.impact === 'serious') {
            failures.push(`${route} ${violation.id}: ${violation.help}`)
          }
        }
      }
      expect(failures).toEqual([])
    })
  }
}
