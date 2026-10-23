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

/** Slot label keys, in the order of the URL params below. */
const SLOT_KEYS = ['slotA', 'slotB', 'slotC'] as const

/** `?a=SYM&b=SYM&c=SYM`: the board lives in the link, so a copy restores it. */
const SLOT_PARAMS = ['a', 'b', 'c'] as const

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

/**
 * The board is read from the URL on every render. A key that is missing keeps
 * the default board's name, so the stock page's `?a=SYM` still lands on three
 * columns; a key sent empty is a deliberately cleared column, which is how
 * "clear" survives a copied link. A symbol asked for twice keeps its first
 * column only, so nothing is ever compared against itself.
 */
function slotsFrom(params: URLSearchParams): (number | null)[] {
  if (!SLOT_PARAMS.some((key) => params.has(key))) return [0, 1, 2]

  const seen = new Set<number>()
  const asked = SLOT_PARAMS.map((key) => {
    if (!params.has(key)) return undefined
    const symbol = params.get(key)
    const pick = symbol ? quotes.findIndex((q) => q.symbol === symbol) : -1
    if (pick < 0 || seen.has(pick)) return null
    seen.add(pick)
    return pick
  })

  return asked.map((pick) => {
    if (pick !== undefined) return pick
    const free = quotes.findIndex((_, i) => !seen.has(i))
    if (free < 0) return null
    seen.add(free)
    return free
  })
}

type Cell = { text: string; tone?: string; bar?: number; empty?: boolean }

type Row = {
  key: string
  label: string
  hint: string
  best: boolean[]
  cells: Cell[]
}

/** What a column prints once its slot is cleared: a dash, never a fake zero. */
const EMPTY_CELL: Cell = { text: '—', tone: 'var(--color-muted)', empty: true }

/**
 * Overlay of the filled slots' sparks rebased to 100 at their first point. The
 * figure wrapper pins `dir="ltr"` so time still runs left → right inside Arabic.
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
  const { lang, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const picks = useMemo(() => slotsFrom(params), [params])

  // Opened from a stock page (?a=SYMBOL) a deep link has no history to pop, so
  // back lands on that stock rather than the tab root.
  const focus = params.get('a')
  const backTo = quotes.some((q) => q.symbol === focus) ? `/m/${focus}` : '/'

  /** Rewrite all three slots at once, so the untouched defaults survive the
      first edit. A cleared slot is written as an empty value, not dropped:
      dropping it would let the default name back in on the next load. */
  const setSlot = (slot: number, value: number | null) => {
    const next = new URLSearchParams(params)
    picks.forEach((pick, i) => {
      const chosen = i === slot ? value : pick
      next.set(SLOT_PARAMS[i], chosen === null ? '' : quotes[chosen].symbol)
    })
    setParams(next, { replace: true })
  }

  const stats = useMemo(
    () => picks.map((pick) => (pick === null ? null : statsFor(quotes[pick]))),
    [picks],
  )
  const live = stats.filter((st): st is Stats => st !== null)

  // Only drawn lines carry a colour, so the legend and the chart agree about
  // which colour belongs to which column even after a slot is emptied.
  const drawn = stats.flatMap((st, i) =>
    st === null
      ? []
      : [
          {
            symbol: st.q.symbol,
            name: st.q.name[lang],
            color: SERIES_COLORS[i],
            series: st.q.spark.map((v) => (v / (st.q.spark[0] || 1)) * 100),
          },
        ],
  )

  const ranked = [...live].sort((a, b) => b.score - a.score)
  const [leader, runnerUp] = ranked
  let verdict = s('verdictNeedTwo')
  if (leader && runnerUp) {
    const margin = Math.max(0, Math.round((leader.score - runnerUp.score) * 10) / 10)
    const verdictVars: Record<string, string> = {
      name: leader.q.name[lang],
      pts: fmtNum(margin, lang, 1),
      a: leader.q.name[lang],
      b: runnerUp.q.name[lang],
    }
    verdict = (margin > 0 ? s('verdictLead') : s('verdictTie')).replace(
      /\{(\w+)\}/g,
      (_m, key) => verdictVars[key] ?? '',
    )
  }

  /** A row winner only means something once two names are on the board. */
  const bestFor = (get: (st: Stats) => number, dir: 'min' | 'max'): boolean[] => {
    if (live.length < 2) return stats.map(() => false)
    const values = live.map(get)
    const target = dir === 'min' ? Math.min(...values) : Math.max(...values)
    return stats.map((st) => st !== null && Math.abs(get(st) - target) < 1e-9)
  }

  const rows: Row[] = [
    {
      key: 'discount',
      label: s('rowDiscount'),
      hint: s('rowDiscountHint'),
      best: bestFor((st) => st.discount, 'max'),
      cells: stats.map((st) =>
        st === null
          ? EMPTY_CELL
          : {
              text: fmtNum(st.discount * 100, lang, 1, '%'),
              tone:
                st.discount > 0
                  ? 'var(--color-up)'
                  : st.discount < 0
                    ? 'var(--color-down)'
                    : 'var(--color-muted)',
            },
      ),
    },
    {
      key: 'change',
      label: s('rowChange'),
      hint: s('rowChangeHint'),
      best: bestFor((st) => st.q.change, 'max'),
      cells: stats.map((st) =>
        st === null
          ? EMPTY_CELL
          : {
              text: fmtPct(st.q.change, lang),
              tone:
                st.q.change > 0
                  ? 'var(--color-up)'
                  : st.q.change < 0
                    ? 'var(--color-down)'
                    : 'var(--color-muted)',
            },
      ),
    },
    {
      key: 'range',
      label: s('rowRange'),
      hint: s('rowRangeHint'),
      best: bestFor((st) => st.pos, 'max'),
      cells: stats.map((st) =>
        st === null ? EMPTY_CELL : { text: fmtNum(st.pos * 100, lang, 0, '%'), bar: st.pos },
      ),
    },
    {
      key: 'vol',
      label: s('rowVol'),
      hint: s('rowVolHint'),
      best: bestFor((st) => st.vol, 'min'),
      cells: stats.map((st) =>
        st === null ? EMPTY_CELL : { text: fmtNum(st.vol * 100, lang, 2, '%') },
      ),
    },
    {
      key: 'score',
      label: s('rowScore'),
      hint: s('rowScoreHint'),
      best: bestFor((st) => st.score, 'max'),
      cells: stats.map((st) => (st === null ? EMPTY_CELL : { text: fmtNum(st.score, lang, 1) })),
    },
  ]

  return (
    <Screen title={s('title')} leading={<BackButton fallback={backTo} />}>
      <section className="panel mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="t-section">{s('slotsTitle')}</h2>

          <button
            type="button"
            aria-live="polite"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1600)
              } catch {
                // Clipboard permission is optional.
              }
            }}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-[11px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {copied ? t('common.copied') : s('copyLink')}
          </button>
        </div>

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
                    value={value ?? ''}
                    aria-label={`${s('slotSelect')} ${s(SLOT_KEYS[i])}`}
                    onChange={(e) =>
                      setSlot(i, e.target.value === '' ? null : Number(e.target.value))
                    }
                    className={`num min-h-11 w-full appearance-none rounded-lg bg-fg/5 px-2.5 pe-6 text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                      value === null ? 'text-muted' : 'text-fg'
                    }`}
                  >
                    <option value="">{s('slotEmpty')}</option>
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
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-2 pb-2">
          <h2 className="t-section">{s('tableTitle')}</h2>
          <span className="num shrink-0 text-[10px] text-muted">{s('tableTag')}</span>
        </div>

        <p id="cmp-table-desc" className="sr-only">
          {s('tableCaption')}
        </p>

        <div
          role="table"
          aria-label={s('tableTitle')}
          aria-describedby="cmp-table-desc"
          className="border-t border-line"
        >
          <div
            role="row"
            className="grid grid-cols-[84px_repeat(3,minmax(0,1fr))] items-end px-3 pt-1.5 pb-1.5"
          >
            <div role="columnheader">
              <span className="sr-only">{s('metric')}</span>
            </div>
            {stats.map((st, i) =>
              st === null ? (
                <div key={`slot-${i}`} role="columnheader" className="px-0.5 text-center">
                  <span className="mt-0.5 block text-[10px] leading-none text-muted">
                    {s('slotEmpty')}
                  </span>
                </div>
              ) : (
                <div key={st.q.symbol} role="columnheader" className="px-0.5 text-center">
                  <span className="num block text-[12px] font-semibold">{st.q.symbol}</span>
                  <span className="mt-0.5 block text-[10px] leading-none text-muted">
                    {st.q.currency}
                  </span>
                </div>
              ),
            )}
          </div>

          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              className="grid min-h-14 grid-cols-[84px_repeat(3,minmax(0,1fr))] items-center border-t border-line px-3"
            >
              <div role="rowheader" className="py-2 pe-1">
                <span className="block text-[11px] leading-tight font-medium">{row.label}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-muted">
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
                      {cell.empty && <span className="sr-only"> {s('slotEmpty')}</span>}
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

        <p className="pt-2 text-[10px] leading-snug text-muted">{s('bestHint')}</p>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="t-section">{s('chartTitle')}</h2>
          <span className="num shrink-0 text-[10px] text-muted">{s('chartTag')}</span>
        </div>

        {drawn.length === 0 ? (
          <p className="mt-2.5 text-[12px] text-muted">{s('chartEmpty')}</p>
        ) : (
          <>
            <ul
              aria-label={s('legendAria')}
              className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5"
            >
              {drawn.map((line) => (
                <li key={line.symbol} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: line.color }}
                  />
                  <span className="num text-[11px] font-semibold">{line.symbol}</span>
                  <span className="whitespace-nowrap text-[11px] text-muted">{line.name}</span>
                </li>
              ))}
            </ul>

            <figure className="mt-2" dir="ltr">
              <OverlayChart
                series={drawn.map((line) => line.series)}
                colors={drawn.map((line) => line.color)}
                lang={lang}
                aria={`${s('chartAria')}: ${drawn.map((line) => line.symbol).join(' · ')}`}
                from={s('axisFrom')}
                to={s('axisTo')}
              />
            </figure>
          </>
        )}
      </section>

      <p
        className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed"
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
