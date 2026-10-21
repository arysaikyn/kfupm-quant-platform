import type { Lang } from '../../i18n'
import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'

/** News carries bare codes; this is the one lookup back to a named stock. */
export const quoteBySymbol: Record<string, Quote | undefined> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q] as const),
)

/** Arabic keeps Western digits, matching fmtNum in src/i18n. */
export const locales: Record<Lang, string> = {
  zh: 'zh',
  en: 'en',
  ar: 'ar-SA-u-nu-latn',
}

/** "18 minutes ago" / "قبل 18 دقيقة" — never hand-written suffixes. */
export function relTime(minutesAgo: number, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: 'auto' })
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
  return new Intl.DateTimeFormat(locales[lang], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    calendar: 'gregory',
  }).format(new Date(year, month, day))
}
