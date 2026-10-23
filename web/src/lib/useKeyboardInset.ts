import { useEffect, useState } from 'react'
import { useOnline } from './useOnline'

/**
 * How much of the viewport the on-screen keyboard covers. iOS keeps
 * `window.innerHeight` fixed while `visualViewport` shrinks, so a fixed
 * composer would otherwise sit under the keyboard.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      // Browser chrome also shrinks the viewport by a few pixels; only a real
      // keyboard is worth moving the composer for.
      setInset(covered > 80 ? Math.round(covered) : 0)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}

export { useOnline }
