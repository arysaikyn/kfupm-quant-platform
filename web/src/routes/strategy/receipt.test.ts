import { describe, expect, it } from 'vitest'
import { strategies } from '../../data/mock'
import type { Strategy } from '../../data/mock'
import {
  compareReceipt,
  decodeReceipt,
  encodeReceipt,
  fromBase64Url,
  hashOf,
  receiptFor,
  toBase64Url,
  UNIVERSE,
} from './receipt'
import type { Receipt, ReceiptCosts } from './receipt'

const COSTS: ReceiptCosts = { capital: 10_000, feeBps: 15, slipBps: 50, turnoverPct: 78 }

const strategy = strategies[0]

function receiptOf(source: Strategy = strategy, costs: ReceiptCosts = COSTS): Receipt {
  return receiptFor(source, costs)
}

describe('receipt token', () => {
  it('round-trips through base64url', () => {
    const text = '市盈率 < 15× · الدين < 30% · نسبة ٧٨٪'
    expect(fromBase64Url(toBase64Url(text))).toBe(text)
  })

  it('emits a URL-safe token that decodes back to the receipt', () => {
    const receipt = receiptOf()
    const token = encodeReceipt(receipt)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeReceipt(token)).toEqual(receipt)
  })

  it('rejects malformed tokens instead of throwing', () => {
    expect(decodeReceipt('')).toBeNull()
    expect(decodeReceipt('A')).toBeNull()
    expect(decodeReceipt('!!!!')).toBeNull()
    expect(decodeReceipt(toBase64Url('{"v":2}'))).toBeNull()
    expect(decodeReceipt(toBase64Url('not json'))).toBeNull()
  })

  it('pins the same rules in every language', () => {
    const translated: Strategy = {
      ...strategy,
      name: { zh: '甲', en: 'A', ar: 'أ' },
      rules: strategy.rules.map((rule) => ({
        ...rule,
        label: { zh: '标签', en: 'label', ar: 'وسم' },
      })),
    }
    expect(hashOf(receiptOf(translated))).toBe(hashOf(receiptOf()))
  })
})

describe('receipt hash', () => {
  it('is a stable 16-character hex digest', () => {
    const hash = hashOf(receiptOf())
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
    expect(hashOf(receiptOf())).toBe(hash)
  })

  it('moves when a rule condition moves', () => {
    const base = hashOf(receiptOf())
    const changed = receiptOf({
      ...strategy,
      rules: strategy.rules.map((rule) =>
        rule.id === 'pe' ? { ...rule, value: '< 20×' } : rule,
      ),
    })
    expect(hashOf(changed)).not.toBe(base)
  })

  it('moves with the as-of date, the universe and every cost constant', () => {
    const base = hashOf(receiptOf())
    expect(hashOf({ ...receiptOf(), asOf: '2026-10-24' })).not.toBe(base)
    expect(hashOf({ ...receiptOf(), universe: [...UNIVERSE, '9999'] })).not.toBe(base)
    expect(hashOf({ ...receiptOf(), costs: { ...COSTS, feeBps: 16 } })).not.toBe(base)
    expect(hashOf({ ...receiptOf(), costs: { ...COSTS, turnoverPct: 80 } })).not.toBe(base)
  })
})

describe('receipt verdict', () => {
  it('reproduces an unchanged strategy', () => {
    const verdict = compareReceipt(receiptOf(), receiptOf())
    expect(verdict.ok).toBe(true)
    expect(verdict.changes).toEqual([])
    expect(verdict.hash).toBe(hashOf(receiptOf()))
  })

  it('names the rule whose condition changed', () => {
    const current = receiptOf({
      ...strategy,
      rules: strategy.rules.map((rule) =>
        rule.id === 'debt' ? { ...rule, value: '< 40%' } : rule,
      ),
    })
    const verdict = compareReceipt(receiptOf(), current)
    expect(verdict.ok).toBe(false)
    expect(verdict.changes).toEqual([
      { field: 'rules', ruleId: 'debt', kind: 'value', from: '< 30%', to: '< 40%' },
    ])
  })

  it('names a moved date, a changed universe and a changed cost', () => {
    const current: Receipt = {
      ...receiptOf(),
      asOf: '2026-10-24',
      universe: [...UNIVERSE.filter((s) => s !== '0700'), '9999'],
      costs: { ...COSTS, slipBps: 60 },
    }
    const verdict = compareReceipt(receiptOf(), current)
    expect(verdict.changes).toContainEqual({ field: 'asOf', from: '2026-10-19', to: '2026-10-24' })
    expect(verdict.changes).toContainEqual({ field: 'universe', kind: 'added', symbol: '9999' })
    expect(verdict.changes).toContainEqual({ field: 'universe', kind: 'removed', symbol: '0700' })
    expect(verdict.changes).toContainEqual({
      field: 'costs',
      key: 'slipBps',
      from: 50,
      to: 60,
    })
  })

  it('reports a reordered rule list as an order change, not a silent pass', () => {
    const [first, second, ...rest] = strategy.rules
    const current = receiptOf({ ...strategy, rules: [second, first, ...rest] })
    const verdict = compareReceipt(receiptOf(), current)
    expect(verdict.ok).toBe(false)
    expect(verdict.changes[0]).toMatchObject({ field: 'rules', kind: 'order' })
  })

  it('names an added and a removed rule once, with no phantom order change', () => {
    const fewer = receiptOf({
      ...strategy,
      rules: strategy.rules.filter((rule) => rule.id !== 'debt'),
    })
    expect(compareReceipt(receiptOf(), fewer).changes).toEqual([
      { field: 'rules', ruleId: 'debt', kind: 'removed' },
    ])

    const more = receiptOf({
      ...strategy,
      rules: [
        ...strategy.rules,
        { id: 'roe', label: strategy.rules[0].label, value: '≥ 1.0×' },
      ],
    })
    expect(compareReceipt(receiptOf(), more).changes).toEqual([
      { field: 'rules', ruleId: 'roe', kind: 'added' },
    ])
  })
})
