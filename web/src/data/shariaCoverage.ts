import { fundamentalsFor } from './fundamentals'

export type ShariaField = 'debt' | 'interestBearing' | 'income' | 'receivables'
export type ShariaStatus = 'compliant' | 'non-compliant' | 'unclassified'

export type ShariaValues = Record<ShariaField, number | null>

export type ShariaBreach = { field: ShariaField; value: number; limit: number }

/**
 * Three outcomes, and the type carries the invariant each one promises.
 *
 * It used to be one shape with a `status` field and two parallel arrays, which
 * let `{ status: 'non-compliant', failed: [] }` typecheck; `lib/ledger` then read
 * `verdict.failed[0].value` and threw inside render, taking the whole strategy
 * screen down. Now a breach has at least one entry and an unproven name has at
 * least one missing field, so the compiler refuses the empty case and the
 * non-empty tuple is what the reader indexes.
 */
export type ShariaVerdict =
  | { status: 'compliant'; values: ShariaValues; failed: []; missing: [] }
  | {
      status: 'non-compliant'
      values: ShariaValues
      failed: [ShariaBreach, ...ShariaBreach[]]
      missing: []
    }
  | {
      status: 'unclassified'
      values: ShariaValues
      failed: ShariaBreach[]
      missing: [ShariaField, ...ShariaField[]]
    }

export const SHARIA_LIMITS: Record<ShariaField, number> = {
  debt: 0.3,
  interestBearing: 0.3,
  income: 0.05,
  receivables: 0.3333,
}

/**
 * The mock tape only carries a proxy balance sheet. These are the AAOIFI
 * coverage values used by the audit UI; `null` means the vendor did not publish
 * the input, which must stay distinct from zero.
 */
const EXTRA: Record<string, Pick<Record<ShariaField, number | null>, 'interestBearing' | 'income' | 'receivables'>> = {
  '2222': { interestBearing: 0.18, income: 0.004, receivables: 0.21 },
  '1120': { interestBearing: 0.22, income: 0.012, receivables: 0.28 },
  '2010': { interestBearing: 0.26, income: 0.031, receivables: null },
  '600519': { interestBearing: 0.11, income: 0.002, receivables: 0.18 },
  '0700': { interestBearing: 0.24, income: 0.021, receivables: 0.25 },
}

export function shariaVerdict(symbol: string, price: number): ShariaVerdict {
  const f = fundamentalsFor(symbol, price)
  const extra = EXTRA[symbol] ?? { interestBearing: null, income: null, receivables: null }
  const values: Record<ShariaField, number | null> = {
    debt: Number.isFinite(f.debtRatio) ? f.debtRatio : null,
    interestBearing: extra.interestBearing,
    income: extra.income,
    receivables: extra.receivables,
  }
  const missing = (Object.keys(SHARIA_LIMITS) as ShariaField[]).filter(
    (field) => values[field] === null,
  )
  const failed = (Object.keys(SHARIA_LIMITS) as ShariaField[]).flatMap((field) => {
    const value = values[field]
    if (value === null || value <= SHARIA_LIMITS[field]) return []
    return [{ field, value, limit: SHARIA_LIMITS[field] }]
  })
  // A missing input outranks a failure: the name is unproven, not condemned.
  if (missing.length > 0) {
    return { status: 'unclassified', values, failed, missing: missing as [ShariaField, ...ShariaField[]] }
  }
  if (failed.length > 0) {
    return { status: 'non-compliant', values, failed: failed as [ShariaBreach, ...ShariaBreach[]], missing: [] }
  }
  return { status: 'compliant', values, failed: [], missing: [] }
}
