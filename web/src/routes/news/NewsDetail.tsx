import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { news } from '../../data/mock'
import { fmtPct, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol, relTime } from './format'
import { strings } from './strings'

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useI18n()
  const s = useStrings(strings)
  const navigate = useNavigate()
  const item = news.find((n) => n.id === id)

  const back = (
    <Link
      to="/news"
      className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-line px-3 text-[13px] text-muted"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="rtl:[transform:scaleX(-1)]"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {s('back')}
    </Link>
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
          <div className="mt-2 flex flex-wrap gap-2">
            {item.symbols.map((sym) => {
              const quote = quoteBySymbol[sym]
              return (
                <Link
                  key={sym}
                  to={`/m/${sym}`}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5"
                >
                  <span className="num text-[13px] text-fg">{sym}</span>
                  {quote && <span className="text-[13px] text-muted">{quote.name[lang]}</span>}
                  {quote && (
                    <span
                      className={`num text-[12px] ${quote.change >= 0 ? 'text-up' : 'text-down'}`}
                    >
                      {fmtPct(quote.change, lang)}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => navigate('/ai')}
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-[15px] font-medium text-white"
        >
          {s('askAi')}
        </button>
      </article>
    </Screen>
  )
}
