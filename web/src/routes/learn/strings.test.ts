import { describe, expect, it } from 'vitest'
import { isUnlocked } from '../../store/learn'
import { termRoutes, terms } from './strings'

describe('glossary data', () => {
  it('names the same terms in every language, once each', () => {
    const zh = terms.zh.map((term) => term.id)
    expect(new Set(zh).size).toBe(zh.length)
    expect(terms.en.map((term) => term.id)).toEqual(zh)
    expect(terms.ar.map((term) => term.id)).toEqual(zh)
  })

  it('gives every term an unlock rule', () => {
    for (const term of terms.zh) {
      expect(termRoutes[term.id]).toBeDefined()
    }
  })

  it('keeps the two basic terms readable before any screen is seen', () => {
    const basic = terms.en.filter((term) => isUnlocked(termRoutes[term.id], []))
    expect(basic.map((term) => term.id)).toEqual(['pe', 'yield'])
  })
})
