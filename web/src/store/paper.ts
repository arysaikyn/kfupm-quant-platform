import { useSyncExternalStore } from 'react'
import type { PaperAccount } from '../api/ai'

/**
 * Local snapshots of a paper account. They never travel to the backend: a
 * checkpoint is a frozen copy of what the panel was showing, so a later
 * comparison stays deterministic even when the live account moves on.
 */

export type PaperPosition = {
  symbol: string
  quantity: number
}

export type PaperLedger = {
  cash: number
  positions: PaperPosition[]
  /** Raw position count, including entries this build cannot name. */
  positionCount: number
}

export type PaperSnapshot = {
  id: string
  accountId: string
  accountLabel: string
  label: string
  createdAt: number
  currency: string
  cash: number
  positions: PaperPosition[]
  positionCount: number
  /** Always true: the snapshot is a local demo record, not a broker statement. */
  demo: true
}

export type PaperDiff = {
  added: PaperPosition[]
  dropped: PaperPosition[]
  /** after.cash - before.cash, rounded to cents. */
  cashDelta: number
  positionCountDelta: number
  unchanged: number
}

const KEY = 'paper.checkpoints.v1'
const LIMIT = 20
const NAME_LIMIT = 40
const SYMBOL_KEYS = ['symbol', 'code', 'ticker', 'asset', 'instrument'] as const
const QUANTITY_KEYS = ['quantity', 'qty', 'shares', 'units', 'weight'] as const

function cents(value: number): number {
  return Math.round(value * 100) / 100
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readSymbol(value: unknown): string | null {
  if (typeof value === 'string') {
    const symbol = value.trim().toUpperCase()
    return symbol.length > 0 ? symbol : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

/** Tolerates both plain strings and the object shapes paper APIs return. */
export function toPosition(value: unknown): PaperPosition | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const symbol = readSymbol(value)
    return symbol ? { symbol, quantity: 0 } : null
  }
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  let symbol: string | null = null
  for (const key of SYMBOL_KEYS) {
    symbol = readSymbol(record[key])
    if (symbol) break
  }
  if (!symbol) return null
  let quantity = 0
  for (const key of QUANTITY_KEYS) {
    const n = finite(record[key])
    if (n !== null) {
      quantity = n
      break
    }
  }
  return { symbol, quantity }
}

function uniquePositions(input: unknown): PaperPosition[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: PaperPosition[] = []
  for (const entry of input) {
    const position = toPosition(entry)
    if (!position || seen.has(position.symbol)) continue
    seen.add(position.symbol)
    out.push(position)
  }
  return out
}

export function accountLedger(account: PaperAccount): PaperLedger {
  const raw = account.account_state?.positions
  return {
    cash: cents(finite(account.account_state?.cash) ?? 0),
    positions: uniquePositions(raw),
    positionCount: Array.isArray(raw) ? raw.length : 0,
  }
}

export function snapshotLedger(snapshot: PaperSnapshot): PaperLedger {
  return {
    cash: cents(snapshot.cash),
    positions: uniquePositions(snapshot.positions),
    positionCount: snapshot.positionCount,
  }
}

/** Set comparison by symbol; output is sorted so a diff never reshuffles. */
export function diffLedgers(before: PaperLedger, after: PaperLedger): PaperDiff {
  const beforeBy = new Map(before.positions.map((p) => [p.symbol, p] as const))
  const afterBy = new Map(after.positions.map((p) => [p.symbol, p] as const))
  const added = [...afterBy.values()]
    .filter((p) => !beforeBy.has(p.symbol))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
  const dropped = [...beforeBy.values()]
    .filter((p) => !afterBy.has(p.symbol))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
  const unchanged = [...afterBy.keys()].filter((symbol) => beforeBy.has(symbol)).length
  return {
    added,
    dropped,
    cashDelta: cents(after.cash - before.cash),
    positionCountDelta: after.positionCount - before.positionCount,
    unchanged,
  }
}

/** What rewinding to `snapshot` would restore or drop, read-only. */
export function rewindPreview(snapshot: PaperSnapshot, current: PaperLedger): PaperDiff {
  return diffLedgers(current, snapshotLedger(snapshot))
}

export function createPaperSnapshot(
  account: PaperAccount,
  label: string,
  at = Date.now(),
  id = `cp-${account.id}-${at.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
): PaperSnapshot | null {
  const name = Array.from(label.trim()).slice(0, NAME_LIMIT).join('')
  if (!name) return null
  const ledger = accountLedger(account)
  return {
    id,
    accountId: account.id,
    accountLabel: account.label,
    label: name,
    createdAt: at,
    currency: account.currency,
    cash: ledger.cash,
    positions: ledger.positions,
    positionCount: ledger.positionCount,
    demo: true,
  }
}

function toSnapshot(value: unknown): PaperSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.accountId !== 'string' || !raw.accountId) return null
  if (typeof raw.label !== 'string' || !raw.label.trim()) return null
  const createdAt = finite(raw.createdAt)
  const cash = finite(raw.cash)
  if (createdAt === null || cash === null) return null
  return {
    id: raw.id,
    accountId: raw.accountId,
    accountLabel: typeof raw.accountLabel === 'string' ? raw.accountLabel : raw.accountId,
    label: Array.from(raw.label.trim()).slice(0, NAME_LIMIT).join(''),
    createdAt,
    currency: typeof raw.currency === 'string' ? raw.currency : '',
    cash: cents(cash),
    positions: uniquePositions(raw.positions),
    positionCount:
      finite(raw.positionCount) ?? (Array.isArray(raw.positions) ? raw.positions.length : 0),
    demo: true,
  }
}

function load(): PaperSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .flatMap((entry) => {
        const snapshot = toSnapshot(entry)
        return snapshot ? [snapshot] : []
      })
      .slice(0, LIMIT)
  } catch {
    return []
  }
}

/** Newest first: the comparison a user wants is almost always the last freeze. */
let state: PaperSnapshot[] = load().sort((a, b) => b.createdAt - a.createdAt)
const listeners = new Set<() => void>()

function set(next: PaperSnapshot[]) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private browsing: the in-memory list still works until reload.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function usePaperSnapshots(): PaperSnapshot[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function freezePaperAccount(account: PaperAccount, label: string): PaperSnapshot | null {
  const snapshot = createPaperSnapshot(account, label)
  if (!snapshot) return null
  set([snapshot, ...state].slice(0, LIMIT))
  return snapshot
}

export function removePaperSnapshot(id: string): void {
  set(state.filter((snapshot) => snapshot.id !== id))
}
