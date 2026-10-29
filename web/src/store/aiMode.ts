import { useSyncExternalStore } from 'react'
import { currentMode, currentProvider, subscribeAiMode } from '../lib/aiMode'

/** React binding for `lib/aiMode`: the state and its persistence live there. */

export function useAiMode() {
  return useSyncExternalStore(subscribeAiMode, currentMode, currentMode)
}

export function useProviderMeta() {
  return useSyncExternalStore(subscribeAiMode, currentProvider, currentProvider)
}
