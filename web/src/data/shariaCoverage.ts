import { fundamentalsFor } from './fundamentals'

export type ShariaField = 'debt' | 'interestBearing' | 'income' | 'receivables'
export type ShariaStatus = 'compliant' | 'non-compliant' | 'unclassified'

export type ShariaVerdict = {
  status: ShariaStatus
  values: Record<ShariaField, number | null>
  failed: { field: ShariaField; value: number; limit: number }[]
  missing: ShariaField[]
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
  const status: ShariaStatus =
    missing.length > 0 ? 'unclassified' : failed.length > 0 ? 'non-compliant' : 'compliant'
  return { status, values, failed, missing }
}
