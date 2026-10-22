import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quotes } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import { strings, SEED_GROUP_NAME } from './strings'

type Group = {
  id: string
  name: string
  symbols: string[]
}

const KEY = 'watchlists.v1'
/** The seeded group is the one wired to the shared watchlist store. */
const DEFAULT_ID = 'default'
const MAX_NAME = 24
const CONFIRM_MS = 3000

const QUOTE_BY_SYMBOL: Record<string, (typeof quotes)[number]> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q] as const),
)

/** Accepts only symbols this build can render, and never twice in one group. */
function cleanSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const symbol of value) {
    if (typeof symbol !== 'string') continue
    if (!Object.hasOwn(QUOTE_BY_SYMBOL, symbol) || out.includes(symbol)) continue
    out.push(symbol)
  }
  return out
}

/** Code-point slice, so a 24-character cap never splits a surrogate pair. */
function clampName(value: string): string {
  return Array.from(value).slice(0, MAX_NAME).join('')
}

function toGroup(value: unknown): Group | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.name !== 'string') return null
  const name = clampName(raw.name.trim())
  if (!name) return null
  return { id: raw.id, name, symbols: cleanSymbols(raw.symbols) }
}

function seed(watchlist: string[]): Group[] {
  return [{ id: DEFAULT_ID, name: SEED_GROUP_NAME, symbols: cleanSymbols(watchlist) }]
}

/** A stored empty array stays empty; only a missing key or bad payload reseeds. */
function load(watchlist: string[]): Group[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Private browsing: seed still renders for this session.
    return seed(watchlist)
  }
  if (raw === null) return seed(watchlist)
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const groups = parsed.flatMap((entry) => {
        const group = toGroup(entry)
        return group ? [group] : []
      })
      return groups
    }
  } catch {
    // Corrupt payload: start from the seed rather than an unusable screen.
  }
  return seed(watchlist)
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

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="m6.5 7 .8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 19.5H8L18.5 9a2.1 2.1 0 0 0-3-3L5 16.5v3z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12h7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.6 4.6L19 7.6" />
    </svg>
  )
}

function CloseIcon() {
  return (
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
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconBtn({
  label,
  onClick,
  children,
  type = 'button',
  disabled,
  tone,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  tone?: string
}) {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      style={{ color: tone ?? 'var(--color-muted)' }}
    >
      {children}
    </button>
  )
}

function HeadStat({ value, label, tracking }: { value: number; label: string; tracking: number | undefined }) {
  return (
    <div className="text-end">
      <p className="num text-[17px] leading-none font-semibold">{value}</p>
      <p
        className="t-kicker mt-1.5 max-w-[86px] truncate"
        style={{ color: 'var(--color-muted)', letterSpacing: tracking }}
      >
        {label}
      </p>
    </div>
  )
}

export default function WatchlistsPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()

  const [groups, setGroups] = useState<Group[]>(() => load(watchlist))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pick, setPick] = useState(
    () => quotes.find((q) => !groups[0]?.symbols.includes(q.symbol))?.symbol ?? quotes[0].symbol,
  )
  const newRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(groups))
    } catch {
      // Persistence is best-effort; the session still works.
    }
  }, [groups])

  // Two-tap delete: the armed state expires on its own, so a stray tap cannot
  // delete a group later.
  useEffect(() => {
    if (!confirmId) return
    const timer = setTimeout(() => setConfirmId(null), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [confirmId])

  useEffect(() => {
    if (newOpen) newRef.current?.focus()
  }, [newOpen])

  const active = groups.find((g) => g.id === activeId) ?? groups[0] ?? null

  const uniqueCount = useMemo(() => {
    const seen = new Set<string>()
    for (const group of groups) {
      for (const symbol of group.symbols) {
        if (Object.hasOwn(QUOTE_BY_SYMBOL, symbol)) seen.add(symbol)
      }
    }
    return seen.size
  }, [groups])

  const rows = useMemo(() => {
    if (!active) return []
    return active.symbols.flatMap((symbol) => {
      const quote = QUOTE_BY_SYMBOL[symbol]
      return quote ? [quote] : []
    })
  }, [active])

  function patchGroup(id: string, update: (group: Group) => Group) {
    setGroups((prev) => prev.map((group) => (group.id === id ? update(group) : group)))
  }

  /** The shared store is the source of truth; only write when it would change. */
  function setWatched(symbol: string, watched: boolean) {
    if (watchlist.includes(symbol) !== watched) toggleWatch(symbol)
  }

  function createGroup(e: FormEvent) {
    e.preventDefault()
    const name = clampName(newName.trim())
    if (!name) return
    const id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    setGroups((prev) => [...prev, { id, name, symbols: [] }])
    setActiveId(id)
    setNewName('')
    setNewOpen(false)
    setEditingId(null)
    setConfirmId(null)
  }

  function startRename(group: Group) {
    setEditingId(group.id)
    setEditName(group.name)
    setConfirmId(null)
  }

  function saveRename(e: FormEvent) {
    e.preventDefault()
    const name = clampName(editName.trim())
    if (!editingId || !name) return
    patchGroup(editingId, (group) => ({ ...group, name }))
    setEditingId(null)
  }

  // First tap arms, second tap deletes. Tapping another trash re-arms it there.
  function tapDelete(group: Group) {
    if (confirmId !== group.id) {
      setConfirmId(group.id)
      return
    }
    setGroups((prev) => prev.filter((g) => g.id !== group.id))
    setActiveId((prev) => (prev === group.id ? null : prev))
    setEditingId((prev) => (prev === group.id ? null : prev))
    setConfirmId(null)
  }

  function addSymbol(e: FormEvent) {
    e.preventDefault()
    if (!active || active.symbols.includes(pick)) return
    if (active.id === DEFAULT_ID) setWatched(pick, true)
    patchGroup(active.id, (group) => ({ ...group, symbols: [pick, ...group.symbols] }))
    const next = quotes.find((q) => q.symbol !== pick && !active.symbols.includes(q.symbol))
    if (next) setPick(next.symbol)
  }

  function removeSymbol(group: Group, symbol: string) {
    if (group.id === DEFAULT_ID) setWatched(symbol, false)
    patchGroup(group.id, (g) => ({ ...g, symbols: g.symbols.filter((x) => x !== symbol) }))
  }

  function toggleStar(symbol: string) {
    const watched = watchlist.includes(symbol)
    toggleWatch(symbol)
    // The seeded group mirrors the primary list, wherever the star is tapped.
    if (groups.some((g) => g.id === DEFAULT_ID)) {
      patchGroup(DEFAULT_ID, (g) => ({
        ...g,
        symbols: watched
          ? g.symbols.filter((x) => x !== symbol)
          : [symbol, ...g.symbols.filter((x) => x !== symbol)],
      }))
    }
  }

  const kicker = { letterSpacing: lang === 'ar' ? 0 : undefined }
  const canAdd = Boolean(active) && !active?.symbols.includes(pick)
  const deleting = active !== null && confirmId === active.id

  return (
    <Screen
      title={s('title')}
      subtitle={s('subtitle')}
      action={
        <div
          role="group"
          aria-label={`${groups.length} ${s('groups')}, ${uniqueCount} ${s('uniqueSymbols')}`}
          className="flex shrink-0 items-center gap-3 pb-0.5"
        >
          <HeadStat value={groups.length} label={s('groups')} tracking={kicker.letterSpacing} />
          <span aria-hidden="true" className="h-7 w-px" style={{ background: 'var(--color-line)' }} />
          <HeadStat value={uniqueCount} label={s('uniqueSymbols')} tracking={kicker.letterSpacing} />
        </div>
      }
    >
      {/* Chips scroll on their own axis; the negative gutter lets them run to the
          screen edge without ever widening the page. */}
      <div
        className="-mx-4 mt-4 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
      >
        <div role="group" aria-label={s('groups')} className="flex w-max min-w-full items-center gap-2 pb-1">
          {groups.map((group) => {
            const selected = active?.id === group.id
            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setActiveId(group.id)
                  setEditingId(null)
                  setConfirmId(null)
                  const next = quotes.find((q) => !group.symbols.includes(q.symbol))
                  if (next) setPick(next.symbol)
                }}
                title={group.name}
                className="flex min-h-11 max-w-[220px] shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                style={
                  selected
                    ? { background: 'var(--color-fg)', color: 'var(--color-bg)' }
                    : { border: '1px solid var(--color-line)', color: 'var(--color-muted)' }
                }
              >
                <span className="min-w-0 truncate">{group.name}</span>
                <span aria-hidden="true" className="num text-[10px] opacity-60">
                  {group.symbols.length}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setNewOpen((open) => !open)}
            aria-expanded={newOpen}
            aria-controls={newOpen ? 'wl-new-group' : undefined}
            aria-label={s('newGroup')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            style={{ border: '1px dashed var(--color-line)', color: 'var(--color-muted)' }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {newOpen && (
        <form
          id="wl-new-group"
          onSubmit={createGroup}
          className="panel mt-2 p-3"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setNewOpen(false)
              setNewName('')
            }
          }}
        >
          <label htmlFor="wl-new-name" className="t-kicker" style={{ ...kicker, color: 'var(--color-muted)' }}>
            {s('newGroup')}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={newRef}
              id="wl-new-name"
              value={newName}
              maxLength={MAX_NAME}
              placeholder={s('groupNamePlaceholder')}
              aria-label={s('groupName')}
              onChange={(e) => setNewName(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-lg px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                border: '1px solid var(--color-line)',
                background: 'var(--color-bg)',
                color: 'var(--color-fg)',
              }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="min-h-11 shrink-0 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {s('create')}
            </button>
            <IconBtn
              label={s('cancel')}
              onClick={() => {
                setNewOpen(false)
                setNewName('')
              }}
            >
              <CloseIcon />
            </IconBtn>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
              {s('nameLimit')}
            </span>
            <span className="num text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {newName.length}/{MAX_NAME}
            </span>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <EmptyState
          text={s('emptyGroups')}
          action={
            !newOpen ? (
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="min-h-11 rounded-full px-4 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                {s('newGroup')}
              </button>
            ) : undefined
          }
        />
      ) : active ? (
        <section className="panel mt-3 overflow-hidden">
          <div
            className="flex items-center gap-1 border-b ps-3 pe-1 py-1.5"
            style={{ borderColor: 'var(--color-line)' }}
          >
            {editingId === active.id ? (
              <form onSubmit={saveRename} className="flex min-w-0 flex-1 items-center gap-1">
                <label htmlFor="wl-rename" className="sr-only">
                  {s('rename')}
                </label>
                <input
                  id="wl-rename"
                  autoFocus
                  value={editName}
                  maxLength={MAX_NAME}
                  aria-label={s('groupName')}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="min-h-11 min-w-0 flex-1 rounded-lg px-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-accent"
                  style={{
                    border: '1px solid var(--color-line)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-fg)',
                  }}
                />
                <IconBtn label={s('save')} type="submit" disabled={!editName.trim()}>
                  <CheckIcon />
                </IconBtn>
                <IconBtn label={s('cancel')} onClick={() => setEditingId(null)}>
                  <CloseIcon />
                </IconBtn>
              </form>
            ) : (
              <>
                <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{active.name}</h2>
                <span className="num shrink-0 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {rows.length}
                </span>
                <IconBtn label={`${s('rename')} ${active.name}`} onClick={() => startRename(active)}>
                  <PencilIcon />
                </IconBtn>
                {deleting ? (
                  <button
                    type="button"
                    onClick={() => tapDelete(active)}
                    aria-label={`${s('confirmDelete')} ${active.name}`}
                    className="flex min-h-11 shrink-0 items-center rounded-full px-3 text-[11px] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                    style={{
                      border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
                      background: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {s('confirmDelete')}
                  </button>
                ) : (
                  <IconBtn label={`${s('delete')} ${active.name}`} onClick={() => tapDelete(active)}>
                    <TrashIcon />
                  </IconBtn>
                )}
              </>
            )}
          </div>

          <form
            onSubmit={addSymbol}
            className="flex items-center gap-2 border-b px-3 py-2"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <label htmlFor="wl-add-symbol" className="sr-only">
              {s('addSymbol')}
            </label>
            <select
              id="wl-add-symbol"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-lg px-2 text-[13px] focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                border: '1px solid var(--color-line)',
                background: 'var(--color-bg)',
                color: 'var(--color-fg)',
              }}
            >
              {quotes.map((q) => (
                <option key={q.symbol} value={q.symbol}>
                  {q.symbol} · {q.name[lang]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!canAdd}
              className="min-h-11 shrink-0 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {s('add')}
            </button>
          </form>

          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--color-muted)' }}>
              {s('emptyGroup')}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((q) => {
                const watched = watchlist.includes(q.symbol)
                const tone = q.change >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                return (
                  <li key={q.symbol} className="flex items-center">
                    <Link
                      to={`/m/${q.symbol}`}
                      className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 ps-3 pe-2 py-2.5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="num block text-[14px] leading-tight font-semibold">{q.symbol}</span>
                        <span
                          className="mt-1 block truncate text-[11.5px] leading-tight"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {q.name[lang]}
                        </span>
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="num block text-[14px] leading-tight font-medium">
                          {fmtNum(q.price, lang, 2)}
                        </span>
                        <span className="num mt-1 block text-[11px] leading-tight" style={{ color: tone }}>
                          {fmtPct(q.change, lang)}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-pressed={watched}
                      aria-label={`${watched ? s('removeFromWatch') : s('addToWatch')}: ${q.symbol}`}
                      onClick={() => toggleStar(q.symbol)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                      style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
                    >
                      <StarIcon filled={watched} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${s('removeFromGroup')}: ${q.symbol}`}
                      onClick={() => removeSymbol(active, q.symbol)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <MinusIcon />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}
    </Screen>
  )
}
