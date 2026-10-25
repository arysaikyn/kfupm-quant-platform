import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const ROUTES = [
  '/',
  '/news',
  '/news/n1',
  '/ai',
  '/strategy',
  '/strategy/low-debt-value',
  '/report/low-debt-value',
  '/me',
  '/screener',
  '/alerts',
  '/review',
  '/calendar',
  '/compare',
  '/runs',
  '/learn',
  '/search',
  '/sector/energy',
  '/watchlists',
  '/settings',
  '/m/2222',
  '/workspace',
]

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

type Issue = { route: string; kind: string; detail: string }

for (const lang of ['en', 'ar', 'zh'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`route matrix ${lang} ${theme}`, async ({ page }) => {
      test.setTimeout(180_000)
      await prime(page, lang, theme)
      const issues: Issue[] = []

      for (const route of ROUTES) {
        await page.goto(route)
        const h1 = page.locator('h1').first()
        await h1.waitFor({ state: 'visible' })

        const audit = await page.evaluate(() => {
          const label = (el: Element) =>
            (
              el.getAttribute('aria-label') ||
              el.getAttribute('title') ||
              (el as HTMLElement).innerText ||
              ''
            )
              .trim()
              .slice(0, 40)

          const small = [...document.querySelectorAll('button, input, select, textarea')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              const style = getComputedStyle(el)
              if (r.width === 0 || r.height === 0) return false
              if (style.visibility === 'hidden' || style.display === 'none') return false
              return r.width < 43.5 || r.height < 43.5
            })
            .map((el) => `${el.tagName}:${label(el)}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)

          const unnamed = [...document.querySelectorAll('button, a[href]')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              return r.width > 0 && r.height > 0 && label(el) === ''
            })
            .map((el) => el.tagName)

          const heading = document.querySelector('h1')
          const clipped =
            heading && heading.scrollHeight > heading.clientHeight + 1
              ? `${heading.scrollHeight}/${heading.clientHeight}`
              : null

          return {
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            h1Count: document.querySelectorAll('h1').length,
            dir: document.documentElement.dir,
            theme: document.documentElement.dataset.theme,
            title: document.title,
            small,
            unnamed,
            clipped,
          }
        })

        if (audit.overflow > 1) issues.push({ route, kind: 'overflow', detail: String(audit.overflow) })
        if (audit.h1Count !== 1) issues.push({ route, kind: 'h1Count', detail: String(audit.h1Count) })
        if (audit.small.length) issues.push({ route, kind: 'small-targets', detail: audit.small.join(', ') })
        if (audit.unnamed.length) issues.push({ route, kind: 'unnamed', detail: audit.unnamed.join(',') })
        if (audit.clipped) issues.push({ route, kind: 'clipped-title', detail: audit.clipped })
        if (!audit.title.includes('Quant Desk')) issues.push({ route, kind: 'title', detail: audit.title })
        if (audit.theme !== theme) issues.push({ route, kind: 'theme', detail: String(audit.theme) })
        if ((lang === 'ar') !== (audit.dir === 'rtl'))
          issues.push({ route, kind: 'direction', detail: String(audit.dir) })
      }

      expect(issues).toEqual([])
    })
  }
}

test('desktop shell and 1280 layout', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await prime(page, 'en', 'dark')
  for (const route of ROUTES) {
    await page.goto(route)
    await page.locator('h1').first().waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow, route).toBeLessThanOrEqual(1)
  }
})
