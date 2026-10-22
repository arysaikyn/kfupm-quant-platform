/**
 * Carries a question from another screen into the AI tab.
 * A long press on a row writes one here and navigates; the AI page drains it
 * on mount and sends it, so the user lands on an answer instead of a form.
 */
const KEY = 'app.ai.intake'

export function setIntake(prompt: string): void {
  try {
    sessionStorage.setItem(KEY, prompt)
  } catch {
    // Private browsing: the long press still navigates, the prompt is lost.
  }
}

export function takeIntake(): string | null {
  try {
    const value = sessionStorage.getItem(KEY)
    if (value) sessionStorage.removeItem(KEY)
    return value
  } catch {
    return null
  }
}
