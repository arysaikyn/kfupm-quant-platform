import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { BarStrip } from '../../components/BarStrip'
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

export default function MarketPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const [sector, setSector] = useState<string | null>(null)

  const ranked = useMemo(() => {
    const members = sector ? (SECTOR_MEMBERS[sector] ?? []) : null
    const list = members ? quotes.filter((q) => members.includes(q.symbol)) : quotes
    return [...list].sort((a, b) => b.change - a.change)
  }, [sector])

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
        <ul className="mt-2 space-y-2 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-2 min-[900px]:space-y-0">
          {ranked.map((q) => {
            const up = q.change >= 0
            return (
              <li key={q.symbol}>
                <Link
                  to={`/m/${q.symbol}`}
                  className="panel flex min-h-[64px] items-center gap-3 px-3.5 py-2.5 active:opacity-75"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{q.name[lang]}</p>
                    <p className="num mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {q.symbol}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 ${up ? 'text-up' : 'text-down'}`}
                  >
                    <BarStrip data={q.spark} up={up} />
                  </span>
                  <div className="shrink-0 text-end">
                    <p className="num text-[15px] leading-none font-semibold">
                      <AnimatedNumber value={q.price} format={(n) => fmtNum(n, lang, 2)} />
                    </p>
                    <p className={`num mt-1 text-[12px] leading-none ${up ? 'text-up' : 'text-down'}`}>
                      {fmtPct(q.change, lang)}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
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
