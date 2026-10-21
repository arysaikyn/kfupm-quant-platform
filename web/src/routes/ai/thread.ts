import type { CtxRef, Msg } from './chat'

/**
 * The thread lives in sessionStorage so switching tabs, or coming back from a
 * symbol page, does not wipe a conversation the user just had.
 */
export type Thread = { msgs: Msg[]; chips: CtxRef[]; turn: number }

const KEY = 'app.ai.thread'

export function loadThread(): Thread | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Thread
    if (!Array.isArray(parsed.msgs) || !Array.isArray(parsed.chips)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveThread(thread: Thread): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(thread))
  } catch {
    // Private browsing or a full quota: losing history is acceptable.
  }
}
