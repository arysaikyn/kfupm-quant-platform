import type { Quote } from '../../data/mock'
import { SHARIA_LIMITS, shariaVerdict } from '../../data/shariaCoverage'
import type { ShariaField, ShariaVerdict } from '../../data/shariaCoverage'
import { applyRules, ruleValue } from '../../lib/screener'
import type { Field, Rule } from '../../lib/screener'

/** One extra step outward, in the unit each rule is typed in. */
const RELAX_STEP: Record<Field, number> = {
  pe: 2,
  debt: 5,
  yield: 1,
  change: 0.5,
  price: 5,
  turnover: 5,
}

const SHARIA_FIELDS = Object.keys(SHARIA_LIMITS) as ShariaField[]

export type ShariaEntry = { quote: Quote; verdict: ShariaVerdict }

export type ShariaBuckets = {
  total: number
  compliant: Quote[]
  nonCompliant: ShariaEntry[]
  unclassified: ShariaEntry[]
}

/**
 * The one split every stage downstream uses: only `compliant` is rankable.
 * Missing inputs stay separate from failed checks — a name the vendor did not
 * publish is unproven, not condemned.
 */
export function shariaBuckets(list: readonly Quote[]): ShariaBuckets {
  const buckets: ShariaBuckets = {
    total: list.length,
    compliant: [],
    nonCompliant: [],
    unclassified: [],
  }
  for (const quote of list) {
    const verdict = shariaVerdict(quote.symbol, quote.price)
    if (verdict.status === 'compliant') buckets.compliant.push(quote)
    else if (verdict.status === 'non-compliant') buckets.nonCompliant.push({ quote, verdict })
    else buckets.unclassified.push({ quote, verdict })
  }
  return buckets
}

/** Cumulative: each stage is the whole prefix of active rules, not a delta. */
export type FunnelStage = { rule: Rule; threshold: number; kept: number }

export function funnel(pool: readonly Quote[], rules: readonly Rule[]): FunnelStage[] {
  const active = rules.flatMap((rule) => {
    const threshold = ruleValue(rule)
    return threshold === null ? [] : [{ rule, threshold }]
  })
  const stages: FunnelStage[] = []
  const prefix: Rule[] = []
  for (const { rule, threshold } of active) {
    prefix.push(rule)
    stages.push({ rule, threshold, kept: applyRules(pool, prefix).length })
  }
  return stages
}

export type Relaxation = {
  id: string
  ruleId: string
  kind: 'drop' | 'widen'
  /** The rule as typed, and the widened threshold when `kind` is widen. */
  rule: Rule
  threshold: number
  nextValue: number | null
  /** Exactly the rule set the preview counted; applying it is a plain setRules. */
  rules: Rule[]
  kept: number
  gained: number
}

/**
 * Every candidate loosens exactly one rule: delete it, or move its threshold
 * one step outward. Counts come from `applyRules`, never arithmetic on the
 * funnel, so the preview and the applied screen cannot drift.
 */
export function relaxations(
  pool: readonly Quote[],
  rules: readonly Rule[],
  limit = 3,
): Relaxation[] {
  const baseline = applyRules(pool, rules).length
  const active = rules.flatMap((rule, index) => {
    const threshold = ruleValue(rule)
    return threshold === null ? [] : [{ rule, threshold, index }]
  })
  const scored = active.flatMap(({ rule, threshold, index }) => {
    const out: { candidate: Relaxation; index: number }[] = []
    const dropRules = rules.filter((entry) => entry.id !== rule.id)
    const dropKept = applyRules(pool, dropRules).length
    out.push({
      index,
      candidate: {
        id: `${rule.id}:drop`,
        ruleId: rule.id,
        kind: 'drop',
        rule,
        threshold,
        nextValue: null,
        rules: dropRules,
        kept: dropKept,
        gained: dropKept - baseline,
      },
    })

    const step = RELAX_STEP[rule.field]
    const next = Math.round((rule.op === 'gt' ? threshold - step : threshold + step) * 1e4) / 1e4
    const widened = { ...rule, value: String(next) }
    const widenRules = rules.map((entry) => (entry.id === rule.id ? widened : entry))
    const widenKept = applyRules(pool, widenRules).length
    out.push({
      index,
      candidate: {
        id: `${rule.id}:widen`,
        ruleId: rule.id,
        kind: 'widen',
        rule,
        threshold,
        nextValue: next,
        rules: widenRules,
        kept: widenKept,
        gained: widenKept - baseline,
      },
    })
    return out
  })

  return scored
    .filter(({ candidate }) => candidate.gained > 0)
    .sort(
      ({ candidate: a, index: ai }, { candidate: b, index: bi }) =>
        b.gained - a.gained ||
        // On a tie the smaller loosening wins: widening before deleting.
        (a.kind === b.kind ? 0 : a.kind === 'widen' ? -1 : 1) ||
        ai - bi,
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

export type CounterfactualEntry = {
  quote: Quote
  status: 'non-compliant' | 'unclassified'
}

/**
 * Audit only: Sharia-excluded names that would have cleared the rules had the
 * stage order been reversed. The real ranking never consumes this list.
 */
export function counterfactual(
  buckets: ShariaBuckets,
  rules: readonly Rule[],
): CounterfactualEntry[] {
  const excluded: CounterfactualEntry[] = [
    ...buckets.nonCompliant.map(({ quote }) => ({ quote, status: 'non-compliant' as const })),
    ...buckets.unclassified.map(({ quote }) => ({ quote, status: 'unclassified' as const })),
  ]
  const kept = new Set(applyRules(excluded.map((entry) => entry.quote), rules).map((q) => q.symbol))
  return excluded.filter((entry) => kept.has(entry.quote.symbol))
}

export type AuditGroup = {
  kind: 'failed' | 'missing'
  field: ShariaField
  limit: number
  entries: { quote: Quote; value: number | null }[]
}

/** Group the exclusion bin by its exact reason, in AAOIFI field order. */
export function reasonGroups(
  entries: readonly ShariaEntry[],
  kind: 'failed' | 'missing',
): AuditGroup[] {
  const groups: Partial<Record<ShariaField, AuditGroup>> = {}
  for (const { quote, verdict } of entries) {
    const fields =
      kind === 'failed' ? verdict.failed.map((failure) => failure.field) : verdict.missing
    for (const field of fields) {
      const group =
        groups[field] ?? (groups[field] = { kind, field, limit: SHARIA_LIMITS[field], entries: [] })
      group.entries.push({ quote, value: verdict.values[field] })
    }
  }
  return SHARIA_FIELDS.flatMap((field) => {
    const group = groups[field]
    return group ? [group] : []
  })
}
