import { chromium } from '@playwright/test'
import { mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Capture the phone screenshots the README shows.
 *
 * Two things this does that a plain screenshot does not:
 * 1. it blurs whatever the router focused, because `Screen` moves focus to the
 *    page heading on every route change, and Chromium then paints a focus ring
 *    around the title;
 * 2. it hides the scrollbar, which is desktop chrome inside a phone frame.
 *
 * Output goes to `docs/screenshots/raw/`; `frame.py` puts it in a phone body.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const RAW = path.join(ROOT, 'docs/screenshots/raw')
const BASE = process.env.BASE ?? 'http://127.0.0.1:5179'

const SHOTS = [
  { name: 'market', route: '/' },
  { name: 'symbol', route: '/m/2222' },
  { name: 'news', route: '/news' },
  {
    name: 'ai',
    route: '/ai',
    before: async (page) => {
      await page.getByRole('textbox').first().fill('cheap, low debt, Sharia screen')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(6000)
    },
  },
  { name: 'strategy', route: '/strategy/low-debt-value' },
  { name: 'screener', route: '/screener' },
  {
    name: 'refusal',
    route: '/ai',
    before: async (page) => {
      await page.getByRole('textbox').first().fill('Should I buy Saudi Aramco?')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2500)
    },
  },
  { name: 'arabic', route: '/', lang: 'ar' },
  { name: 'light', route: '/', theme: 'light' },
]

const browser = await chromium.launch({ channel: 'chrome' })
await rm(RAW, { recursive: true, force: true })
await mkdir(RAW, { recursive: true })

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  await context.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem('app.prefs', JSON.stringify({ onboarded: true, market: 'sa' }))
      localStorage.setItem('app.lang', lang)
      localStorage.setItem('app.theme', theme)
    },
    { lang: shot.lang ?? 'en', theme: shot.theme ?? 'dark' },
  )
  const page = await context.newPage()
  await page.goto(`${BASE}${shot.route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  if (shot.before) await shot.before(page)

  // No focus ring, no scrollbar: both are artefacts of being a browser.
  await page.addStyleTag({
    content:
      '*:focus, *:focus-visible { outline: none !important; box-shadow: none; } html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }',
  })
  await page.evaluate(() => document.activeElement?.blur?.())
  const focused = await page.evaluate(() => document.querySelectorAll(':focus-visible').length)
  await page.screenshot({ path: path.join(RAW, `${shot.name}.png`) })
  console.log(shot.name, 'focus-visible elements:', focused)
  await context.close()
}

await browser.close()
