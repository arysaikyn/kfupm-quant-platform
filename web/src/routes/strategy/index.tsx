import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LongPressLink } from '../../components/LongPressLink'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity, strategies } from '../../data/mock'
import { fmtDate } from './format'
import { listStrings, TAG_KEY } from './strings'

type Sort = 'recent' | 'return'

/** Fixed product order; only tags that actually occur in the mock are offered. */
const TAG_ORDER = ['value', 'sharia', 'momentum', 'income'] as const

/** New words for the filter row live with it, so the shared dictionary stays untouched. */
const ALL: Record<Lang, string> = { zh: '全部', en: 'All', ar: 'الكل' }
const FILTER_LABEL: Record<Lang, string> = {
  zh: '按标签筛选',
  en: 'Filter by tag',
  ar: 'تصفية حسب الوسم',
}

const SW = 120
const SH = 56
const SP = 4

/**
 * One window of the shared curve per strategy, keyed by id so that sorting and
 * filtering never change a card's shape. Each window is rescaled so its last
 * point is exactly the strategy's last return — the number printed above it.
 */
const SPARKS: Record<string, number[]> = {}
strategies.forEach((st, i) => {
  const slice = equity.withCost.slice((i * 17) % 31)
  const scale = (1 + st.lastReturn) / slice[slice.length - 1]
  SPARKS[st.id] = slice.map((v) => v * scale)
})

function Sparkline({ id, series, up }: { id: string; series: number[]; up: boolean }) {
  const lo = Math.min(...series)
  const hi = Math.max(...series)
  const span = hi - lo || 1
  const pts = series
    .map((v, i) => {
      const x = SP + (i / Math.max(series.length - 1, 1)) * (SW - SP * 2)
      const y = SP + (1 - (v - lo) / span) * (SH - SP * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const tone = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      preserveAspectRatio="none"
      className="h-14 w-full"
      style={{ direction: 'ltr' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: tone, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: tone, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polygon points={`${SP},${SH} ${pts} ${SW - SP},${SH}`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function StrategyPage() {
  const { lang } = useI18n()
  const s = useStrings(listStrings)
  const [sort, setSort] = useState<Sort>('recent')
  /** null is the "All" chip. */
  const [tag, setTag] = useState<string | null>(null)

  const tags = useMemo(
    () => TAG_ORDER.filter((t) => strategies.some((st) => st.tags.includes(t))),
    [],
  )

  const rows = useMemo(
    () =>
      [...strategies]
        .filter((st) => tag === null || st.tags.includes(tag))
        .sort((a, b) =>
          sort === 'recent'
            ? b.updated.localeCompare(a.updated)
            : b.lastReturn - a.lastReturn,
        ),
    [sort, tag],
  )

  return (
    <Screen title={s('title')} subtitle={s('subtitle')}>
      {tags.length > 0 && (
        <div
          role="group"
          aria-label={FILTER_LABEL[lang]}
          className="-mx-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-0.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
        >
          {[null, ...tags].map((t) => {
            const active = tag === t
            return (
              <button
                key={t ?? 'all'}
                type="button"
                onClick={() => setTag(t)}
                aria-pressed={active}
                className={`min-h-11 shrink-0 rounded-full px-3 text-[13px] whitespace-nowrap transition-colors ${
                  active ? 'font-medium text-fg' : 'text-muted'
                }`}
                style={{
                  border: '1px solid var(--color-line)',
                  background: active ? 'var(--color-surface)' : 'transparent',
                }}
              >
                {t ? s(TAG_KEY[t]) : ALL[lang]}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <div
          role="group"
          aria-label={s('sortLabel')}
          className="flex rounded-full p-1"
          style={{ border: '1px solid var(--color-line)' }}
        >
          {(['recent', 'return'] as const).map((k) => {
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
                {s(k === 'recent' ? 'sortRecent' : 'sortReturn')}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            text={s('empty')}
            action={
              <Link
                to="/ai"
                className="flex min-h-11 items-center rounded-full px-4 text-[13px]"
                style={{ border: '1px solid var(--color-line)' }}
              >
                {s('emptyCta')}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((st) => {
              const ret = st.lastReturn
              const up = ret >= 0
              const tone = ret > 0 ? 'text-up' : ret < 0 ? 'text-down' : 'text-muted'
              return (
                <li key={st.id}>
                  <LongPressLink
                    to={`/strategy/${st.id}`}
                    prompt={`${st.name[lang]} — ${st.description[lang]}`}
                    className="panel block p-4 active:opacity-80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[16px] leading-snug font-semibold">
                          {st.name[lang]}
                        </h2>
                        <p
                          className="mt-1 line-clamp-2 text-[13px] leading-snug"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {st.description[lang]}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <div
                          dir="ltr"
                          className={`num text-[22px] leading-none font-semibold ${tone}`}
                        >
                          {fmtPct(ret, lang, 1)}
                        </div>
                        <div
                          className="mt-1.5 text-[11px] leading-none"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {s('lastReturn')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Sparkline id={`spark-${st.id}`} series={SPARKS[st.id]} up={up} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {st.tags.map((t) => {
                        const key = TAG_KEY[t]
                        return (
                          <span
                            key={t}
                            className="rounded-full px-2.5 py-1 text-[11px] leading-none"
                            style={{
                              border: '1px solid var(--color-line)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {key ? s(key) : t}
                          </span>
                        )
                      })}
                    </div>

                    <div
                      className="mt-2.5 flex items-center justify-between gap-3 text-[11px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <span>
                        <span className="num">{fmtNum(st.rules, lang, 0)}</span> {s('rulesUnit')}
                      </span>
                      <span className="truncate">
                        {s('updated')} {fmtDate(st.updated, lang)}
                      </span>
                    </div>
                  </LongPressLink>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}
