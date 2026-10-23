import { maxMsgId } from './chat'
import type { CtxRef, Msg, Thread } from './chat'

/**
 * The thread lives in localStorage: "History" is a promise that survives a tab
 * close. Version 2 fixes the old id counter, which restarted at 0 on every
 * mount and let a new answer overwrite an old one.
 */
const KEY = 'app.ai.thread.v2'
const LEGACY_SESSION_KEY = 'app.ai.thread'
const MAX_MSGS = 80

type RawChip = { kind?: unknown; symbol?: unknown; id?: unknown }
type RawMsg = {
  id?: unknown
  role?: unknown
  at?: unknown
  text?: unknown
  paras?: unknown
  sources?: unknown
  total?: unknown
  shown?: unknown
}
type RawThread = { msgs?: unknown; chips?: unknown; turn?: unknown }

function isChip(value: unknown): value is CtxRef {
  if (typeof value !== 'object' || value === null) return false
  const chip = value as RawChip
  if (chip.kind === 'quote') return typeof chip.symbol === 'string'
  if (chip.kind === 'sector' || chip.kind === 'news' || chip.kind === 'strategy') {
    return typeof chip.id === 'string'
  }
  return false
}

function isMsg(value: unknown): value is Msg {
  if (typeof value !== 'object' || value === null) return false
  const m = value as RawMsg
  if (typeof m.id !== 'number' || !Number.isFinite(m.id)) return false
  if (typeof m.at !== 'number' || !Number.isFinite(m.at)) return false
  if (m.role === 'user' || m.role === 'error') return typeof m.text === 'string'
  if (m.role !== 'assistant') return false
  return (
    Array.isArray(m.paras) &&
    Array.isArray(m.sources) &&
    typeof m.total === 'number' &&
    typeof m.shown === 'number'
  )
}

/**
 * Legacy threads can contain duplicate ids (the old bug). Renumbering from the
 * order of the list is deterministic and makes every id unique again.
 */
function normalize(raw: unknown): Thread | null {
  if (typeof raw !== 'object' || raw === null) return null
  const thread = raw as RawThread
  if (!Array.isArray(thread.msgs)) return null
  const now = Date.now()
  const source = thread.msgs
  const msgs = source
    .filter(isMsg)
    .slice(-MAX_MSGS)
    .map((m, index) => ({ ...m, id: index + 1, at: m.at || now - (source.length - index) * 60_000 }))
  const chips = Array.isArray(thread.chips) ? thread.chips.filter(isChip) : []
  const turn = typeof thread.turn === 'number' && thread.turn >= 0 ? thread.turn : 0
  return { version: 2, msgs, chips, turn }
}

export function emptyThread(): Thread {
  return { version: 2, msgs: [], chips: [], turn: 0 }
}

export function loadThread(): Thread | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = normalize(JSON.parse(raw))
      if (parsed) return parsed
    }
  } catch {
    // Corrupt payload: fall through to a fresh thread.
  }
  try {
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY)
    if (!legacy) return null
    const parsed = normalize(JSON.parse(legacy))
    if (!parsed) return null
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
    saveThread(parsed)
    return parsed
  } catch {
    return null
  }
}

export function saveThread(thread: Thread): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...thread, version: 2, msgs: thread.msgs.slice(-MAX_MSGS) }),
    )
  } catch {
    // Private browsing or a full quota: losing history is acceptable.
  }
}

export function clearThread(): void {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // Nothing to clear in private browsing.
  }
}

/** The next id must never collide with a restored message. */
export function nextId(msgs: readonly Msg[]): number {
  // Seed for a pre-increment counter: the next message is max + 1.
  return maxMsgId(msgs)
}
