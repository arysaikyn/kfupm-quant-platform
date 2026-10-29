/**
 * The demo book's cost model, stated once.
 *
 * It used to live in three places that had to agree and were never checked
 * against each other: `data/mock.ts` built the gross curve from a literal
 * `0.78 * (0.0015 + 0.005)`, `routes/strategy/StrategyDetail.tsx` restated the
 * three rates for the cost row, and `routes/strategy/receipt.ts` hashed them.
 * Change the fee and the chart, the cost row and the receipt could disagree
 * while every type still checked.
 */

export type DemoCosts = {
  /** Share of the book replaced in a year, as a fraction. */
  turnover: number
  /** Broker fee per unit traded, as a fraction of notional (0.0015 = 15 bps). */
  feeRate: number
  /** Slippage per unit traded, as a fraction of notional (0.005 = 50 bps). */
  slipRate: number
  /** Starting capital the cost row prices, in the account currency. */
  capital: number
}

export const DEMO_COSTS: DemoCosts = {
  turnover: 0.78,
  feeRate: 0.0015,
  slipRate: 0.005,
  capital: 10_000,
}

/** What one year of trading costs, as a fraction of the book. */
export const COST_PER_YEAR = DEMO_COSTS.turnover * (DEMO_COSTS.feeRate + DEMO_COSTS.slipRate)

/** The drag a span of `years` puts between the gross curve and the net curve. */
export function costDrag(years: number): number {
  return COST_PER_YEAR * years
}
