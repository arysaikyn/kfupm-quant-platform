import { describe, expect, it } from 'vitest'
import {
  DAY_MS,
  RETURN_AFTER_DAYS,
  daysUntil,
  exampleReturn,
  isEligible,
  partitionReturns,
  returnDueAt,
} from './returns'
import type { ReturnEntry } from './returns'

const NOW = 1_760_000_000_000

function entry(id: string, dueInDays: number): ReturnEntry {
  const dueAt = NOW + dueInDays * DAY_MS
  return {
    id,
    symbol: id.toUpperCase(),
    groupId: 'default',
    reason: 'risk',
    removedAt: dueAt - RETURN_AFTER_DAYS * DAY_MS,
    dueAt,
  }
}

describe('returns dock eligibility', () => {
  it('waits exactly the configured number of days', () => {
    expect(returnDueAt(NOW)).toBe(NOW + RETURN_AFTER_DAYS * DAY_MS)
    expect(RETURN_AFTER_DAYS).toBe(7)
  })

  it('offers a row at its due time, not a millisecond before', () => {
    const row = entry('a', 0)
    expect(isEligible(row, row.dueAt)).toBe(true)
    expect(isEligible(row, row.dueAt - 1)).toBe(false)
  })

  it('counts whole days left without ever going negative', () => {
    expect(daysUntil(entry('a', 3), NOW)).toBe(3)
    expect(daysUntil(entry('b', 2.2), NOW)).toBe(3)
    expect(daysUntil(entry('c', 0), NOW)).toBe(0)
    expect(daysUntil(entry('d', -4), NOW)).toBe(0)
  })

  it('partitions into eligible and pending by due time', () => {
    const rows = [entry('c', 5), entry('b', -1), entry('a', 2)]
    const { eligible, pending } = partitionReturns(rows, NOW)
    expect(eligible.map((row) => row.id)).toEqual(['b'])
    expect(pending.map((row) => row.id)).toEqual(['a', 'c'])
    // Sorting must not reorder the caller's array.
    expect(rows.map((row) => row.id)).toEqual(['c', 'b', 'a'])
  })

  it('seeds an example that is already eligible', () => {
    const seeded = exampleReturn(NOW)
    expect(seeded.example).toBe(true)
    expect(isEligible(seeded, NOW)).toBe(true)
  })
})
