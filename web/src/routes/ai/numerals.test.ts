import { describe, expect, it } from 'vitest'
import type { RunPreview } from '../../api/ai'
import { extractNumerals, normalizeNumeral, numeralProvenance } from './numerals'

const run = (metrics: Record<string, number> | null): RunPreview => ({
  metrics,
  equity_curve: [],
  report_worthy: Boolean(metrics),
})

describe('numeral extraction', () => {
  it('reads signed percentages, decimals and grouped integers', () => {
    const { tokens } = extractNumerals(
      'Return +12.30%, Sharpe 1.20, drawdown -8.00%, 1,200 trades.',
    )
    expect(tokens.map((token) => token.text)).toEqual(['+12.30%', '1.20', '-8.00%', '1,200'])
    expect(tokens.map((token) => token.kind)).toEqual([
      'percent',
      'decimal',
      'percent',
      'integer',
    ])
    expect(tokens[2].value).toBe(-8)
    expect(tokens[3].value).toBe(1200)
  })

  it('skips code, urls, tickers, years and versions', () => {
    const markdown = [
      'Aramco (2222) in 2026.',
      '`+99.99%` and',
      '```',
      '+88.88%',
      '```',
      'See https://example.com/a?return=42.50 and [run](/runs?sharpe=9.9).',
      'Version 1.2.3 shipped.',
    ].join('\n')
    const { tokens, skipped } = extractNumerals(markdown)
    expect(tokens).toHaveLength(0)
    expect(skipped.filter((item) => item.reason === 'code')).toHaveLength(2)
    expect(skipped.some((item) => item.reason === 'ticker')).toBe(true)
    expect(skipped.some((item) => item.reason === 'year')).toBe(true)
    expect(skipped.some((item) => item.reason === 'url')).toBe(true)
    expect(skipped.some((item) => item.reason === 'link')).toBe(true)
    expect(skipped.some((item) => item.reason === 'version')).toBe(true)
  })

  it('leaves words that merely contain digits alone', () => {
    const { tokens } = extractNumerals('Q3 and 5G and TASI30, plus 1.4% for Brent.')
    expect(tokens.map((token) => token.text)).toEqual(['1.4%'])
  })

  it('ignores ordered-list and footnote markers', () => {
    const { tokens } = extractNumerals('1. First step\n2. Second step[^2]\n12.5% growth')
    expect(tokens.map((token) => token.text)).toEqual(['12.5%'])
  })
})

describe('numeral provenance', () => {
  const metrics = { total_return: 0.123, sharpe: 1.2, max_drawdown: -0.08, trade_count: 1200 }

  it('binds exact display strings to run metrics', () => {
    const provenance = numeralProvenance(
      'Total return +12.30%, Sharpe 1.20, max drawdown -8.00%, 1,200 trades. Also 14.20% elsewhere.',
      run(metrics),
      'en',
    )
    expect(provenance.total).toBe(5)
    expect(provenance.traced).toBe(4)
    expect(provenance.numbers.map((number) => number.metricKeys[0] ?? null)).toEqual([
      'total_return',
      'sharpe',
      'max_drawdown',
      'trade_count',
      null,
    ])
  })

  it('accepts a signless percentage for a positive metric', () => {
    const provenance = numeralProvenance('Return 12.30%.', run({ total_return: 0.123 }), 'en')
    expect(provenance.numbers[0].metricKeys).toEqual(['total_return'])
  })

  it('keeps both keys when two metrics share a value', () => {
    const provenance = numeralProvenance(
      '+12.30%',
      run({ total_return: 0.123, annual_return: 0.123 }),
      'en',
    )
    expect(provenance.numbers[0].metricKeys).toEqual(['total_return', 'annual_return'])
  })

  it('traces nothing when the run carries no metrics', () => {
    const provenance = numeralProvenance('Demo says +12.30% and -8.00%.', run(null), 'en')
    expect(provenance.total).toBe(2)
    expect(provenance.traced).toBe(0)
  })

  it('traces nothing in demo mode, where no run exists at all', () => {
    const provenance = numeralProvenance('| Total return | 12.30% |', undefined, 'en')
    expect(provenance.total).toBe(1)
    expect(provenance.traced).toBe(0)
  })

  it('normalizes bidi marks before matching', () => {
    expect(normalizeNumeral('\u2066+12.30%\u2069')).toBe('+12.30%')
    expect(normalizeNumeral('\u200e-8.00%')).toBe('-8.00%')
  })

  it('binds Arabic-formatted metric strings', () => {
    const provenance = numeralProvenance('العائد +12.30%', run({ total_return: 0.123 }), 'ar')
    expect(provenance.traced).toBe(1)
  })
})
