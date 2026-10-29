import type { CtxRef } from '../lib/chips'

/**
 * Carries a question and its context from another screen into the AI tab.
 * A long press on a row, or an explicit "ask" button, writes one here and
 * navigates; the AI page drains it on mount.
 */
export type Intake = { prompt: string; chips: CtxRef[] }

const KEY = 'app.ai.intake'

export function setIntake(prompt: string, chips: CtxRef[] = []): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ prompt, chips }))
  } catch {
    // Private browsing: the handoff still navigates, the prompt is lost.
  }
}

export function takeIntake(): Intake | null {
  try {
    const value = sessionStorage.getItem(KEY)
    if (!value) return null
    sessionStorage.removeItem(KEY)
    // Older builds stored a bare string.
    if (value.trim().startsWith('{')) {
      const parsed = JSON.parse(value) as Intake
      return { prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '', chips: Array.isArray(parsed.chips) ? parsed.chips : [] }
    }
    return { prompt: value, chips: [] }
  } catch {
    return null
  }
}
