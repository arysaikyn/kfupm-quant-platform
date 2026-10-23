import { useMemo, useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { strings, terms } from './strings'
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

type Group = { key: string; items: Term[] }

function buildGroups(lang: Lang, query: string): Group[] {
  const needle = fold(query.trim())
  const list = terms[lang].filter(
    (t) => !needle || fold(t.term).includes(needle) || fold(t.plain).includes(needle),
  )

  // Insertion order is the curated order, so a plain record plus the key
  // roster keeps the groups in the order they were first met.
  const buckets: Record<string, Term[]> = {}
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

export default function LearnPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const [query, setQuery] = useState('')

  const groups = useMemo(() => buildGroups(lang, query), [lang, query])
  const shown = groups.reduce((n, g) => n + g.items.length, 0)
  const searching = query.trim().length > 0

  const count = (searching ? s('countHit') : s('countAll')).replace(
    '{n}',
    fmtNum(shown, lang, 0),
  )

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/me" />}>
      <div className="pt-4">
        <p className="text-[13px] leading-[1.5] text-muted">{s('intro')}</p>

        {/* The border lives on the wrapper so focus lights the whole field. */}
        <div className="panel mt-3 flex h-14 items-center gap-1 ps-4 pe-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
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

        <p className="num mt-2.5 text-[12px] text-muted" aria-live="polite">
          {count}
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="mt-6">
          {/* Sticks just under the Screen header (65px tall) while the group
              scrolls past, so the reader always knows the current bucket. */}
          <h2 className="sticky top-[64px] z-20 -mx-4 flex items-center gap-2 bg-bg px-4 pt-2.5 pb-2 text-[14px] font-semibold">
            <span className="text-fg">{group.key}</span>
          </h2>

          <ul className="panel divide-y divide-line overflow-hidden">
            {group.items.map((item) => (
              <li key={item.term} className="px-4 py-4">
                <h3 className="t-title text-[17px] leading-[1.3] font-semibold text-fg">
                  {item.term}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-fg/85">{item.plain}</p>
                <div className="mt-3 border-s-2 border-line ps-3">
                  <p className="text-[11px] leading-[1.4] font-semibold text-muted">
                    {s('why')}
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted">{item.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

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
