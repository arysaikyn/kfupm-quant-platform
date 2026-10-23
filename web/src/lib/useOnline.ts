import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function snapshot(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

/** Network reachability as a store, so any screen can read it. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}
