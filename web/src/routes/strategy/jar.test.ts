import { describe, expect, it } from 'vitest'
import { strategies } from '../../data/mock'
import { jarStacks, JAR_DEPOSIT, yearIndex } from './jar'

const flat = Array.from({ length: 8 }, () => 1)
const rising = Array.from({ length: 8 }, (_, i) => 1 + i * 0.1)

describe('yearIndex', () => {
  it('puts the first and last year on the first and last point', () => {
    expect(yearIndex(flat, 2019)).toBe(0)
    expect(yearIndex(flat, 2026)).toBe(flat.length - 1)
  })

  it('clamps a year outside the axis', () => {
    expect(yearIndex(flat, 1990)).toBe(0)
    expect(yearIndex(flat, 2099)).toBe(flat.length - 1)
  })
})

describe('jarStacks', () => {
  it('keeps a full deposit with no picks, and does not grow it', () => {
    const jar = jarStacks([], strategies[0].curve, 2019, 1)
    expect(jar.idle).toBe(true)
    expect(jar.grown).toBe(JAR_DEPOSIT)
    expect(jar.cash).toBe(JAR_DEPOSIT)
    expect(jar.stacks).toEqual([])
  })

  it('buys whole shares and leaves the rest in cash', () => {
    const jar = jarStacks([{ symbol: '2222', weight: 1, price: 25.48 }], flat, 2026, 1)
    expect(jar.grown).toBe(100)
    expect(jar.stacks[0]).toMatchObject({ coins: 3, spent: 76.44 })
    expect(jar.cash).toBe(23.56)
  })

  it('re-values the deposit on the curve from the chosen year', () => {
    const jar = jarStacks([{ symbol: '2222', weight: 1, price: 25.48 }], rising, 2019, 1)
    expect(jar.grown).toBe(170)
    expect(jar.stacks[0].budget).toBe(170)
  })

  it('buying at a higher assumed price buys fewer coins', () => {
    const cheap = jarStacks([{ symbol: '2222', weight: 1, price: 25.48 }], flat, 2026, 1)
    const dear = jarStacks([{ symbol: '2222', weight: 1, price: 25.48 }], flat, 2026, 2)
    expect(dear.stacks[0].coins).toBeLessThan(cheap.stacks[0].coins)
    expect(dear.stacks[0].price).toBe(50.96)
  })

  it('splits the deposit by weight and is deterministic', () => {
    const picks = [
      { symbol: '1120', weight: 0.5, price: 60.15 },
      { symbol: '2010', weight: 0.5, price: 72.4 },
    ]
    const jar = jarStacks(picks, flat, 2026, 1)
    expect(jar.stacks.map((stack) => stack.budget)).toEqual([50, 50])
    expect(jar.cash).toBe(100 - jar.spent)
    expect(jarStacks(picks, flat, 2026, 1)).toEqual(jar)
  })
})
