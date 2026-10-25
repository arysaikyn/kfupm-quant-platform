import { useSyncExternalStore } from 'react'
import { quotes } from '../data/mock'

export type CallDir = 'up' | 'down' | 'flat'

/** 1 is a shrug, 5 is certainty; the score reads it as a probability of 0.2–1.0. */
export type Confidence = 1 | 2 | 3 | 4 | 5

/** Sessions in one sample week. Every quote's spark is a 40-session walk. */
export const HORIZON = 5

/**
 * A week that moves less than this counts as flat. The sample series drifts
 * 0.25–1% a week, so the band is wide enough to catch a flat week and narrow
 * enough that a real move is never called sideways.
 */
export const FLAT_BAND = 0.003

export type ConfidenceCall = {
  id: string
  symbol: string
  dir: CallDir
  confidence: Confidence
  /**
   * Spark index where the call's week ends, or null while the week is still
   * ahead. The outcome is never stored: it is re-read off the sample path,
   * the same way an alert's trigger state is re-read off the live quote.
   */
  windowEnd: number | null
}

const KEY = 'confidence.v1'

const QUOTE_BY_SYMBOL = Object.fromEntries(quotes.map((q) => [q.symbol, q] as const))

/**
 * Three settled calls with a mixed record, plus one still open, so the book
 * reads as a book on first open instead of an empty form.
 */
const SEED: ConfidenceCall[] = [
  { id: 'seed-c1', symbol: '1120', dir: 'down', confidence: 2, windowEnd: 35 },
  { id: 'seed-c2', symbol: '0700', dir: 'down', confidence: 4, windowEnd: 30 },
  { id: 'seed-c3', symbol: '600519', dir: 'down', confidence: 3, windowEnd: 30 },
  { id: 'seed-c4', symbol: '2010', dir: 'up', confidence: 3, windowEnd: null },
]

function isCall(v: unknown): v is ConfidenceCall {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  const quote = typeof c.symbol === 'string' ? QUOTE_BY_SYMBOL[c.symbol] : undefined
  if (!quote) return false
  if (c.dir !== 'up' && c.dir !== 'down' && c.dir !== 'flat') return false
  if (
    typeof c.confidence !== 'number' ||
    !Number.isInteger(c.confidence) ||
    c.confidence < 1 ||
    c.confidence > 5
  ) {
    return false
  }
  if (typeof c.id !== 'string') return false
  if (c.windowEnd === null) return true
  return (
    typeof c.windowEnd === 'number' &&
    Number.isInteger(c.windowEnd) &&
    c.windowEnd >= HORIZON &&
    c.windowEnd < quote.spark.length
  )
}

/** A stored empty array stays empty: only a missing key or bad JSON reseeds. */
function load(): ConfidenceCall[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Private browsing: the seeds still render for this session.
    return SEED
  }
  if (raw === null) return SEED
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(isCall)
  } catch {
    // Corrupt payload: fall back to the seed rather than an empty screen.
  }
  return SEED
}

let state: ConfidenceCall[] = load()
const listeners = new Set<() => void>()

function set(next: ConfidenceCall[]) {
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

export function useCalls(): ConfidenceCall[] {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function addCall(input: { symbol: string; dir: CallDir; confidence: Confidence }) {
  if (!QUOTE_BY_SYMBOL[input.symbol]) return
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  set([{ ...input, id, windowEnd: null }, ...state])
}

/**
 * Settle an open call against the latest week of the sample path. The spark is
 * static demo data, so this is the one week the sample can score; the button
 * says so rather than pretending a real week passed.
 */
export function resolveCall(id: string) {
  const call = state.find((c) => c.id === id)
  if (!call || call.windowEnd !== null) return
  const quote = QUOTE_BY_SYMBOL[call.symbol]
  if (!quote) return
  const end = quote.spark.length - 1
  if (end < HORIZON) return
  set(state.map((c) => (c.id === id ? { ...c, windowEnd: end } : c)))
}

/** The move the call's week produced, or null while it is still open. */
export function moveOf(call: ConfidenceCall): number | null {
  const quote = QUOTE_BY_SYMBOL[call.symbol]
  const end = call.windowEnd
  if (!quote || end === null) return null
  const start = end - HORIZON
  if (start < 0 || end >= quote.spark.length) return null
  const base = quote.spark[start]
  if (!base) return null
  return (quote.spark[end] - base) / base
}

export function dirOf(move: number): CallDir {
  if (move > FLAT_BAND) return 'up'
  if (move < -FLAT_BAND) return 'down'
  return 'flat'
}

export function actualDir(call: ConfidenceCall): CallDir | null {
  const move = moveOf(call)
  return move === null ? null : dirOf(move)
}

/** 1..5 → 0.2..1.0. Confidence is the probability you say you are right. */
export function probabilityOf(confidence: Confidence): number {
  return confidence / 5
}

/**
 * The coin baseline: it says 0.5 every time, so it is right or wrong with
 * equal chance and its Brier score is (0.5 - 1)² = (0.5 - 0)² = 0.25.
 */
export const COIN_BRIER = 0.25

export type ResolvedCall = ConfidenceCall & {
  move: number
  actual: CallDir
  hit: boolean
}

/** Settled calls only, newest week first; an open call has no row yet. */
export function resolvedCalls(calls: ConfidenceCall[]): ResolvedCall[] {
  return calls
    .flatMap((call) => {
      const move = moveOf(call)
      if (move === null) return []
      const actual = dirOf(move)
      return [{ ...call, move, actual, hit: actual === call.dir }]
    })
    .sort((a, b) => (b.windowEnd ?? 0) - (a.windowEnd ?? 0))
}

/** Mean squared error of the stated probability against the 0/1 outcome. */
export function brierScore(calls: ConfidenceCall[]): number | null {
  const rows = resolvedCalls(calls)
  if (rows.length === 0) return null
  const total = rows.reduce((sum, row) => {
    const error = probabilityOf(row.confidence) - (row.hit ? 1 : 0)
    return sum + error * error
  }, 0)
  return total / rows.length
}

export type CalibrationKey = 'low' | 'mid' | 'high'

export type Bucket = {
  key: CalibrationKey
  calls: number
  hits: number
  /** Average probability the user claimed in this bucket. */
  stated: number
  /** Share of calls that were actually right. */
  observed: number
}

const BUCKETS: { key: CalibrationKey; levels: Confidence[] }[] = [
  { key: 'low', levels: [1, 2] },
  { key: 'mid', levels: [3] },
  { key: 'high', levels: [4, 5] },
]

/** Claimed probability against the hit rate, in three confidence bands. */
export function calibration(calls: ConfidenceCall[]): Bucket[] {
  const rows = resolvedCalls(calls)
  return BUCKETS.flatMap(({ key, levels }) => {
    const set = rows.filter((row) => levels.includes(row.confidence))
    if (set.length === 0) return []
    const hits = set.filter((row) => row.hit).length
    const stated = set.reduce((sum, row) => sum + probabilityOf(row.confidence), 0) / set.length
    return [{ key, calls: set.length, hits, stated, observed: hits / set.length }]
  })
}
