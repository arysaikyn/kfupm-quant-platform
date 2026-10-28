import { mean, sd } from './stats'

/**
 * Why this file exists.
 *
 * A trading agent that reads news, candles and the usual indicators, then lets a
 * model pick a stop and a target, ends up running a grid: the only degree of
 * freedom left is distance from a reference price, so the profit comes from the
 * size of each move, not from knowing which way it went. Open-source references
 * for the alternative are unanimous — Microsoft RD-Agent + Qlib rank the
 * cross-section and churn names (`TopkDropoutStrategy`, top-k with `n_drop`),
 * ai-hedge-fund's contract carries a `Signal` in [-1, 1] and no price fields at
 * all, and Kaminski & Lo (JFM 2014) prove a stop-loss subtracts the risk premium
 * under a random walk and hurts under mean reversion.
 *
 * So this module answers one question about a rule set or a saved run: is the
 * return coming from the cross-section, or from the path? Nothing here embeds a
 * number that is not computed from the curve, the families, or the facts the
 * caller passes in.
 */

/** Where a rule reads its input, in the taxonomy the factor zoos actually use. */
export type FactorFamily =
  | 'price'
  | 'volume'
  | 'momentum'
  | 'reversal'
  | 'volatility'
  | 'fundamental'
  | 'sharia'
  | 'event'

/**
 * The price block is Alpha101 / GTJA-191 / Qlib Alpha158 territory: measured
 * survival of those formulas after eight years is low, and Qlib's 158 features
 * contain no fundamental at all. Splitting the two blocks is the whole point.
 */
const PRICE_BLOCK: Record<FactorFamily, boolean> = {
  price: true,
  volume: true,
  momentum: true,
  reversal: true,
  volatility: true,
  fundamental: false,
  sharia: false,
  event: false,
}

/** Bars a signal stays useful. An annual report decays over a year, a print over a day. */
export const FAMILY_DECAY: Record<FactorFamily, number> = {
  price: 1,
  volume: 1,
  momentum: 5,
  reversal: 5,
  volatility: 5,
  fundamental: 252,
  sharia: 252,
  event: 3,
}

export type GridReason =
  /** Nothing says how a holding ends, so the exit decides the return. */
  | 'noExitPolicy'
  /** Every rule reads the price block: the measured-dead family set. */
  | 'priceOnly'
  /** The signal is stale within a week, so the return is churn. */
  | 'shortDecay'
  /** The return loads on the size of the market move, not its direction. */
  | 'volHarvest'
  /** Mean reversion at this horizon: a stop-loss exits before the reversal. */
  | 'stopHurts'
  /** More turnover than a strategy can survive after costs. */
  | 'highTurnover'
  /** One name can carry the result. */
  | 'concentrated'

export type GridFinding = { id: GridReason; points: number }

/** `curve_i = alpha + betaDrift * bench_i + betaVol * |bench_i|`, ordinary least squares. */
export type Exposure = {
  betaDrift: number
  betaVol: number
  /** Share of the explained variation that needs a move, not a direction. 0 to 1. */
  volShare: number
  r2: number
  n: number
}

/**
 * Kaminski & Lo's stopping premium is `-pi + rho * sigma + eta`: a stop adds
 * expected return only when the persistence at the holding horizon clears the
 * Sharpe ratio. `rho` and `sr` are both per observation, so they compare.
 */
export type Persistence = {
  /** Lag-one autocorrelation of the run's own returns. Negative means mean reversion. */
  gamma1: number
  /** Mean over standard deviation, per observation. */
  sr: number
  stop: 'adds' | 'insurance' | 'hurts'
}

export type GridInput = {
  /** Distinct families the rules read; duplicates collapse. */
  families: readonly FactorFamily[]
  /** True when exits happen by leaving the ranking, false when the spec states none. */
  rankExit: boolean
  /** Equity curve of the run, one unit of capital at index 0. */
  curve?: readonly number[]
  /** Benchmark on the same dates, one unit of capital at index 0. */
  bench?: readonly number[]
  /** Annual turnover as a fraction (0.78 means 78%). */
  turnover?: number
  /** Largest single weight as a fraction (0.1 means 10%). */
  maxWeight?: number
}

export type GridVerdict = 'crossSection' | 'thin' | 'gridlike'

export type GridReport = {
  /** 0 is a cross-sectional rule set; 100 is an order sheet a grid bot would write. */
  score: number
  verdict: GridVerdict
  /** Distinct families the rules read, in the order the caller passed them. */
  families: FactorFamily[]
  findings: GridFinding[]
  exposure: Exposure | null
  persistence: Persistence | null
}

/** A book that replaces itself more than once a year cannot out-earn its costs. */
const TURNOVER_CAP = 1
const WEIGHT_CAP = 0.1
const SHORT_DECAY_BARS = 20

/** Per-period simple returns. A flat or broken curve contributes nothing. */
export function returnsOf(curve: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < curve.length; i += 1) {
    const prev = curve[i - 1]
    const now = curve[i]
    if (Number.isFinite(prev) && Number.isFinite(now) && prev > 0 && now > 0) {
      out.push(now / prev - 1)
    }
  }
  return out
}

/** Solve A x = b for a 3x3 system by Gaussian elimination with partial pivoting. */
function solve3(a: number[][], b: number[]): number[] | null {
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < 3; col += 1) {
    let pivot = col
    for (let row = col + 1; row < 3; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row
    }
    if (Math.abs(m[pivot][col]) < 1e-12) return null
    if (pivot !== col) {
      const swap = m[col]
      m[col] = m[pivot]
      m[pivot] = swap
    }
    for (let row = 0; row < 3; row += 1) {
      if (row === col) continue
      const factor = m[row][col] / m[col][col]
      for (let k = col; k < 4; k += 1) m[row][k] -= factor * m[col][k]
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]]
}

/**
 * Split the run's return into a directional part and a magnitude part. A grid
 * earns `|move|`; a rule that knows the cross-section earns the signed move.
 * Both are fitted on the benchmark's own returns, so the split is measurable
 * from two curves and nothing else.
 */
export function exposureOf(
  curve: readonly number[],
  bench: readonly number[],
): Exposure | null {
  const y = returnsOf(curve)
  const raw = returnsOf(bench)
  const n = Math.min(y.length, raw.length)
  if (n < 8) return null
  const x1 = raw.slice(0, n)
  const x2 = x1.map(Math.abs)
  const ys = y.slice(0, n)

  let s1 = 0
  let s2 = 0
  let s11 = 0
  let s22 = 0
  let s12 = 0
  let sy = 0
  let s1y = 0
  let s2y = 0
  for (let i = 0; i < n; i += 1) {
    s1 += x1[i]
    s2 += x2[i]
    s11 += x1[i] * x1[i]
    s22 += x2[i] * x2[i]
    s12 += x1[i] * x2[i]
    sy += ys[i]
    s1y += x1[i] * ys[i]
    s2y += x2[i] * ys[i]
  }
  const coef = solve3(
    [
      [n, s1, s2],
      [s1, s11, s12],
      [s2, s12, s22],
    ],
    [sy, s1y, s2y],
  )
  if (!coef) return null
  const [alpha, betaDrift, betaVol] = coef

  let ssRes = 0
  let ssTot = 0
  const m = sy / n
  for (let i = 0; i < n; i += 1) {
    const fit = alpha + betaDrift * x1[i] + betaVol * x2[i]
    ssRes += (ys[i] - fit) ** 2
    ssTot += (ys[i] - m) ** 2
  }
  const drift = Math.abs(betaDrift) * sd(x1)
  const vol = Math.abs(betaVol) * sd(x2)
  const total = drift + vol
  return {
    betaDrift,
    betaVol,
    volShare: total > 1e-12 ? vol / total : 0,
    r2: ssTot > 1e-12 ? Math.max(0, 1 - ssRes / ssTot) : 0,
    n,
  }
}

/** Lag-one autocorrelation plus the per-observation Sharpe of the same returns. */
export function persistenceOf(curve: readonly number[]): Persistence | null {
  const rets = returnsOf(curve)
  const n = rets.length
  if (n < 8) return null
  const m = mean(rets)
  let denom = 0
  for (const r of rets) denom += (r - m) ** 2
  if (denom <= 0) return null
  let num = 0
  for (let i = 1; i < n; i += 1) num += (rets[i] - m) * (rets[i - 1] - m)
  const gamma1 = num / denom
  const spread = sd(rets)
  const sr = spread > 0 ? m / spread : 0
  // Kaminski & Lo: `stopping ratio = -pi + rho * sigma + eta`, so a stop only
  // adds expected return once persistence clears the Sharpe ratio.
  const stop = gamma1 >= sr ? 'adds' : gamma1 >= 0 ? 'insurance' : 'hurts'
  return { gamma1, sr, stop }
}

/** Which block the rule set reads, for the panel's one-line summary. */
export type FamilySummary = 'none' | 'price' | 'mixed' | 'fundamental'

export function familySummary(families: readonly FactorFamily[]): FamilySummary {
  if (families.length === 0) return 'none'
  const price = families.filter((family) => PRICE_BLOCK[family]).length
  if (price === families.length) return 'price'
  return price > 0 ? 'mixed' : 'fundamental'
}

/**
 * The check. Points add up rather than multiply, so one hard structural failure
 * cannot be outvoted by four mild ones, and the report names every finding it
 * charged for.
 */
export function gridCheck(input: GridInput): GridReport {
  const seen: Partial<Record<FactorFamily, true>> = {}
  const families: FactorFamily[] = []
  for (const family of input.families) {
    if (seen[family]) continue
    seen[family] = true
    families.push(family)
  }
  const findings: GridFinding[] = []

  if (!input.rankExit) findings.push({ id: 'noExitPolicy', points: 30 })

  const priceOnly = families.length > 0 && families.every((f) => PRICE_BLOCK[f])
  if (priceOnly) findings.push({ id: 'priceOnly', points: 25 })

  const decay = families.length === 0 ? 0 : Math.max(...families.map((f) => FAMILY_DECAY[f]))
  if (families.length > 0 && decay < SHORT_DECAY_BARS) {
    findings.push({ id: 'shortDecay', points: 10 })
  }

  const exposure = input.curve && input.bench ? exposureOf(input.curve, input.bench) : null
  if (exposure) {
    if (exposure.volShare >= 0.6) findings.push({ id: 'volHarvest', points: 20 })
    else if (exposure.volShare >= 0.35) findings.push({ id: 'volHarvest', points: 10 })
  }

  const persistence = input.curve ? persistenceOf(input.curve) : null
  if (persistence && persistence.stop === 'hurts') {
    findings.push({ id: 'stopHurts', points: 10 })
  }

  if (typeof input.turnover === 'number' && input.turnover > TURNOVER_CAP) {
    findings.push({ id: 'highTurnover', points: 10 })
  }
  if (typeof input.maxWeight === 'number' && input.maxWeight > WEIGHT_CAP) {
    findings.push({ id: 'concentrated', points: 5 })
  }

  const score = Math.min(100, findings.reduce((sum, f) => sum + f.points, 0))
  const verdict: GridVerdict = score >= 55 ? 'gridlike' : score >= 25 ? 'thin' : 'crossSection'
  return { score, verdict, families, findings, exposure, persistence }
}
