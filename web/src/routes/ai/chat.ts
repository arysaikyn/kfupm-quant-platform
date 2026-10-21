import type { Lang } from '../../i18n'

export type CtxRef = { kind: 'quote'; symbol: string } | { kind: 'sector'; id: string }

type UserMsg = { id: number; role: 'user'; text: string }

export type AssistantMsg = {
  id: number
  role: 'assistant'
  /** Paragraphs pre-split into animation tokens. */
  paras: string[][]
  sources: string[]
  artifactTitle?: string
  total: number
  shown: number
}

export type Msg = UserMsg | AssistantMsg

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
