import { chromium } from '@playwright/test'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 } })
await p.goto('file:///tmp/readme.html')
const boxes = await p.evaluate(() =>
  [...document.images].map((img) => ({
    src: img.currentSrc.split('/').pop() || img.src.split('/').pop(),
    w: Math.round(img.getBoundingClientRect().width),
    nat: img.naturalWidth ? `${img.naturalWidth}x${img.naturalHeight}` : 'no-load',
  })),
)
console.log(boxes)
await b.close()
