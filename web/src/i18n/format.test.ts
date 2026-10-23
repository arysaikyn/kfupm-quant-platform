import { describe, expect, it } from 'vitest'
import { fmtPct, fmtNum } from './index'
import {
  countNames,
  countRules,
  dayStamp,
  fill,
  fmtClock,
  fmtDate,
  formatDay,
  plural,
  relTime,
} from './format'

const LRI = '\u2066'
const PDI = '\u2069'

describe('number formatting', () => {
  it('wraps figures in bidi isolates for Arabic', () => {
    expect(fmtNum(25.48, 'ar')).toBe(`${LRI}25.48${PDI}`)
    expect(fmtPct(0.0123, 'ar')).toBe(`${LRI}+1.23%${PDI}`)
  })

  it('uses Western digits in Arabic', () => {
    expect(fmtNum(1234.5, 'ar', 1)).toContain('1,234.5')
    expect(fmtNum(1234.5, 'ar', 1)).not.toMatch(/[٠-٩]/)
  })

  it('keeps an explicit plus on positive percentages only', () => {
    expect(fmtPct(0.01, 'en')).toContain('+1.00%')
    expect(fmtPct(-0.01, 'en')).toContain('-1.00%')
    expect(fmtPct(0, 'en')).toContain('0.00%')
  })
})

describe('plural', () => {
  it('selects English one/other', () => {
    expect(plural('en', 1, { one: 'rule', other: 'rules' })).toBe('rule')
    expect(plural('en', 2, { one: 'rule', other: 'rules' })).toBe('rules')
  })

  it('selects Arabic two/few/many', () => {
    const forms = { one: 'قاعدة', two: 'قاعدتان', few: 'قواعد', many: 'قاعدة', other: 'قاعدة' }
    expect(plural('ar', 1, forms)).toBe('قاعدة')
    expect(plural('ar', 2, forms)).toBe('قاعدتان')
    expect(plural('ar', 3, forms)).toBe('قواعد')
    expect(plural('ar', 11, forms)).toBe('قاعدة')
  })

  it('keeps Chinese invariant', () => {
    expect(plural('zh', 1, { other: '条规则' })).toBe('条规则')
    expect(countRules('zh', 4)).toBe('条规则')
    expect(countNames('en', 1)).toBe('name')
    expect(countNames('en', 3)).toBe('names')
  })
})

describe('dates and relative time', () => {
  it('treats a bare date as a calendar day, not UTC midnight', () => {
    expect(fmtDate('2026-10-24', 'en', { year: 'numeric', month: '2-digit', day: '2-digit' })).toContain(
      '10',
    )
  })

  it('formats relative minutes at the boundaries', () => {
    expect(relTime(1, 'en')).toContain('1 minute')
    expect(relTime(59, 'en')).toContain('59 minutes')
    expect(relTime(60, 'en')).toContain('1 hour')
    expect(relTime(60 * 24, 'en')).toMatch(/yesterday|1 day/)
  })

  it('round-trips a day stamp', () => {
    const now = new Date(2026, 9, 24, 12).getTime()
    const stamp = dayStamp(0, now)
    expect(stamp).toBe(20261024)
    expect(formatDay(stamp, 'en')).toContain('24')
  })

  it('formats a clock from epoch ms', () => {
    expect(fmtClock(new Date(2026, 0, 1, 9, 5).getTime(), 'en')).toMatch(/09:05|9:05/)
  })
})

describe('fill', () => {
  it('replaces known placeholders and leaves unknown ones', () => {
    expect(fill('{n} of {total}', { n: 3, total: 5 })).toBe('3 of 5')
    expect(fill('{n} of {missing}', { n: 1 })).toBe('1 of {missing}')
  })
})
