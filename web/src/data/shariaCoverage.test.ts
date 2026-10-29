import { describe, expect, it } from 'vitest'
import { shariaVerdict } from './shariaCoverage'

/**
 * The verdict is a filter before ranking, so its precedence is a product rule:
 * an unproven name is not condemned, and a breach names at least one field.
 */
describe('sharia verdict', () => {
  it('calls a name with every ratio under the cap compliant, with no reasons', () => {
    const verdict = shariaVerdict('1120', 60.15)
    expect(verdict.status).toBe('compliant')
    expect(verdict.failed).toEqual([])
    expect(verdict.missing).toEqual([])
  })

  it('names the first breached field when the data is complete', () => {
    const verdict = shariaVerdict('600519', 1313.29)
    expect(verdict.status).toBe('non-compliant')
    expect(verdict.failed.length).toBeGreaterThan(0)
    expect(verdict.missing).toEqual([])
    expect(verdict.failed[0]?.field).toBe('debt')
    expect(verdict.failed[0]?.limit).toBe(0.3)
  })

  it('leaves a name unproven when a published ratio is missing, even without a breach', () => {
    const verdict = shariaVerdict('2010', 72.4)
    expect(verdict.status).toBe('unclassified')
    expect(verdict.missing.length).toBeGreaterThan(0)
  })
})
