import { useMemo, useState } from 'react'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { news } from '../../data/mock'
import type { NewsItem } from '../../data/mock'
import { useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { dayStamp, formatDay, quoteBySymbol, relTime } from './format'
import { LongPressLink } from '../../components/LongPressLink'
import { StoryArt } from './StoryArt'
import { strings } from './strings'

function NewsRow({ item, lang, askLabel }: { item: NewsItem; lang: Lang; askLabel: string }) {
  const deck = item.body[0]?.[lang]

  return (
    <LongPressLink
      to={`/news/${item.id}`}
      prompt={`${askLabel} — ${item.title[lang]}`}
      className="panel block px-4 py-3.5 transition-colors active:opacity-80"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="t-title line-clamp-2 text-[17px] leading-[1.3] font-semibold text-fg">
            {item.title[lang]}
          </h3>
          {deck && (
            <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.45] text-muted">{deck}</p>
          )}
        </div>
        <StoryArt item={item} />
      </div>
      <div className="t-kicker mt-3 flex items-center gap-2 text-muted">
        <span className="truncate">{item.source}</span>
        <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
        <time className="num shrink-0">{relTime(item.minutesAgo, lang)}</time>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.symbols.map((sym) => {
          const quote = quoteBySymbol[sym]
          return (
            <span
              key={sym}
              className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px]"
            >
              <span className="num text-fg">{sym}</span>
              {quote && <span className="text-muted">{quote.name[lang]}</span>}
            </span>
          )
        })}
      </div>
    </LongPressLink>
  )
}

export default function NewsPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const [now] = useState(() => Date.now())

  const { groups, todayStamp, yesterdayStamp } = useMemo(() => {
    const today = dayStamp(0, now)
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yesterday = y.getFullYear() * 10000 + (y.getMonth() + 1) * 100 + y.getDate()

    const sorted = [...news].sort((a, b) => a.minutesAgo - b.minutesAgo)
    const out: { stamp: number; items: NewsItem[] }[] = []
    for (const item of sorted) {
      const stamp = dayStamp(item.minutesAgo, now)
      const last = out[out.length - 1]
      if (last && last.stamp === stamp) last.items.push(item)
      else out.push({ stamp, items: [item] })
    }
    return { groups: out, todayStamp: today, yesterdayStamp: yesterday }
  }, [now])

  return (
    <Screen title={s('title')} subtitle={s('lead')}>
      {groups.length === 0 ? (
        <EmptyState text={s('empty')} />
      ) : (
        <div className="mt-1 space-y-6">
          {groups.map((group) => (
            <section key={group.stamp}>
              <header className="mb-2.5 flex items-center gap-3 px-1">
                <h2 className="t-kicker shrink-0 text-muted">
                  {group.stamp === todayStamp
                    ? s('today')
                    : group.stamp === yesterdayStamp
                      ? s('yesterday')
                      : formatDay(group.stamp, lang)}
                </h2>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 rtl:[transform:scaleX(-1)]"
                  style={{
                    background: 'linear-gradient(to right, var(--color-line), transparent)',
                  }}
                />
              </header>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NewsRow item={item} lang={lang} askLabel={s('askAi')} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Screen>
  )
}
