import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { Sparkline } from '../../components/Sparkline'
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

      {/* Index strip */}
      <p className="mt-5 text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
        {s('indices')}
      </p>
      <div
        className="-mx-4 mt-2 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {indices.map((ix) => {
          const up = ix.change >= 0
          return (
            <div
              key={ix.symbol}
              className="w-[158px] shrink-0 snap-start rounded-2xl p-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
            >
              <p className="truncate text-[12px]" style={{ color: 'var(--color-muted)' }}>
                {ix.name[lang]}
              </p>
              <p className="num mt-1.5 text-[19px] leading-none font-semibold">
                {fmtNum(ix.value, lang, 2)}
              </p>
              <p className={`num mt-1.5 text-[12px] ${up ? 'text-up' : 'text-down'}`}>
                {fmtPct(ix.change, lang)}
              </p>
            </div>
          )
        })}
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
                const alpha = 10 + Math.min(Math.abs(sec.change) / 0.02, 1) * 28
                return (
                  <button
                    key={sec.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSector(selected ? null : sec.id)}
                    className="flex min-w-0 flex-col justify-between rounded-xl p-2.5 text-start"
                    style={{
                      flexGrow: sec.weight,
                      flexBasis: 0,
                      background: `color-mix(in srgb, ${token} ${alpha}%, var(--color-surface))`,
                      boxShadow: selected ? 'inset 0 0 0 2px var(--color-accent)' : undefined,
                    }}
                  >
                    <span className="block min-w-0 truncate text-[12px] font-medium">
                      {sec.name[lang]}
                    </span>
                    <span className={`num text-[12px] ${up ? 'text-up' : 'text-down'}`}>
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
                  className="flex min-h-[64px] items-center gap-3 rounded-2xl px-3.5 py-2.5 active:opacity-75"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
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
                    <Sparkline data={q.spark} w={48} h={20} />
                  </span>
                  <div className="shrink-0 text-end">
                    <p className="num text-[15px] leading-none font-semibold">
                      {fmtNum(q.price, lang, 2)}
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
