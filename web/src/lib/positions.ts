/**
 * Reading one holding out of whatever shape a payload publishes.
 *
 * Two boundaries need this — the HTTP response and a snapshot restored from
 * localStorage — so it lives here rather than in either one. The tolerance is
 * the point: paper APIs spell the symbol `symbol`, `code`, `ticker`, `asset` or
 * `instrument`, and guessing wrong in three places is how a position list
 * silently loses a name.
 */

export type PaperPosition = {
  symbol: string
  quantity: number
}

export type PositionRead = {
  positions: PaperPosition[]
  /** Entries that carried no usable symbol: counted, never invented. */
  unreadable: number
}

const SYMBOL_KEYS = ['symbol', 'code', 'ticker', 'asset', 'instrument'] as const
const QUANTITY_KEYS = ['quantity', 'qty', 'shares', 'units', 'weight'] as const

function finite(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[,\s%]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function readOne(raw: unknown): PaperPosition | null {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const symbol = String(raw).trim().toUpperCase()
    return symbol.length > 0 ? { symbol, quantity: 0 } : null
  }
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  let symbol = ''
  for (const key of SYMBOL_KEYS) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      symbol = value.trim().toUpperCase()
      break
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      symbol = String(value)
      break
    }
  }
  if (!symbol) return null
  let quantity = 0
  for (const key of QUANTITY_KEYS) {
    const parsed = finite(record[key])
    if (parsed !== null) {
      quantity = parsed
      break
    }
  }
  return { symbol, quantity }
}

/** Deduplicated, first occurrence wins. A non-array reads as empty. */
export function parsePositions(raw: unknown): PositionRead {
  if (!Array.isArray(raw)) return { positions: [], unreadable: 0 }
  const seen = new Set<string>()
  const positions: PaperPosition[] = []
  let unreadable = 0
  for (const entry of raw) {
    const position = readOne(entry)
    if (!position) {
      unreadable += 1
      continue
    }
    if (seen.has(position.symbol)) continue
    seen.add(position.symbol)
    positions.push(position)
  }
  return { positions, unreadable }
}
