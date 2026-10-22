import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { BarStrip } from '../../components/BarStrip'
import { LongPressLink } from '../../components/LongPressLink'
import { TickerTape } from '../../components/TickerTape'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { indices, quotes, sectors } from '../../data/mock'
import type { Quote, Sector } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import { SectionHead } from './SectionHead'
import { strings } from './strings'

/** Which stocks sit in which sector. The mock quotes carry no sector field. */
const SECTOR_MEMBERS: Record<string, string[]> = {
  energy: ['2222'],
  banks: ['1120'],
  materials: ['2010'],
  tech: ['0700'],
  retail: [],
  utilities: [],
  health: [],
  telecom: [],
}

/** Treemap rows: area ∝ weight, split so every tile stays tappable on a phone. */
const HEAT_ROWS: Sector[][] = (() => {
  const sorted = [...sectors].sort((a, b) => b.weight - a.weight)
  const rows: Sector[][] = []
  for (let i = 0; i < sorted.length; i += 3) rows.push(sorted.slice(i, i + 3))
  return rows
})()

const TILE_UNIT = 2.8

/** One grid for the header rail and every row, so the columns stack in a line.
    The last 44px of the row are padding, not a column: the star floats there on
    every row, so it costs the name nothing at any width. Below 480px the 1M
    sparkline drops out of the track list; that is the only way the name, price
    and change all still fit at 360px. */
const ROW_GRID =
  'grid grid-cols-[18px_minmax(0,1fr)_84px_60px_70px] items-center gap-x-2 ' +
  'max-[480px]:grid-cols-[16px_minmax(0,1fr)_54px_62px]'

/** Cells that carry the sparkline; the rail header hides with it. */
const SPARK_CELL = 'max-[480px]:hidden'

/** A move this large is worth surfacing on the strip. */
const ALERT_MOVE = 0.01

type Sort = 'chg' | 'fall' | 'name'

const SORTS = ['chg', 'fall', 'name'] as const

const SORT_KEY = { chg: 'sortGain', fall: 'sortLoss', name: 'sortName' } as const

type Alert = { symbol: string; tone: string; text: string }

/** A drawn triangle, not ▲: at 8px the text glyph sits on a different baseline
    in every locale font, which is what made the old rows look unaligned. */
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="8"
      height="8"
      viewBox="0 0 8 8"
      className="shrink-0"
      style={{ fill: 'currentColor' }}
    >
      <path d={up ? 'M4 1.3 7.5 6.9H.5z' : 'M4 6.7.5 1.1h7z'} />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.62 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z" />
    </svg>
  )
}

/** Sits on top of the row's trailing 44px, never inside the link: the row stays
    one tap target for /m/{symbol} and the star is a sibling, not a nested button. */
function WatchStar({
  watched,
  label,
  onToggle,
}: {
  watched: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={watched}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onToggle()
      }}
      className="absolute top-1/2 end-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
    >
      <StarIcon filled={watched} />
    </button>
  )
}

export default function MarketPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()
  const [sector, setSector] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('chg')

  const ranked = useMemo(() => {
    const members = sector ? (SECTOR_MEMBERS[sector] ?? []) : null
    const list = members ? quotes.filter((q) => members.includes(q.symbol)) : quotes
    return [...list].sort((a, b) =>
      sort === 'chg'
        ? b.change - a.change
        : sort === 'fall'
          ? a.change - b.change
          : a.name[lang].localeCompare(b.name[lang], lang),
    )
  }, [sector, sort, lang])

  // Symbols arrive newest first from the store; the mock quote is the row.
  const watched = useMemo(
    () =>
      watchlist
        .map((symbol) => quotes.find((q) => q.symbol === symbol))
        .filter((q): q is Quote => Boolean(q)),
    [watchlist],
  )

  // Alerts are derived on every render pass, never stored: the biggest moves
  // lead, then the day's extremes fill the strip if fewer than three qualified.
  const alerts = useMemo(() => {
    const out: Alert[] = []
    const add = (q: Quote, tone: string, text: string) => {
      if (out.length >= 3 || out.some((a) => a.symbol === q.symbol)) return
      out.push({ symbol: q.symbol, tone, text })
    }
    const movers = [...quotes].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    for (const q of movers) {
      if (Math.abs(q.change) < ALERT_MOVE) continue
      const up = q.change >= 0
      add(
        q,
        up ? 'var(--color-up)' : 'var(--color-down)',
        `${fmtPct(q.change, lang)} ${s(up ? 'alertOverUp' : 'alertOverDown')}`,
      )
    }
    const byChange = [...quotes].sort((a, b) => b.change - a.change)
    const gainer = byChange[0]
    const loser = byChange[byChange.length - 1]
    if (gainer) {
      add(
        gainer,
        'var(--color-up)',
        `${fmtPct(gainer.change, lang)} ${s('alertTopGainer')}`,
      )
    }
    if (loser && loser.change < 0) {
      add(
        loser,
        'var(--color-down)',
        `${fmtPct(loser.change, lang)} ${s('alertTopLoser')}`,
      )
    }
    return out
  }, [lang, s])

  // Breadth is read off the rows the user is looking at, not the whole market,
  // so the summary and the list can never disagree after a sector filter.
  const breadth = useMemo(() => {
    const up = ranked.filter((q) => q.change >= 0).length
    return { up, down: ranked.length - up }
  }, [ranked])

  const breadthTone =
    breadth.up > breadth.down
      ? 'var(--color-up)'
      : breadth.down > breadth.up
        ? 'var(--color-down)'
        : 'var(--color-muted)'

  // .t-kicker sets 10px unlayered, so the rail's 11px has to come inline.
  const kicker = {
    color: 'var(--color-muted)',
    fontSize: 11,
    // Letter-spacing tears the joins in Arabic script.
    letterSpacing: lang === 'ar' ? 0 : undefined,
  }

  const scrollToRanking = () =>
    document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <Screen title={t('tab.market')} subtitle={s('subtitle')}>
      {/* Market switch — visual only for now. */}
      <div role="group" aria-label={s('markets')} className="mt-1 flex flex-wrap gap-2">
        {[s('mSaudi'), s('mCn'), s('mHk')].map((label, i) => (
          <span
            key={label}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium"
            style={
              i === 0
                ? { background: 'var(--color-fg)', color: 'var(--color-bg)' }
                : { border: '1px solid var(--color-line)', color: 'var(--color-muted)' }
            }
          >
            {label}
          </span>
        ))}
      </div>

      {/* Live tape: the screen's signature, 0 KB */}
      <div className="mt-3 border-y" style={{ borderColor: 'var(--color-line)' }}>
        <TickerTape
          quotes={quotes.slice(0, 5).concat(indices.map((ix) => ({
            symbol: ix.symbol,
            name: ix.name,
            price: ix.value,
            change: ix.change,
            currency: '',
            spark: [ix.value],
          }))).slice(0, 8)}
          name={(q) => q.name[lang]}
          price={(q) => fmtNum(q.price, lang, 2)}
          change={(q) => fmtPct(q.change, lang)}
        />
      </div>

      {/* Alerts: every value is computed from the quotes above, none is stored */}
      {alerts.length > 0 && (
        <div className="mt-3">
          <p className="t-kicker" style={kicker}>
            {s('alertsLabel')}
          </p>
          <div
            className="-mx-4 mt-1.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
          >
            {alerts.map((a) => (
              <Link
                key={a.symbol}
                to={`/m/${a.symbol}`}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] whitespace-nowrap transition-colors active:opacity-70"
                style={{
                  border: `1px solid color-mix(in srgb, ${a.tone} 30%, transparent)`,
                  background: `color-mix(in srgb, ${a.tone} 10%, transparent)`,
                }}
              >
                <span className="num font-semibold" style={{ color: a.tone }}>
                  {a.symbol}
                </span>
                <span style={{ color: 'var(--color-fg)' }}>{a.text}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ways into the deeper screens, kept to one thumb-height row */}
      <nav className="mt-3 grid grid-cols-4 gap-2" aria-label={s('moreScreens')}>
        {[
          { to: '/screener', label: s('goScreener') },
          { to: '/review', label: s('goReview') },
          { to: '/alerts', label: s('goAlerts') },
          { to: '/compare', label: s('goCompare') },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="panel flex min-h-[44px] items-center justify-center px-1 text-center text-[11px] leading-tight"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Index masthead: one hero figure, then the rest as a compact row */}
      <div className="mt-5">
        {indices[0] && (
          <div className="panel px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="t-kicker" style={{ color: 'var(--color-muted)' }}>
                {indices[0].name[lang]}
              </p>
              <p
                className="num text-[12px]"
                style={{ color: indices[0].change >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
              >
                {fmtPct(indices[0].change, lang)}
              </p>
            </div>
            <p className="t-display num mt-1 text-[40px] leading-none font-bold italic">
              <AnimatedNumber value={indices[0].value} format={(n) => fmtNum(n, lang, 2)} />
            </p>
          </div>
        )}
        <div
          className="mt-2 flex snap-x gap-2.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {indices.slice(1).map((ix) => {
            const up = ix.change >= 0
            return (
              <div key={ix.symbol} className="panel w-[152px] shrink-0 snap-start p-3">
                <p className="truncate text-[12px]" style={{ color: 'var(--color-muted)' }}>
                  {ix.name[lang]}
                </p>
                <p className="num mt-1.5 text-[19px] leading-none font-semibold">
                  <AnimatedNumber value={ix.value} format={(n) => fmtNum(n, lang, 2)} />
                </p>
                <p className={`num mt-1.5 text-[12px] ${up ? 'text-up' : 'text-down'}`}>
                  {fmtPct(ix.change, lang)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sector heatmap */}
      <SectionHead title={s('heatTitle')} hint={s('heatHint')} />
      <div className="mt-2 flex flex-col gap-1.5">
        {HEAT_ROWS.map((row) => {
          const sum = row.reduce((a, r) => a + r.weight, 0)
          return (
            <div
              key={row.map((r) => r.id).join('-')}
              className="flex gap-1.5"
              style={{ height: Math.max(64, Math.round(sum * TILE_UNIT)) }}
            >
              {row.map((sec) => {
                const up = sec.change >= 0
                const selected = sector === sec.id
                const token = up ? 'var(--color-up)' : 'var(--color-down)'
                const alpha = 22 + Math.min(Math.abs(sec.change) / 0.02, 1) * 26
                return (
                  <button
                    key={sec.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSector(selected ? null : sec.id)}
                    className="flex min-w-0 flex-col justify-between rounded-[14px] p-2.5 text-start"
                    style={{
                      flexGrow: sec.weight,
                      flexBasis: 0,
                      background: `linear-gradient(165deg, color-mix(in srgb, ${token} ${Math.round(alpha * 0.9)}%, transparent), color-mix(in srgb, ${token} ${Math.round(alpha * 0.2)}%, transparent))`,
                      border: `1px solid color-mix(in srgb, ${token} 26%, transparent)`,
                      boxShadow: selected
                        ? 'inset 0 0 0 2px var(--color-accent)'
                        : 'var(--card-inset)',
                    }}
                  >
                    <span className="block min-w-0 truncate text-[12px] font-medium">
                      {sec.name[lang]}
                    </span>
                    <span className="num text-[12px]" style={{ color: token }}>
                      {fmtPct(sec.change, lang)}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Ranking */}
      <div className="mt-6 flex items-center justify-between gap-3" id="ranking">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{s('rankTitle')}</h2>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('rankHint')}
          </p>
        </div>
        {sector && (
          <button
            type="button"
            onClick={() => setSector(null)}
            className="min-h-[44px] shrink-0 px-1 text-[12px] font-medium text-accent"
          >
            {s('heatClear')}
          </button>
        )}
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          text={s('rankEmpty')}
          action={
            <button
              type="button"
              onClick={() => setSector(null)}
              className="min-h-[44px] rounded-full px-4 text-[13px]"
              style={{ border: '1px solid var(--color-line)' }}
            >
              {s('rankPick')}
            </button>
          }
        />
      ) : (
        <>
          {/* Sort: reorders the rows in place, the active sector is separate state */}
          <div className="mt-3 flex">
            <div
              role="group"
              aria-label={s('sortLabel')}
              className="flex rounded-full p-1"
              style={{ border: '1px solid var(--color-line)' }}
            >
              {SORTS.map((k) => {
                const active = sort === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSort(k)}
                    aria-pressed={active}
                    className={`min-h-11 rounded-full px-3.5 text-[13px] transition-colors ${
                      active ? 'font-medium text-fg' : 'text-muted'
                    }`}
                    style={active ? { background: 'var(--color-surface)' } : undefined}
                  >
                    {s(SORT_KEY[k])}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Breadth: the shape of the board before the rows themselves */}
          <div className="mt-3">
            <p className="text-[12px] leading-none" style={{ color: breadthTone }}>
              {s('breadthUp')} <span className="num font-semibold">{breadth.up}</span>
              <span className="mx-1.5" style={{ color: 'var(--color-muted)' }}>
                ·
              </span>
              {s('breadthDown')} <span className="num font-semibold">{breadth.down}</span>
            </p>
            <div
              aria-hidden="true"
              className="mt-2 flex h-[3px] gap-px overflow-hidden rounded-full"
              style={{ background: 'var(--color-line)' }}
            >
              {breadth.up > 0 && (
                <span style={{ flexGrow: breadth.up, background: 'var(--color-up)' }} />
              )}
              {breadth.down > 0 && (
                <span style={{ flexGrow: breadth.down, background: 'var(--color-down)' }} />
              )}
            </div>
          </div>

          <div className="panel mt-3 overflow-hidden">
            {/* Column rail: one grid shared with every row, so the figures sit
                in a line instead of drifting with each name length. */}
            <div
              aria-hidden="true"
              className={`${ROW_GRID} ps-3 pe-11 py-2`}
              style={{ borderBottom: '1px solid var(--color-line)' }}
            >
              <span className="t-kicker text-center" style={kicker}>
                #
              </span>
              <span className="t-kicker" style={kicker}>
                {s('colName')}
              </span>
              <span className={`t-kicker text-center ${SPARK_CELL}`} style={kicker}>
                {s('col1m')}
              </span>
              <span className="t-kicker text-end" style={kicker}>
                {s('colLast')}
              </span>
              <span className="t-kicker text-end" style={kicker}>
                {s('colChg')}
              </span>
            </div>

            <ul className="divide-y divide-line">
              {ranked.map((q, i) => {
                const up = q.change >= 0
                const isWatched = watchlist.includes(q.symbol)
                return (
                  <li key={q.symbol} className="relative">
                    <LongPressLink
                      to={`/m/${q.symbol}`}
                      prompt={`${s('askAbout')} ${q.name[lang]}`}
                      className={`${ROW_GRID} min-h-[56px] ps-3 pe-11 py-2 transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent`}
                    >
                      {/* Rank is positional, so it is not read out as part of the name. */}
                      <span
                        aria-hidden="true"
                        className="num text-center text-[11px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] leading-tight font-medium">
                          {q.name[lang]}
                        </span>
                        <span
                          className="num mt-0.5 block truncate text-[11px] leading-none"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {q.symbol}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex ${SPARK_CELL} ${up ? 'text-up' : 'text-down'}`}
                      >
                        <BarStrip data={q.spark} up={up} compact />
                      </span>
                      <span className="num text-end text-[12px] leading-none">
                        <AnimatedNumber value={q.price} format={(n) => fmtNum(n, lang, 2)} />
                      </span>
                      <span
                        className={`num flex items-center justify-end gap-1 text-[15px] leading-none font-semibold ${up ? 'text-up' : 'text-down'}`}
                      >
                        <TrendArrow up={up} />
                        <span>{fmtPct(q.change, lang)}</span>
                      </span>
                    </LongPressLink>
                    <WatchStar
                      watched={isWatched}
                      label={`${isWatched ? s('watchRemove') : s('watchAdd')} ${q.name[lang]}`}
                      onToggle={() => toggleWatch(q.symbol)}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {/* Watchlist — read from the shared store, so a tap anywhere lands here */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{s('watchTitle')}</h2>
          <span
            className="num rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
          >
            {watched.length}
          </span>
        </div>
        {watched.length === 0 ? (
          <EmptyState
            text={s('watchEmpty')}
            action={
              <button
                type="button"
                onClick={scrollToRanking}
                className="min-h-[44px] rounded-full px-4 text-[13px]"
                style={{ border: '1px solid var(--color-line)', color: 'var(--color-fg)' }}
              >
                {s('watchCta')}
              </button>
            }
          />
        ) : (
          <ul className="panel mt-3 divide-y divide-line overflow-hidden">
            {watched.map((q) => {
              const up = q.change >= 0
              return (
                <li key={q.symbol} className="relative">
                  <LongPressLink
                    to={`/m/${q.symbol}`}
                    prompt={`${s('askAbout')} ${q.name[lang]}`}
                    className="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 ps-3 pe-11 py-2 transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] leading-tight font-medium">
                        {q.name[lang]}
                      </span>
                      <span
                        className="num mt-0.5 block truncate text-[11px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {q.symbol}
                      </span>
                    </span>
                    <span className="num text-end text-[12px] leading-none">
                      <AnimatedNumber value={q.price} format={(n) => fmtNum(n, lang, 2)} />
                    </span>
                    <span
                      className={`num flex items-center justify-end gap-1 text-[14px] leading-none font-semibold ${up ? 'text-up' : 'text-down'}`}
                    >
                      <TrendArrow up={up} />
                      <span>{fmtPct(q.change, lang)}</span>
                    </span>
                  </LongPressLink>
                  <WatchStar
                    watched
                    label={`${s('watchRemove')} ${q.name[lang]}`}
                    onToggle={() => toggleWatch(q.symbol)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}
