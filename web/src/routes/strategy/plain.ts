import type { Lang } from '../../i18n'
import type { L10n, Strategy } from '../../data/mock'

/**
 * ELI10 copy. The switch rewrites prose only: every figure is read from the
 * same variables as the plain view, so turning it on cannot move a number.
 * Summaries are written per strategy because a template would either lie or
 * read like a template; anything without one falls back to a generic sentence.
 */
const PLAIN_SUMMARY: Record<string, L10n> = {
  'low-debt-value': {
    zh: '大白话：专挑赚钱多、股价相对不贵、又不太借钱的公司，而且先过教法筛选。',
    en: 'In everyday words: pick companies that earn well for their share price, borrow little, and pass the Sharia screen first.',
    ar: 'ببساطة: اختر شركات تربح جيدًا مقابل سعر سهمها، وتقترض قليلًا، وتجتاز الفحص الشرعي أولًا.',
  },
  'dividend-growers': {
    zh: '大白话：找分红大方、而且分红一年比一年多的公司。',
    en: 'In everyday words: look for companies that pay a decent dividend and raise it year after year.',
    ar: 'ببساطة: ابحث عن شركات توزّع أرباحًا جيدة وترفعها سنة بعد سنة.',
  },
  'momentum-quality': {
    zh: '大白话：买最近涨得好、而且真的赚钱的公司，不只买「涨得凶」的。',
    en: 'In everyday words: buy what has been rising, but only if the business is genuinely profitable.',
    ar: 'ببساطة: اشترِ ما يرتفع سعره، لكن فقط إذا كان العمل مربحًا فعلًا.',
  },
}

export function plainSummaryOf(strategy: Strategy, lang: Lang, fallback: string): string {
  return PLAIN_SUMMARY[strategy.id]?.[lang] ?? fallback
}

export type DiffRow = {
  id: string
  kind: 'changed' | 'added' | 'removed'
  label: L10n
  from?: string
  to?: string
}

/**
 * Rule-by-rule diff between what a strategy was and what a revival would run.
 * A revive button that silently restores a rule is exactly the failure this
 * table exists to prevent, so the diff is the deliverable, not a preview.
 */
export function diffRules(
  before: { id: string; label: L10n; value: string }[],
  after: { id: string; label: L10n; value: string }[],
): DiffRow[] {
  const rows: DiffRow[] = []
  for (const rule of after) {
    const old = before.find((item) => item.id === rule.id)
    if (!old) {
      rows.push({ id: rule.id, kind: 'added', label: rule.label, to: rule.value })
      continue
    }
    if (old.value !== rule.value) {
      rows.push({
        id: rule.id,
        kind: 'changed',
        label: rule.label,
        from: old.value,
        to: rule.value,
      })
    }
  }
  for (const rule of before) {
    if (after.every((item) => item.id !== rule.id)) {
      rows.push({ id: rule.id, kind: 'removed', label: rule.label, from: rule.value })
    }
  }
  return rows
}
