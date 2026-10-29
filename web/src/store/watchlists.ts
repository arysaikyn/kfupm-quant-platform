import { quoteBySymbol } from '../data/mock'

/**
 * The saved watchlists, and only them: the model, the decode and the write.
 *
 * They used to live inside the screen file, which meant the group model, eight
 * SVG icons and 600 lines of markup shared one module, and no test could reach
 * the decoder without rendering the page.
 */

export type Group = {
  id: string
  name: string
  symbols: string[]
}

const KEY = 'watchlists.v1'
/** The seeded group is the one wired to the shared watchlist store. */
export const DEFAULT_ID = 'default'
export const MAX_NAME = 24

/** Accepts only symbols this build can render, and never twice in one group. */
function cleanSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const symbol of value) {
    if (typeof symbol !== 'string') continue
    if (!Object.hasOwn(quoteBySymbol, symbol) || out.includes(symbol)) continue
    out.push(symbol)
  }
  return out
}

/** Code-point slice, so a 24-character cap never splits a surrogate pair. */
export function clampName(value: string): string {
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

function seed(watchlist: string[], defaultName: string): Group[] {
  return [{ id: DEFAULT_ID, name: defaultName, symbols: cleanSymbols(watchlist) }]
}

/** A stored empty array stays empty; only a missing key or bad payload reseeds. */
export function loadGroups(watchlist: string[], defaultName: string): Group[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Private browsing: seed still renders for this session.
    return seed(watchlist, defaultName)
  }
  if (raw === null) return seed(watchlist, defaultName)
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
  return seed(watchlist, defaultName)
}

/** Best-effort write: private browsing keeps working in memory for the session. */
export function saveGroups(groups: readonly Group[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(groups))
  } catch {
    // Nothing to recover: the screen already holds the new list in state.
  }
}
