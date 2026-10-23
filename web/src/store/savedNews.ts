import { useSyncExternalStore } from 'react'

const KEY = 'news.saved.v1'

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, 100)
  } catch {
    return []
  }
}

let state: string[] = load()
const listeners = new Set<() => void>()

function set(next: string[]) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Persistence is best-effort.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSavedNews(): string[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function toggleSavedNews(id: string): void {
  set(state.includes(id) ? state.filter((x) => x !== id) : [id, ...state])
}
