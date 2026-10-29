import { useSyncExternalStore } from 'react'
import { BOARD_IDS, isBoard } from '../data/markets'
import type { Board } from '../data/markets'


export type PrefsState = {
  /** True once the welcome screens have been completed on this device. */
  onboarded: boolean
  /** The market picked on the last step; the default board after that. */
  market: Board
}

const KEY = 'app.prefs'

function load(): PrefsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrefsState>
      // Anything malformed falls back to the first run instead of locking the
      // user out of the app behind a half-written record.
      if (typeof parsed.onboarded === 'boolean' && isBoard(parsed.market)) {
        return { onboarded: parsed.onboarded, market: parsed.market }
      }
    }
  } catch {
    // Private browsing: start at the welcome screens, keep working in memory.
  }
  return { onboarded: false, market: BOARD_IDS[0] ?? 'sa' }
}

let state: PrefsState = load()
const listeners = new Set<() => void>()

function set(next: PrefsState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Persistence is best-effort; the session still works.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function usePrefs(): PrefsState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function completeOnboarding(market: Board) {
  set({ onboarded: true, market })
}

/** The board's market switch writes the same field onboarding sets. */
export function setMarket(market: Board) {
  set({ ...state, market })
}

/** Replays the welcome screens. The market is kept for the app default, but step 4 asks again. */
export function resetOnboarding() {
  set({ onboarded: false, market: state.market })
}
