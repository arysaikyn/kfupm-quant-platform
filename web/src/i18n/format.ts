import type { Lang } from './index'

/**
 * One place for dates, counts and relative time. Screens used to carry their
 * own Intl tags; a wrong tag in one file is a silent inconsistency.
 */
const LOCALE: Record<Lang, string> = {
  zh: 'zh',
  en: 'en',
  ar: 'ar-u-nu-latn-ca-gregory',
}

export function localeOf(lang: Lang): string {
  return LOCALE[lang]
}

function asDate(value: string | Date | number): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') return Number.isFinite(value) ? new Date(value) : null
  // A bare yyyy-mm-dd is a calendar date, not UTC midnight.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function fmtDate(
  value: string | Date | number,
  lang: Lang,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const date = asDate(value)
  if (!date) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat(LOCALE[lang], options).format(date)
}

export function fmtDateTime(value: string | Date | number, lang: Lang): string {
  return fmtDate(value, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtClock(value: string | Date | number, lang: Lang): string {
  return fmtDate(value, lang, { hour: '2-digit', minute: '2-digit' })
}

/** "18 minutes ago" / "قبل 18 دقيقة" — never hand-written suffixes. */
export function relTime(minutesAgo: number, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' })
  const m = Math.max(1, Math.round(minutesAgo))
  if (m < 60) return rtf.format(-m, 'minute')
  if (m < 60 * 24) return rtf.format(-Math.round(m / 60), 'hour')
  return rtf.format(-Math.round(m / (60 * 24)), 'day')
}

/** Sortable yyyymmdd for an item published `minutesAgo` before `now`. */
export function dayStamp(minutesAgo: number, now: number): number {
  const d = new Date(now - minutesAgo * 60_000)
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

/** Weekday + date for days older than today/yesterday. */
export function formatDay(stamp: number, lang: Lang): string {
  const year = Math.floor(stamp / 10000)
  const month = (Math.floor(stamp / 100) % 100) - 1
  const day = stamp % 100
  return new Intl.DateTimeFormat(LOCALE[lang], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    calendar: 'gregory',
  }).format(new Date(year, month, day))
}

export type PluralForms = {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

/**
 * Count words per language. English needs 1/other, Arabic has six categories,
 * Chinese has one. Missing forms fall back to `other` so no screen crashes on
 * an unusual count.
 */
export function plural(lang: Lang, n: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(lang).select(n)
  return forms[category as keyof PluralForms] ?? forms.other
}

/** Replace `{name}` placeholders without a template engine. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  )
}

/** Latin text isolated from the surrounding RTL run. */
export function isolate(text: string): string {
  return `\u2066${text}\u2069`
}

/** "4 rules" / "4 条规则" / "4 قواعد" — the unit follows the count. */
export function countRules(lang: Lang, n: number): string {
  return plural(lang, n, {
    one: lang === 'ar' ? 'قاعدة' : 'rule',
    two: 'قاعدتان',
    few: 'قواعد',
    many: 'قاعدة',
    other: lang === 'zh' ? '条规则' : lang === 'ar' ? 'قاعدة' : 'rules',
  })
}

/** "3 names" / "3 只" / "3 أسهم" for artifact row counts. */
export function countNames(lang: Lang, n: number): string {
  return plural(lang, n, {
    one: lang === 'ar' ? 'سهم' : 'name',
    two: 'سهمان',
    few: 'أسهم',
    many: 'سهمًا',
    other: lang === 'zh' ? '只' : lang === 'ar' ? 'سهم' : 'names',
  })
}
