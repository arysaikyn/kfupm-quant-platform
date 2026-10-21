import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { news, quotes } from '../../data/mock'
import { SectionHead } from './SectionHead'
import { strings } from './strings'

const RANGES = ['1D', '1M', '6M', '1Y']

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
      className="chart-draw h-auto w-full"
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
  const [range, setRange] = useState<string>('1Y')

  const quote = quotes.find((q) => q.symbol === symbol)

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

  const rules = [
    {
      title: move >= 0 ? s('ruleTrendUp') : s('ruleTrendDown'),
      sub: `${s('ruleTrendSub')} ${fmtPct(move, lang, 1)}`,
    },
    { title: s('ruleCalm'), sub: `${s('ruleCalmSub')} ${fmtNum(volatility * 100, lang, 2)}%` },
    { title: s('ruleHeavy'), sub: s('ruleHeavySub') },
    {
      title: s('ruleDividend'),
      sub: `${s('ruleDividendSub')} ${fmtNum(divYield * 100, lang, 1)}%`,
    },
  ]
  const related = news.filter((n) => n.symbols.includes(quote.symbol)).slice(0, 2)

  return (
    <Screen title={quote.name[lang]} leading={back}>
      {/* Price header */}
      <div className="mt-1">
        <p className="num text-[11px] tracking-[0.12em]" style={{ color: 'var(--color-muted)' }}>
          {quote.symbol} · {quote.currency}
        </p>
        <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="num text-[46px] leading-none font-bold italic tracking-tight">
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
      <SectionHead title={s('rulesTitle')} hint={s('rulesHint')} />
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
    </Screen>
  )
}
