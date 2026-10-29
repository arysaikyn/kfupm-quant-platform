import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { news } from '../../data/mock'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol } from '../../data/mock'
import { relTime } from '../../i18n/format'
import { toggleWatch, useUser } from '../../store/user'
import { setIntake } from '../../store/aiIntake'
import { toggleSavedNews, useSavedNews } from '../../store/savedNews'
import { strings } from './strings'

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useI18n()
  const s = useStrings(strings)
  const [copied, setCopied] = useState(false)
  const savedIds = useSavedNews()
  const { watchlist } = useUser()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const item = news.find((n) => n.id === id)
  const saved = item ? savedIds.includes(item.id) : false

  // The feed's source filter travels with the story's URL. A history pop
  // already restores it; this fallback covers a deep link or a reload, where
  // there is no entry to pop and back must still land on the filtered list.
  const source = params.get('source')
  const back = (
    <BackButton fallback={source === null ? '/news' : `/news?source=${encodeURIComponent(source)}`} />
  )

  if (!item) {
    return (
      <Screen leading={back}>
        <ErrorState message={s('notFound')} />
      </Screen>
    )
  }

  return (
    <Screen leading={back}>
      <article className="pt-1 pb-2">
        {/* The headline is the hero: largest type on the page, on the canvas. */}
        <h1 className="t-title text-2xl leading-[1.25] font-semibold text-fg rtl:leading-[1.55]">
          {item.title[lang]}
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-2xs text-muted">
          <Link
            to={`/news?source=${encodeURIComponent(item.source)}`}
            className="inline-flex min-h-11 min-w-0 items-center truncate underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {item.source}
          </Link>
          <span aria-hidden="true">·</span>
          <time className="num shrink-0">{relTime(item.minutesAgo, lang)}</time>
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? s('saved') : s('save')}
            onClick={() => toggleSavedNews(item.id)}
            className="ms-auto flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            style={{ color: saved ? 'var(--color-accent)' : undefined }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 4h12v16l-6-4-6 4z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1600)
              } catch {
                // Clipboard permission is optional.
              }
            }}
            className="inline-flex min-h-11 items-center rounded-full px-2 text-2xs text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {copied ? t('common.copied') : s('share')}
          </button>
        </div>

        <div className="mt-6 max-w-[68ch] space-y-4 text-md leading-[1.75] text-fg/85 rtl:leading-[1.95]">
          {item.body.map((paragraph, i) => (
            <p key={i}>{paragraph[lang]}</p>
          ))}
        </div>

        <section className="mt-9">
          <h2 className="text-xs font-medium text-muted">{s('related')}</h2>
          <ul className="mt-2 border-t border-line divide-y divide-line">
            {item.symbols.map((sym) => {
              const quote = quoteBySymbol[sym]
              const watched = watchlist.includes(sym)
              return (
                <li key={sym} className="flex items-center gap-2">
                  <Link
                    to={`/m/${sym}`}
                    className="flex min-h-14 min-w-0 flex-1 flex-col justify-center py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:opacity-80"
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="num shrink-0 text-sm font-medium text-fg">{sym}</span>
                      {quote && (
                        <span className="truncate text-xs text-muted">{quote.name[lang]}</span>
                      )}
                    </span>
                    {quote && (
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="num text-md text-fg">{fmtNum(quote.price, lang)}</span>
                        <span className="text-2xs text-muted">{quote.currency}</span>
                        <span
                          className={`num text-xs ${quote.change >= 0 ? 'text-up' : 'text-down'}`}
                        >
                          {fmtPct(quote.change, lang)}
                        </span>
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleWatch(sym)}
                    aria-pressed={watched}
                    aria-label={`${watched ? s('watchRemove') : s('watchAdd')} · ${sym}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
                    style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill={watched ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3.8l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.82 6.9 19.5l.97-5.68L3.75 9.8l5.7-.83z" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <button
          type="button"
          onClick={() => {
            setIntake(`${s('askAi')} — ${item.title[lang]}`, [{ kind: 'news', id: item.id }])
            navigate('/ai')
          }}
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-solid px-5 text-md font-medium text-bg transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
        >
          {s('askAi')}
        </button>
      </article>
    </Screen>
  )
}
