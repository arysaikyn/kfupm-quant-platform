import type { Lang } from '../../i18n'

/** Arabic keeps Western digits and the Gregorian calendar, matching the mock. */
export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/** Clock time for the rerun receipt. */
export function fmtClock(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
