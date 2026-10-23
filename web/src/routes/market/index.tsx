import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { BarStrip } from '../../components/BarStrip'
import { LongPressLink } from '../../components/LongPressLink'
import { TickerTape } from '../../components/TickerTape'
import { Treemap } from '../../components/Treemap'
import type { TreemapGroup } from '../../components/Treemap'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { fundamentalsFor } from '../../data/fundamentals'
import { indices, quotes, sectors } from '../../data/mock'
import type { Quote } from '../../data/mock'
import { frameChange, membersChange, membersOf } from '../../data/membership'
import type { HeatFrame } from '../../data/membership'
import { useAlerts, triggeredCount } from '../../store/alerts'
import { setMarket, usePrefs } from '../../store/prefs'
import { toggleWatch, useUser } from '../../store/user'
import { SectionHead } from './SectionHead'
import { strings } from './strings'

/** The map's frames, in the order the switcher lists them. */
const FRAMES: [HeatFrame, 'frameDay' | 'frameWeek' | 'frameMonth'][] = [
  ['1d', 'frameDay'],
  ['1w', 'frameWeek'],
  ['1m', 'frameMonth'],
]

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

const VIEWS = ['rank', 'sectors', 'watch'] as const
type View = (typeof VIEWS)[number]

const SORTS = ['chg', 'fall', 'name'] as const
type Sort = (typeof SORTS)[number]

const SORT_KEY = { chg: 'sortGain', fall: 'sortLoss', name: 'sortName' } as const

/** The map's frame keys, in the same order as the switcher's buttons. */
const FRAME_KEYS: HeatFrame[] = FRAMES.map(([key]) => key)

/** Read the board out of the URL. Every field is checked against its known
    values, so a hand-edited or stale link falls back to the default board
    instead of an empty screen; a sector the universe does not know is ignored
    for the same reason. */
function boardFrom(params: URLSearchParams) {
  const rawView = params.get('view')
  const rawSort = params.get('sort')
  const rawFrame = params.get('frame')
  const rawSector = params.get('sector')
  return {
    view: VIEWS.includes(rawView as View) ? (rawView as View) : 'rank',
    sort: SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : 'chg',
    frame: FRAME_KEYS.includes(rawFrame as HeatFrame) ? (rawFrame as HeatFrame) : '1d',
    sector:
      rawSector !== null && sectors.some((sec) => sec.id === rawSector)
        ? rawSector
        : null,
  }
}

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

const MARKETS = [
  { id: 'sa', key: 'mSaudi', index: 'TASI' },
  { id: 'cn', key: 'mCn', index: '000001' },
  { id: 'hk', key: 'mHk', index: 'HSI' },
] as const

export default function MarketPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const navigate = useNavigate()
  const { watchlist } = useUser()
  // The board lives in the URL, not in component state: the quote page's back
  // button, the browser's back button and a shared link all land on the same
  // board instead of resetting to rank.
  const [params, setParams] = useSearchParams()
  const { view, sort, frame, sector } = boardFrom(params)
  const [picked, setPicked] = useState<string | null>(null)
  const { market: prefMarket } = usePrefs()
  const heroIndex = indices.find((ix) => ix.symbol === MARKETS.find((m) => m.id === prefMarket)?.index) ?? indices[0]
  const restIndices = indices.filter((ix) => ix.symbol !== heroIndex.symbol)

  /** Patch the board in place. replace keeps history as destination → destination,
      so tapping through tabs never stacks entries the back button has to replay. */
  const writeBoard = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const setView = (next: View) => writeBoard({ view: next })
  const setSector = (next: string | null) => writeBoard({ sector: next })
  const setSort = (next: Sort) => writeBoard({ sort: next })
  const setFrame = (next: HeatFrame) => writeBoard({ frame: next })

  const ranked = useMemo(() => {
    const list = sector ? membersOf(sector) : quotes
    return [...list].sort((a, b) =>
      sort === 'chg'
        ? b.change - a.change
        : sort === 'fall'
          ? a.change - b.change
          : a.name[lang].localeCompare(b.name[lang], lang),
    )
  }, [sector, sort, lang])

  // The map's bands are the sectors that own a quote: the mock only carries five
  // names, so a sector with no constituent is left out rather than drawn as an
  // empty column. With a real universe every sector fills in on its own.
  const heatGroups = useMemo<TreemapGroup[]>(() => {
    const groups: TreemapGroup[] = []
    for (const sec of sectors) {
      const members = membersOf(sec.id)
      if (members.length === 0) continue
      groups.push({
        id: sec.id,
        label: sec.name[lang],
        // Always the mean of the band's own tiles, from the shared membership
        // table: the sector page and the AI chips print this same figure.
        change: membersChange(sec.id, frame),
        weight: sec.weight,
        tiles: members.map((q) => ({
          key: q.symbol,
          label: q.name[lang],
          sub: q.symbol,
          change: frameChange(q, frame),
          // Market cap, not the raw price: price mixes SAR, CNY and HKD, so a
          // yuan stock would look fifty times bigger without its cap.
          weight: fundamentalsFor(q.symbol, q.price).marketCap,
        })),
      })
    }
    return groups
  }, [frame, lang])

  const pickedQuote = picked ? (quotes.find((q) => q.symbol === picked) ?? null) : null

  // Symbols arrive newest first from the store; the mock quote is the row.
  // Alerts belong to the bell, not to the feed. The count is what fired; the
  // rows that carry one get a small bell, the way Eastmoney marks a watchlist.
  const alertList = useAlerts()
  const fired = triggeredCount(alertList)
  const alertSymbols = useMemo(() => new Set(alertList.map((a) => a.symbol)), [alertList])

  const watched = useMemo(
    () =>
      watchlist
        .map((symbol) => quotes.find((q) => q.symbol === symbol))
        .filter((q): q is Quote => Boolean(q)),
    [watchlist],
  )

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

  return (
    <Screen
      title={t('tab.market')}
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            aria-label={s('goSearch')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
          </Link>
          <Link
            to="/alerts"
            aria-label={s('goAlerts')}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
              <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
            {fired > 0 && (
              <span
                aria-hidden="true"
                className="num absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
                style={{ background: 'var(--color-down)', color: '#fff' }}
              >
                {fired > 9 ? '9+' : fired}
              </span>
            )}
          </Link>
        </div>
      }
    >
      {/* Market switch: the choice made in onboarding, and changeable here. */}
      <div role="group" aria-label={s('markets')} className="mt-1 flex gap-1.5">
        {MARKETS.map((id) => {
          const active = prefMarket === id.id
          return (
            <button
              key={id.id}
              type="button"
              aria-pressed={active}
              onClick={() => setMarket(id.id)}
              className="tap rounded-full px-2.5 text-[11px] font-medium"
              style={
                active
                  ? { background: 'var(--color-fg)', color: 'var(--color-bg)' }
                  : { background: 'var(--color-surface)', color: 'var(--color-muted)' }
              }
            >
              {/* The hit box is 44; the pill stays compact inside it. */}
              <span className="rounded-full px-2 py-1 leading-none">{s(id.key)}</span>
            </button>
          )
        })}
      </div>

      {/* Live tape: the screen's signature, 0 KB */}
      <div className="mt-3">
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

      {/* Index masthead: one hero figure, the rest as a single inline row */}
      <div className="mt-3">
        {heroIndex && (
          <div className="panel px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="t-kicker" style={{ color: 'var(--color-muted)' }}>
                {heroIndex.name[lang]}
              </p>
              <p
                className="num text-[12px]"
                style={{ color: heroIndex.change >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
              >
                {fmtPct(heroIndex.change, lang)}
              </p>
            </div>
            <p className="t-display num mt-1 text-[38px] leading-none">
              <AnimatedNumber value={heroIndex.value} format={(n) => fmtNum(n, lang, 2)} />
            </p>
          </div>
        )}
        <div className="mt-2 flex gap-5 px-1">
          {restIndices.map((ix) => {
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
        className="mt-4 flex rounded-full bg-surface p-1"
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
              className={`min-h-11 flex-1 rounded-full text-[12px] transition-colors ${
                active ? 'font-medium' : 'text-muted'
              }`}
              style={active ? { background: 'var(--color-bg)' } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>

      {view === 'sectors' && (
        <>
      {/* Sector map */}
        <SectionHead title={s('heatTitle')} />

        <div
          role="group"
          aria-label={s('heatFrame')}
          className="mt-2 flex items-center gap-1.5"
        >
          {FRAMES.map(([key, label]) => {
            const on = key === frame
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setFrame(key)}
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
                  {s(label)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-2">
          <Treemap
            groups={heatGroups}
            up="var(--color-up)"
            down="var(--color-down)"
            selected={picked}
            selectedGroup={sector}
            formatChange={(v) => fmtPct(v, lang)}
            onGroup={(id) => navigate(`/sector/${id}`)}
            onPick={(key) => {
              const again = picked === key
              setPicked(again ? null : key)
              setSector(
                again
                  ? null
                  : (heatGroups.find((g) => g.tiles.some((t) => t.key === key))?.id ?? null),
              )
            }}
          />
        </div>

        {frame !== '1d' && (
          <p
            className="mt-1.5 text-[10px] leading-snug"
            style={{ color: 'var(--color-muted)' }}
          >
            {s('heatDerived')}
          </p>
        )}

        {/* What the picked tile is, in full: the map itself only has room for
            the name and the move. */}
        {pickedQuote && (
          <div className="panel mt-2 flex min-h-[56px] items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{pickedQuote.name[lang]}</p>
              <p
                className="num mt-0.5 truncate text-[11px]"
                style={{ color: 'var(--color-muted)' }}
              >
                {pickedQuote.symbol} · {fmtNum(pickedQuote.price, lang, 2)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`num text-[13px] font-semibold ${
                  frameChange(pickedQuote, frame) >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {fmtPct(frameChange(pickedQuote, frame), lang)}
              </span>
              <Link
                to={`/m/${pickedQuote.symbol}`}
                className="flex min-h-11 items-center rounded-full px-3 text-[12px] text-accent"
              >
                {s('openQuote')}
              </Link>
            </div>
          </div>
        )}

        {/* Drill into whichever sector is in focus */}
        <Link
          to={`/sector/${sector ?? sectors[0]?.id ?? 'energy'}`}
          className="panel mt-2 flex min-h-[44px] items-center justify-between gap-3 px-3 text-[12px] transition-colors active:bg-fg/10"
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
                className="min-h-11 rounded-full px-4 text-[13px] font-medium"
                style={{ background: 'var(--color-accent-fill)', color: '#fff' }}
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
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[12px] transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                  className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {s(SORT_KEY[sort])}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                  </svg>
                </button>
              </div>
            </div>
            {/* A 96px strip, not a page-wide bar: full width made a two-rule
                summary look like a progress meter. */}
            <div
              aria-hidden="true"
              className="mt-1 flex h-0.5 w-24 gap-0.5 overflow-hidden rounded-full"
              style={{ background: 'var(--color-line)' }}
            >
              {breadth.up > 0 && (
                <span
                  className="rounded-full"
                  style={{
                    flexGrow: breadth.up,
                    background: 'color-mix(in srgb, var(--color-up) 70%, transparent)',
                  }}
                />
              )}
              {breadth.down > 0 && (
                <span
                  className="rounded-full"
                  style={{
                    flexGrow: breadth.down,
                    background: 'color-mix(in srgb, var(--color-down) 70%, transparent)',
                  }}
                />
              )}
            </div>
  
            <div className="panel mt-3 divide-y divide-line overflow-hidden">
              {/* Column rail: one grid shared with every row, so the figures sit
                  in a line instead of drifting with each name length. The panel's
                  divider draws the line under it; the rail draws nothing. */}
              <div aria-hidden="true" className={`${ROW_GRID} ps-3 pe-11 py-2`}>
                <span className="text-center text-[11px] text-muted">#</span>
                <span className="text-[11px] text-muted">{s('colName')}</span>
                <span className={`text-center text-[11px] text-muted ${SPARK_CELL}`}>
                  {s('col1m')}
                </span>
                <span className="text-end text-[11px] text-muted">{s('colLast')}</span>
                <span className="text-end text-[11px] text-muted">{s('colChg')}</span>
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
                        className={`${ROW_GRID} min-h-[56px] ps-3 pe-11 py-2 transition-colors hover:bg-fg/5 active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent`}
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
                          <span className="mt-0.5 flex items-center gap-1">
                            <span
                              className="num truncate text-[11px] leading-none"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              {q.symbol}
                            </span>
                            {alertSymbols.has(q.symbol) && (
                              <span
                                role="img"
                                aria-label={s('goAlerts')}
                                style={{ color: 'var(--color-accent)' }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
                                  <path d="M13.7 20a2 2 0 0 1-3.4 0" />
                                </svg>
                              </span>
                            )}
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
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <h2 className="truncate text-[15px] font-semibold">{s('watchTitle')}</h2>
              <span className="num rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                {watched.length}
              </span>
            </div>
            {/* Groups live next to the list they group, not inside Profile. */}
            <Link
              to="/watchlists"
              className="-me-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-2 text-[12px] text-accent transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {s('watchGroups')}
            </Link>
          </div>
          {watched.length === 0 ? (
            <EmptyState
              text={s('watchEmpty')}
              action={
                <button
                  type="button"
                  onClick={() => setView('rank')}
                  className="min-h-11 rounded-full px-4 text-[13px] font-medium"
                  style={{ background: 'var(--color-accent-fill)', color: '#fff' }}
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
                      className="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 ps-3 pe-11 py-2 transition-colors hover:bg-fg/5 active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
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
