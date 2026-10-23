import { describe, expect, it } from 'vitest'
import { safeNext } from './next'

describe('safeNext', () => {
  it('accepts local paths', () => {
    expect(safeNext('/m/2222?x=1')).toBe('/m/2222?x=1')
  })

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeNext('https://evil.example')).toBe('/')
    expect(safeNext('//evil.example')).toBe('/')
    expect(safeNext(null)).toBe('/')
  })
})
