export type CtxRef =
  | { kind: 'quote'; symbol: string }
  | { kind: 'sector'; id: string }
  | { kind: 'news'; id: string }
  | { kind: 'strategy'; id: string }

/** Market colour follows the locale, so the token decides, not a hex value. */
export const toneOf = (v: number) => (v >= 0 ? 'text-up' : 'text-down')

export function sameChip(a: CtxRef, b: CtxRef): boolean {
  if (a.kind === 'quote' && b.kind === 'quote') return a.symbol === b.symbol
  if (a.kind === 'sector' && b.kind === 'sector') return a.id === b.id
  if (a.kind === 'news' && b.kind === 'news') return a.id === b.id
  if (a.kind === 'strategy' && b.kind === 'strategy') return a.id === b.id
  return false
}

/** Merge without duplicates; the newest context sits at the end. */
export function mergeChips(current: readonly CtxRef[], add: readonly CtxRef[], max = 6): CtxRef[] {
  const out = [...current]
  for (const ref of add) {
    if (!out.some((c) => sameChip(c, ref))) out.push(ref)
  }
  return out.slice(0, max)
}
