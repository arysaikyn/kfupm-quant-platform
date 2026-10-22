import type { CSSProperties } from 'react'
import type { NewsItem } from '../../data/mock'
import { quoteBySymbol } from './format'

/* FNV-1a over the id: the same story always paints the same tile, so the feed
   never reshuffles itself between renders or reloads. */
function seedOf(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic 0..1 stream — no Math.random ever reaches a render. */
function stream(seed: number, length: number): number[] {
  let h = seed
  return Array.from({ length }, () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    return h / 4294967296
  })
}

/** Five-point price path drawn in the 96×96 tile: trend from the symbol, wobble from the id. */
function pricePath(seed: number, rising: boolean) {
  const values = stream(seed, 5)
  const raw = values.map((v, i) => {
    const t = i / (values.length - 1)
    return (rising ? -1 : 1) * (t - 0.5) * 1.1 + (v - 0.5) * 0.7
  })
  const lo = Math.min(...raw)
  const span = Math.max(...raw) - lo || 1
  const points = raw.map((y, i) => [10 + i * 19, 27 + ((y - lo) / span) * 45] as const)
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  return { line, area: `${line} L86 82 L10 82 Z` }
}

/** Eight bars that climb with the symbol and jitter with the id. */
function barHeights(seed: number, rising: boolean): number[] {
  return stream(seed, 8).map((v, i) => 10 + v * 34 + (rising ? i : 7 - i) * 2)
}

type Props = {
  item: NewsItem
}

export function StoryArt({ item }: Props) {
  const quote = item.symbols[0] ? quoteBySymbol[item.symbols[0]] : undefined
  const seed = seedOf(item.id)
  const rising = quote ? quote.change >= 0 : seed % 4 < 2
  /* Up/down tokens carry the market convention, so the tile recolours with the
     locale switch (CN red-up, INTL green-up) instead of hard-coding a hue. */
  const tone = rising ? 'var(--color-up)' : 'var(--color-down)'
  const bars = seed % 2 === 1
  const { line, area } = pricePath(seed, rising)
  const corner = item.symbols[0] ?? item.source.charAt(0)

  // Flat tint plus the hairline. The gradient glow made a 96px thumbnail the
  // loudest element in the feed, louder than the headline next to it.
  const tile: CSSProperties = {
    borderColor: 'var(--color-line)',
    background: `color-mix(in srgb, ${tone} 8%, var(--color-surface))`,
  }

  return (
    <div
      aria-hidden="true"
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[14px] border"
      style={tile}
    >
      <svg viewBox="0 0 96 96" fill="none" className="absolute inset-0 h-full w-full">
        {bars ? (
          barHeights(seed, rising).map((h, i) => (
            <rect
              key={i}
              x={4.5 + i * 11.5}
              y={82 - h}
              width={6.5}
              height={h}
              rx={1.6}
              fill={tone}
              fillOpacity={0.34 + (i / 7) * 0.14}
            />
          ))
        ) : (
          <>
            {/* Flat fill: a gradient glow on a 96px thumbnail reads as a
                sticker, and the card already carries the number. */}
            <path d={area} fill={tone} fillOpacity="0.10" />
            <path
              d={line}
              stroke={tone}
              strokeOpacity="0.5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
      <span
        className="t-kicker absolute start-2 top-1.5"
        style={{ color: 'color-mix(in srgb, var(--color-fg) 58%, transparent)' }}
      >
        {corner}
      </span>
    </div>
  )
}
