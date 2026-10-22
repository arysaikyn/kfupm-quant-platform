import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { news } from '../../data/mock'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol, relTime } from './format'
import { toggleWatch, useUser } from '../../store/user'
import { strings } from './strings'

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const item = news.find((n) => n.id === id)

  // The feed's source filter travels with the story's URL. A history pop
  // already restores it; this fallback covers a deep link or a reload, where
  // there is no entry to pop and back must still land on the filtered list.
  const source = params.get('source')
  const back = (
    <BackButton fallback={source === null ? '/news' : `/news?source=${encodeURIComponent(source)}`} />
  )

  if (!item) {
    return (
      <Screen title={s('title')} leading={back}>
        <ErrorState message={s('notFound')} />
      </Screen>
    )
  }

  return (
    <Screen title={s('title')} leading={back}>
      <article className="pt-1 pb-2">
        <h1 className="text-[23px] leading-[1.3] font-semibold text-fg rtl:leading-[1.55]">
          {item.title[lang]}
        </h1>
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
          <span className="truncate">{item.source}</span>
          <span aria-hidden="true">·</span>
          <time className="num shrink-0">{relTime(item.minutesAgo, lang)}</time>
        </div>

        <div className="mt-6 space-y-4 text-[15px] leading-[1.75] text-fg/85 rtl:leading-[1.95]">
          {item.body.map((paragraph, i) => (
            <p key={i}>{paragraph[lang]}</p>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="text-[12px] font-medium text-muted">{s('related')}</h2>
          <ul className="mt-2 space-y-2">
            {item.symbols.map((sym) => {
              const quote = quoteBySymbol[sym]
              const watched = watchlist.includes(sym)
              return (
                <li key={sym} className="panel flex items-center gap-2 ps-3.5 pe-2">
                  <Link
                    to={`/m/${sym}`}
                    className="flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-xl py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:opacity-80"
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="num shrink-0 text-[13px] font-medium text-fg">{sym}</span>
                      {quote && (
                        <span className="truncate text-[12px] text-muted">{quote.name[lang]}</span>
                      )}
                    </span>
                    {quote && (
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="num text-[15px] text-fg">{fmtNum(quote.price, lang)}</span>
                        <span className="text-[11px] text-muted">{quote.currency}</span>
                        <span
                          className={`num text-[12px] ${quote.change >= 0 ? 'text-up' : 'text-down'}`}
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80"
                    style={{
                      borderColor: watched ? 'var(--color-accent)' : 'var(--color-line)',
                      background: watched
                        ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
                        : 'transparent',
                      color: watched ? 'var(--color-accent)' : 'var(--color-muted)',
                    }}
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
          onClick={() => navigate('/ai')}
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-[15px] font-medium text-white transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80"
        >
          {s('askAi')}
        </button>
      </article>
    </Screen>
  )
}
