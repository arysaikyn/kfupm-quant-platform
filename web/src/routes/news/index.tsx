import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { news } from '../../data/mock'
import type { NewsItem, Quote } from '../../data/mock'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { useUser } from '../../store/user'
import { dayStamp, formatDay, quoteBySymbol, relTime } from './format'
import { LongPressLink } from '../../components/LongPressLink'
import { StoryArt } from './StoryArt'
import { strings } from './strings'
import type { NewsKey } from './strings'

type S = (k: NewsKey) => string

/** "1 up, 1 down" — counts only, never a canned verdict. */
function directionPhrase(
  up: number,
  down: number,
  flat: number,
  lang: Lang,
  s: S,
): string {
  const total = up + down + flat
  const lead = lang === 'zh' ? '' : ' '
  if (up === total) return `${lead}${total === 1 ? s('whyUp') : s('whyAllUp')}`
  if (down === total) return `${lead}${total === 1 ? s('whyDown') : s('whyAllDown')}`
  if (flat === total) return `${lead}${s('whyFlatOnly')}`

  const parts: string[] = []
  if (up) parts.push(`${fmtNum(up, lang, 0)} ${s('whyUp')}`)
  if (down) parts.push(`${fmtNum(down, lang, 0)} ${s('whyDown')}`)
  if (flat) parts.push(`${fmtNum(flat, lang, 0)} ${s('whyFlat')}`)
  return ` ${parts.join(s('whyComma'))}`
}

/**
 * One derived line under the deck. Scoped to the watchlist when the story
 * touches it, otherwise to every symbol in the story.
 */
function whyItMatters(item: NewsItem, watchlist: string[], lang: Lang, s: S): string | null {
  const watched = item.symbols.filter((sym) => watchlist.includes(sym))
  const scope = watched.length > 0 ? watched : item.symbols
  const quotes = scope
    .map((sym) => quoteBySymbol[sym])
    .filter((q): q is Quote => Boolean(q))
  if (quotes.length === 0) return null

  const up = quotes.filter((q) => q.change > 0).length
  const down = quotes.filter((q) => q.change < 0).length
  const flat = quotes.length - up - down
  const n = quotes.length

  const template = watched.length > 0 ? s('whyWatched') : s('whyStory')
  const counted =
    lang === 'ar' && n < 3
      ? n === 1
        ? s('whyStockOne')
        : s('whyStockTwo')
      : `${fmtNum(n, lang, 0)} ${n === 1 ? s('whyStockOne') : s('whyStock')}`
  return template
    .replace('{count}', counted)
    .replace('{dir}', directionPhrase(up, down, flat, lang, s))
}

function NewsRow({
  item,
  lang,
  s,
  watchlist,
  source,
}: {
  item: NewsItem
  lang: Lang
  s: S
  watchlist: string[]
  /** Carried into the story's URL so the detail screen can rebuild this list. */
  source: string | null
}) {
  const deck = item.body[0]?.[lang]
  const watched = item.symbols.some((sym) => watchlist.includes(sym))
  const why = whyItMatters(item, watchlist, lang, s)

  return (
    <LongPressLink
      to={source === null ? `/news/${item.id}` : `/news/${item.id}?source=${encodeURIComponent(source)}`}
      prompt={`${s('askAi')} — ${item.title[lang]}`}
      className="w-full min-w-0 flex-1 px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[17px] leading-[1.3] rtl:leading-[1.6] font-semibold tracking-[-0.011em] text-fg">
            {item.title[lang]}
          </h3>
          {deck && (
            <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.45] text-muted">{deck}</p>
          )}
          {why && <p className="mt-1.5 text-[12px] leading-[1.45] text-muted">{why}</p>}
        </div>
        <StoryArt item={item} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] leading-[1.4] text-muted">
        {watched && (
          <span className="flex shrink-0 items-center gap-1 text-accent">
            <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-current" />
            {s('watchMark')}
          </span>
        )}
        <span className="min-w-0 truncate">{item.source}</span>
        <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
        <time className="num shrink-0">{relTime(item.minutesAgo, lang)}</time>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.symbols.map((sym) => {
          const quote = quoteBySymbol[sym]
          return (
            <span
              key={sym}
              className="flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[11px]"
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
  const { watchlist } = useUser()
  const [now] = useState(() => Date.now())
  // The filter lives in the URL, not in component state: leaving for a story and
  // coming back (a history pop) must restore the same list, not reset to All.
  const [params, setParams] = useSearchParams()
  const source = params.get('source')

  const selectSource = (name: string | null) => {
    const next = new URLSearchParams(params)
    if (name === null) next.delete('source')
    else next.set('source', name)
    // replace: a chip is view state, not a destination — it must not stack
    // history entries between the list and the story the user opens next.
    setParams(next, { replace: true })
  }

  const sources = useMemo(() => Array.from(new Set(news.map((item) => item.source))), [])

  const { groups, todayStamp, yesterdayStamp } = useMemo(() => {
    const today = dayStamp(0, now)
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yesterday = y.getFullYear() * 10000 + (y.getMonth() + 1) * 100 + y.getDate()

    const sorted = [...news]
      .filter((item) => source === null || item.source === source)
      .sort((a, b) => a.minutesAgo - b.minutesAgo)
    const out: { stamp: number; items: NewsItem[] }[] = []
    for (const item of sorted) {
      const stamp = dayStamp(item.minutesAgo, now)
      const last = out[out.length - 1]
      if (last && last.stamp === stamp) last.items.push(item)
      else out.push({ stamp, items: [item] })
    }
    return { groups: out, todayStamp: today, yesterdayStamp: yesterday }
  }, [now, source])

  return (
    <Screen
      title={s('title')}
      action={
        <Link to="/calendar" className="flex min-h-[44px] items-center rounded-full px-3.5 text-[12px] text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {s('calendar')}
        </Link>
      }
    >
      <Link
        to="/review"
        className="panel row mt-1 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-fg/5"
      >
        <span className="text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5h11l5 5v9H4z" />
            <path d="M8 12h8M8 16h5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-tight">{s('reviewEntry')}</span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted">
            {s('reviewHint')}
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)] text-muted" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {sources.length > 1 && (
        <div
          role="group"
          aria-label={s('filterLabel')}
          className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
        >
          {[null, ...sources].map((name) => {
            const active = source === name
            return (
              <button
                key={name ?? 'all'}
                type="button"
                onClick={() => selectSource(name)}
                aria-pressed={active}
                className={`min-h-11 min-w-11 shrink-0 rounded-full px-3 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  active ? 'bg-surface font-medium text-fg' : 'text-muted'
                }`}
              >
                {name ?? s('allSources')}
              </button>
            )
          })}
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState text={source === null ? s('empty') : s('emptySource')} />
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section key={group.stamp}>
              <header className="mb-2 flex items-center gap-3">
                <h2 className="t-section shrink-0 ">
                  {group.stamp === todayStamp
                    ? s('today')
                    : group.stamp === yesterdayStamp
                      ? s('yesterday')
                      : formatDay(group.stamp, lang)}
                </h2>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </header>
              <ul className="panel overflow-hidden">
                {group.items.map((item) => (
                  <li key={item.id} className="row p-0">
                    <NewsRow item={item} lang={lang} s={s} watchlist={watchlist} source={source} />
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
