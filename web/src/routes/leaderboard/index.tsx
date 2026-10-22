import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { equity, strategies } from '../../data/mock'
import type { Strategy } from '../../data/mock'
import { leaderboardStrings } from './strings'

type Sort = 'return' | 'rules' | 'recent'

type Copied = {
  id: string
  name: string
  /** Epoch milliseconds. */
  timestamp: number
}

const KEY = 'strategies.copied'

const SPARK_W = 56
const SPARK_H = 24
const SPARK_PAD = 2
const SPARK_POINTS = 26

/**
 * One shifted window of the shared equity curve per strategy. Keyed by id so a
 * re-sort never changes a row's shape; the shift is deterministic.
 */
const SERIES: Record<string, number[]> = {}
strategies.forEach((st, i) => {
  const src = equity.withCost
  const maxStart = Math.max(src.length - SPARK_POINTS, 0)
  const start = (i * 17) % (maxStart + 1)
  SERIES[st.id] = src.slice(start, start + SPARK_POINTS)
})

function isCopiedItem(v: unknown): v is Copied {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.timestamp === 'number' &&
    Number.isFinite(c.timestamp)
  )
}

function loadCopied(): Copied[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isCopiedItem) : []
  } catch {
    // Private browsing or corrupt payload: start with none.
    return []
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function Spark({ series, up }: { series: number[]; up: boolean }) {
  const lo = Math.min(...series)
  const span = Math.max(...series) - lo || 1
  const step = series.length > 1 ? (SPARK_W - SPARK_PAD * 2) / (series.length - 1) : 0
  const points = series
    .map((v, i) => {
      const x = SPARK_PAD + i * step
      const y = SPARK_H - SPARK_PAD - ((v - lo) / span) * (SPARK_H - SPARK_PAD * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      className="shrink-0"
      style={{ direction: 'ltr' }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--color-up)' : 'var(--color-down)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export default function LeaderboardPage() {
  const { lang, dir } = useI18n()
  const s = useStrings(leaderboardStrings)

  const [sort, setSort] = useState<Sort>('return')
  const [copied, setCopied] = useState<Copied[]>(loadCopied)
  /** Inline acknowledgement text; the band below reserves its height. */
  const [ack, setAck] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const rows = useMemo(
    () =>
      [...strategies].sort((a, b) => {
        if (sort === 'return') return b.lastReturn - a.lastReturn
        if (sort === 'rules') return b.rules - a.rules || b.lastReturn - a.lastReturn
        return b.updated.localeCompare(a.updated)
      }),
    [sort],
  )

  const med = useMemo(() => median(strategies.map((st) => st.lastReturn)), [])
  const medTone = med > 0 ? 'text-up' : med < 0 ? 'text-down' : 'text-muted'

  function copyToMine(st: Strategy) {
    const next: Copied[] = [
      { id: st.id, name: st.name[lang], timestamp: Date.now() },
      ...copied.filter((c) => c.id !== st.id),
    ]
    setCopied(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Persistence is best-effort; the copied state still shows this session.
    }

    setAck(`${s('copyAck')} · ${st.name[lang]}`)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setAck(null)
      timer.current = null
    }, 2000)
  }

  return (
    <Screen title={s('title')}>
      <section aria-label={s('summaryStrategies')} className="panel mt-2 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="t-kicker" style={{ color: 'var(--color-muted)' }}>
              {s('summaryStrategies')}
            </div>
            <div dir="ltr" className="num mt-1.5 text-[24px] leading-none font-semibold">
              {fmtNum(strategies.length, lang, 0)}
            </div>
          </div>
          <div className="min-w-0 text-end">
            <div className="t-kicker" style={{ color: 'var(--color-muted)' }}>
              {s('summaryMedian')}
            </div>
            <div dir="ltr" className={`num mt-1.5 text-[24px] leading-none font-semibold ${medTone}`}>
              {fmtPct(med, lang, 1)}
            </div>
          </div>
        </div>

        <Link
          to="/strategy"
          className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-[13px] active:opacity-80"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <span className="truncate">{s('openStrategy')}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : undefined }}
          >
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </Link>
      </section>

      <div
        role="group"
        aria-label={s('sortLabel')}
        className="mt-4 grid w-full grid-cols-3 rounded-full p-1"
        style={{ border: '1px solid var(--color-line)' }}
      >
        {(['return', 'rules', 'recent'] as const).map((k) => {
          const active = sort === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              aria-pressed={active}
              className={`min-h-11 truncate rounded-full px-1.5 text-[12px] transition-colors ${
                active ? 'font-medium text-fg' : 'text-muted'
              }`}
              style={active ? { background: 'var(--color-surface)' } : undefined}
            >
              {s(k === 'return' ? 'sortReturn' : k === 'rules' ? 'sortRules' : 'sortRecent')}
            </button>
          )
        })}
      </div>

      {/* Reserved band: the acknowledgement sits in flow, so it can never cover
          a row, and clearing it does not shift the list. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-2 flex h-9 items-center justify-center"
      >
        {ack && (
          <span
            className="max-w-full truncate rounded-full px-3 py-1 text-[12px] leading-snug"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 38%, transparent)',
            }}
          >
            {ack}
          </span>
        )}
      </div>

      <ul className="mt-1 space-y-3">
        {rows.map((st, i) => {
          const ret = st.lastReturn
          const rank = i + 1
          const isCopied = copied.some((c) => c.id === st.id)
          const tone = ret > 0 ? 'text-up' : ret < 0 ? 'text-down' : 'text-muted'

          return (
            <li key={st.id} className="panel p-3.5">
              <div className="flex items-start gap-3">
                <span
                  className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    background:
                      rank === 1
                        ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                        : 'var(--color-surface)',
                    border: `1px solid ${
                      rank === 1
                        ? 'color-mix(in srgb, var(--color-accent) 45%, transparent)'
                        : 'var(--color-line)'
                    }`,
                    color: rank === 1 ? 'var(--color-accent)' : 'var(--color-muted)',
                  }}
                >
                  <span className="sr-only">{s('rankLabel')} </span>
                  {rank}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-[15px] leading-snug font-semibold">
                      {st.name[lang]}
                    </h2>
                    <div className="shrink-0 text-end">
                      <div dir="ltr" className={`num text-[14px] leading-none font-medium ${tone}`}>
                        {fmtPct(ret, lang, 1)}
                      </div>
                      <div
                        className="mt-1 text-[10px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {s('lastYear')}
                      </div>
                    </div>
                  </div>

                  <p
                    className="mt-1 truncate text-[12px] leading-snug"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {st.description[lang]}
                  </p>

                  <div className="mt-2.5 flex items-end justify-between gap-2">
                    <div
                      className="min-w-0 flex-1 truncate text-[11px] leading-none"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <span dir="ltr" className="num">
                        {fmtNum(st.rules, lang, 0)}
                      </span>{' '}
                      {s('rulesUnit')}
                      <span aria-hidden="true"> · </span>
                      <span dir="ltr" className="num">
                        {st.updated}
                      </span>
                    </div>
                    <Spark series={SERIES[st.id] ?? equity.withCost} up={ret >= 0} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToMine(st)}
                aria-label={`${isCopied ? s('copied') : s('copy')} · ${st.name[lang]}`}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors active:opacity-80"
                style={
                  isCopied
                    ? {
                        background: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
                        border:
                          '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)',
                        color: 'var(--color-accent)',
                      }
                    : {
                        border: '1px solid var(--color-line)',
                        color: 'var(--color-fg)',
                      }
                }
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {isCopied ? s('copied') : s('copy')}
              </button>
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}
