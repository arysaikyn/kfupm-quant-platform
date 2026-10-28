import { describe, expect, it } from 'vitest'
import { expectedMaxZ, mean, normCdf, normInv, sd } from './stats'

describe('normal helpers', () => {
  it('puts the standard values where the tables put them', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6)
    expect(normCdf(1.6449)).toBeCloseTo(0.95, 4)
    expect(normInv(0.5)).toBeCloseTo(0, 6)
    expect(normInv(0.975)).toBeCloseTo(1.96, 2)
    expect(normInv(1)).toBe(Infinity)
  })

  it('raises the bar as more trials are tried', () => {
    expect(expectedMaxZ(1)).toBe(0)
    expect(expectedMaxZ(10)).toBeGreaterThan(1)
    expect(expectedMaxZ(100)).toBeGreaterThan(expectedMaxZ(10))
  })
})

describe('sample moments', () => {
  it('uses n - 1 and refuses a single value', () => {
    expect(mean([1, 2, 3])).toBe(2)
    expect(sd([2, 2, 2])).toBe(0)
    expect(sd([1])).toBe(0)
    expect(sd([1, 3])).toBeCloseTo(Math.SQRT2, 10)
  })
})
