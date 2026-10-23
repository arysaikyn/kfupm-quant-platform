import { describe, expect, it } from 'vitest'
import { quotes } from '../../data/mock'
import { applyRules, presetRules, ruleValue } from './rules'
import type { Rule } from './rules'

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

  it('produces the value preset from the URL handoff', () => {
    expect(applyRules(quotes, presetRules('value')).length).toBe(3)
  })
})
