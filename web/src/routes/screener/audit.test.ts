import { describe, expect, it } from 'vitest'
import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'
import { counterfactual, funnel, reasonGroups, relaxations, shariaBuckets } from './audit'
import { applyRules } from '../../lib/screener'
import type { Rule } from '../../lib/screener'

function makeQuote(symbol: string, price: number, change: number): Quote {
  return {
    symbol,
    name: { zh: symbol, en: symbol, ar: symbol },
    price,
    change,
    currency: 'SAR',
    spark: [1, 1.02, 0.99],
  }
}

const PRICE: Rule = { id: 'r1', field: 'price', op: 'lt', value: '80' }
const GAIN: Rule = { id: 'r2', field: 'change', op: 'gt', value: '0' }
const POOL = [makeQuote('A', 10, 0.01), makeQuote('B', 50, -0.002), makeQuote('C', 100, 0.03)]

describe('zero-result funnel', () => {
  it('counts cumulative prefixes with applyRules', () => {
    const stages = funnel(POOL, [PRICE, GAIN])
    expect(stages.map((stage) => stage.kept)).toEqual([2, 1])
    expect(stages[0].kept).toBe(applyRules(POOL, [PRICE]).length)
    expect(stages[1].kept).toBe(applyRules(POOL, [PRICE, GAIN]).length)
  })

  it('ignores blank rules because they do not filter', () => {
    const blank: Rule = { id: 'r3', field: 'change', op: 'gt', value: ' ' }
    expect(funnel(POOL, [PRICE, blank])).toHaveLength(1)
  })
})

describe('loosen exactly one', () => {
  const baseline = applyRules(POOL, [PRICE, GAIN]).length
  const candidates = relaxations(POOL, [PRICE, GAIN])

  it('ranks previews by recovered names without touching the input rules', () => {
    expect(baseline).toBe(1)
    expect(candidates).toHaveLength(3)
    expect(candidates.every((candidate) => candidate.gained > 0)).toBe(true)
    expect(candidates[0].kind).toBe('widen')
    expect(candidates[0].ruleId).toBe(GAIN.id)
    expect(candidates[0].nextValue).toBe(-0.5)
    expect([PRICE, GAIN]).toEqual([{ ...PRICE }, { ...GAIN }])
  })

  it('changes exactly one rule and previews with the same applyRules', () => {
    for (const candidate of candidates) {
      expect(candidate.kept).toBe(applyRules(POOL, candidate.rules).length)
      if (candidate.kind === 'drop') {
        expect(candidate.rules).toHaveLength(1)
        expect(candidate.rules[0].id).not.toBe(candidate.ruleId)
        expect([PRICE.id, GAIN.id]).toContain(candidate.rules[0].id)
      } else {
        const changed = candidate.rules.filter((rule, index) => rule.value !== [PRICE, GAIN][index].value)
        expect(changed).toHaveLength(1)
        expect(changed[0].id).toBe(candidate.ruleId)
        expect(changed[0].value).toBe(String(candidate.nextValue))
      }
    }
  })
})

describe('verdict use', () => {
  const buckets = shariaBuckets(quotes)

  it('ranks only the compliant bucket and keeps each exclusion separate', () => {
    expect(buckets.total).toBe(5)
    expect(buckets.compliant.map((quote) => quote.symbol)).toEqual(['1120'])
    expect(buckets.nonCompliant.map((entry) => entry.quote.symbol)).toEqual([
      '2222',
      '600519',
      '0700',
    ])
    expect(buckets.unclassified.map((entry) => entry.quote.symbol)).toEqual(['2010'])
    expect(buckets.unclassified[0].verdict.missing).toEqual(['receivables'])
  })

  it('lets a missing input outrank a failed check', () => {
    const [unknown] = shariaBuckets([makeQuote('TEST', 10, 0.01)]).unclassified
    expect(unknown.verdict.status).toBe('unclassified')
    expect(unknown.verdict.failed.map((failure) => failure.field)).toContain('debt')
    expect(unknown.verdict.missing).toHaveLength(3)
  })

  it('groups the bin by the exact failed or missing rule', () => {
    const failed = reasonGroups(buckets.nonCompliant, 'failed')
    expect(failed.map((group) => group.field)).toEqual(['debt'])
    expect(failed[0].entries.map((entry) => entry.quote.symbol)).toEqual([
      '2222',
      '600519',
      '0700',
    ])
    expect(failed[0].entries.every((entry) => typeof entry.value === 'number')).toBe(true)

    const missing = reasonGroups(buckets.unclassified, 'missing')
    expect(missing.map((group) => group.field)).toEqual(['receivables'])
    expect(missing[0].entries[0].value).toBeNull()
  })

  it('audits the counterfactual without changing the real ranking', () => {
    const ranked = applyRules(buckets.compliant, [GAIN])
    const whatIf = counterfactual(buckets, [GAIN])
    expect(ranked.map((quote) => quote.symbol)).toEqual([])
    expect(whatIf.map((entry) => entry.quote.symbol)).toEqual(['2222', '600519', '2010'])
    expect(whatIf.some((entry) => ranked.includes(entry.quote))).toBe(false)
  })
})
