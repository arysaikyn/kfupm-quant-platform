import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { news, quotes } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import { SectionHead } from './SectionHead'
import { strings } from './strings'
import { symbolStrings } from './symbolStrings'

const RANGES = ['1D', '1M', '6M', '1Y']

/** Shared by the peer header rail and its rows so the figures line up. */
const PEER_GRID = 'grid grid-cols-[minmax(0,1fr)_72px_60px] items-center gap-x-2'

/** Swap `{name}` slots in a translated template. */
const fill = (tpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    tpl,
  )

/** Deterministic 1–99 score; the hash keeps each symbol stable across visits. */
const hashSymbol = (symbol: string) =>
  [...symbol].reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 100003, 7)

const clampScore = (n: number) => Math.max(1, Math.min(99, Math.round(n)))

// Draw the line once per session. Replaying it on every open made navigation
// look like the page was re-rendering out of order.
let hasDrawnOnce = false

/** 320×150 area chart; scales with the card so it never clips on a phone. */
function PriceChart({ data, up }: { data: number[]; up: boolean }) {
  const w = 320
  const h = 150
  const pad = 6
  const min = Math.min(...data)
  const span = Math.max(...data) - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ])
  const line = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`
  const stroke = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`${hasDrawnOnce ? "" : "chart-draw"} h-auto w-full`}
      style={{ filter: `drop-shadow(0 0 14px color-mix(in srgb, ${stroke} 45%, transparent))` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#priceFill)" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SymbolPage() {
  const { symbol = '' } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { t, lang, dir } = useI18n()
  const s = useStrings(strings)
  const c = useStrings(symbolStrings)
  const { watchlist } = useUser()
  const [range, setRange] = useState<string>('1Y')

  const quote = quotes.find((q) => q.symbol === symbol)
  const watched = watchlist.includes(symbol)

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }

  const back = (
    <button
      type="button"
      onClick={goBack}
      aria-label={t('common.back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ border: '1px solid var(--color-line)', color: 'var(--color-fg)' }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
  )

  if (!quote) {
    return (
      <Screen title={s('notFound')} leading={back}>
        <ErrorState message={s('notFoundHint')} />
        <div className="flex justify-center">
          <Link
            to="/"
            className="flex min-h-[44px] items-center rounded-full px-4 text-[13px]"
            style={{ border: '1px solid var(--color-line)' }}
          >
            {t('tab.market')}
          </Link>
        </div>
      </Screen>
    )
  }

  const up = quote.change >= 0
  const token = up ? 'var(--color-up)' : 'var(--color-down)'
  // The range buttons are real: each one shows a shorter slice of the series.
  const SPANS: Record<string, number> = { '1D': 10, '1M': 20, '6M': 30, '1Y': quote.spark.length }
  const series = quote.spark.slice(-(SPANS[range] ?? quote.spark.length))
  // 40-day momentum: the last spark point against the first one.
  const move = quote.spark[quote.spark.length - 1] / quote.spark[0] - 1
  const moves = quote.spark.slice(1).map((v, i) => Math.abs(v / quote.spark[i] - 1))
  const volatility = moves.reduce((a, m) => a + m, 0) / moves.length
  // Stable per-symbol mock yield in the 2.4%–4.9% band.
  const divYield =
    0.024 + ([...quote.symbol].reduce((a, c) => a + c.charCodeAt(0), 0) % 26) * 0.001

  // Peer set: neither quotes nor sectors carry a membership map in the mock,
  // so compare the first three other names in the board.
  const peers = quotes.filter((q) => q.symbol !== quote.symbol).slice(0, 3)

  // Factor scores: the symbol hash gives every name a stable base, then the
  // quote's own change, momentum and volatility tilt each factor.
  const seed = hashSymbol(quote.symbol)
  const factors = [
    {
      key: 'value',
      label: c('factorValue'),
      score: clampScore(44 + (seed % 31) + quote.change * 380),
    },
    {
      key: 'quality',
      label: c('factorQuality'),
      score: clampScore(
        48 + ((seed >> 3) % 29) + quote.change * 220 - volatility * 180,
      ),
    },
    {
      key: 'momentum',
      label: c('factorMomentum'),
      score: clampScore(34 + ((seed >> 6) % 29) + move * 300),
    },
    {
      key: 'volatility',
      label: c('factorVolatility'),
      score: clampScore(
        34 + ((seed >> 9) % 29) + volatility * 900 + Math.abs(quote.change) * 200,
      ),
    },
  ]

  // Why it moved: each bullet counts something in this quote's own series.
  const closes = quote.spark.slice(-6)
  const higher = closes.slice(1).filter((v, i) => v > closes[i]).length
  const closedUp = higher * 2 >= closes.length - 1
  const pulse = Math.abs(quote.change) / (volatility || 1)
  const why = [
    {
      attr: c('whyAttrStreak'),
      tone: closedUp ? 'var(--color-up)' : 'var(--color-down)',
      text: fill(closedUp ? c('whyStreakUp') : c('whyStreakDown'), {
        n: fmtNum(closes.length - 1, lang, 0),
        k: fmtNum(closedUp ? higher : closes.length - 1 - higher, lang, 0),
      }),
    },
    {
      attr: c('whyAttrPulse'),
      tone: token,
      text: fill(c('whyPulse'), {
        chg: fmtPct(quote.change, lang),
        x: fmtNum(Math.max(0.1, pulse), lang, 1),
      }),
    },
    {
      attr: c('whyAttrMomentum'),
      tone: move >= 0 ? 'var(--color-up)' : 'var(--color-down)',
      text: fill(move >= 0 ? c('whyMomentumUp') : c('whyMomentumDown'), {
        move: fmtPct(move, lang, 1),
      }),
    },
  ]

  const rules = [
    {
      title: move >= 0 ? s('ruleTrendUp') : s('ruleTrendDown'),
      sub: `${s('ruleTrendSub')} ${fmtPct(move, lang, 1)}`,
    },
    { title: s('ruleCalm'), sub: `${s('ruleCalmSub')} ${fmtNum(volatility * 100, lang, 2, '%')}` },
    { title: s('ruleHeavy'), sub: s('ruleHeavySub') },
    {
      title: s('ruleDividend'),
      sub: `${s('ruleDividendSub')} ${fmtNum(divYield * 100, lang, 1, '%')}`,
    },
  ]
  const related = news.filter((n) => n.symbols.includes(quote.symbol)).slice(0, 2)
  hasDrawnOnce = true

  return (
    <Screen title={quote.name[lang]} leading={back}>
      {/* Price header */}
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-[11px] tracking-[0.12em]" style={{ color: 'var(--color-muted)' }}>
            {quote.symbol} · {quote.currency}
          </p>
          <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="t-display num text-[46px] leading-none font-bold italic">
              <AnimatedNumber value={quote.price} format={(n) => fmtNum(n, lang, 2)} />
            </span>
            <span className="pb-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
              {quote.currency}
            </span>
          </div>
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: `color-mix(in srgb, ${token} 16%, transparent)`,
              color: token,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
              <path d={up ? 'M5 1.5 9 8H1z' : 'M5 8.5 1 2h8z'} fill="currentColor" />
            </svg>
            <span className="num text-[13px] font-medium">{fmtPct(quote.change, lang)}</span>
            <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
              {s('today')}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-pressed={watched}
          onClick={() => toggleWatch(quote.symbol)}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-75"
          style={
            watched
              ? {
                  background: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 38%, transparent)',
                  color: 'var(--color-accent)',
                }
              : { border: '1px solid var(--color-line)', color: 'var(--color-muted)' }
          }
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={watched ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
          </svg>
          {watched ? c('watchOn') : c('watchAdd')}
        </button>
      </div>

      {/* Chart */}
      <div
        className="mt-4 rounded-2xl p-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
      >
        <PriceChart data={series} up={up} />
        <div
          role="group"
          aria-label={s('rangeGroup')}
          className="mt-3 flex items-center gap-1.5"
        >
          {RANGES.map((r) => {
            const on = r === range
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => setRange(r)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={
                  on
                    ? { background: 'var(--color-accent)', color: '#fff' }
                    : { color: 'var(--color-muted)' }
                }
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rules */}
      <SectionHead title={s('rulesTitle')} />
      <div className="mt-2 flex flex-wrap gap-2">
        {rules.map((r) => (
          <div
            key={r.title}
            className="max-w-full rounded-2xl px-3 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
          >
            <p className="text-[13px] font-medium">{r.title}</p>
            <p className="num mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
              {r.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Related news */}
      <SectionHead title={s('newsTitle')} />
      {related.length === 0 ? (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
          {s('newsEmpty')}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {related.map((n) => (
            <li key={n.id}>
              <Link
                to={`/news/${n.id}`}
                className="block rounded-2xl px-3.5 py-3 active:opacity-75"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
              >
                <p className="line-clamp-2 text-[14px] leading-snug">{n.title[lang]}</p>
                <p className="num mt-1.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {n.source} · {s('timePrefix')} {fmtNum(n.minutesAgo, lang, 0)} {s('timeSuffix')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Factor scores */}
      <SectionHead title={c('factorsTitle')} />
      <div className="panel mt-3 p-4">
        <ul className="space-y-3">
          {factors.map((f) => (
            <li
              key={f.key}
              className="grid grid-cols-[68px_minmax(0,1fr)_24px] items-center gap-x-2.5"
            >
              <span className="truncate text-[12px] font-medium">{f.label}</span>
              <div
                aria-hidden="true"
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--color-line)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${f.score}%`, background: 'var(--color-accent)' }}
                />
              </div>
              <span className="num text-end text-[13px] font-semibold">{f.score}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Peer comparison */}
      <SectionHead title={c('peersTitle')} />
      <div className="panel mt-3 overflow-hidden">
        <div
          aria-hidden="true"
          className={`${PEER_GRID} px-3 py-2`}
          style={{ borderBottom: '1px solid var(--color-line)' }}
        >
          <span className="t-kicker">{c('colName')}</span>
          <span className="t-kicker text-end">{c('colPrice')}</span>
          <span className="t-kicker text-end">{c('colChg')}</span>
        </div>
        <ul className="divide-y divide-line">
          {peers.map((p) => {
            const pUp = p.change >= 0
            return (
              <li key={p.symbol}>
                <Link
                  to={`/m/${p.symbol}`}
                  className={`${PEER_GRID} min-h-[44px] px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] leading-tight font-medium">
                      {p.name[lang]}
                    </span>
                    <span
                      className="num mt-0.5 block truncate text-[11px] leading-none"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {p.symbol} · {p.currency}
                    </span>
                  </span>
                  <span className="num text-end text-[12px]">
                    <AnimatedNumber value={p.price} format={(n) => fmtNum(n, lang, 2)} />
                  </span>
                  <span
                    className="num text-end text-[12px]"
                    style={{ color: pUp ? 'var(--color-up)' : 'var(--color-down)' }}
                  >
                    {fmtPct(p.change, lang)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Why it moved */}
      <SectionHead title={c('whyTitle')} />
      <ul className="mt-3 space-y-2">
        {why.map((w) => (
          <li key={w.attr} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: w.tone }}
            />
            <p className="min-w-0 text-[12px] leading-relaxed">
              <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                {w.attr} ·{' '}
              </span>
              {w.text}
            </p>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
