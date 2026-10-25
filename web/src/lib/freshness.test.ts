import { describe, expect, it } from 'vitest'
import { DATA_AS_OF, MAX_DATA_AGE_DAYS, dataAgeDays, isDataStale } from './freshness'

const asOf = Date.parse(DATA_AS_OF)
const day = 86_400_000

describe('demo data freshness', () => {
  it('is fresh at the snapshot instant', () => {
    expect(dataAgeDays(asOf)).toBe(0)
    expect(isDataStale(asOf)).toBe(false)
  })

  it('refuses only after the stated window', () => {
    expect(isDataStale(asOf + MAX_DATA_AGE_DAYS * day)).toBe(false)
    expect(isDataStale(asOf + (MAX_DATA_AGE_DAYS + 0.1) * day)).toBe(true)
  })
})
