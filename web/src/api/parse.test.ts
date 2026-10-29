import { describe, expect, it } from 'vitest'
import { AiApiError } from './errors'
import { parsePositions } from '../lib/positions'
import { parseMessageList, parsePaperAccount, parseRunPreview, parseSessionList } from './parse'

describe('positions', () => {
  it('reads every key spelling the paper API has used, and dedupes', () => {
    const read = parsePositions([
      { symbol: '2222', quantity: 40 },
      { code: '1120', qty: 12 },
      { ticker: '2010' },
      '0700',
      { symbol: '2222', quantity: 99 },
      { note: 'no symbol' },
    ])
    expect(read.positions).toEqual([
      { symbol: '2222', quantity: 40 },
      { symbol: '1120', quantity: 12 },
      { symbol: '2010', quantity: 0 },
      { symbol: '0700', quantity: 0 },
    ])
    expect(read.unreadable).toBe(1)
  })

  it('reads a missing list as empty rather than throwing', () => {
    expect(parsePositions(null)).toEqual({ positions: [], unreadable: 0 })
  })
})

describe('run preview', () => {
  it('drops numbers that are not finite and points without equity', () => {
    const preview = parseRunPreview({
      metrics: { sharpe: 1.2, max_drawdown: null, win_rate: Number.NaN },
      equity_curve: [
        { date: '2026-01-02', equity: '1,010.5' },
        { date: '2026-01-03', equity: null },
        { equity: 1020 },
      ],
      report_worthy: 'yes',
    })
    expect(preview.metrics).toEqual({ sharpe: 1.2 })
    expect(preview.equity_curve).toHaveLength(2)
    expect(preview.equity_curve[0]).toEqual({ date: '2026-01-02', equity: 1010.5 })
    expect(preview.report_worthy).toBe(false)
  })

  it('never reports an empty metric block as an object', () => {
    expect(parseRunPreview({ metrics: {}, equity_curve: [] }).metrics).toBeNull()
  })
})

describe('messages', () => {
  it('drops a role this build cannot render', () => {
    const list = parseMessageList([
      { message_id: 'm1', role: 'user', content: 'hi' },
      { message_id: 'm2', role: 'tool', content: 'internal' },
      { message_id: 'm3', role: 'assistant', content: 'ok' },
    ])
    expect(list.map((message) => message.role)).toEqual(['user', 'assistant'])
  })
})

describe('the boundary itself', () => {
  it('throws a typed error instead of handing back a wrong shape', () => {
    expect(() => parseSessionList({ nope: true })).toThrow(AiApiError)
    expect(() => parsePaperAccount({ label: 'no id' })).toThrow(AiApiError)
  })
})
