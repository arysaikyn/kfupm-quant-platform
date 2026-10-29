import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * The 320px torture test, and the type floor.
 *
 * A clipped label reads as an unfinished screen — the Arabic tab labels that
 * ended in "الاست…" were exactly this failure. At 320px the app has no room to
 * be vague: either the label fits, or it wraps, or it is not printed at all.
 *
 * Three assertions per screen:
 * 1. no horizontal scroll;
 * 2. no element that renders an ellipsis is actually cut;
 * 3. no rendered text below 11px (chart axis ticks are SVG and exempt).
 */

const DENSE = ['/', '/m/2222', '/news', '/strategy/low-debt-value', '/screener', '/strategy']

async function prime(page: Page, lang: string) {
  await page.addInitScript((l) => {
    localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
    localStorage.setItem('app.lang', l)
    localStorage.setItem('app.theme', 'dark')
  }, lang)
}

for (const lang of ['en', 'ar', 'zh']) {
  test(`no clipped label at 320px · ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await prime(page, lang)
    for (const route of DENSE) {
      await page.goto(route)
      const report = await page.evaluate(() => {
        const clipped: string[] = []
        let smallest = 99
        for (const el of document.querySelectorAll('body *')) {
          if (el.children.length > 0 || !el.textContent?.trim()) continue
          if (el.namespaceURI?.includes('svg')) continue
          const style = getComputedStyle(el)
          smallest = Math.min(smallest, parseFloat(style.fontSize))
          if (style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
            clipped.push(el.textContent.trim().slice(0, 24))
          }
        }
        return {
          clipped,
          smallest,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        }
      })
      expect(report.clipped, `${lang} ${route} clips these labels`).toEqual([])
      expect(report.overflow, `${lang} ${route} scrolls sideways`).toBeLessThanOrEqual(0)
      expect(report.smallest, `${lang} ${route} renders text below the floor`).toBeGreaterThanOrEqual(11)
    }
  })
}
