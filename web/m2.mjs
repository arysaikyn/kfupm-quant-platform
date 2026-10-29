import { chromium } from '@playwright/test'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 900, height: 900 } })
await p.goto('file:///tmp/readme2.html')
await p.waitForTimeout(500)
const boxes = await p.evaluate(() =>
  [...document.images].map((img) => ({
    name: img.src.split('/').pop(),
    w: Math.round(img.getBoundingClientRect().width),
    h: Math.round(img.getBoundingClientRect().height),
  })),
)
console.log(boxes)
await b.close()
