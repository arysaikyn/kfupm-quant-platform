import { useSyncExternalStore } from 'react'

export type UserState = {
  /** Symbols the user follows, newest first. */
  watchlist: string[]
}

const KEY = 'app.user'

function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UserState
      // Older builds stored a paper-trade journal beside the watchlist; the
      // watchlist is the only state this product keeps.
      if (Array.isArray(parsed.watchlist)) return { watchlist: parsed.watchlist }
    }
  } catch {
    // Private browsing: start empty, keep working in memory.
  }
  return { watchlist: [] }
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

