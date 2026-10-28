import { describe, expect, it } from 'vitest'
import { exposureOf, gridCheck, persistenceOf, returnsOf } from './gridcheck'

/** Compound a return series into an equity curve starting at 1. */
function curveOf(rets: readonly number[]): number[] {
  const out = [1]
  for (const r of rets) out.push(out[out.length - 1] * (1 + r))
  return out
}

/** Deterministic noise: mulberry32, so a failing case always fails the same way. */
function noise(seed: number, n: number, spread: number): number[] {
  let state = seed
  return Array.from({ length: n }, () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (((t ^ (t >>> 14)) >>> 0) / 0x100000000 - 0.5) * 2 * spread
  })
}

/** Alternating direction, drifting magnitude: mean reversion with no drift. */
const CHOP = noise(7, 60, 0.01).map((r, i) => (i % 2 === 0 ? Math.abs(r) : -Math.abs(r)))
/** An AR(1) path with rho = 0.3: persistence without a cycle. */
const TREND = noise(11, 60, 0.01).reduce<number[]>((out, shock) => {
  const prev = out[out.length - 1] ?? 0
  out.push(0.3 * prev + shock)
  return out
}, [])

describe('returnsOf', () => {
  it('drops broken points instead of emitting NaN', () => {
    expect(returnsOf([1, 1.1, 0, 2]).map((r) => Number(r.toFixed(6)))).toEqual([0.1])
  })
})

describe('exposure', () => {
  const bench = curveOf(CHOP)

  it('charges a curve that only reads the size of the move', () => {
    const harvest = curveOf(CHOP.map((r) => Math.abs(r) * 0.5 - 0.0001))
    const exposure = exposureOf(harvest, bench)
    expect(exposure).not.toBeNull()
    expect(exposure!.volShare).toBeGreaterThan(0.6)
  })

  it('credits a curve that reads the direction', () => {
    const directional = curveOf(CHOP.map((r) => r * 0.8))
    const exposure = exposureOf(directional, bench)
    expect(exposure!.volShare).toBeLessThan(0.35)
  })

  it('refuses to guess from fewer than eight observations', () => {
    expect(exposureOf([1, 1.01, 1.02], [1, 1.01, 1.02])).toBeNull()
  })
})

describe('persistence', () => {
  it('says a stop hurts on a mean-reverting path', () => {
    const p = persistenceOf(curveOf(CHOP))
    expect(p).not.toBeNull()
    expect(p!.gamma1).toBeLessThan(0)
    expect(p!.stop).toBe('hurts')
  })

  it('says a stop adds on a persistent path', () => {
    const p = persistenceOf(curveOf(TREND))
    expect(p!.gamma1).toBeGreaterThan(0)
    expect(p!.stop).toBe('adds')
  })
})

describe('the check', () => {
  it('fails a price-only rule set that names no exit', () => {
    const report = gridCheck({ families: ['price', 'volume'], rankExit: false })
    expect(report.verdict).toBe('gridlike')
    expect(report.score).toBeGreaterThanOrEqual(55)
    expect(report.findings.map((f) => f.id)).toEqual(['noExitPolicy', 'priceOnly', 'shortDecay'])
  })

  it('passes a fundamental rule set that exits by rank', () => {
    const report = gridCheck({ families: ['fundamental'], rankExit: true })
    expect(report).toEqual({
      score: 0,
      verdict: 'crossSection',
      families: ['fundamental'],
      findings: [],
      exposure: null,
      persistence: null,
    })
  })

  it('collapses duplicate families before scoring', () => {
    const once = gridCheck({ families: ['price'], rankExit: true })
    const twice = gridCheck({ families: ['price', 'price'], rankExit: true })
    expect(twice.score).toBe(once.score)
  })

  it('charges turnover and concentration against the published caps', () => {
    const idle = gridCheck({
      families: ['fundamental'],
      rankExit: true,
      turnover: 0.3,
      maxWeight: 0.05,
    })
    const churn = gridCheck({
      families: ['fundamental'],
      rankExit: true,
      turnover: 1.4,
      maxWeight: 0.24,
    })
    expect(idle.score).toBe(0)
    expect(churn.findings.map((f) => f.id)).toEqual(['highTurnover', 'concentrated'])
  })

  it('adds the measured findings on top of the structural ones', () => {
    const report = gridCheck({
      families: ['momentum'],
      rankExit: true,
      curve: curveOf(CHOP.map((r) => Math.abs(r) * 0.5 + 0.0002)),
      bench: curveOf(CHOP),
    })
    expect(report.findings.map((f) => f.id)).toEqual([
      'priceOnly',
      'shortDecay',
      'volHarvest',
    ])
    expect(report.verdict).toBe('gridlike')
  })
})
