import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  format: (n: number) => string
  duration?: number
}

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Counts to the value on mount and on change; snaps when motion is reduced. */
export function AnimatedNumber({ value, format, duration = 720 }: Props) {
  // Start at the value: counting from 0 flashed 0.00 on every mount.
  const [shown, setShown] = useState(value)
  const origin = useRef(value)

  useEffect(() => {
    if (REDUCED_MOTION) {
      setShown(value)
      origin.current = value
      return
    }
    const start = performance.now()
    const from = origin.current
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from + (value - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else origin.current = value
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{format(shown)}</>
}
