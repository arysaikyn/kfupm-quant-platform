import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { isUnlocked, nextUnlock, useSeenRoutes } from '../../store/learn'
import { strings, termRoutes, terms, unlockLabels } from './strings'
import type { Term } from './strings'

/**
 * Search folding. Latin loses case and accents, Arabic loses the marks that
 * readers leave out anyway, and CJK is left alone: every language then reduces
 * to a plain substring test (`includes`) with no per-script branches at the
 * call site.
 */
function fold(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0640\u064b-\u0652\u0670]/g, '')
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064a')
}

/**
 * The heading a term files under. Chinese has no letters, so its first
 * character *is* the bucket — exactly how a paper dictionary is thumbed
 * through. Arabic folds the hamza forms so أقصى files with the other alifs.
 */
function groupKey(term: string, lang: Lang): string {
  const first = Array.from(term.trim())[0] ?? '#'
  if (lang === 'zh') return first
  const base =
    lang === 'ar'
      ? first.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
      : first.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return /\p{L}/u.test(base) ? base.toLocaleUpperCase() : '#'
}

const COLLATOR: Record<Lang, string> = { zh: 'zh', en: 'en', ar: 'ar' }

type Entry = Term & { locked: boolean }

type Group = { key: string; items: Entry[] }

function buildGroups(lang: Lang, entries: Entry[], query: string): Group[] {
  const needle = fold(query.trim())
  // A locked entry still answers its headword, because that is how a reader
  // discovers what to unlock; its explanation stays hidden until earned.
  const list = entries.filter(
    (t) =>
      !needle ||
      fold(t.term).includes(needle) ||
      (!t.locked && fold(t.plain).includes(needle)),
  )

  // Insertion order is the curated order, so a plain record plus the key
  // roster keeps the groups in the order they were first met.
  const buckets: Record<string, Entry[]> = {}
  const order: string[] = []
  for (const item of list) {
    const key = groupKey(item.term, lang)
    if (buckets[key]) buckets[key].push(item)
    else {
      buckets[key] = [item]
      order.push(key)
    }
  }

  const groups: Group[] = order.map((key) => ({ key, items: buckets[key] }))

  // Chinese keeps the order the terms are introduced in: the buckets are
  // characters, so there is no alphabet to sort them by. Latin and Arabic
  // sort, so a reader can find a letter without scanning every label.
  if (lang !== 'zh') {
    const collator = COLLATOR[lang]
    groups.sort((a, b) => a.key.localeCompare(b.key, collator))
    for (const group of groups) {
      group.items.sort((a, b) => a.term.localeCompare(b.term, collator))
    }
  }

  return groups
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  )
}

function GoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 rtl:[transform:scaleX(-1)]"
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function LearnPage() {
  const { lang, t } = useI18n()
  const s = useStrings(strings)
  const [query, setQuery] = useState('')
  const seen = useSeenRoutes()

  // Lock state is derived per render from the visited screens, so it never
  // goes stale and a term cannot stay locked after its screen was opened.
  const entries = useMemo(
    () =>
      terms[lang].map((term) => ({
        ...term,
        locked: !isUnlocked(termRoutes[term.id], seen),
      })),
    [lang, seen],
  )

  const groups = useMemo(() => buildGroups(lang, entries, query), [lang, entries, query])
  const shown = groups.reduce((n, g) => n + g.items.length, 0)
  const locked = entries.filter((entry) => entry.locked).length
  const unlocked = entries.length - locked
  const searching = query.trim().length > 0

  // One heading per group, keyed by the group label. The index strip is a
  // table of contents, so a jump scrolls the group under the sticky header and
  // moves focus to its heading instead of only scrolling.
  const heads = useRef<Record<string, HTMLHeadingElement | null>>({})

  const jumpTo = (key: string) => {
    const heading = heads.current[key]
    if (!heading) return
    heading.scrollIntoView({ block: 'start', behavior: 'smooth' })
    heading.focus({ preventScroll: true })
  }

  const count = (searching ? s('countHit') : s('countAll'))
    .replace('{n}', fmtNum(shown, lang, 0))
    .replace('{unlocked}', fmtNum(unlocked, lang, 0))

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/me" />}>
      <div className="pt-4">
        <p className="text-[14px] leading-[1.5] text-muted">{s('intro')}</p>

        {/* The border lives on the wrapper so focus lights the whole field. */}
        <div className="panel mt-3 flex h-14 items-center gap-1 ps-4 pe-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg">
          <span className="flex shrink-0 items-center text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
            }}
            placeholder={s('search')}
            aria-label={s('search')}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-[16px] text-fg outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={s('clear')}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:text-fg ${
              query ? '' : 'invisible'
            }`}
          >
            <ClearIcon />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <p className="num text-[12px] text-muted" aria-live="polite">
            {count}
          </p>
          {locked > 0 && (
            <span className="num rounded-full bg-fg/5 px-2 py-0.5 text-[10px] leading-[1.6] text-muted">
              {s('lockedBadge').replace('{n}', fmtNum(locked, lang, 0))}
            </span>
          )}
        </div>

        {/* A first-letter strip, horizontal so twenty buckets still fit one
            line on a phone. It follows the filter: a letter with no hit under
            the current query is not offered. */}
        {groups.length > 0 && (
          <nav aria-label={s('indexAria')} className="mt-2 -mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-1.5 pb-1">
              {groups.map((group) => (
                <li key={group.key}>
                  <button
                    type="button"
                    onClick={() => jumpTo(group.key)}
                    className="num flex h-11 min-w-11 items-center justify-center rounded-full bg-fg/5 px-2 text-[13px] font-semibold text-fg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                  >
                    {group.key}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {groups.map((group) => {
        const size = fmtNum(group.items.length, lang, 0)
        return (
          <section key={group.key} className="mt-8">
            {/* Sticks to the top of the viewport while the group
                scrolls past, so the reader always knows the current bucket. The
                letter index focuses this heading, so it must take tabIndex -1. */}
            <h2
              ref={(node) => {
                heads.current[group.key] = node
              }}
              tabIndex={-1}
              style={{ top: 'env(safe-area-inset-top)' }}
              className="sticky top-0 z-20 -mx-4 scroll-mt-0 bg-bg px-4 pt-2.5 pb-1.5 text-[12px] font-semibold text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
            >
              {group.key}
              <span className="num ms-1.5 font-normal opacity-70">
                <span aria-hidden="true">{size}</span>
                <span className="sr-only">
                  {' '}
                  {s('groupCount').replace('{n}', size)}
                </span>
              </span>
            </h2>

            <ul className="divide-y divide-line border-t border-line">
              {group.items.map((item) => {
                const target = item.locked ? nextUnlock(termRoutes[item.id], seen) : null
                return (
                  <li
                    key={item.id}
                    className={`px-3 py-4 ${item.locked ? 'opacity-60' : ''}`}
                  >
                    <h3 className="t-title flex items-center gap-1.5 text-[15px] leading-[1.35] font-semibold text-fg">
                      {item.locked && <LockIcon />}
                      {item.term}
                      {item.locked && (
                        <span className="sr-only"> · {s('lockedA11y')}</span>
                      )}
                    </h3>
                    {item.locked && target ? (
                      <Link
                        to={target}
                        className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-full text-[12px] text-fg underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                      >
                        {s('unlockHint').replace('{place}', t(unlockLabels[target]))}
                        <GoIcon />
                      </Link>
                    ) : (
                      <>
                        <p className="mt-1.5 text-[14px] leading-[1.55] text-fg/85">
                          {item.plain}
                        </p>
                        <div className="mt-3 border-s-2 border-line ps-3">
                          <p className="text-[11px] leading-[1.4] font-semibold text-muted">
                            {s('why')}
                          </p>
                          <p className="mt-1 text-[12px] leading-[1.5] text-muted">
                            {item.why}
                          </p>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {groups.length === 0 && (
        <EmptyState
          text={s('empty')}
          action={
            <button
              type="button"
              onClick={() => setQuery('')}
              className="min-h-11 rounded-full border border-line px-4 text-[13px]"
            >
              {s('emptyAction')}
            </button>
          }
        />
      )}
    </Screen>
  )
}
