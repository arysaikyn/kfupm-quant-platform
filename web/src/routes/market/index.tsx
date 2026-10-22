import { useMemo, useState } from 'react'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { BarStrip } from '../../components/BarStrip'
import { LongPressLink } from '../../components/LongPressLink'
import { TickerTape } from '../../components/TickerTape'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { indices, quotes, sectors } from '../../data/mock'
import type { Sector } from '../../data/mock'
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
    Under 430px the 84px strip leaves the name ~90px, so both the strip cell and
    the column itself drop out of the track list. */
const ROW_GRID =
  'grid grid-cols-[18px_minmax(0,1fr)_84px_60px_70px] items-center gap-x-2 ' +
  'max-[430px]:grid-cols-[16px_minmax(0,1fr)_52px_54px_62px]'

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

export default function MarketPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const [sector, setSector] = useState<string | null>(null)

  const ranked = useMemo(() => {
    const members = sector ? (SECTOR_MEMBERS[sector] ?? []) : null
    const list = members ? quotes.filter((q) => members.includes(q.symbol)) : quotes
    return [...list].sort((a, b) => b.change - a.change)
  }, [sector])

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
                      background: `linear-gradient(165deg, color-mix(in srgb, ${token} ${Math.round(alpha * 0.55)}%, transparent), color-mix(in srgb, ${token} ${Math.round(alpha * 0.12)}%, transparent))`,
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
              className={`${ROW_GRID} px-3 py-2`}
              style={{ borderBottom: '1px solid var(--color-line)' }}
            >
              <span className="t-kicker text-center" style={kicker}>
                #
              </span>
              <span className="t-kicker" style={kicker}>
                {s('colName')}
              </span>
              <span className="t-kicker text-center" style={kicker}>
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
                return (
                  <li key={q.symbol}>
                    <LongPressLink
                      to={`/m/${q.symbol}`}
                      prompt={`${s('askAbout')} ${q.name[lang]}`}
                      className={`${ROW_GRID} min-h-[56px] px-3 py-2 transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent`}
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
                        className={`flex ${up ? 'text-up' : 'text-down'}`}
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
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {/* Watchlist — no data yet */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{s('watchTitle')}</h2>
          <span
            className="num rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
          >
            0
          </span>
        </div>
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
      </div>
    </Screen>
  )
}
