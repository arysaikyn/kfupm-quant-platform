import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { FairValueRail } from '../../components/FairValueRail'
import { Snowflake } from '../../components/Snowflake'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { fundamentalsFor } from '../../data/fundamentals'
import { news, quotes } from '../../data/mock'
import { axisScores, checkList, strengthsAndRisks } from './checks'
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
      aria-hidden="true"
    >
      {/* A flat 10% wash under the line: a hint of direction, never a glow. */}
      <path
        d={area}
        style={{ fill: `color-mix(in srgb, ${stroke} 6%, transparent)` }}
      />
      <path
        d={line}
        style={{ fill: 'none', stroke }}
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface"
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
            className="flex min-h-11 items-center rounded-full px-4 text-[13px] font-medium"
            style={{ background: 'var(--color-accent-fill)', color: '#fff' }}
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
  // Read the same fundamentals block the Sharia screen scores, so the yield in
  // the dividend rule and the "yield below 5%" check can never disagree.
  const fundamentals = fundamentalsFor(quote.symbol, quote.price)
  const divYield = fundamentals.dividendYield

  // Peer set: the first three other names on the board.
  const peers = quotes.filter((q) => q.symbol !== quote.symbol).slice(0, 3)

  // Five axes, six named checks each. The score is a count of passes, never a
  // grade: 4/6 says "four of these six rules hold", which a reader can audit.
  const checks = checkList(quote.symbol, quote.price)
  const axes = axisScores(checks)
  const { rewards, risks } = strengthsAndRisks(checks, 3)
  const fairValue = fundamentals.fairValue
  const axisLabel: Record<string, string> = {
    value: c('factorValue'),
    growth: c('factorQuality'),
    past: c('factorMomentum'),
    health: c('factorVolatility'),
    sharia: c('axisSharia'),
  }

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
    <Screen
      title={quote.name[lang]}
      leading={back}
      action={
        <Link
          to={`/compare?a=${quote.symbol}`}
          className="flex min-h-11 shrink-0 items-center rounded-full bg-surface px-3.5 text-[12px] text-muted"
        >
          {s('goCompare')}
        </Link>
      }
    >
      {/* Price header */}
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-[11px] tracking-[0.12em]" style={{ color: 'var(--color-muted)' }}>
            {quote.symbol} · {quote.currency}
          </p>
          <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="t-display num text-[46px] leading-none">
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
                  color: 'var(--color-accent)',
                }
              : { background: 'var(--color-surface)', color: 'var(--color-muted)' }
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

      {/* Fair value rail: price against the model's fair value, before anything else */}
      <div className="mt-3">
        <FairValueRail
          price={quote.price}
          fairValue={fairValue}
          format={(n) => fmtNum(n, lang, 2)}
          labels={{
            title: c('fairTitle'),
            price: c('fairPrice'),
            fair: c('fairValueLabel'),
            undervalued: c('undervalued'),
            overvalued: c('overvalued'),
            aboutRight: c('aboutRight'),
          }}
        />
      </div>

      {/* Chart */}
      <div className="panel mt-4 p-3">
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
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
                  style={
                    on
                      ? { background: 'var(--color-accent-fill)', color: '#fff' }
                      : { color: 'var(--color-muted)' }
                  }
                >
                  {r}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Rules */}
      <SectionHead title={s('rulesTitle')} />
      <div className="panel mt-2">
        {rules.map((r) => (
          <div key={r.title} className="row justify-between gap-3">
            <p className="min-w-0 truncate text-[13px]">{r.title}</p>
            <p className="num shrink-0 text-end text-[11px] text-muted">{r.sub}</p>
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
        <ul className="panel mt-2 overflow-hidden">
          {related.map((n) => (
            <li key={n.id} className="row">
              <Link to={`/news/${n.id}`} className="block w-full py-3 transition-colors active:bg-fg/10">
                <p className="line-clamp-2 text-[14px] leading-snug">{n.title[lang]}</p>
                <p className="num mt-1.5 text-[11px] text-muted">
                  {n.source} · {s('timePrefix')} {fmtNum(n.minutesAgo, lang, 0)} {s('timeSuffix')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Five-axis score: the polygon is the summary, the rows are the audit */}
      <SectionHead title={c('factorsTitle')} />
      <div className="panel mt-3 p-4">
        <div className="flex items-center gap-4">
          <Snowflake
            scores={axes.map((a) => a.score)}
            labels={axes.map((a) => axisLabel[a.axis])}
            max={6}
            size={132}
            aria={axes.map((a) => `${axisLabel[a.axis]} ${a.score}/${a.total}`).join(', ')}
          />
          <ul className="min-w-0 flex-1 space-y-1.5">
            {axes.map((a) => {
              const tone =
                a.score >= 4
                  ? 'var(--color-up)'
                  : a.score <= 1
                    ? 'var(--color-down)'
                    : 'var(--color-muted)'
              return (
                <li key={a.axis} className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12px]">{axisLabel[a.axis]}</span>
                  <span className="num shrink-0 text-[12px] font-semibold" style={{ color: tone }}>
                    {a.score}/{a.total}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {c('factorsHint')}
        </p>
      </div>

      {/* Strengths / risks: the same checks, read out in words */}
      <SectionHead title={c('rewardsTitle')} />
      <div className="panel mt-3 divide-y divide-line overflow-hidden">
        {rewards.map((k) => (
          <div key={k.id} className="flex items-start gap-2.5 px-4 py-2.5">
            <span className="mt-0.5 shrink-0 text-[12px]" style={{ color: 'var(--color-up)' }}>✓</span>
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug">{k.label[lang]}</span>
            <span className="num shrink-0 text-[11px]" style={{ color: 'var(--color-muted)' }}>{k.value}</span>
          </div>
        ))}
      </div>

      <SectionHead title={c('risksTitle')} />
      <div className="panel mt-3 divide-y divide-line overflow-hidden">
        {risks.map((k) => (
          <div key={k.id} className="flex items-start gap-2.5 px-4 py-2.5">
            <span className="mt-0.5 shrink-0 text-[12px]" style={{ color: 'var(--color-down)' }}>⚠</span>
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug">{k.label[lang]}</span>
            <span className="num shrink-0 text-[11px]" style={{ color: 'var(--color-muted)' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Peer comparison */}
      <SectionHead title={c('peersTitle')} />
      <div className="panel mt-3 divide-y divide-line overflow-hidden">
        <div aria-hidden="true" className={`${PEER_GRID} px-3 py-2`}>
          <span className="text-[11px] text-muted">{c('colName')}</span>
          <span className="text-end text-[11px] text-muted">{c('colPrice')}</span>
          <span className="text-end text-[11px] text-muted">{c('colChg')}</span>
        </div>
        <ul className="divide-y divide-line">
          {peers.map((p) => {
            const pUp = p.change >= 0
            return (
              <li key={p.symbol}>
                <Link
                  to={`/m/${p.symbol}`}
                  className={`${PEER_GRID} min-h-14 px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/10`}
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
