import { useSyncExternalStore } from 'react'

export type JournalEntry = {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  price: number
  qty: number
  at: number
  note?: string
}

export type UserState = {
  /** Symbols the user follows, newest first. */
  watchlist: string[]
  /** Paper trades, newest first. */
  journal: JournalEntry[]
}

const KEY = 'app.user'

function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UserState
      if (Array.isArray(parsed.watchlist) && Array.isArray(parsed.journal)) return parsed
    }
  } catch {
    // Private browsing: start empty, keep working in memory.
  }
  return { watchlist: [], journal: [] }
}

let state: UserState = load()
const listeners = new Set<() => void>()

function set(next: UserState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Persistence is best-effort; the session still works.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useUser(): UserState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function toggleWatch(symbol: string) {
  const has = state.watchlist.includes(symbol)
  set({
    ...state,
    watchlist: has ? state.watchlist.filter((s) => s !== symbol) : [symbol, ...state.watchlist],
  })
}

export function addJournal(entry: Omit<JournalEntry, 'id' | 'at'>) {
  set({
    ...state,
    journal: [
      { ...entry, id: `${entry.symbol}-${Date.now()}`, at: Date.now() },
      ...state.journal,
    ],
  })
}

export function removeJournal(id: string) {
  set({ ...state, journal: state.journal.filter((e) => e.id !== id) })
}
