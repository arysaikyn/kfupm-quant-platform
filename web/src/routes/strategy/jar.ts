import { equityYears } from '../../data/mock'

/**
 * The jar holds one demo deposit of 100 riyals. Equal weights come from the
 * passing names, the year scrubber re-values the deposit on the strategy's own
 * curve, and the price scrubber changes the entry price the coins are bought
 * at. A coin is one whole share; whatever does not buy a share stays cash.
 */

export const JAR_DEPOSIT = 100

export type JarPick = { symbol: string; weight: number; price: number }

export type JarStack = {
  symbol: string
  weight: number
  /** Riyals this name was allocated before buying shares. */
  budget: number
  price: number
  coins: number
  spent: number
}

export type Jar = {
  year: number
  priceFactor: number
  deposit: number
  /** The deposit re-valued from `year` to the end of the curve. */
  grown: number
  stacks: JarStack[]
  spent: number
  cash: number
  /** True when nothing qualifies, so the money is not grown by the strategy. */
  idle: boolean
}

const money = (value: number) => Math.round(value * 100) / 100

/** Even spacing of years across the curve, so 2019 sits on its first point. */
export function yearIndex(curve: number[], year: number): number {
  if (curve.length === 0) return 0
  const span = equityYears.last - equityYears.first
  const ratio = span === 0 ? 1 : (year - equityYears.first) / span
  const clamped = Math.min(1, Math.max(0, ratio))
  return Math.round(clamped * (curve.length - 1))
}

export function jarStacks(
  picks: JarPick[],
  curve: number[],
  year: number,
  priceFactor: number,
): Jar {
  const idle = picks.length === 0
  const index = yearIndex(curve, year)
  const start = curve[index] ?? 1
  const end = curve[curve.length - 1] ?? 1
  // Money the strategy never held must not grow on its curve.
  const grown = idle || start <= 0 ? JAR_DEPOSIT : money(JAR_DEPOSIT * (end / start))
  const stacks = picks.map((pick) => {
    const budget = money(grown * pick.weight)
    const price = money(pick.price * priceFactor)
    const coins = price > 0 ? Math.floor(budget / price) : 0
    return {
      symbol: pick.symbol,
      weight: pick.weight,
      budget,
      price,
      coins,
      spent: money(coins * price),
    }
  })
  const spent = money(stacks.reduce((sum, stack) => sum + stack.spent, 0))
  return {
    year,
    priceFactor,
    deposit: JAR_DEPOSIT,
    grown,
    stacks,
    spent,
    cash: money(grown - spent),
    idle,
  }
}
