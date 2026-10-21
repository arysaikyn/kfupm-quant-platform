import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { strategies } from '../../data/mock'
import { fmtDate } from './format'
import { listStrings, TAG_KEY } from './strings'

type Sort = 'recent' | 'return'

export default function StrategyPage() {
  const { lang } = useI18n()
  const s = useStrings(listStrings)
  const [sort, setSort] = useState<Sort>('recent')

  const rows = useMemo(
    () =>
      [...strategies].sort((a, b) =>
        sort === 'recent'
          ? b.updated.localeCompare(a.updated)
          : b.lastReturn - a.lastReturn,
      ),
    [sort],
  )

  return (
    <Screen title={s('title')} subtitle={s('subtitle')}>
      <div
        role="group"
        aria-label={s('sortLabel')}
        className="mt-1 flex rounded-full p-1"
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
              className={`min-h-11 flex-1 rounded-full px-3 text-[13px] transition-colors ${
                active ? 'font-medium text-fg' : 'text-muted'
              }`}
              style={active ? { background: 'var(--color-surface)' } : undefined}
            >
              {s(k === 'recent' ? 'sortRecent' : 'sortReturn')}
            </button>
          )
        })}
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
              const tone = ret > 0 ? 'text-up' : ret < 0 ? 'text-down' : 'text-muted'
              return (
                <li key={st.id}>
                  <Link
                    to={`/strategy/${st.id}`}
                    className="block rounded-2xl p-4 active:opacity-80"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-line)',
                    }}
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
                        <div dir="ltr" className={`num text-[17px] leading-tight font-semibold ${tone}`}>
                          {fmtPct(ret, lang, 1)}
                        </div>
                        <div className="mt-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          {s('lastReturn')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      {st.tags.map((tag) => {
                        const key = TAG_KEY[tag]
                        return (
                          <span
                            key={tag}
                            className="rounded-full px-2.5 py-1 text-[11px] leading-none"
                            style={{
                              border: '1px solid var(--color-line)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {key ? s(key) : tag}
                          </span>
                        )
                      })}
                      <span
                        className="text-[11px]"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        <span className="num">{fmtNum(st.rules, lang, 0)}</span> {s('rulesUnit')}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {s('updated')} {fmtDate(st.updated, lang)}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}
