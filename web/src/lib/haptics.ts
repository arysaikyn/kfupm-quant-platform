/** A short tap answer where the platform supports it; silent elsewhere. */
export function haptic(ms = 8): void {
  if (typeof navigator === 'undefined') return
  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches) return
  navigator.vibrate?.(ms)
}
