import { fundamentalsFor, marketFor } from '../../data/fundamentals'
import type { Market } from '../../data/fundamentals'
import { quotes, sectors } from '../../data/mock'
import type { Quote, Strategy, StrategyRule } from '../../data/mock'
import { SECTOR_OF } from '../../data/membership'
import { shariaVerdict } from '../../data/shariaCoverage'
import type { ShariaField } from '../../data/shariaCoverage'

/**
 * The demo screen. Every rule in a strategy is applied to the mock tape in the
 * order the engine runs it — Sharia first, because the product contract says a
 * name must clear the screen before it is ranked — and each name keeps the
 * first rule that stopped it, with the figure that rule actually read.
 *
 * A rule the tape cannot measure is `unknown`, never a pass and never a zero:
 * a name that was not proven is `unproven`, which is a different row from a
 * name that failed. That is why the funnel has three stages, not two.
 */

export type MissingKey =
  | 'dividendHistory'
  | 'priceHistory'
  | 'marginData'
  | 'sectorStats'
  | 'aaoifi'
  | 'unmappedRule'

export type Measure =
  | { kind: 'ratio'; value: number }
  | { kind: 'multiple'; value: number }
  | { kind: 'years'; value: number }
  | { kind: 'sector'; value: string }

export type Check =
  | { status: 'pass' }
  | { status: 'fail'; measure: Measure; field?: ShariaField; limit?: number }
  | { status: 'unknown'; missing: MissingKey; field?: ShariaField }

export type Block = {
  ruleId: string
  status: 'fail' | 'unknown'
  measure?: Measure
  missing?: MissingKey
  field?: ShariaField
  limit?: number
}

export type NameRun = {
  symbol: string
  market: Market
  status: 'passed' | 'excluded' | 'unproven'
  /** The first rule that stopped this name; null when it cleared every rule. */
  blocker: Block | null
}

export type Ledger = {
  evaluated: number
  /** Names that were not excluded: they either passed or could not be proven. */
  screened: number
  ranked: number
  names: NameRun[]
  passed: NameRun[]
}

export type Limit = { op: 'lt' | 'gt' | 'lte' | 'gte'; value: number; pct: boolean }

/** "< 15×", "≤ 75%", "> 3%" — one small parser keeps thresholds out of code. */
export function limitOf(text: string): Limit | null {
  const match = /([<>≤≥])\s*(-?\d+(?:[.,]\d+)?)\s*(%|×|x)?/.exec(text)
  if (!match) return null
  const op = match[1] === '<' ? 'lt' : match[1] === '>' ? 'gt' : match[1] === '≤' ? 'lte' : 'gte'
  const raw = Number(match[2].replace(',', '.'))
  if (!Number.isFinite(raw)) return null
  const pct = match[3] === '%'
  return { op, value: pct ? raw / 100 : raw, pct }
}

/** The sector rule in the mock bans banks and insurers; the demo map has no insurer band. */
const BANNED_SECTORS = ['banks', 'insurance']

/** Symbols the sector rule cannot place, exported so the market lens can say why. */
export const UNMAPPED_SECTOR_BANDS = ['insurance']

const SECTOR_OF_SYMBOL: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const [band, symbols] of Object.entries(SECTOR_OF)) {
    for (const symbol of symbols) out[symbol] = band
  }
  return out
})()

export function sectorOfSymbol(symbol: string): string | null {
  return SECTOR_OF_SYMBOL[symbol] ?? null
}

const READERS: Record<string, (q: Quote) => number> = {
  pe: (q) => fundamentalsFor(q.symbol, q.price).pe,
  debt: (q) => fundamentalsFor(q.symbol, q.price).debtRatio,
  yield: (q) => fundamentalsFor(q.symbol, q.price).dividendYield,
  payout: (q) => fundamentalsFor(q.symbol, q.price).payoutRatio,
}

/** Rules whose input the tape simply does not carry. */
const MISSING_INPUT: Record<string, MissingKey> = {
  growth: 'dividendHistory',
  momentum6: 'priceHistory',
  return12: 'priceHistory',
  margin: 'marginData',
  marginTrend: 'marginData',
  roe: 'sectorStats',
}

/** One rule against one name: the only place a figure and a verdict meet. */
export function runRule(rule: StrategyRule, q: Quote): Check {
  const read = READERS[rule.id]
  if (read) {
    const limit = limitOf(rule.value)
    if (!limit) return { status: 'unknown', missing: 'unmappedRule' }
    const value = read(q)
    const pass =
      limit.op === 'lt'
        ? value < limit.value
        : limit.op === 'gt'
          ? value > limit.value
          : limit.op === 'lte'
            ? value <= limit.value
            : value >= limit.value
    return pass ? { status: 'pass' } : { status: 'fail', measure: { kind: limit.pct ? 'ratio' : 'multiple', value } }
  }

  if (rule.id === 'sectors') {
    const band = SECTOR_OF_SYMBOL[q.symbol]
    if (!band) return { status: 'unknown', missing: 'sectorStats' }
    return BANNED_SECTORS.includes(band)
      ? { status: 'fail', measure: { kind: 'sector', value: band } }
      : { status: 'pass' }
  }

  if (rule.id === 'sharia') {
    const verdict = shariaVerdict(q.symbol, q.price)
    if (verdict.status === 'compliant') return { status: 'pass' }
    if (verdict.status === 'non-compliant') {
      const first = verdict.failed[0]
      return {
        status: 'fail',
        measure: { kind: 'ratio', value: first.value },
        field: first.field,
        limit: first.limit,
      }
    }
    const field = verdict.missing[0]
    return { status: 'unknown', missing: 'aaoifi', field }
  }

  return { status: 'unknown', missing: MISSING_INPUT[rule.id] ?? 'unmappedRule' }
}

/** Sharia first: the contract puts the screen upstream of ranking, so the ledger does too. */
function engineOrder(rules: StrategyRule[]): StrategyRule[] {
  const screen = rules.find((rule) => rule.id === 'sharia')
  if (!screen) return rules
  return [screen, ...rules.filter((rule) => rule !== screen)]
}

function runName(strategy: Strategy, q: Quote): NameRun {
  for (const rule of engineOrder(strategy.rules)) {
    const check = runRule(rule, q)
    if (check.status === 'pass') continue
    return {
      symbol: q.symbol,
      market: marketFor(q.symbol),
      status: check.status === 'fail' ? 'excluded' : 'unproven',
      blocker: {
        ruleId: rule.id,
        status: check.status,
        measure: check.status === 'fail' ? check.measure : undefined,
        missing: check.status === 'unknown' ? check.missing : undefined,
        field: check.field,
        limit: check.status === 'fail' ? check.limit : undefined,
      },
    }
  }
  return {
    symbol: q.symbol,
    market: marketFor(q.symbol),
    status: 'passed',
    blocker: null,
  }
}

export function runLedger(strategy: Strategy, universe: Quote[] = quotes): Ledger {
  const names = universe.map((q) => runName(strategy, q))
  const passed = names.filter((name) => name.status === 'passed')
  return {
    evaluated: names.length,
    screened: names.filter((name) => name.status !== 'excluded').length,
    ranked: passed.length,
    names,
    passed,
  }
}

export type MarketReason = 'universe' | 'sectorMap' | 'aaoifi'

export type MarketRun = {
  market: Market
  evaluated: number
  ranked: number
  excluded: number
  unproven: number
  reasons: MarketReason[]
}

export type CrossRun = {
  /** Fixed order, so the table never reshuffles between strategies. */
  rows: MarketRun[]
  /** Gaps that limit every market equally; they cannot explain a difference. */
  gaps: MarketReason[]
  /** The largest universe any one market carries on the tape. */
  fullest: number
  total: number
}

const MARKET_ORDER: Market[] = ['sa', 'cn_a', 'hk', 'us']

/**
 * The same rules, one market at a time. Differences are attributed to what the
 * demo actually lacks — names, a sector map, AAOIFI inputs — never to the
 * market itself, because this is a lens over a five-name sample.
 */
export function crossMarket(strategy: Strategy, universe: Quote[] = quotes): CrossRun {
  const ledger = runLedger(strategy, universe)
  const needsSectors = strategy.rules.some((rule) => rule.id === 'sectors')
  // The sector rule bans banks and insurers, but the demo map has no insurer
  // band: the rule can never be applied in full, in any market. Said once.
  const gaps: MarketReason[] =
    needsSectors && UNMAPPED_SECTOR_BANDS.some((band) => !sectors.some((s) => s.id === band))
      ? ['sectorMap']
      : []
  const fullest = Math.max(...MARKET_ORDER.map((m) => ledger.names.filter((n) => n.market === m).length))
  const rows = MARKET_ORDER.map((market) => {
    const names = ledger.names.filter((name) => name.market === market)
    const reasons: MarketReason[] = []
    if (names.length < fullest) reasons.push('universe')
    if (names.some((name) => name.blocker?.missing === 'sectorStats')) reasons.push('sectorMap')
    if (names.some((name) => name.blocker?.missing === 'aaoifi')) reasons.push('aaoifi')
    return {
      market,
      evaluated: names.length,
      ranked: names.filter((name) => name.status === 'passed').length,
      excluded: names.filter((name) => name.status === 'excluded').length,
      unproven: names.filter((name) => name.status === 'unproven').length,
      reasons,
    }
  })
  return { rows, gaps, fullest, total: ledger.evaluated }
}
