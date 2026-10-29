import { useEffect, useMemo, useRef, useState } from 'react'
import { StarIcon } from '../../components/StarIcon'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quoteBySymbol, quotes } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import {
  RETURN_AFTER_DAYS,
  RETURN_REASONS,
  clearReturn,
  daysUntil,
  isEligible,
  partitionReturns,
  recordReturn,
  useReturns,
} from '../../store/returns'
import type { ReturnEntry, ReturnReason } from '../../store/returns'
import {
  DEFAULT_ID,
  MAX_NAME,
  clampName,
  loadGroups,
  saveGroups,
} from '../../store/watchlists'
import type { Group } from '../../store/watchlists'
import { CheckIcon, CloseIcon, IconBtn, MinusIcon, MoveIcon, PencilIcon, PlusIcon, TrashIcon } from './icons'
import { strings } from './strings'

type S = (key: keyof (typeof strings)['en']) => string

const CONFIRM_MS = 3000

/** Copy keys for the reason a name was dropped; the reasons themselves live in `store/returns`. */
const REASON_KEYS: Record<ReturnReason, keyof (typeof strings)['en']> = {
  valuation: 'reasonValuation',
  risk: 'reasonRisk',
  crowded: 'reasonCrowded',
  other: 'reasonOther',
}



function HeadStat({ value, label, tracking }: { value: number; label: string; tracking: number | undefined }) {
  return (
    <div className="text-end">
      <p className="num text-xl leading-none font-semibold">{value}</p>
      <p
        className="mt-1.5 max-w-[86px] truncate text-2xs leading-tight text-muted"
        style={{ letterSpacing: tracking }}
      >
        {label}
      </p>
    </div>
  )
}

function ReturnsDock({
  entries,
  s,
  lang,
  onReadd,
  onDismiss,
}: {
  entries: ReturnEntry[]
  s: S
  lang: Lang
  onReadd: (entry: ReturnEntry) => void
  onDismiss: (entry: ReturnEntry) => void
}) {
  const [now] = useState(() => Date.now())
  const visible = entries.filter((entry) => Object.hasOwn(quoteBySymbol, entry.symbol))
  const { eligible, pending } = partitionReturns(visible, now)
  if (visible.length === 0) return null
  return (
    <section className="mt-8 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-section">{s('returnsTitle')}</h2>
        <span className="num text-2xs text-muted">{visible.length}</span>
      </div>
      <p className="mt-1 text-2xs leading-snug text-muted">
        {s('returnsHint').replace('{days}', String(RETURN_AFTER_DAYS))}
      </p>
      <ul className="mt-2">
        {[...eligible, ...pending].map((entry) => {
          const quote = quoteBySymbol[entry.symbol]
          if (!quote) return null
          const ready = isEligible(entry, now)
          return (
            <li key={entry.id} className="border-t border-line py-3 first:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/m/${entry.symbol}`}
                  className="min-w-0 flex-1 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="num text-sm font-semibold">{entry.symbol}</span>
                    {entry.example && (
                      <span className="rounded-full border border-line px-1.5 py-0.5 text-2xs leading-none text-muted">
                        {s('returnsExample')}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-2xs leading-tight text-muted">
                    {quote.name[lang]} · {s(REASON_KEYS[entry.reason])}
                  </span>
                </Link>
                <div className="shrink-0 text-end">
                  <p className="text-2xs leading-snug text-muted">
                    {ready
                      ? s('returnsReady')
                      : s('returnsInDays').replace('{days}', String(daysUntil(entry, now)))}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    {ready && (
                      <button
                        type="button"
                        onClick={() => onReadd(entry)}
                        className="min-h-11 rounded-full bg-solid px-3 text-2xs font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
                      >
                        {s('readd')}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`${s('dismiss')}: ${entry.symbol}`}
                      onClick={() => onDismiss(entry)}
                      className="min-h-11 min-w-11 rounded-full px-2 text-2xs text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                    >
                      {s('dismiss')}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function WatchlistsPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()

  const [groups, setGroups] = useState<Group[]>(() => {
    const loaded = loadGroups(watchlist, s('defaultGroup'))
    // A group seeded before localisation carries the old Chinese name. Rename
    // only that untouched seed; a user's own rename is left alone.
    return loaded.map((group) =>
      group.id === DEFAULT_ID && group.name === '默认'
        ? { ...group, name: s('defaultGroup') }
        : group,
    )
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [movingSymbol, setMovingSymbol] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState('')
  const [removeAsk, setRemoveAsk] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState<ReturnReason>('valuation')
  const returns = useReturns()
  const [pick, setPick] = useState(
    () => quotes.find((q) => !groups[0]?.symbols.includes(q.symbol))?.symbol ?? quotes[0].symbol,
  )
  const newRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      saveGroups(groups)
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
        if (Object.hasOwn(quoteBySymbol, symbol)) seen.add(symbol)
      }
    }
    return seen.size
  }, [groups])

  const rows = useMemo(() => {
    if (!active) return []
    return active.symbols.flatMap((symbol) => {
      const quote = quoteBySymbol[symbol]
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
    setMovingSymbol(null)
    setRemoveAsk(null)
  }

  function startRename(group: Group) {
    setEditingId(group.id)
    setEditName(group.name)
    setConfirmId(null)
    setMovingSymbol(null)
    setRemoveAsk(null)
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
    setMovingSymbol(null)
    setRemoveAsk(null)
  }

  // Moving is an inline picker rather than drag: a drag is invisible to anyone
  // who cannot see the screen, and this list has to stay usable with a keyboard.
  function startMove(group: Group, symbol: string) {
    const target = groups.find((g) => g.id !== group.id)
    if (!target) return
    setMovingSymbol(symbol)
    setMoveTarget(target.id)
    setConfirmId(null)
    setEditingId(null)
    setRemoveAsk(null)
  }

  function commitMove(e: FormEvent, group: Group) {
    e.preventDefault()
    const symbol = movingSymbol
    const target = groups.find((g) => g.id === moveTarget && g.id !== group.id)
    if (!symbol || !target) return
    // The seeded group mirrors the shared watchlist, so crossing its edge
    // also flips the symbol's membership there.
    if (group.id === DEFAULT_ID) setWatched(symbol, false)
    if (target.id === DEFAULT_ID) setWatched(symbol, true)
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === group.id) {
          return { ...g, symbols: g.symbols.filter((x) => x !== symbol) }
        }
        if (g.id === target.id && !g.symbols.includes(symbol)) {
          return { ...g, symbols: [symbol, ...g.symbols] }
        }
        return g
      }),
    )
    setMovingSymbol(null)
    clearReturnFor(symbol)
  }

  function addSymbol(e: FormEvent) {
    e.preventDefault()
    if (!active || active.symbols.includes(pick)) return
    if (active.id === DEFAULT_ID) setWatched(pick, true)
    patchGroup(active.id, (group) => ({ ...group, symbols: [pick, ...group.symbols] }))
    clearReturnFor(pick)
    const next = quotes.find((q) => q.symbol !== pick && !active.symbols.includes(q.symbol))
    if (next) setPick(next.symbol)
  }

  function clearReturnFor(symbol: string) {
    const entry = returns.find((item) => item.symbol === symbol)
    if (entry) clearReturn(entry.id)
  }

  function removeSymbol(group: Group, symbol: string) {
    if (group.id === DEFAULT_ID) setWatched(symbol, false)
    patchGroup(group.id, (g) => ({ ...g, symbols: g.symbols.filter((x) => x !== symbol) }))
  }

  function readdSymbol(entry: ReturnEntry) {
    const target =
      groups.find((group) => group.id === entry.groupId) ??
      groups.find((group) => group.id === DEFAULT_ID) ??
      groups[0]
    if (!target) {
      // Every group was deleted while the row waited; the main list is the
      // honest home for a symbol coming back.
      setGroups([{ id: DEFAULT_ID, name: s('defaultGroup'), symbols: [entry.symbol] }])
      setActiveId(DEFAULT_ID)
      setWatched(entry.symbol, true)
      clearReturn(entry.id)
      return
    }
    if (target.id === DEFAULT_ID) setWatched(entry.symbol, true)
    patchGroup(target.id, (group) =>
      group.symbols.includes(entry.symbol)
        ? group
        : { ...group, symbols: [entry.symbol, ...group.symbols] },
    )
    setActiveId(target.id)
    clearReturn(entry.id)
  }

  function toggleStar(symbol: string) {
    const watched = watchlist.includes(symbol)
    toggleWatch(symbol)
    if (!watched) clearReturnFor(symbol)
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
      leading={<BackButton fallback="/" />}
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
                  setMovingSymbol(null)
                  setRemoveAsk(null)
                  const next = quotes.find((q) => !group.symbols.includes(q.symbol))
                  if (next) setPick(next.symbol)
                }}
                title={group.name}
                className={`flex min-h-11 max-w-[220px] shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg ${
                  selected ? 'bg-fg text-bg' : 'border border-line text-muted'
                }`}
              >
                <span className="min-w-0 truncate">{group.name}</span>
                <span aria-hidden="true" className="num text-2xs opacity-60">
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
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
          <label htmlFor="wl-new-name" className="t-kicker text-muted" style={kicker}>
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
              className="min-h-11 min-w-0 flex-1 rounded-lg bg-fg/5 px-3 text-md text-fg focus-visible:outline-2 focus-visible:outline-fg"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="min-h-11 shrink-0 rounded-full bg-solid px-4 text-sm font-medium text-bg disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
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
            <span className="num text-2xs text-muted">
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
                className="min-h-11 rounded-full bg-solid px-4 text-sm font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {s('newGroup')}
              </button>
            ) : undefined
          }
        />
      ) : active ? (
        <section className="mt-6">
          <div className="flex items-center gap-1 pb-1">
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
                  className="min-h-11 min-w-0 flex-1 rounded-lg bg-fg/5 px-2.5 text-md text-fg focus-visible:outline-2 focus-visible:outline-fg"
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
                <h2 className="t-section min-w-0 flex-1 truncate">{active.name}</h2>
                <span className="num shrink-0 text-2xs text-muted">
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
                    className="flex min-h-11 shrink-0 items-center rounded-full px-3 text-2xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    style={{ color: 'var(--color-danger)' }}
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
            className="flex items-center gap-2 border-t border-line py-2"
          >
            <label htmlFor="wl-add-symbol" className="sr-only">
              {s('addSymbol')}
            </label>
            <select
              id="wl-add-symbol"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-lg bg-fg/5 px-2.5 text-sm text-fg focus-visible:outline-2 focus-visible:outline-fg"
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
              className="min-h-11 shrink-0 rounded-full bg-solid px-4 text-sm font-medium text-bg disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s('add')}
            </button>
          </form>

          {rows.length === 0 ? (
            <p className="border-t border-line py-6 text-xs text-muted">{s('emptyGroup')}</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {rows.map((q) => {
                const watched = watchlist.includes(q.symbol)
                const tone = q.change >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                return (
                  <li
                    key={q.symbol}
                    className={`flex min-h-14 flex-wrap items-center gap-1 ps-3 pe-1 ${
                      movingSymbol === q.symbol ? 'bg-fg/5' : ''
                    }`}
                  >
                    <Link
                      to={`/m/${q.symbol}`}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="num block text-md leading-tight font-semibold">{q.symbol}</span>
                        <span className="mt-1 block truncate text-2xs leading-tight text-muted">
                          {q.name[lang]}
                        </span>
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="num block text-md leading-tight font-medium">
                          {fmtNum(q.price, lang, 2)}
                        </span>
                        <span className="num mt-1 block text-2xs leading-tight" style={{ color: tone }}>
                          {fmtPct(q.change, lang)}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-pressed={watched}
                      aria-label={`${watched ? s('removeFromWatch') : s('addToWatch')}: ${q.symbol}`}
                      onClick={() => toggleStar(q.symbol)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                      style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
                    >
                      <StarIcon filled={watched} />
                    </button>
                    <button
                      type="button"
                      aria-expanded={removeAsk === q.symbol}
                      aria-controls={removeAsk === q.symbol ? `wl-remove-${q.symbol}` : undefined}
                      aria-label={`${s('removeFromGroup')}: ${q.symbol}`}
                      onClick={() => {
                        if (removeAsk === q.symbol) {
                          setRemoveAsk(null)
                        } else {
                          setRemoveAsk(q.symbol)
                          setRemoveReason('valuation')
                          setMovingSymbol(null)
                        }
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                      style={{
                        color: removeAsk === q.symbol ? 'var(--color-fg)' : 'var(--color-muted)',
                      }}
                    >
                      <MinusIcon />
                    </button>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        aria-expanded={movingSymbol === q.symbol}
                        aria-controls={movingSymbol === q.symbol ? `wl-move-${q.symbol}` : undefined}
                        aria-label={`${s('moveTo')}: ${q.symbol}`}
                        onClick={() => {
                          if (movingSymbol === q.symbol) setMovingSymbol(null)
                          else startMove(active, q.symbol)
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                        style={{
                          color:
                            movingSymbol === q.symbol
                              ? 'var(--color-fg)'
                              : 'var(--color-muted)',
                        }}
                      >
                        <MoveIcon />
                      </button>
                    )}
                    {movingSymbol === q.symbol && (
                      <form
                        id={`wl-move-${q.symbol}`}
                        onSubmit={(e) => commitMove(e, active)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setMovingSymbol(null)
                        }}
                        className="flex w-full items-center gap-2 pb-2"
                      >
                        <label htmlFor={`wl-move-target-${q.symbol}`} className="sr-only">
                          {s('moveTo')}
                        </label>
                        <select
                          id={`wl-move-target-${q.symbol}`}
                          autoFocus
                          value={moveTarget}
                          onChange={(e) => setMoveTarget(e.target.value)}
                          className="min-h-11 min-w-0 flex-1 rounded-lg bg-fg/5 px-2.5 text-sm text-fg focus-visible:outline-2 focus-visible:outline-fg"
                        >
                          {groups
                            .filter((g) => g.id !== active.id)
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="submit"
                          className="min-h-11 shrink-0 rounded-full bg-solid px-4 text-sm font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                        >
                          {s('move')}
                        </button>
                        <IconBtn label={s('cancel')} onClick={() => setMovingSymbol(null)}>
                          <CloseIcon />
                        </IconBtn>
                      </form>
                    )}
                    {removeAsk === q.symbol && (
                      <div
                        id={`wl-remove-${q.symbol}`}
                        className="w-full pb-3"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setRemoveAsk(null)
                        }}
                      >
                        <p className="t-kicker">{s('removeReasonTitle')}</p>
                        <p className="mt-1 text-2xs leading-snug text-muted">
                          {s('removeReasonHint').replace('{days}', String(RETURN_AFTER_DAYS))}
                        </p>
                        <div
                          role="group"
                          aria-label={s('removeReasonTitle')}
                          className="mt-2 flex flex-wrap gap-2"
                        >
                          {RETURN_REASONS.map((reason) => {
                            const selected = removeReason === reason
                            return (
                              <button
                                key={reason}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setRemoveReason(reason)}
                                className={`min-h-11 rounded-full px-3 text-2xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                                  selected
                                    ? 'bg-fg text-bg'
                                    : 'border border-line text-muted'
                                }`}
                              >
                                {s(REASON_KEYS[reason])}
                              </button>
                            )
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              removeSymbol(active, q.symbol)
                              recordReturn(q.symbol, active.id, removeReason)
                              setRemoveAsk(null)
                            }}
                            className="min-h-11 rounded-full bg-solid px-4 text-xs font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
                          >
                            {s('confirmRemove')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveAsk(null)}
                            className="min-h-11 rounded-full px-3 text-xs text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                          >
                            {s('cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {returns.length > 0 && (
        <ReturnsDock
          entries={returns}
          s={s}
          lang={lang}
          onReadd={readdSymbol}
          onDismiss={(entry) => clearReturn(entry.id)}
        />
      )}
    </Screen>
  )
}
