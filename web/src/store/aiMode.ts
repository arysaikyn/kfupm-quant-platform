import { useSyncExternalStore } from 'react'

export type AiMode = 'demo' | 'live'

const MODE_KEY = 'app.ai.mode'
const PROVIDER_KEY = 'app.ai.provider'

export type ProviderMeta = { baseUrl: string; model: string }

function readMode(): AiMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'live' ? 'live' : 'demo'
  } catch {
    return 'demo'
  }
}

function readProvider(): ProviderMeta {
  try {
    const raw = localStorage.getItem(PROVIDER_KEY)
    if (!raw) return { baseUrl: '', model: '' }
    const parsed = JSON.parse(raw) as Partial<ProviderMeta>
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    }
  } catch {
    return { baseUrl: '', model: '' }
  }
}

let mode: AiMode = readMode()
let provider: ProviderMeta = readProvider()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function setAiMode(next: AiMode) {
  mode = next
  try {
    localStorage.setItem(MODE_KEY, next)
  } catch {
    // Private browsing: the session still uses the in-memory mode.
  }
  notify()
}

export function saveProviderMeta(next: ProviderMeta) {
  provider = next
  try {
    localStorage.setItem(PROVIDER_KEY, JSON.stringify(next))
  } catch {
    // Best effort only.
  }
  notify()
}

export function useAiMode() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => mode,
    () => mode,
  )
}

export function useProviderMeta() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => provider,
    () => provider,
  )
}

/** Called by the transport on every request; demo mode must never hit the backend. */
export function isDemoMode() {
  return mode === 'demo'
}
