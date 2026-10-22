/** The four markets the quote list spans. */
export type Market = 'cn_a' | 'hk' | 'us' | 'sa'

/** Long-run market aggregates used only as comparison anchors. This is static
    config, not a live feed; nothing here is presented as a measured number. */
export type MarketConstants = {
  marketPe: number
  marketPb: number
  marketEpsGrowth: number
  marketRevenueGrowth: number
  yieldP25: number
  yieldP75: number
}

/** Ratios are fractions (0.12 means 12%); marketCap and fcf are currency
    amounts; fairValue is per share. */
export type Fundamentals = {
  pe: number
  pb: number
  peg: number
  roe: number
  roa: number
  roce: number
  epsGrowth: number
  revenueGrowth: number
  debtRatio: number
  currentRatio: number
  interestCover: number
  dividendYield: number
  payoutRatio: number
  fcf: number
  marketCap: number
  fairValue: number
}

const CONSTANTS: Record<Market, MarketConstants> = {
  sa: {
    marketPe: 17.5,
    marketPb: 2.2,
    marketEpsGrowth: 0.08,
    marketRevenueGrowth: 0.07,
    yieldP25: 0.028,
    yieldP75: 0.055,
  },
  cn_a: {
    marketPe: 14.2,
    marketPb: 1.6,
    marketEpsGrowth: 0.09,
    marketRevenueGrowth: 0.08,
    yieldP25: 0.012,
    yieldP75: 0.032,
  },
  hk: {
    marketPe: 11.4,
    marketPb: 1.1,
    marketEpsGrowth: 0.06,
    marketRevenueGrowth: 0.05,
    yieldP25: 0.022,
    yieldP75: 0.046,
  },
  us: {
    marketPe: 22.8,
    marketPb: 4.1,
    marketEpsGrowth: 0.1,
    marketRevenueGrowth: 0.06,
    yieldP25: 0.01,
    yieldP75: 0.021,
  },
}

/** Every symbol in `mock.ts` maps to a market; anything else is priced as US. */
const MARKET_BY_SYMBOL: Record<string, Market> = {
  '2222': 'sa',
  '1120': 'sa',
  '2010': 'sa',
  '600519': 'cn_a',
  '0700': 'hk',
}

export function marketFor(symbol: string): Market {
  return MARKET_BY_SYMBOL[symbol] ?? 'us'
}

export function marketConstants(market: Market): MarketConstants {
  return CONSTANTS[market]
}

/** FNV-1a over `symbol:key`. One stream per metric, so adding a field never
    shifts the values already on screen. */
function unit(symbol: string, key: string): number {
  const input = `${symbol}:${key}`
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 0x100000000
}

/** Deterministic value in [min, max], rounded so a render never shows 17.0000001. */
function span(symbol: string, key: string, min: number, max: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round((min + unit(symbol, key) * (max - min)) * factor) / factor
}

/**
 * A per-symbol fundamentals block. The hash fixes every ratio, so the same
 * symbol always shows the same numbers; `price` only moves the two values that
 * are priced in currency (marketCap and fairValue).
 */
export function fundamentalsFor(symbol: string, price: number): Fundamentals {
  const constants = CONSTANTS[marketFor(symbol)]

  const pe = span(symbol, 'pe', 6, 34, 1)
  const epsGrowth = span(symbol, 'epsGrowth', -0.18, 0.42, 3)
  const revenueGrowth = span(symbol, 'revenueGrowth', -0.12, 0.34, 3)
  const roe = span(symbol, 'roe', 0.03, 0.34, 3)
  const roa = Math.round(roe * span(symbol, 'roaShare', 0.35, 0.7, 3) * 1000) / 1000
  const roce = Math.min(
    0.4,
    Math.round(roa * span(symbol, 'roceMultiple', 1.2, 2.2, 3) * 1000) / 1000,
  )
  const debtRatio = span(symbol, 'debtRatio', 0.05, 0.72, 3)
  const dividendYield = span(
    symbol,
    'dividendYield',
    constants.yieldP25 * 0.2,
    constants.yieldP75 * 1.4,
    4,
  )
  const shares = span(symbol, 'shares', 0.5e9, 9.5e9, 0)
  const marketCap = Math.round(price * shares)
  const gap = unit(symbol, 'fairValueGap') * 0.7 - 0.35

  return {
    pe,
    pb: span(symbol, 'pb', 0.5, 7.5, 2),
    // PEG = P/E ÷ growth in percent. Shrinking earnings have no meaningful
    // PEG, so the denominator floors at 1 and the check fails on its own.
    peg: Math.round((pe / Math.max(epsGrowth * 100, 1)) * 100) / 100,
    roe,
    roa,
    roce,
    epsGrowth,
    revenueGrowth,
    debtRatio,
    currentRatio: span(symbol, 'currentRatio', 0.6, 3.2, 2),
    // Lighter balance sheets service their interest more easily.
    interestCover:
      Math.round((span(symbol, 'interestBase', 0.6, 18, 2) / (0.4 + debtRatio)) * 100) / 100,
    dividendYield,
    // Payout = dividend yield × P/E, which is the same as DPS ÷ EPS.
    payoutRatio: Math.round(dividendYield * pe * 1000) / 1000,
    fcf: Math.round(marketCap * span(symbol, 'fcfYield', -0.02, 0.1, 4)),
    marketCap,
    fairValue: Math.round(price * (1 + gap) * 100) / 100,
  }
}
