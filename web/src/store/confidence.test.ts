import { describe, expect, it } from 'vitest'
import { quotes } from '../data/mock'
import {
  addCall,
  actualDir,
  brierScore,
  calibration,
  COIN_BRIER,
  dirOf,
  moveOf,
  probabilityOf,
  resolveCall,
  resolvedCalls,
} from './confidence'
import type { ConfidenceCall } from './confidence'

const call = (over: Partial<ConfidenceCall>): ConfidenceCall => ({
  id: 't',
  symbol: '2222',
  dir: 'up',
  confidence: 3,
  windowEnd: 10,
  ...over,
})

/**
 * Three settled calls on the sample path: two hits and one miss, which is the
 * case a score has to get right rather than a lucky clean sweep.
 */
const MIXED: ConfidenceCall[] = [
  call({ id: 'a', symbol: '2222', dir: 'up', confidence: 4, windowEnd: 10 }),
  call({ id: 'b', symbol: '1120', dir: 'down', confidence: 3, windowEnd: 15 }),
  call({ id: 'c', symbol: '600519', dir: 'up', confidence: 2, windowEnd: 20 }),
]

describe('call resolution', () => {
  it('reads the move off the spark window, not a stored answer', () => {
    const spark = quotes.find((q) => q.symbol === '2222')!.spark
    const move = moveOf(call({ symbol: '2222', windowEnd: 10 }))
    expect(move).toBeCloseTo((spark[10] - spark[5]) / spark[5], 10)
    expect(actualDir(call({ symbol: '2222', windowEnd: 10 }))).toBe('up')
    expect(actualDir(call({ symbol: '600519', windowEnd: 20 }))).toBe('down')
  })

  it('leaves an open call unscored', () => {
    expect(moveOf(call({ windowEnd: null }))).toBeNull()
    expect(actualDir(call({ windowEnd: null }))).toBeNull()
  })

  it('refuses a window that runs off either end of the spark', () => {
    expect(moveOf(call({ windowEnd: 2 }))).toBeNull()
    expect(moveOf(call({ windowEnd: 400 }))).toBeNull()
  })

  it('bands a small move as flat and a larger one as a direction', () => {
    expect(dirOf(0.003)).toBe('flat')
    expect(dirOf(-0.003)).toBe('flat')
    expect(dirOf(0.0031)).toBe('up')
    expect(dirOf(-0.0031)).toBe('down')
  })
})

describe('brierScore', () => {
  it('is the mean squared error of the stated probability', () => {
    // 4 → hit costs 0.04, 3 → hit costs 0.16, 2 → miss costs 0.16.
    expect(brierScore(MIXED)).toBeCloseTo(0.12, 10)
  })

  it('is null until a call has settled', () => {
    expect(brierScore([])).toBeNull()
    expect(brierScore([call({ windowEnd: null })])).toBeNull()
  })

  it('sits above the coin when every confident call misses', () => {
    const overconfident = [
      call({ id: 'x', symbol: '600519', dir: 'up', confidence: 5, windowEnd: 20 }),
    ]
    expect(brierScore(overconfident)).toBeGreaterThan(COIN_BRIER)
  })

  it('reads 5 as certainty and 1 as one in five', () => {
    expect(probabilityOf(5)).toBe(1)
    expect(probabilityOf(1)).toBeCloseTo(0.2, 10)
  })

  it('orders settled calls newest week first', () => {
    expect(resolvedCalls(MIXED).map((row) => row.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('calibration', () => {
  it('groups the stated probability against the hit rate', () => {
    const buckets = calibration(MIXED)
    expect(buckets.map((bucket) => bucket.key)).toEqual(['low', 'mid', 'high'])
    expect(buckets[0]).toMatchObject({ calls: 1, hits: 0, observed: 0 })
    expect(buckets[0].stated).toBeCloseTo(0.4, 10)
    expect(buckets[1]).toMatchObject({ calls: 1, hits: 1, observed: 1 })
    expect(buckets[2]).toMatchObject({ calls: 1, hits: 1, observed: 1 })
    expect(buckets[2].stated).toBeCloseTo(0.8, 10)
  })

  it('drops bands with no settled call instead of printing a zero', () => {
    const single = calibration([MIXED[1]])
    expect(single.map((bucket) => bucket.key)).toEqual(['mid'])
  })
})

describe('the book itself', () => {
  it('logs an open call and settles it on the latest sample week', () => {
    addCall({ symbol: '2010', dir: 'down', confidence: 5 })
    const read = () => JSON.parse(localStorage.getItem('confidence.v1') ?? '[]') as ConfidenceCall[]
    const added = read()[0]
    expect(added).toMatchObject({ symbol: '2010', dir: 'down', confidence: 5, windowEnd: null })

    resolveCall(added.id)
    const settled = read()[0]
    const spark = quotes.find((q) => q.symbol === '2010')!.spark
    expect(settled.windowEnd).toBe(spark.length - 1)
    expect(actualDir(settled)).not.toBeNull()
  })
})
