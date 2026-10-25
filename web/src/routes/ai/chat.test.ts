import { beforeEach, describe, expect, it } from 'vitest'
import { mergeChips } from './chat'
import type { CtxRef } from './chat'
import { setIntake, takeIntake } from './intake'

beforeEach(() => {
  sessionStorage.clear()
})

describe('chat helpers', () => {
  it('deduplicates chips by kind and id', () => {
    const a: CtxRef = { kind: 'quote', symbol: '2222' }
    const b: CtxRef = { kind: 'quote', symbol: '2010' }
    expect(mergeChips([a], [a, b])).toEqual([a, b])
  })

  it('caps the chip tray', () => {
    const chips: CtxRef[] = Array.from({ length: 8 }, (_, i) => ({
      kind: 'quote' as const,
      symbol: String(i),
    }))
    expect(mergeChips([], chips, 6)).toHaveLength(6)
  })

})

describe('intake', () => {
  it('carries a prompt and context', () => {
    setIntake('Explain this', [{ kind: 'news', id: 'n1' }])
    expect(takeIntake()).toEqual({ prompt: 'Explain this', chips: [{ kind: 'news', id: 'n1' }] })
    expect(takeIntake()).toBeNull()
  })

  it('accepts the legacy bare-string format', () => {
    sessionStorage.setItem('app.ai.intake', 'old prompt')
    expect(takeIntake()).toEqual({ prompt: 'old prompt', chips: [] })
  })
})
