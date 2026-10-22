import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import { strings } from './strings'

const RECENT_KEY = 'search.recent'
const MAX_RECENT = 5

/** The quote table is fixed at import time; symbols are the only keys. */
const QUOTE_BY_SYMBOL: Record<string, Quote | undefined> = Object.fromEntries(
  quotes.map((quote) => [quote.symbol, quote] as const),
)

/** Arabic diacritics, Quranic marks and tatweel carry no search meaning. */
const ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g
/** Zero-width and bidi controls arrive with copied Arabic text; drop them. */
const INVISIBLES = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g

/**
 * One fold for query and target. Lowercasing is a no-op for CJK and Arabic;
 * NFKC turns full-width Latin/digits into ASCII; Arabic alef, alef maqsura,
 * ta marbuta and hamza variants collapse so “ارامكو” finds “أرامكو”.
 */
function fold(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(ARABIC_MARKS, '')
    .replace(INVISIBLES, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0640/g, '')
    .trim()
}

function isRecentTerm(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of parsed) {
      if (!isRecentTerm(item)) continue
      const term = item.trim().replace(/\s+/g, ' ')
      const key = fold(term)
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(term)
      if (out.length === MAX_RECENT) break
    }
    return out
  } catch {
    // Corrupt payload or private browsing: start with no chips.
    return []
  }
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.62 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z" />
    </svg>
  )
}

function QuoteRow({
  quote,
  lang,
  watched,
  watchLabel,
  onToggle,
  onOpen,
}: {
  quote: Quote
  lang: Lang
  watched: boolean
  watchLabel: string
  onToggle: () => void
  onOpen?: () => void
}) {
  const up = quote.change >= 0
  return (
    <li className="row pe-1">
      <Link
        to={`/m/${quote.symbol}`}
        onClick={onOpen}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 py-2 transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-tight font-medium">
            {quote.name[lang]}
          </span>
          <span className="num mt-1 flex items-center gap-1.5 text-[11px] leading-tight text-muted">
            <span>{quote.symbol}</span>
            <span aria-hidden="true">·</span>
            <span>{quote.currency}</span>
          </span>
        </span>
        <span className="shrink-0 text-end">
          <span className="num block text-[14px] leading-tight font-semibold">
            {fmtNum(quote.price, lang)}
          </span>
          <span
            className={`num mt-1 block text-[11px] leading-tight ${up ? 'text-up' : 'text-down'}`}
          >
            {fmtPct(quote.change, lang)}
          </span>
        </span>
      </Link>

      {/* Sibling of the link, not a nested button: the row stays one tap target
          for /m/{symbol} while the star keeps its own 44px hit area. */}
      <button
        type="button"
        aria-pressed={watched}
        aria-label={watchLabel}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          onToggle()
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
        style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
      >
        <StarIcon filled={watched} />
      </button>
    </li>
  )
}

export default function SearchPage() {
  const { lang, dir } = useI18n()
  const s = useStrings(strings)
  const navigate = useNavigate()
  const { watchlist } = useUser()
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // autoFocus opens the keyboard on route entry; this also covers the case
    // where the browser ignores the attribute after a view transition.
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    } catch {
      // Private browsing: chips work for the session but do not persist.
    }
  }, [recent])

  const needle = fold(query)

  const results = useMemo(() => {
    if (!needle) return []
    return quotes.filter(
      (quote) =>
        fold(quote.symbol).includes(needle) ||
        fold(quote.name[lang]).includes(needle) ||
        fold(quote.currency).includes(needle),
    )
  }, [needle, lang])

  const watchedQuotes = useMemo(
    () =>
      watchlist
        .map((symbol) => QUOTE_BY_SYMBOL[symbol])
        .filter((quote): quote is Quote => quote !== undefined),
    [watchlist],
  )

  const commit = (term: string) => {
    const value = term.trim().replace(/\s+/g, ' ')
    const key = fold(value)
    if (!key) return
    setRecent((prev) => [value, ...prev.filter((item) => fold(item) !== key)].slice(0, MAX_RECENT))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    commit(query)
  }

  const chooseRecent = (term: string) => {
    setQuery(term)
    commit(term)
    inputRef.current?.focus()
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) clearQuery()
  }

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }

  const back = (
    <button
      type="button"
      onClick={goBack}
      aria-label={s('back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-fg"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
  )

  return (
    <Screen title={s('title')} leading={back}>
      <div className="pt-3">
        <form
          role="search"
          onSubmit={submit}
          className="panel flex h-14 items-center gap-1 ps-4 pe-1 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.2 4.2" />
          </svg>
          <input
            ref={inputRef}
            autoFocus
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={s('placeholder')}
            aria-label={s('placeholder')}
            className="h-11 min-w-0 flex-1 appearance-none bg-transparent text-[15px] text-fg placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:appearance-none"
          />
          {query !== '' && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label={s('clearQuery')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M7 7l10 10M17 7 7 17" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <Link to="/screener" className="panel row mt-3 gap-3">
        <span className="shrink-0 text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5h18l-7 8v6l-4 2v-8z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-tight">{s('screenerEntry')}</span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted">
            {s('screenerHint')}
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-muted rtl:[transform:scaleX(-1)]" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {needle === '' ? (
        <>
          <section className="mt-6" aria-labelledby="search-recent">
            <div className="flex items-center justify-between gap-3">
              <h2 id="search-recent" className="t-kicker text-muted">
                {s('recent')}
              </h2>
              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecent([])}
                  className="min-h-11 shrink-0 rounded-full px-2 text-[12px] text-accent transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {s('clearAll')}
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="mt-2 text-[12px] text-muted">{s('noRecent')}</p>
            ) : (
              <div className="panel mt-2 overflow-hidden">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => chooseRecent(term)}
                    className="row w-full text-start transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-muted"
                    >
                      <path d="M4 5.5v4h4" />
                      <path d="M4.6 9.5A8 8 0 1 1 4 12" />
                      <path d="M12 8v4.5l3 1.8" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{term}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {watchedQuotes.length > 0 && (
            <section className="mt-6" aria-labelledby="search-watchlist">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="search-watchlist" className="t-kicker text-muted">
                  {s('watchlist')}
                </h2>
                <span className="num text-[11px] text-muted">{watchedQuotes.length}</span>
              </div>
              <ul className="panel mt-2 overflow-hidden">
                {watchedQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.symbol}
                    quote={quote}
                    lang={lang}
                    watched
                    watchLabel={s('removeWatch')}
                    onToggle={() => toggleWatch(quote.symbol)}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      ) : results.length === 0 ? (
        <EmptyState
          text={s('noResults').replace('{q}', query.trim())}
          action={
            <button
              type="button"
              onClick={clearQuery}
              className="min-h-11 rounded-full border border-line px-4 text-[13px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {s('clearQuery')}
            </button>
          }
        />
      ) : (
        <section className="mt-6" aria-labelledby="search-results-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="search-results-heading" className="t-kicker text-muted">
              {s('results')}
            </h2>
            <span className="num text-[11px] text-muted">{results.length}</span>
          </div>
          <ul id="search-results" className="panel mt-2 overflow-hidden">
            {results.map((quote) => {
              const watched = watchlist.includes(quote.symbol)
              return (
                <QuoteRow
                  key={quote.symbol}
                  quote={quote}
                  lang={lang}
                  watched={watched}
                  watchLabel={s(watched ? 'removeWatch' : 'addWatch')}
                  onToggle={() => toggleWatch(quote.symbol)}
                  onOpen={() => commit(query)}
                />
              )
            })}
          </ul>
        </section>
      )}
    </Screen>
  )
}
