import { useState } from 'react'
import { fill } from '../../i18n/format'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { equityYears, quoteBySymbol } from '../../data/mock'
import type { Strategy } from '../../data/mock'
import type { Ledger } from '../../lib/ledger'
import { jarStacks } from './jar'
import { featureStrings } from './strings'

/** Jar geometry, in SVG units. The body is the only region a coin can live in. */
const BODY = { x: 40, y: 52, w: 140, h: 126, r: 26 }
const INNER = { x: 46, y: 60, w: 128, h: 110 }
const BOTTOM = INNER.y + INNER.h

/**
 * 100 riyals, split equally across the names that pass, drawn as coins in a jar.
 * A coin is one whole share at the assumed entry price; what cannot buy a share
 * stays cash. Both scrubbers are labelled demo: the numbers come from the
 * strategy's own curve and the tape's prices, not from a live account.
 */
export function RiyalJar({ strategy, ledger }: { strategy: Strategy; ledger: Ledger }) {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)
  const [year, setYear] = useState(equityYears.last)
  const [priceFactor, setPriceFactor] = useState(1)

  const picks = ledger.passed.map((name) => ({
    symbol: name.symbol,
    weight: ledger.passed.length > 0 ? 1 / ledger.passed.length : 0,
    price: quoteBySymbol[name.symbol]?.price ?? 0,
  }))
  const jar = jarStacks(picks, strategy.curve, year, priceFactor)
  const totalCoins = jar.stacks.reduce((sum, stack) => sum + stack.coins, 0)

  const blockerCounts: Record<string, number> = {}
  for (const name of ledger.names) {
    const id = name.blocker?.ruleId
    if (!id) continue
    blockerCounts[id] = (blockerCounts[id] ?? 0) + 1
  }
  const [topId, topCount] = Object.entries(blockerCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0] ?? ['', 0]
  const topRule = strategy.rules.find((rule) => rule.id === topId)

  const cashHeight = jar.grown > 0 ? (jar.cash / jar.grown) * INNER.h : 0
  const coinArea = INNER.h - cashHeight
  const maxCoins = Math.max(0, ...jar.stacks.map((stack) => stack.coins))
  const coinHeight =
    maxCoins > 0 ? Math.max(3, Math.min(10, (coinArea - (maxCoins - 1) * 2) / maxCoins)) : 0
  const columnWidth = jar.stacks.length > 0 ? INNER.w / jar.stacks.length : INNER.w

  return (
    <section className="border-t border-line pt-5">
      <h2 className="t-section">{s('jarTitle')}</h2>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('jarHint')}
      </p>

      <div className="mt-2 flex justify-center">
        <svg viewBox="0 0 220 200" width="200" height="182" role="img" aria-label={s('jarTitle')}>
          <defs>
            <clipPath id="riyal-jar-body">
              <rect x={INNER.x} y={INNER.y} width={INNER.w} height={INNER.h} rx={20} />
            </clipPath>
          </defs>
          <rect x={78} y={14} width={64} height={14} rx={7} fill="var(--color-surface)" />
          <rect
            x={86}
            y={28}
            width={48}
            height={30}
            rx={6}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={1.5}
          />
          <rect
            x={BODY.x}
            y={BODY.y}
            width={BODY.w}
            height={BODY.h}
            rx={BODY.r}
            fill="var(--color-surface)"
            opacity="0.35"
          />
          <g clipPath="url(#riyal-jar-body)">
            {cashHeight > 0 && (
              <rect
                x={INNER.x}
                y={BOTTOM - cashHeight}
                width={INNER.w}
                height={cashHeight}
                fill="var(--color-surface)"
              />
            )}
            {jar.stacks.map((stack, column) =>
              Array.from({ length: stack.coins }, (_, index) => (
                <rect
                  key={`${stack.symbol}-${index}`}
                  x={INNER.x + column * columnWidth + 5}
                  y={BOTTOM - cashHeight - (index + 1) * coinHeight - index * 2}
                  width={columnWidth - 10}
                  height={coinHeight}
                  rx={Math.min(3, coinHeight / 2)}
                  fill="var(--color-fg)"
                  opacity={0.16 + Math.min(0.4, index * 0.06)}
                />
              )),
            )}
          </g>
          <rect
            x={BODY.x}
            y={BODY.y}
            width={BODY.w}
            height={BODY.h}
            rx={BODY.r}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={2}
          />
        </svg>
      </div>

      {picks.length === 0 ? (
        <>
          <p className="mt-1 text-center text-[13px] leading-snug">{s('jarEmpty')}</p>
          <p className="mt-1 text-center text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {fill(s('jarEmptyHint'), {
              rule: topRule?.label[lang] ?? topId,
              n: fmtNum(topCount, lang, 0),
            })}
          </p>
        </>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {jar.stacks.map((stack) => (
            <li key={stack.symbol} className="flex items-baseline justify-between gap-3 py-2">
              <span className="truncate text-[12px]">
                {quoteBySymbol[stack.symbol]?.name[lang] ?? stack.symbol}
              </span>
              <span dir="ltr" className="num shrink-0 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                {fmtNum(stack.weight * 100, lang, 1, '%')}
                {' · '}
                {fill(s('jarShares'), { n: fmtNum(stack.coins, lang, 0) })}
                {' · '}
                {fmtNum(stack.spent, lang, 2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
        <span>
          {s('jarDeposit')} <span dir="ltr" className="num">{fmtNum(jar.grown, lang, 2)}</span>
        </span>
        <span>
          {s('jarCash')} <span dir="ltr" className="num">{fmtNum(jar.cash, lang, 2)}</span>
        </span>
        <span>
          {fill(s('jarCoins'), { n: fmtNum(totalCoins, lang, 0) })}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <label className="block text-[11px]" style={{ color: 'var(--color-muted)' }}>
          <span className="flex items-center justify-between gap-3">
            <span>{s('jarYear')}</span>
            <span dir="ltr" className="num">{fmtNum(jar.year, lang, 0)}</span>
          </span>
          <input
            type="range"
            min={equityYears.first}
            max={equityYears.last}
            step={1}
            value={year}
            disabled={jar.idle}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label={s('jarYear')}
            className="mt-1 h-11 w-full accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          />
        </label>
        <label className="block text-[11px]" style={{ color: 'var(--color-muted)' }}>
          <span className="flex items-center justify-between gap-3">
            <span>{s('jarWhatIf')}</span>
            <span dir="ltr" className="num">{fmtNum(jar.priceFactor, lang, 1, '×')}</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={priceFactor}
            disabled={jar.idle}
            onChange={(event) => setPriceFactor(Number(event.target.value))}
            aria-label={s('jarWhatIf')}
            className="mt-1 h-11 w-full accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          />
        </label>
      </div>

      {jar.idle && (
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {s('jarIdle')}
        </p>
      )}
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('jarDemo')}
      </p>
    </section>
  )
}
