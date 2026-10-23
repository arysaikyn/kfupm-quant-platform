import { beforeEach, describe, expect, it } from 'vitest'
import { loadThread, nextId, saveThread } from './thread'
import type { Thread } from './chat'

const V2 = 'app.ai.thread.v2'
const LEGACY = 'app.ai.thread'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

function thread(): Thread {
  return {
    version: 2,
    turn: 0,
    chips: [],
    msgs: [
      { id: 1, role: 'user', text: 'q1', at: 1000 },
      {
        id: 2,
        role: 'assistant',
        paras: [['a1']],
        sources: [],
        total: 1,
        shown: 1,
        at: 1100,
      },
    ],
  }
}

describe('thread storage', () => {
  it('round-trips a thread', () => {
    saveThread(thread())
    expect(loadThread()).toEqual(thread())
  })

  it('renumbers duplicate ids from the stored order', () => {
    localStorage.setItem(
      V2,
      JSON.stringify({
        version: 2,
        turn: 0,
        chips: [],
        msgs: [
          { id: 1, role: 'user', text: 'q1', at: 1000 },
          { id: 1, role: 'assistant', paras: [['a1']], sources: [], total: 1, shown: 1, at: 1100 },
          { id: 1, role: 'user', text: 'q2', at: 1200 },
        ],
      }),
    )
    expect(loadThread()?.msgs.map((m) => m.id)).toEqual([1, 2, 3])
  })

  it('migrates the legacy session thread and removes it', () => {
    sessionStorage.setItem(LEGACY, JSON.stringify({ msgs: thread().msgs, chips: [], turn: 2 }))
    const loaded = loadThread()
    expect(loaded?.turn).toBe(2)
    expect(sessionStorage.getItem(LEGACY)).toBeNull()
    expect(localStorage.getItem(V2)).not.toBeNull()
  })

  it('returns null for corrupt payloads', () => {
    localStorage.setItem(V2, '{nope')
    expect(loadThread()).toBeNull()
  })

  it('compacts restored ids and seeds the counter from the last one', () => {
    saveThread({ ...thread(), msgs: thread().msgs.map((m) => ({ ...m, id: m.id + 10 })) })
    const loaded = loadThread()
    expect(loaded).not.toBeNull()
    expect(loaded!.msgs.map((m) => m.id)).toEqual([1, 2])
    expect(nextId(loaded!.msgs)).toBe(2)
  })

  it('keeps only the newest 80 messages', () => {
    const msgs = Array.from({ length: 90 }, (_, i) => ({
      id: i + 1,
      role: 'user' as const,
      text: `q${i}`,
      at: i,
    }))
    saveThread({ ...thread(), msgs })
    expect(loadThread()?.msgs).toHaveLength(80)
  })
})
