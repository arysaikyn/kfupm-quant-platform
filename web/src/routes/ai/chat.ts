import type { Lang } from '../../i18n'

export type CtxRef =
  | { kind: 'quote'; symbol: string }
  | { kind: 'sector'; id: string }
  | { kind: 'news'; id: string }
  | { kind: 'strategy'; id: string }

export type SourceRef = { label: string; href?: string }

export type Artifact = {
  title: string
  symbols: string[]
  /** The rule in one line, read-only. */
  rule: string
  preset: 'value' | 'momentum' | 'calm'
}

type UserMsg = { id: number; role: 'user'; text: string; at: number }

export type AssistantMsg = {
  id: number
  role: 'assistant'
  /** Paragraphs pre-split into animation tokens. */
  paras: string[][]
  sources: SourceRef[]
  artifact?: Artifact
  total: number
  shown: number
  at: number
  evidenceSymbol?: string
}

export type ErrorMsg = { id: number; role: 'error'; text: string; at: number }

export type Msg = UserMsg | AssistantMsg | ErrorMsg

export type Thread = {
  version: 2
  msgs: Msg[]
  chips: CtxRef[]
  turn: number
}

/** Market colour follows the locale, so the token decides, not a hex value. */
export const toneOf = (v: number) => (v >= 0 ? 'text-up' : 'text-down')

/** Chinese streams per character; spaced scripts stream per word. */
export function tokenize(text: string, lang: Lang): string[] {
  return lang === 'zh' ? Array.from(text) : (text.match(/\S+\s*/g) ?? [])
}

export function visibleParas(paras: string[][], shown: number): string[] {
  let left = shown
  return paras.map((tokens) => {
    const take = Math.max(0, Math.min(tokens.length, left))
    left -= tokens.length
    return tokens.slice(0, take).join('')
  })
}

export function maxMsgId(msgs: readonly Msg[]): number {
  return msgs.reduce((max, m) => (Number.isFinite(m.id) && m.id > max ? m.id : max), 0)
}

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
