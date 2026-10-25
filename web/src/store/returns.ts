import { useSyncExternalStore } from 'react'

/**
 * The returns dock: a symbol removed from a watchlist is parked here with a
 * reason, then offered back after a fixed wait. Local only; no server job.
 */

export const RETURN_AFTER_DAYS = 7
export const DAY_MS = 86_400_000
export const RETURN_REASONS = ['valuation', 'risk', 'crowded', 'other'] as const

export type ReturnReason = (typeof RETURN_REASONS)[number]

export type ReturnEntry = {
  id: string
  symbol: string
  /** Group the symbol left, so Re-add can put it back where it lived. */
  groupId: string
  reason: ReturnReason
  removedAt: number
  dueAt: number
  /** One seeded row explains the dock before the user removes anything. */
  example?: boolean
}

const KEY = 'watchlists.returns.v1'
const LIMIT = 50

function isReason(value: unknown): value is ReturnReason {
  return typeof value === 'string' && (RETURN_REASONS as readonly string[]).includes(value)
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function returnDueAt(removedAt: number, days = RETURN_AFTER_DAYS): number {
  return removedAt + days * DAY_MS
}

export function isEligible(entry: ReturnEntry, now: number): boolean {
  return now >= entry.dueAt
}

/** Whole days left, never negative; eligible rows read as 0. */
export function daysUntil(entry: ReturnEntry, now: number): number {
  return Math.max(0, Math.ceil((entry.dueAt - now) / DAY_MS))
}

/** Eligible first, each side sorted by when the dock should surface it. */
export function partitionReturns(
  entries: readonly ReturnEntry[],
  now: number,
): { eligible: ReturnEntry[]; pending: ReturnEntry[] } {
  const eligible: ReturnEntry[] = []
  const pending: ReturnEntry[] = []
  for (const entry of entries) {
    if (isEligible(entry, now)) eligible.push(entry)
    else pending.push(entry)
  }
  eligible.sort((a, b) => a.dueAt - b.dueAt)
  pending.sort((a, b) => a.dueAt - b.dueAt)
  return { eligible, pending }
}

export function exampleReturn(now = Date.now()): ReturnEntry {
  const removedAt = now - 9 * DAY_MS
  return {
    id: 'ret-example-1120',
    symbol: '1120',
    groupId: 'default',
    reason: 'valuation',
    removedAt,
    dueAt: returnDueAt(removedAt),
    example: true,
  }
}

function toEntry(value: unknown): ReturnEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.symbol !== 'string' || !raw.symbol.trim()) return null
  if (typeof raw.groupId !== 'string' || !raw.groupId) return null
  if (!isReason(raw.reason)) return null
  const removedAt = finite(raw.removedAt)
  if (removedAt === null) return null
  return {
    id: raw.id,
    symbol: raw.symbol.trim().toUpperCase(),
    groupId: raw.groupId,
    reason: raw.reason,
    removedAt,
    dueAt: finite(raw.dueAt) ?? returnDueAt(removedAt),
    ...(raw.example === true ? { example: true } : {}),
  }
}

function load(): ReturnEntry[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return [exampleReturn()]
  }
  // Only a missing key seeds the example; a stored empty list stays empty.
  if (raw === null) return [exampleReturn()]
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .flatMap((entry) => {
        const value = toEntry(entry)
        return value ? [value] : []
      })
      .slice(0, LIMIT)
  } catch {
    return []
  }
}

let state: ReturnEntry[] = load()
const listeners = new Set<() => void>()

function set(next: ReturnEntry[]) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private browsing: the in-memory dock still works until reload.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useReturns(): ReturnEntry[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/** Removing the same symbol again restarts its wait instead of stacking rows. */
export function recordReturn(
  symbol: string,
  groupId: string,
  reason: ReturnReason,
  at = Date.now(),
): void {
  const normalized = symbol.trim().toUpperCase()
  if (!normalized || !groupId) return
  const entry: ReturnEntry = {
    id: `ret-${normalized}-${at.toString(36)}`,
    symbol: normalized,
    groupId,
    reason,
    removedAt: at,
    dueAt: returnDueAt(at),
  }
  set([entry, ...state.filter((item) => item.symbol !== normalized)].slice(0, LIMIT))
}

export function clearReturn(id: string): void {
  set(state.filter((entry) => entry.id !== id))
}
