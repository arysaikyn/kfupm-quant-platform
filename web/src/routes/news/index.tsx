import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { news } from '../../data/mock'
import type { NewsItem } from '../../data/mock'
import { useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { dayStamp, formatDay, quoteBySymbol, relTime } from './format'
import { strings } from './strings'

function NewsRow({ item, lang }: { item: NewsItem; lang: Lang }) {
  return (
    <Link
      to={`/news/${item.id}`}
      className="panel block p-4 transition-colors active:opacity-80"
    >
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <span className="truncate">{item.source}</span>
        <span aria-hidden="true">·</span>
        <time className="num shrink-0">{relTime(item.minutesAgo, lang)}</time>
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-medium text-fg">
        {item.title[lang]}
      </h3>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
    </Link>
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
              <h2 className="mb-2 flex items-center gap-2 px-1 text-[12px] font-medium text-muted">
                <span>
                  {group.stamp === todayStamp
                    ? s('today')
                    : group.stamp === yesterdayStamp
                      ? s('yesterday')
                      : formatDay(group.stamp, lang)}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </h2>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NewsRow item={item} lang={lang} />
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
