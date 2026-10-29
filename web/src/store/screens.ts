import { createId, sanitizeRules } from '../lib/screener'
import type { Rule } from '../lib/screener'

/**
 * Saved screens, and only saved screens. The storage key and the decode live
 * with the rest of the persisted state so another feature can read them
 * without importing a route folder.
 */

const STORAGE_KEY = 'screener.screens'

export type SavedScreen = {
  id: string
  name: string
  rules: Rule[]
}

/** Never throws: a corrupt or blocked store reads as "no saved screens". */
export function loadScreens(): SavedScreen[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: SavedScreen[] = []
    const ids = new Set<string>()
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name.trim().slice(0, 40) : ''
      if (!name) continue
      const rules = Array.isArray(record.rules) ? sanitizeRules(record.rules) : []
      let id =
        typeof record.id === 'string' && record.id.trim() ? record.id.trim() : createId('s')
      if (ids.has(id)) id = createId('s')
      ids.add(id)
      out.push({ id, name, rules })
    }
    return out
  } catch {
    return []
  }
}

export function storeScreens(screens: readonly SavedScreen[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(screens))
  } catch {
    // Private browsing: the in-memory list still works until reload.
  }
}
