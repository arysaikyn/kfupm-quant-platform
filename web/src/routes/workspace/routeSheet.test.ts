import { describe, expect, it } from 'vitest'
import { buildRouteSheet, nextRouteStart } from './routeSheet'
import type { RouteInput } from './routeSheet'

function input(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    screens: [
      { id: 's1', name: 'Value screen', ruleCount: 2 },
      { id: 's2', name: 'Calm screen', ruleCount: 1 },
    ],
    watchlists: [
      { id: 'default', name: 'Main list', symbolCount: 4 },
      { id: 'g2', name: 'Empty', symbolCount: 0 },
    ],
    strategies: [
      { id: 'st1', name: 'Low-debt value', ruleCount: 4 },
      { id: 'st2', name: 'Dividend growers', ruleCount: 3 },
    ],
    newsCount: 6,
    ...overrides,
  }
}

const NOW = new Date(2026, 9, 21, 14, 30).getTime() // Wednesday 21 Oct 2026, 14:30 local
const SLOT = 15 * 60_000

describe('weekly route sheet', () => {
  it('starts on the next Monday at 09:00', () => {
    const start = nextRouteStart(NOW)
    const date = new Date(start)
    expect(date.getDay()).toBe(1)
    expect(date.getHours()).toBe(9)
    expect(date.getMinutes()).toBe(0)
    expect(start).toBeGreaterThan(NOW)
  })

  it('rolls a whole week when Monday 09:00 has already passed', () => {
    const monday = new Date(2026, 9, 19, 10, 0).getTime()
    expect(nextRouteStart(monday)).toBe(new Date(2026, 9, 26, 9, 0).getTime())
  })

  it('keeps a future Monday slot later the same morning', () => {
    const monday = new Date(2026, 9, 19, 8, 0).getTime()
    expect(nextRouteStart(monday)).toBe(new Date(2026, 9, 19, 9, 0).getTime())
  })

  it('walks screens, watchlists, strategies, then news with consecutive slots', () => {
    const sheet = buildRouteSheet(input(), NOW)
    expect(sheet.stops.map((stop) => stop.kind)).toEqual([
      'screen',
      'screen',
      'watchlist',
      'strategy',
      'strategy',
      'news',
    ])
    expect(sheet.stops.map((stop) => stop.name)).toEqual([
      'Value screen',
      'Calm screen',
      'Main list',
      'Low-debt value',
      'Dividend growers',
      null,
    ])
    expect(sheet.activeCount).toBe(6)
    expect(sheet.skippedCount).toBe(0)
    expect(sheet.nextStart).toBe(nextRouteStart(NOW))
    expect(sheet.stops.map((stop) => stop.nextStart)).toEqual([
      sheet.nextStart,
      sheet.nextStart + SLOT,
      sheet.nextStart + 2 * SLOT,
      sheet.nextStart + 3 * SLOT,
      sheet.nextStart + 4 * SLOT,
      sheet.nextStart + 5 * SLOT,
    ])
    expect(sheet.finishAt).toBe(sheet.nextStart + 6 * SLOT)
  })

  it('keeps skipped stops visible without spending a slot', () => {
    const sheet = buildRouteSheet(
      input({
        screens: [],
        watchlists: [{ id: 'default', name: 'Main list', symbolCount: 0 }],
        strategies: [{ id: 'st1', name: 'Low-debt value', ruleCount: 4 }],
        newsCount: 0,
      }),
      NOW,
    )
    expect(sheet.stops.map((stop) => stop.status)).toEqual([
      'skipped',
      'skipped',
      'ready',
      'skipped',
    ])
    expect(sheet.stops[0].nextStart).toBeNull()
    expect(sheet.stops[1].nextStart).toBeNull()
    expect(sheet.stops[2].nextStart).toBe(sheet.nextStart)
    expect(sheet.stops[3].nextStart).toBeNull()
    expect(sheet.activeCount).toBe(1)
    expect(sheet.skippedCount).toBe(3)
    expect(sheet.finishAt).toBe(sheet.nextStart + SLOT)
  })

  it('caps each saved kind at three stops', () => {
    const sheet = buildRouteSheet(
      input({
        screens: Array.from({ length: 5 }, (_, i) => ({
          id: `s${i}`,
          name: `Screen ${i}`,
          ruleCount: 1,
        })),
        watchlists: [],
        strategies: Array.from({ length: 5 }, (_, i) => ({
          id: `st${i}`,
          name: `Strategy ${i}`,
          ruleCount: 1,
        })),
      }),
      NOW,
    )
    expect(sheet.stops.filter((stop) => stop.kind === 'screen')).toHaveLength(3)
    expect(sheet.stops.filter((stop) => stop.kind === 'strategy')).toHaveLength(3)
    expect(sheet.stops.filter((stop) => stop.kind === 'watchlist')).toHaveLength(1)
  })
})
