import { describe, expect, it } from 'vitest'
import type { MessageItem } from '../api/ai'
import { classifyRefusal, receiptsFromMessages, receiptFor } from './refusal'

describe('refusal classification', () => {
  it('flags a personal buy call as advice', () => {
    const hit = classifyRefusal('Should I buy Saudi Aramco now?')
    expect(hit?.rule).toBe('advice')
    expect(hit?.trigger.toLowerCase()).toContain('should i buy')
  })

  it('flags a concrete order as execution', () => {
    const hit = classifyRefusal('Buy 100 shares of Aramco.')
    expect(hit?.rule).toBe('execution')
    expect(hit?.trigger.toLowerCase()).toContain('buy 100 shares')
  })

  it('flags a promise of returns as a guarantee', () => {
    expect(classifyRefusal('Can you guarantee 12% a year?')?.rule).toBe('guarantee')
    expect(classifyRefusal('Is this risk-free?')?.rule).toBe('guarantee')
  })

  it('flags Chinese and Arabic requests', () => {
    expect(classifyRefusal('帮我买入 100 股阿美')?.rule).toBe('execution')
    expect(classifyRefusal('这只股票能买吗？')?.rule).toBe('advice')
    expect(classifyRefusal('هل أشتري أرامكو الآن؟')?.rule).toBe('advice')
    expect(classifyRefusal('هل العائد مضمون؟')?.rule).toBe('guarantee')
  })

  it('does not flag a denial in an answer', () => {
    expect(classifyRefusal('No return is guaranteed.', 'assistant')).toBeNull()
    expect(classifyRefusal('Guaranteed returns do not exist.', 'assistant')).toBeNull()
    expect(classifyRefusal('Returns are not guaranteed.', 'assistant')).toBeNull()
  })

  it('does not flag neutral research questions', () => {
    expect(classifyRefusal('What was the max drawdown of this rule?')).toBeNull()
    expect(classifyRefusal('Explain why Aramco moved today.')).toBeNull()
  })

  it('still flags an advice request that opens with uncertainty', () => {
    expect(classifyRefusal("I don't know, should I buy?")?.rule).toBe('advice')
  })

  it('names the trigger and carries role and time', () => {
    const receipt = receiptFor('Should we sell now?', 'assistant', 1_700_000_000_000)
    expect(receipt).toMatchObject({
      rule: 'advice',
      role: 'assistant',
      at: 1_700_000_000_000,
    })
    expect(receipt?.trigger.length).toBeGreaterThan(0)
  })
})

describe('receipts from persisted messages', () => {
  it('ignores the app-context preamble and keeps both roles', () => {
    const at = new Date('2026-10-25T09:00:00Z').toISOString()
    const items: MessageItem[] = [
      {
        message_id: 'm1',
        session_id: 's1',
        role: 'user',
        content: 'App context selected by the user:\n- Stock 2222 Aramco\n\nShould I buy?',
        created_at: at,
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
      {
        message_id: 'm2',
        session_id: 's1',
        role: 'assistant',
        content: 'You should buy it now.',
        created_at: at,
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
      {
        message_id: 'm3',
        session_id: 's1',
        role: 'assistant',
        content: 'The screen keeps debt under 30%.',
        created_at: at,
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
    ]
    const receipts = receiptsFromMessages(items)
    expect(receipts).toHaveLength(2)
    expect(receipts.map((item) => item.role)).toEqual(['user', 'assistant'])
    expect(receipts[0].trigger).toBe('Should I buy')
  })
})
