import { useCallback, useRef } from 'react'

type Options = {
  /** Held this long with little movement to count as a long press. */
  ms?: number
  /** Movement beyond this cancels: a scroll must never fire it. */
  slop?: number
}

/**
 * Touch-and-hold that coexists with scrolling. Returns pointer handlers and a
 * callback to cancel when the gesture turns into a scroll.
 */
export function useLongPress(onLongPress: () => void, { ms = 480, slop = 10 }: Options = {}) {
  const timer = useRef(0)
  const origin = useRef<{ x: number; y: number } | null>(null)

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current)
    origin.current = null
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return
      origin.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        if (!origin.current) return
        origin.current = null
        onLongPress()
      }, ms)
    },
    [ms, onLongPress],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = origin.current
      if (!start) return
      if (Math.abs(e.clientX - start.x) > slop || Math.abs(e.clientY - start.y) > slop) cancel()
    },
    [cancel, slop],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}
