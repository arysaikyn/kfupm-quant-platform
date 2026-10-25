import { describe, expect, it } from 'vitest'
import { messagesFromHistory, reduceAgentEvent, toolLabel } from './remote'

const start = { attempt_id: 'a1', started_at: 100 }

describe('agent stream reducer', () => {
  it('streams text, tools and the final summary', () => {
    let state = reduceAgentEvent(null, 'attempt.started', start)
    expect(state.live?.status).toBe('thinking')

    state = reduceAgentEvent(state.live, 'text_delta', { delta: 'Hello' })
    expect(state.live?.text).toBe('Hello')
    expect(state.live?.status).toBe('answering')

    state = reduceAgentEvent(state.live, 'tool_call', {
      tool: 'get_market_data',
      call_id: 'c1',
      arguments: { symbol: 'AAPL' },
    })
    expect(state.live?.tools).toHaveLength(1)
    expect(state.live?.tools[0].status).toBe('running')

    state = reduceAgentEvent(state.live, 'tool_result', {
      tool: 'get_market_data',
      call_id: 'c1',
      status: 'ok',
      preview: '{"rows":10}',
      elapsed_ms: 1200,
    })
    expect(state.live?.tools[0].status).toBe('ok')
    expect(state.live?.tools[0].elapsedMs).toBe(1200)

    state = reduceAgentEvent(state.live, 'attempt.completed', {
      attempt_id: 'a1',
      summary: 'Final answer',
      elapsed_ms: 2500,
      model: 'GLM-4.5-Flash',
      run_dir: '/tmp/runs/run_1',
    })
    expect(state.live).toBeNull()
    expect(state.completed).toMatchObject({
      text: 'Final answer',
      status: 'done',
      model: 'GLM-4.5-Flash',
      runId: 'run_1',
    })
    expect(state.completed?.tools).toHaveLength(1)
  })

  it('turns a failed attempt into an error turn', () => {
    const live = reduceAgentEvent(null, 'attempt.started', start).live
    const state = reduceAgentEvent(live, 'attempt.failed', {
      attempt_id: 'a1',
      summary: 'provider error',
    })
    expect(state.completed?.status).toBe('failed')
    expect(state.completed?.error).toBe('provider error')
  })

  it('accepts a terminal event when no live turn is held', () => {
    const state = reduceAgentEvent(null, 'attempt.completed', {
      attempt_id: 'a9',
      summary: 'Late answer',
      model: 'm',
    })
    expect(state.live).toBeNull()
    expect(state.completed?.text).toBe('Late answer')
    expect(state.completed?.status).toBe('done')
  })

  it('resets when a new attempt starts', () => {
    const live = reduceAgentEvent(null, 'attempt.started', start).live
    const next = reduceAgentEvent(live, 'attempt.started', {
      attempt_id: 'a2',
      started_at: 200,
    })
    expect(next.live?.attemptId).toBe('a2')
    expect(next.live?.text).toBe('')
  })
})

describe('history mapping', () => {
  it('keeps user and assistant messages and skips system rows', () => {
    const mapped = messagesFromHistory([
      {
        message_id: 'm1',
        session_id: 's1',
        role: 'user',
        content: 'hello',
        created_at: '2026-10-25T10:00:00Z',
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
      {
        message_id: 'm2',
        session_id: 's1',
        role: 'assistant',
        content: '**hi**',
        created_at: '2026-10-25T10:00:01Z',
        linked_attempt_id: 'a1',
        metadata: null,
        tool_trail: null,
      },
      {
        message_id: 'm3',
        session_id: 's1',
        role: 'system',
        content: 'hidden',
        created_at: '2026-10-25T10:00:02Z',
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
    ])
    expect(mapped.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(mapped[1].text).toBe('**hi**')
  })

  it('strips the context preamble from a stored user message', () => {
    const mapped = messagesFromHistory([
      {
        message_id: 'm1',
        session_id: 's1',
        role: 'user',
        content: 'App context selected by the user:\n- Stock 2222 Saudi Aramco\n\nWhat moved?',
        created_at: '2026-10-25T10:00:00Z',
        linked_attempt_id: null,
        metadata: null,
        tool_trail: null,
      },
    ])
    expect(mapped[0].text).toBe('What moved?')
  })

  it('humanises tool ids', () => {
    expect(toolLabel('get_market_data')).toBe('Get Market Data')
  })
})
