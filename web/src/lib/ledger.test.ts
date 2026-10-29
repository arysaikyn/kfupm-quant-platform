import { describe, expect, it } from 'vitest'
import { quotes, strategies } from '../data/mock'
import { crossMarket, limitOf, runLedger, runRule, sectorOfSymbol } from './ledger'

const lowDebt = strategies.find((s) => s.id === 'low-debt-value')!
const dividend = strategies.find((s) => s.id === 'dividend-growers')!
const momentum = strategies.find((s) => s.id === 'momentum-quality')!

const nameOf = (symbol: string) => quotes.find((q) => q.symbol === symbol)!

describe('rule thresholds', () => {
  it('reads a multiple, a percent and a count', () => {
    expect(limitOf('< 15×')).toEqual({ op: 'lt', value: 15, pct: false })
    expect(limitOf('≤ 75%')).toEqual({ op: 'lte', value: 0.75, pct: true })
    expect(limitOf('≥ 3')).toEqual({ op: 'gte', value: 3, pct: false })
  })

  it('returns null when a rule carries no threshold', () => {
    expect(limitOf('✓')).toBeNull()
    expect(limitOf('0%')).toBeNull()
  })
})

describe('one rule, one name', () => {
  it('measures the figure it judged', () => {
    const check = runRule(lowDebt.rules[0], nameOf('1120'))
    expect(check).toEqual({ status: 'fail', measure: { kind: 'multiple', value: 31.5 } })
  })

  it('passes a name inside the threshold', () => {
    const debt = lowDebt.rules.find((r) => r.id === 'debt')!
    expect(runRule(debt, nameOf('2010'))).toEqual({ status: 'pass' })
    expect(runRule(debt, nameOf('2222'))).toMatchObject({
      status: 'fail',
      measure: { kind: 'ratio', value: 0.553 },
    })
  })

  it('fails a banned sector band and names it', () => {
    const sectors = lowDebt.rules.find((r) => r.id === 'sectors')!
    expect(sectorOfSymbol('1120')).toBe('banks')
    expect(runRule(sectors, nameOf('1120'))).toEqual({
      status: 'fail',
      measure: { kind: 'sector', value: 'banks' },
    })
    expect(runRule(sectors, nameOf('2222'))).toEqual({ status: 'pass' })
  })

  it('keeps an AAOIFI gap as unknown, with the missing field', () => {
    const sharia = lowDebt.rules.find((r) => r.id === 'sharia')!
    expect(runRule(sharia, nameOf('2010'))).toEqual({
      status: 'unknown',
      missing: 'aaoifi',
      field: 'receivables',
    })
    expect(runRule(sharia, nameOf('1120'))).toEqual({ status: 'pass' })
    expect(runRule(sharia, nameOf('2222'))).toMatchObject({ status: 'fail', field: 'debt' })
  })

  it('marks a rule the tape cannot feed as unknown, never zero', () => {
    const growth = dividend.rules.find((r) => r.id === 'growth')!
    expect(runRule(growth, nameOf('0700'))).toEqual({
      status: 'unknown',
      missing: 'dividendHistory',
    })
    const roe = momentum.rules.find((r) => r.id === 'roe')!
    expect(runRule(roe, nameOf('0700'))).toEqual({ status: 'unknown', missing: 'sectorStats' })
  })
})

describe('the funnel', () => {
  it('counts evaluated, screened and ranked separately', () => {
    const ledger = runLedger(lowDebt)
    expect(ledger.evaluated).toBe(5)
    // Only Moutai survives the screen: it cannot be classified, so it is not
    // excluded, but it is not ranked either.
    expect(ledger.screened).toBe(1)
    expect(ledger.ranked).toBe(0)
  })

  it('puts Sharia before the numeric rules', () => {
    const ledger = runLedger(lowDebt)
    const bySymbol = Object.fromEntries(ledger.names.map((n) => [n.symbol, n]))
    // Aramco's debt ratio breaks AAOIFI before its P/E is ever read.
    expect(bySymbol['2222'].status).toBe('excluded')
    expect(bySymbol['2222'].blocker).toMatchObject({ ruleId: 'sharia', field: 'debt' })
    // Al Rajhi passes Sharia, so the P/E rule is the one that stops it.
    expect(bySymbol['1120'].blocker).toMatchObject({ ruleId: 'pe' })
    expect(bySymbol['2010'].status).toBe('unproven')
    expect(bySymbol['2010'].blocker).toMatchObject({ missing: 'aaoifi' })
  })

  it('excludes on a measured rule and leaves unmeasured rules alone', () => {
    const ledger = runLedger(dividend)
    const bySymbol = Object.fromEntries(ledger.names.map((n) => [n.symbol, n]))
    expect(bySymbol['2010'].blocker).toMatchObject({ ruleId: 'yield', status: 'fail' })
    expect(bySymbol['0700'].status).toBe('unproven')
    expect(bySymbol['0700'].blocker).toMatchObject({ ruleId: 'growth', missing: 'dividendHistory' })
    expect(ledger.screened).toBe(4)
    expect(ledger.ranked).toBe(0)
  })

  it('turns a whole strategy into unproven when no rule is measurable', () => {
    const ledger = runLedger(momentum)
    expect(ledger.names.every((n) => n.status === 'unproven')).toBe(true)
    expect(ledger.names.every((n) => n.blocker?.missing === 'priceHistory')).toBe(true)
    expect(ledger.screened).toBe(5)
    expect(ledger.ranked).toBe(0)
  })

  it('is deterministic across calls', () => {
    expect(runLedger(lowDebt)).toEqual(runLedger(lowDebt))
  })
})

describe('cross-market lens', () => {
  it('splits the tape by market in a fixed order', () => {
    const cross = crossMarket(lowDebt)
    expect(cross.rows.map((row) => row.market)).toEqual(['sa', 'cn_a', 'hk', 'us'])
    expect(cross.rows.map((row) => row.evaluated)).toEqual([3, 1, 1, 0])
    expect(cross.rows.reduce((sum, row) => sum + row.evaluated, 0)).toBe(cross.total)
    expect(cross.fullest).toBe(3)
  })

  it('attributes a difference to the missing universe, the sector map and AAOIFI', () => {
    const cross = crossMarket(lowDebt)
    const byMarket = Object.fromEntries(cross.rows.map((row) => [row.market, row]))
    expect(byMarket['us'].reasons).toContain('universe')
    expect(byMarket['cn_a'].reasons).toContain('universe')
    expect(byMarket['cn_a'].reasons).toEqual(['universe'])
    expect(byMarket['sa'].reasons).toEqual(['aaoifi'])
    // The insurer band is missing for every market, so it is a shared gap.
    expect(cross.gaps).toEqual(['sectorMap'])
  })

  it('reports no sector-map gap for a strategy without a sector rule', () => {
    const cross = crossMarket(dividend)
    expect(cross.rows.every((row) => !row.reasons.includes('sectorMap'))).toBe(true)
    expect(cross.gaps).toEqual([])
  })
})
