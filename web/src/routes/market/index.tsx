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
  const [view, setView] = useState<'rank' | 'sectors' | 'watch'>('rank')

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

  return (
    <Screen
      title={t('tab.market')}
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            aria-label={s('goSearch')}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
          </Link>
          <Link
            to="/alerts"
            aria-label={s('goAlerts')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
              <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
            {alerts.length > 0 && (
              <span
                aria-hidden="true"
                className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-down)' }}
              />
            )}
          </Link>
        </div>
      }
    >
      {/* Market switch — visual only for now. */}
      <div role="group" aria-label={s('markets')} className="mt-1 flex gap-1.5">
        {[s('mSaudi'), s('mCn'), s('mHk')].map((label, i) => (
          <span
            key={label}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium leading-none"
            style={
              i === 0
                ? { background: 'var(--color-fg)', color: 'var(--color-bg)' }
                : { color: 'var(--color-muted)' }
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

      {/* Index masthead: one hero figure, the rest as a single inline row */}
      <div className="mt-3">
        {indices[0] && (
          <div className="panel px-4 py-3">
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
            <p className="t-display num mt-1 text-[38px] leading-none font-bold italic">
              <AnimatedNumber value={indices[0].value} format={(n) => fmtNum(n, lang, 2)} />
            </p>
          </div>
        )}
        <div className="mt-2 flex gap-5 px-1">
          {indices.slice(1).map((ix) => {
            const up = ix.change >= 0
            return (
              <div key={ix.symbol} className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span className="truncate text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {ix.name[lang]}
                </span>
                <span className="num shrink-0 text-[12px]">
                  <AnimatedNumber value={ix.value} format={(n) => fmtNum(n, lang, 0)} />
                </span>
                <span
                  className={`num shrink-0 text-[11px] ${up ? 'text-up' : 'text-down'}`}
                >
                  {fmtPct(ix.change, lang, 1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* One switch for the three things this screen is for */}
      <div
        role="tablist"
        aria-label={s('moreScreens')}
        className="mt-4 flex rounded-full p-1"
        style={{ border: '1px solid var(--color-line)' }}
      >
        {([
          ['rank', s('viewRank')],
          ['sectors', s('viewSectors')],
          ['watch', s('viewWatch')],
        ] as const).map(([key, label]) => {
          const active = view === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(key)}
              className={`min-h-10 flex-1 rounded-full text-[12px] transition-colors ${
                active ? 'font-medium' : 'text-muted'
              }`}
              style={active ? { background: 'var(--color-surface)' } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>

      {view === 'sectors' && (
        <>
      {/* Sector heatmap */}
        <SectionHead title={s('heatTitle')} />
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
  
        {/* Drill into whichever sector is in focus */}
        <Link
          to={`/sector/${sector ?? sectors[0]?.id ?? 'energy'}`}
          className="panel mt-2 flex min-h-[44px] items-center justify-between gap-3 px-3 text-[12px]"
        >
          <span>{s('sectorDetail')}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)]" style={{ color: 'var(--color-muted)' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
        </>
      )}

      {view === 'rank' && (
        <>
      {/* Ranking */}
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
            {/* One meta row: the shape of the board, plus the two controls */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[12px] leading-none" style={{ color: breadthTone }}>
                {s('breadthUp')} <span className="num font-semibold">{breadth.up}</span>
                <span className="mx-1.5" style={{ color: 'var(--color-muted)' }}>
                  ·
                </span>
                {s('breadthDown')} <span className="num font-semibold">{breadth.down}</span>
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/screener"
                  aria-label={s('goScreener')}
                  className="flex min-h-11 min-w-9 items-center justify-center"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 5h18l-7 8v6l-4 2v-8z" />
                  </svg>
                </Link>
                {sector && (
                  <button
                    type="button"
                    onClick={() => setSector(null)}
                    className="min-h-11 text-[12px]"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {s('heatClear')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setSort(sort === 'chg' ? 'fall' : sort === 'fall' ? 'name' : 'chg')
                  }
                  className="flex min-h-11 items-center gap-1.5 text-[12px]"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {s(SORT_KEY[sort])}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
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
        </>
      )}

      {view === 'watch' && (
        <>
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
                  onClick={() => setView('rank')}
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
        </>
      )}

    </Screen>
  )
}
