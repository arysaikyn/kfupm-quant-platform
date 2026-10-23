import { useEffect, useState } from 'react'
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
import { setIntake } from '../ai/intake'
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

// Draw each symbol's line once per session. Replaying it on every open made
// navigation look like the page was re-rendering out of order.
const drawnSymbols = new Set<string>()

/** 320×150 area chart; scales with the card so it never clips on a phone. */
function PriceChart({ data, up, symbol }: { data: number[]; up: boolean; symbol: string }) {
  const [animate] = useState(() => !drawnSymbols.has(symbol))
  useEffect(() => {
    drawnSymbols.add(symbol)
  }, [symbol])
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
      className={`${animate ? "chart-draw" : ""} h-auto w-full`}
      aria-hidden="true"
    >
      {/* A flat 10% wash under the line: a hint of direction, never a glow. */}
      <path
        d={area}
        style={{ fill: `color-mix(in srgb, ${stroke} 4%, transparent)` }}
      />
      <path
        d={line}
        style={{ fill: 'none', stroke }}
        strokeWidth="1.5"
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
            style={{ background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }}
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

  return (
    <Screen
      title={quote.name[lang]}
      leading={back}
      action={
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-pressed={watched}
            aria-label={`${watched ? c('watchOn') : c('watchAdd')} ${quote.name[lang]}`}
            onClick={() => toggleWatch(quote.symbol)}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:bg-fg/10"
            style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={watched ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
            </svg>
          </button>
          <Link
            to={`/compare?a=${quote.symbol}`}
            className="flex min-h-11 shrink-0 items-center rounded-full bg-surface px-3.5 text-[12px] text-muted"
          >
            {s('goCompare')}
          </Link>
        </div>
      }
    >
      {/* The price owns the screen: one number, type on the canvas, no card */}
      <div className="mt-1">
        <p className="t-sym" style={{ color: 'var(--color-muted)' }}>
          {quote.symbol} · {quote.currency}
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="t-display num text-[56px] leading-[0.95]">
            <AnimatedNumber value={quote.price} format={(n) => fmtNum(n, lang, 2)} />
          </span>
          <span
            className="num flex items-center gap-1 pb-1 text-[14px] font-medium"
            style={{ color: token }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
              <path d={up ? 'M5 1.5 9 8H1z' : 'M5 8.5 1 2h8z'} fill="currentColor" />
            </svg>
            {fmtPct(quote.change, lang)}
          </span>
          <span className="pb-1 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            {s('today')}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setIntake(`${s('askAbout')} ${quote.name[lang]}`, [{ kind: 'quote', symbol: quote.symbol }])
              navigate('/ai')
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" />
            </svg>
            {s('askAbout')}
          </button>
          <Link
            to={`/alerts?symbol=${quote.symbol}`}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('setAlert')}
          </Link>
        </div>
      </div>

      {/* Fair value rail: price against the model's fair value, before anything
          else. A rule and space, not a second box under the price. */}
      <div className="mt-8 border-t border-line pt-4">
        <FairValueRail
          price={quote.price}
          fairValue={fairValue}
          format={(n) => fmtNum(n, lang, 2)}
          percent={(n) => fmtNum(n, lang, 0, '%')}
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

      {/* Chart: full width, no frame; the series is the page's texture */}
      <div className="mt-8 border-t border-line pt-4">
        <PriceChart data={series} up={up} symbol={quote.symbol} />
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
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                <span
                  className="px-2 py-1.5 text-[12px]"
                  style={
                    on
                      ? {
                          color: 'var(--color-fg)',
                          fontWeight: 600,
                          borderBottom: '2px solid var(--color-fg)',
                        }
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

      {/* Rules: a hairline list, not a card */}
      <h2 className="mt-8 text-[15px] font-semibold">{s('rulesTitle')}</h2>
      <ul className="mt-2">
        {rules.map((r) => (
          <li
            key={r.title}
            className="flex min-h-[56px] items-center justify-between gap-3 border-t border-line"
          >
            <p className="min-w-0 truncate text-[14px]">{r.title}</p>
            <p className="num shrink-0 text-end text-[12px] text-muted">{r.sub}</p>
          </li>
        ))}
      </ul>

      {/* Five-axis score: the polygon is the summary, the rows are the audit */}
      <h2 className="mt-8 text-[15px] font-semibold">{c('factorsTitle')}</h2>
      <div className="mt-3">
        <div className="flex items-center gap-4">
          <Snowflake
            scores={axes.map((a) => a.score)}
            labels={axes.map((a) => axisLabel[a.axis])}
            max={6}
            size={132}
            aria={axes.map((a) => `${axisLabel[a.axis]} ${a.score}/${a.total}`).join(', ')}
          />
          <ul className="min-w-0 flex-1 space-y-2">
            {axes.map((a) => {
              const tone =
                a.score >= 4
                  ? 'var(--color-up)'
                  : a.score <= 1
                    ? 'var(--color-down)'
                    : 'var(--color-muted)'
              return (
                <li key={a.axis} className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[14px]">{axisLabel[a.axis]}</span>
                  <span className="num shrink-0 text-[14px] font-semibold" style={{ color: tone }}>
                    {a.score}/{a.total}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        <p className="mt-4 text-[12px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {c('factorsHint')}
        </p>
      </div>

      {/* Strengths and risks: one list, two group labels. The same checks the
          axes count, read out in words. */}
      <h2 className="mt-8 text-[15px] font-semibold">{c('checksTitle')}</h2>
      <div className="mt-2">
        <p className="text-[12px] font-medium" style={{ color: 'var(--color-muted)' }}>
          {c('rewardsTitle')}
        </p>
        <ul className="mt-1 divide-y divide-line border-t border-line">
          {rewards.map((k) => (
            <li key={k.id} className="flex min-h-[44px] items-start gap-2.5 py-2.5">
              <span className="mt-0.5 shrink-0 text-[12px]" style={{ color: 'var(--color-up)' }}>✓</span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug">{k.label[lang]}</span>
              <span className="num shrink-0 text-[12px]" style={{ color: 'var(--color-muted)' }}>{k.value}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[12px] font-medium" style={{ color: 'var(--color-muted)' }}>
          {c('risksTitle')}
        </p>
        <ul className="mt-1 divide-y divide-line border-t border-line">
          {risks.map((k) => (
            <li key={k.id} className="flex min-h-[44px] items-start gap-2.5 py-2.5">
              <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-down)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block">
                  <path d="M12 4 2.6 20h18.8L12 4Z" />
                  <path d="M12 10v3.5" />
                  <path d="M12 17.2v.2" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug">{k.label[lang]}</span>
              <span className="num shrink-0 text-[12px]" style={{ color: 'var(--color-muted)' }}>{k.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Peers: a hairline list with a column rail, the same shape as the board */}
      <h2 className="mt-8 text-[15px] font-semibold">{c('peersTitle')}</h2>
      <div className="mt-2 border-t border-line">
        <div aria-hidden="true" className={`${PEER_GRID} border-b border-line py-2`}>
          <span className="text-[12px] text-muted">{c('colName')}</span>
          <span className="text-end text-[12px] text-muted">{c('colPrice')}</span>
          <span className="text-end text-[12px] text-muted">{c('colChg')}</span>
        </div>
        <ul className="divide-y divide-line">
          {peers.map((p) => {
            const pUp = p.change >= 0
            return (
              <li key={p.symbol}>
                <Link
                  to={`/m/${p.symbol}`}
                  className={`${PEER_GRID} min-h-[56px] py-2 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/10`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] leading-tight font-medium">
                      {p.name[lang]}
                    </span>
                    <span
                      className="num mt-0.5 block truncate text-[12px] leading-none"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {p.symbol} · {p.currency}
                    </span>
                  </span>
                  <span className="num text-end text-[14px]">
                    <AnimatedNumber value={p.price} format={(n) => fmtNum(n, lang, 2)} />
                  </span>
                  <span
                    className="num text-end text-[14px]"
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
      <h2 className="mt-8 text-[15px] font-semibold">{c('whyTitle')}</h2>
      <ul className="mt-3 space-y-2.5">
        {why.map((w) => (
          <li key={w.attr} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: w.tone }}
            />
            <p className="min-w-0 text-[14px] leading-relaxed">
              <span className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
                {w.attr} ·{' '}
              </span>
              {w.text}
            </p>
          </li>
        ))}
      </ul>

      {/* Related news: the last thing on the page, because it is context for
          the figures above, not a headline of its own. */}
      <h2 className="mt-8 text-[15px] font-semibold">{s('newsTitle')}</h2>
      {related.length === 0 ? (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
          {s('newsEmpty')}
        </p>
      ) : (
        <ul className="mt-2">
          {related.map((n) => (
            <li key={n.id} className="border-t border-line">
              <Link
                to={`/news/${n.id}`}
                className="block min-h-[56px] py-3 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/10"
              >
                <p className="line-clamp-2 text-[14px] leading-snug">{n.title[lang]}</p>
                <p className="num mt-1.5 text-[12px] text-muted">
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
