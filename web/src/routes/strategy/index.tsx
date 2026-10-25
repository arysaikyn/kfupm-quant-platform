import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LongPressLink } from '../../components/LongPressLink'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { bench, strategies } from '../../data/mock'
import { fmtDate } from './format'
import { countRules } from '../../i18n/format'
import { featureStrings, listStrings, TAG_KEY } from './strings'

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

const benchTotal = (bench[bench.length - 1] ?? 1) - 1

const fill = (tpl: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), tpl)

export default function StrategyPage() {
  const { lang } = useI18n()
  const s = useStrings(listStrings)
  const f = useStrings(featureStrings)
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

  /** One sentence, read straight off the rule list the detail screen runs. */

  return (
    <Screen
      title={s('title')}
    >
      <div className="mt-3 flex items-center justify-between gap-3">
        {tags.length > 0 && (
          <div
            role="group"
            aria-label={FILTER_LABEL[lang]}
            className="-ms-4 flex min-w-0 gap-1 overflow-x-auto ps-4 [&::-webkit-scrollbar]:hidden fade-end"
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
                  className={`min-h-11 min-w-11 shrink-0 rounded-full px-3 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg ${
                    active ? 'font-medium' : 'text-muted'
                  }`}
                  style={
                    active
                      ? {
                          background: 'color-mix(in srgb, var(--color-fg) 8%, transparent)',
                          color: 'var(--color-fg)',
                        }
                      : undefined
                  }
                >
                  {t ? s(TAG_KEY[t]) : ALL[lang]}
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setSort(sort === 'recent' ? 'return' : 'recent')}
          aria-label={s('sortLabel')}
          className="flex min-h-11 shrink-0 items-center gap-1.5 text-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          style={{ color: 'var(--color-muted)' }}
        >
          {s(sort === 'recent' ? 'sortRecent' : 'sortReturn')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
          </svg>
        </button>
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
          // A returns list, not a card per curve: numbers compare down a column.
          <ul className="border-t border-line">
            {rows.map((st) => {
              const ret = st.lastReturn
              const tone = ret > 0 ? 'text-up' : ret < 0 ? 'text-down' : 'text-muted'
              const vsBench = ret - benchTotal
              return (
                <li key={st.id} className="border-b border-line">
                  <LongPressLink
                    to={`/strategy/${st.id}`}
                    prompt={`${st.name[lang]} — ${st.description[lang]}`}
                    chips={[{ kind: 'strategy', id: st.id }]}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-4 transition-colors hover:bg-fg/[0.03] active:bg-fg/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-[16px] leading-snug font-semibold">
                        {st.name[lang]}
                      </h2>
                      <p
                        className="mt-1 line-clamp-2 text-[12px] leading-snug"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {st.description[lang]}
                      </p>
                      <div
                        className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {st.tags.map((t) => {
                          const key = TAG_KEY[t]
                          return (
                            <span key={t} className="flex items-center gap-2">
                              {key ? s(key) : t}
                              <span aria-hidden="true">·</span>
                            </span>
                          )
                        })}
                        <span>
                          <span className="num">{fmtNum(st.rules.length, lang, 0)}</span>{' '}
                          {countRules(lang, st.rules.length)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{fmtDate(st.updated, lang)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-end">
                      <span
                        dir="ltr"
                        className={`num t-display block text-[22px] leading-none ${tone}`}
                      >
                        {fmtPct(ret, lang, 1)}
                      </span>
                      <span
                        dir="ltr"
                        className="num mt-1.5 block text-[11px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {fill(s('vsBench'), { pct: fmtPct(vsBench, lang, 1) })}
                      </span>
                    </div>
                  </LongPressLink>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Dead strategies are evidence, not a hidden drawer. */}
      <Link
        to="/strategy/graveyard"
        className="mt-6 flex min-h-14 items-center justify-between gap-3 border-t border-line text-[13px] transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <span>{f('graveListLink')}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="rtl:[transform:scaleX(-1)]"
          style={{ color: 'var(--color-muted)' }}
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>
    </Screen>
  )
}
