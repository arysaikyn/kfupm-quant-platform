import { useSyncExternalStore } from 'react'
import { quotes } from '../data/mock'

export type AlertDir = 'above' | 'below'

export type PriceAlert = {
  id: string
  symbol: string
  dir: AlertDir
  threshold: number
}

const KEY = 'alerts.v1'

const QUOTE_BY_SYMBOL = Object.fromEntries(quotes.map((q) => [q.symbol, q] as const))

/** One already met and one still waiting, so both states show on first open. */
const SEED: PriceAlert[] = [
  { id: 'seed-1120', symbol: '1120', dir: 'below', threshold: 61 },
  { id: 'seed-2222', symbol: '2222', dir: 'above', threshold: 26 },
]

function isAlert(v: unknown): v is PriceAlert {
  if (!v || typeof v !== 'object') return false
  const a = v as Record<string, unknown>
  return (
    typeof a.id === 'string' &&
    typeof a.symbol === 'string' &&
    Object.hasOwn(QUOTE_BY_SYMBOL, a.symbol) &&
    (a.dir === 'above' || a.dir === 'below') &&
    typeof a.threshold === 'number' &&
    Number.isFinite(a.threshold) &&
    a.threshold > 0
  )
}

/** An empty stored array stays empty: only a missing key or bad JSON reseeds. */
function load(): PriceAlert[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Private browsing: seeds still render for this session.
    return SEED
  }
  if (raw === null) return SEED
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(isAlert)
  } catch {
    // Corrupt payload: fall back to the seed rather than an empty screen.
  }
  return SEED
}

let state: PriceAlert[] = load()
const listeners = new Set<() => void>()

function set(next: PriceAlert[]) {
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

export function useAlerts(): PriceAlert[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function addAlert(alert: Omit<PriceAlert, 'id'>) {
  const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  set([{ ...alert, id }, ...state])
}

export function removeAlert(id: string) {
  set(state.filter((a) => a.id !== id))
}

export type AlertRow = PriceAlert & {
  quote: (typeof quotes)[number]
  triggered: boolean
}

/** Trigger state is read off the live quote every time; it is never stored. */
export function rowsFor(alerts: PriceAlert[]): AlertRow[] {
  return alerts.flatMap((a) => {
    const quote = QUOTE_BY_SYMBOL[a.symbol]
    if (!quote) return []
    const triggered = a.dir === 'above' ? quote.price >= a.threshold : quote.price <= a.threshold
    return [{ ...a, quote, triggered }]
  })
}

export function triggeredCount(alerts: PriceAlert[]): number {
  return rowsFor(alerts).filter((r) => r.triggered).length
}
