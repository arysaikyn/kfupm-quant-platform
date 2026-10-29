import { describe, expect, it } from 'vitest'
import { quotes } from '../../data/mock'
import { applyRules, metric, presetRules, ruleValue } from '../../lib/screener'
import type { Rule } from '../../lib/screener'

function rule(field: Rule['field'], op: Rule['op'], value: string): Rule {
  return { id: 'r1', field, op, value }
}

describe('screener rules', () => {
  it('treats a blank value as inactive', () => {
    expect(ruleValue(rule('price', 'lt', ' '))).toBeNull()
    expect(applyRules(quotes, [rule('price', 'lt', '')])).toHaveLength(quotes.length)
  })

  it('accepts a comma decimal', () => {
    expect(ruleValue(rule('change', 'gt', '1,5'))).toBe(1.5)
  })

  it('applies lt and gt with the displayed units', () => {
    const under80 = applyRules(quotes, [rule('price', 'lt', '80')])
    expect(under80.every((q) => q.price < 80)).toBe(true)
    const gainers = applyRules(quotes, [rule('change', 'gt', '0')])
    expect(gainers.every((q) => q.change > 0)).toBe(true)
  })

  it('requires every active rule to pass', () => {
    const both = applyRules(quotes, [rule('price', 'lt', '80'), rule('change', 'gt', '0')])
    expect(both.every((q) => q.price < 80 && q.change > 0)).toBe(true)
  })

  it('builds the value preset from fundamentals, not from the price', () => {
    const value = applyRules(quotes, presetRules('value'))
    expect(value.length).toBeGreaterThan(0)
    expect(value.every((q) => metric(q, 'pe') < 30 && metric(q, 'debt') < 45)).toBe(true)
  })
})
