import { describe, expect, it } from 'vitest'
import { isUnlocked, markRouteSeen, nextUnlock, routeKeyOf } from './learn'

describe('routeKeyOf', () => {
  it('reduces the root and a stock page to the market tab', () => {
    expect(routeKeyOf('/')).toBe('/market')
    expect(routeKeyOf('/m/2222')).toBe('/market')
  })

  it('keeps the family of a detail route', () => {
    expect(routeKeyOf('/strategy/s1')).toBe('/strategy')
    expect(routeKeyOf('/report/2026')).toBe('/report')
    expect(routeKeyOf('/sector/tech')).toBe('/sector')
    expect(routeKeyOf('/learn')).toBe('/learn')
  })
})

describe('unlock selection', () => {
  it('treats a term with no route as basic', () => {
    expect(isUnlocked([], [])).toBe(true)
    expect(nextUnlock([], [])).toBeNull()
  })

  it('stays locked until one of its screens was seen', () => {
    expect(isUnlocked(['/screener'], [])).toBe(false)
    expect(isUnlocked(['/screener'], ['/learn'])).toBe(false)
    expect(isUnlocked(['/screener', '/sector'], ['/sector'])).toBe(true)
  })

  it('deep-links to the first screen that unlocks the term', () => {
    expect(nextUnlock(['/report', '/compare'], [])).toBe('/report')
    expect(nextUnlock(['/report', '/compare'], ['/compare'])).toBeNull()
  })
})

describe('markRouteSeen', () => {
  it('reports the first visit only and persists the screen', () => {
    expect(markRouteSeen('/compare/x')).toBe(true)
    expect(markRouteSeen('/compare')).toBe(false)
    expect(JSON.parse(localStorage.getItem('learn.seen.v1') ?? '[]')).toEqual(['/compare'])
  })
})
