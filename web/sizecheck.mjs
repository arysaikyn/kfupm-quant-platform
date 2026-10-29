import { chromium } from '@playwright/test'
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
  localStorage.setItem('app.lang', 'en')
  localStorage.setItem('app.theme', 'dark')
})
const p = await ctx.newPage()
for (const [route, ask] of [['/', false], ['/ai', true]]) {
  await p.goto(`http://127.0.0.1:5179${route}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200)
  if (ask) {
    await p.getByRole('textbox').first().fill('cheap, low debt, Sharia screen')
    await p.keyboard.press('Enter')
    await p.waitForTimeout(6000)
  }
  const r = await p.evaluate(() => {
    const sizes = new Map()
    let textPx = 0
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length || !el.textContent?.trim()) continue
      const fs = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10
      sizes.set(fs, (sizes.get(fs) ?? 0) + 1)
      textPx += fs * el.textContent.trim().length
    }
    const totalChars = [...document.querySelectorAll('body *')]
      .filter((el) => !el.children.length && el.textContent?.trim())
      .reduce((n, el) => n + el.textContent.trim().length, 0)
    return { sizes: [...sizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6), avgPx: +(textPx / totalChars).toFixed(2) }
  })
  console.log(route, JSON.stringify(r))
}
await b.close()
