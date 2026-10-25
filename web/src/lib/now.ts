/** One impure boundary for timestamps used in event handlers. */
export function nowMs(): number {
  return Date.now()
}
