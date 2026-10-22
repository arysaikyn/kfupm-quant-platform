import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { fundamentalsFor } from '../../data/fundamentals'
import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { strings } from './strings'

/** Colour belongs to the slot, not the symbol: swapping a name keeps the line. */
const SERIES_COLORS = ['var(--color-up)', 'var(--color-down)', 'var(--color-accent)'] as const

/** Window behind both derived metrics. */
const WINDOW = 20

/** Daily volatility treated as fully stressed when scoring calm. */
const VOL_CEILING = 0.035

const SLOT_KEYS = ['slotA', 'slotB', 'slotC'] as const

const CHART_W = 320
const CHART_H = 152
const PAD_L = 34
const PAD_R = 8
const PAD_T = 10
const PAD_B = 16

type Stats = {
  q: Quote
  /** Where the last point sits in its own 20-day range: 0 = low, 1 = high. */
  pos: number
  /** Standard deviation of the last 20 daily returns. */
  vol: number
  /** 0–100 blend of range position, today's move and calm. */
  score: number
  /** Fair value ÷ price − 1. Unit-free, so it ranks across currencies. */
  discount: number
}

function statsFor(q: Quote): Stats {
  const tail = q.spark.slice(-(WINDOW + 1))
  const rets = tail.slice(1).map((v, i) => v / tail[i] - 1)
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1)
  const variance =
    rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(rets.length - 1, 1)
  const vol = Math.sqrt(variance)

  const win = q.spark.slice(-WINDOW)
  const lo = Math.min(...win)
  const hi = Math.max(...win)
  const pos = hi > lo ? (win[win.length - 1] - lo) / (hi - lo) : 0.5

  // 45% where it sits in its range · 30% today's move · 25% how calm the tape is.
  // A pure function of the three metrics in the table, so no tie-breaker drift.
  const momentum = Math.min(1, Math.max(0, 0.5 + q.change * 20))
  const calm = Math.min(1, Math.max(0, 1 - vol / VOL_CEILING))
  const score = 100 * (0.45 * pos + 0.3 * momentum + 0.25 * calm)
  // Same fair value the stock page prints, read as a fraction of price so the
  // number means the same thing whether the quote is in SAR, CNY or HKD.
  const discount = fundamentalsFor(q.symbol, q.price).fairValue / q.price - 1

  return { q, pos, vol, score: Math.round(score * 10) / 10, discount }
}

function bestFlags(values: number[], dir: 'min' | 'max'): boolean[] {
  const target = dir === 'min' ? Math.min(...values) : Math.max(...values)
  return values.map((v) => Math.abs(v - target) < 1e-9)
}

type Cell = { text: string; tone?: string; bar?: number }

type Row = {
  key: string
  label: string
  hint: string
  best: boolean[]
  cells: Cell[]
}

/**
 * Overlay of the three sparks rebased to 100 at their first point. The figure
 * wrapper pins `dir="ltr"` so time still runs left → right inside Arabic.
 */
function OverlayChart({
  series,
  colors,
  lang,
  aria,
  from,
  to,
}: {
  series: number[][]
  colors: readonly string[]
  lang: Lang
  aria: string
  from: string
  to: string
}) {
  const all = series.flat()
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const min = lo - span * 0.12
  const max = hi + span * 0.12

  const plotW = CHART_W - PAD_L - PAD_R
  const plotH = CHART_H - PAD_T - PAD_B
  const px = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * plotW
  const py = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH

  const ticks = [hi, (hi + lo) / 2, lo]

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="block h-auto w-full"
      role="img"
      aria-label={aria}
    >
      {ticks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={CHART_W - PAD_R}
            y1={py(v)}
            y2={py(v)}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
          <text
            x={PAD_L - 6}
            y={py(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-muted)"
          >
            {fmtNum(v, lang, 1)}
          </text>
        </g>
      ))}

      {100 > min && 100 < max && (
        <line
          x1={PAD_L}
          x2={CHART_W - PAD_R}
          y1={py(100)}
          y2={py(100)}
          stroke="var(--color-muted)"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="2 3"
        />
      )}

      {series.map((line, i) => (
        <polyline
          key={i}
          points={line
            .map((v, j) => `${px(j, line.length).toFixed(1)},${py(v).toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke={colors[i]}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      <text x={PAD_L} y={CHART_H - 3} fontSize="9" fill="var(--color-muted)" textAnchor="start">
        {from}
      </text>
      <text
        x={CHART_W - PAD_R}
        y={CHART_H - 3}
        fontSize="9"
        fill="var(--color-muted)"
        textAnchor="end"
      >
        {to}
      </text>
    </svg>
  )
}

export default function ComparePage() {
  const s = useStrings(strings)
  const { lang } = useI18n()
  // Opened from a stock page, the first slot starts on that stock. The other
  // two keep their defaults unless they would repeat it.
  const [params] = useSearchParams()
  const [picks, setPicks] = useState<number[]>(() => {
    const wanted = quotes.findIndex((q) => q.symbol === params.get('a'))
    if (wanted < 0) return [0, 1, 2]
    return [wanted, ...[0, 1, 2].filter((i) => i !== wanted)].slice(0, 3)
  })

  // Opened from a stock page (?a=SYMBOL) a deep link has no history to pop, so
  // back lands on that stock rather than the tab root.
  const focus = params.get('a')
  const backTo = quotes.some((q) => q.symbol === focus) ? `/m/${focus}` : '/'

  const stats = useMemo(() => picks.map((i) => statsFor(quotes[i])), [picks])

  const series = useMemo(
    () =>
      stats.map((st) => {
        const base = st.q.spark[0] || 1
        return st.q.spark.map((v) => (v / base) * 100)
      }),
    [stats],
  )

  const ranked = useMemo(() => [...stats].sort((a, b) => b.score - a.score), [stats])
  const leader = ranked[0]
  const runnerUp = ranked[1]
  const margin = Math.max(0, Math.round((leader.score - runnerUp.score) * 10) / 10)
  const verdictVars: Record<string, string> = {
    name: leader.q.name[lang],
    pts: fmtNum(margin, lang, 1),
    a: leader.q.name[lang],
    b: runnerUp.q.name[lang],
  }
  const verdict = (margin > 0 ? s('verdictLead') : s('verdictTie')).replace(
    /\{(\w+)\}/g,
    (_m, key) => verdictVars[key] ?? '',
  )

  const discounts = stats.map((st) => st.discount)
  const changes = stats.map((st) => st.q.change)
  const positions = stats.map((st) => st.pos)
  const vols = stats.map((st) => st.vol)
  const scores = stats.map((st) => st.score)

  const rows: Row[] = [
    {
      key: 'discount',
      label: s('rowDiscount'),
      hint: s('rowDiscountHint'),
      best: bestFlags(discounts, 'max'),
      cells: stats.map((st) => ({
        text: fmtNum(st.discount * 100, lang, 1, '%'),
        tone:
          st.discount > 0
            ? 'var(--color-up)'
            : st.discount < 0
              ? 'var(--color-down)'
              : 'var(--color-muted)',
      })),
    },
    {
      key: 'change',
      label: s('rowChange'),
      hint: s('rowChangeHint'),
      best: bestFlags(changes, 'max'),
      cells: stats.map((st) => ({
        text: fmtPct(st.q.change, lang),
        tone:
          st.q.change > 0
            ? 'var(--color-up)'
            : st.q.change < 0
              ? 'var(--color-down)'
              : 'var(--color-muted)',
      })),
    },
    {
      key: 'range',
      label: s('rowRange'),
      hint: s('rowRangeHint'),
      best: bestFlags(positions, 'max'),
      cells: stats.map((st) => ({
        text: fmtNum(st.pos * 100, lang, 0, '%'),
        bar: st.pos,
      })),
    },
    {
      key: 'vol',
      label: s('rowVol'),
      hint: s('rowVolHint'),
      best: bestFlags(vols, 'min'),
      cells: stats.map((st) => ({ text: fmtNum(st.vol * 100, lang, 2, '%') })),
    },
    {
      key: 'score',
      label: s('rowScore'),
      hint: s('rowScoreHint'),
      best: bestFlags(scores, 'max'),
      cells: stats.map((st) => ({ text: fmtNum(st.score, lang, 1) })),
    },
  ]

  const setSlot = (slot: number, value: number) =>
    setPicks((prev) => prev.map((p, i) => (i === slot ? value : p)))

  return (
    <Screen title={s('title')} leading={<BackButton fallback={backTo} />}>
      <section className="panel mt-4 overflow-hidden">
        <div className="p-4">
          <h2 className="t-kicker text-muted">{s('slotsTitle')}</h2>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {picks.map((value, i) => (
              <div key={i} className="min-w-0">
                <label htmlFor={`cmp-slot-${i}`} className="block">
                  <span className="text-[11px] font-medium text-muted">
                    {s(SLOT_KEYS[i])}
                  </span>

                  <div className="relative mt-1">
                    <select
                      id={`cmp-slot-${i}`}
                      value={value}
                      aria-label={`${s('slotSelect')} ${s(SLOT_KEYS[i])}`}
                      onChange={(e) => setSlot(i, Number(e.target.value))}
                      className="num min-h-11 w-full appearance-none rounded-lg bg-fg/5 px-2.5 pe-6 text-[12px] font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {quotes.map((q, qi) => (
                        <option
                          key={q.symbol}
                          value={qi}
                          disabled={picks.some((p, j) => j !== i && p === qi)}
                        >
                          {q.symbol} · {q.name[lang]}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-muted pointer-events-none absolute end-2 top-1/2 h-3 w-3 -translate-y-1/2"
                    >
                      <path
                        d="m2.5 4.5 3.5 3.5 3.5-3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <span
                    className="mt-1 block truncate text-[10px] text-muted"
                    title={quotes[value].name[lang]}
                  >
                    {quotes[value].name[lang]}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line">
          <div className="flex items-baseline justify-between gap-2 px-4 pt-4 pb-2">
            <h2 className="text-[13px] font-semibold">{s('tableTitle')}</h2>
            <span className="num shrink-0 text-[10px] text-muted">{s('tableTag')}</span>
          </div>

          <div role="table" aria-label={s('tableTitle')}>
            <div
              role="row"
              className="grid grid-cols-[84px_repeat(3,minmax(0,1fr))] items-end px-4 pb-1.5"
            >
              <div role="columnheader">
                <span className="sr-only">{s('metric')}</span>
              </div>
              {stats.map((st) => (
                <div key={st.q.symbol} role="columnheader" className="px-0.5 text-center">
                  <span className="num block text-[12px] font-semibold">{st.q.symbol}</span>
                  <span className="mt-0.5 block text-[9px] leading-none text-muted">
                    {st.q.currency}
                  </span>
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <div
                key={row.key}
                role="row"
                className="grid min-h-14 grid-cols-[84px_repeat(3,minmax(0,1fr))] items-center border-t border-line px-4"
              >
                <div role="rowheader" className="py-2 pe-1">
                  <span className="block text-[11px] leading-tight font-medium">{row.label}</span>
                  <span className="mt-0.5 block text-[9px] leading-tight text-muted">
                    {row.hint}
                  </span>
                </div>

                {row.cells.map((cell, i) => (
                  <div key={i} role="cell" className="px-0.5 py-1.5">
                    <div
                      className={`rounded-lg px-1 py-1 text-center ${row.best[i] ? 'bg-fg/10' : ''}`}
                    >
                      <span
                        className={`num block text-[12px] leading-tight ${row.best[i] ? 'font-semibold' : 'font-medium'}`}
                        style={{ color: cell.tone ?? 'var(--color-fg)' }}
                      >
                        {cell.text}
                        {row.best[i] && <span className="sr-only"> {s('bestMark')}</span>}
                      </span>

                      {cell.bar !== undefined && (
                        <span
                          className="mx-auto mt-1 block h-[3px] w-[84%] overflow-hidden rounded-full"
                          style={{
                            background: 'color-mix(in srgb, var(--color-fg) 12%, transparent)',
                          }}
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${Math.round(cell.bar * 100)}%`,
                              background: 'color-mix(in srgb, var(--color-fg) 45%, transparent)',
                            }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="px-4 pt-2 pb-4 text-[10px] leading-snug text-muted">
            {s('bestHint')}
          </p>
        </div>
      </section>

      <section className="panel mt-6 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold">{s('chartTitle')}</h2>
          <span className="num shrink-0 text-[10px] text-muted">{s('chartTag')}</span>
        </div>

        <ul
          aria-label={s('legendAria')}
          className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5"
        >
          {stats.map((st, i) => (
            <li key={st.q.symbol} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: SERIES_COLORS[i] }}
              />
              <span className="num text-[11px] font-semibold">{st.q.symbol}</span>
              <span className="whitespace-nowrap text-[11px] text-muted">
                {st.q.name[lang]}
              </span>
            </li>
          ))}
        </ul>

        <figure className="mt-2" dir="ltr">
          <OverlayChart
            series={series}
            colors={SERIES_COLORS}
            lang={lang}
            aria={`${s('chartAria')}: ${stats.map((st) => st.q.symbol).join(' · ')}`}
            from={s('axisFrom')}
            to={s('axisTo')}
          />
        </figure>
      </section>

      <p
        className="mt-3 flex items-start gap-2 px-1 text-[12px] leading-relaxed"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
        />
        <span>{verdict}</span>
      </p>
    </Screen>
  )
}
