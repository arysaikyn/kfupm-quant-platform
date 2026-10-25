import { useSyncExternalStore } from 'react'

const KEY = 'learn.seen.v1'

/**
 * A pathname reduced to the screen family that owns it. `/` is the market tab
 * and a stock page belongs to it, so opening one symbol unlocks the same terms
 * as reading the quote table. Detail routes (`/strategy/x`, `/report/x`) fall
 * back to their list, which is the screen that introduces the concept.
 */
export function routeKeyOf(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0]
  if (!first) return '/market'
  return first === 'm' ? '/market' : `/${first}`
}

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string' && v.startsWith('/'))
    }
  } catch {
    // Private browsing or a corrupt payload: nothing is unlocked rather than
    // everything, so a broken store never claims the user has read a screen.
  }
  return []
}

let seen: string[] = load()
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * App calls this on every navigation; only a screen not seen before notifies,
 * so the navigation effect cannot loop through this store's subscribers.
 */
export function markRouteSeen(pathname: string): boolean {
  const key = routeKeyOf(pathname)
  if (seen.includes(key)) return false
  seen = [...seen, key]
  try {
    localStorage.setItem(KEY, JSON.stringify(seen))
  } catch {
    // Persistence is best-effort; the session still unlocks.
  }
  listeners.forEach((fn) => fn())
  return true
}

export function useSeenRoutes(): readonly string[] {
  return useSyncExternalStore(subscribe, () => seen, () => seen)
}

/** No route means the term is basic: readable before any exploring. */
export function isUnlocked(paths: readonly string[], seenRoutes: readonly string[]): boolean {
  return paths.length === 0 || paths.some((path) => seenRoutes.includes(path))
}

/** The first screen that would unlock the term, or null once it is open. */
export function nextUnlock<T extends string>(
  paths: readonly T[],
  seenRoutes: readonly string[],
): T | null {
  if (isUnlocked(paths, seenRoutes)) return null
  return paths[0] ?? null
}
