/** The demo tape has one explicit as-of timestamp; nothing pretends to be live. */
export const DATA_AS_OF = '2026-10-25T09:30:00+03:00'
// The demo tape is a fixed sample; keep the gate lenient so the demo does not
// brick, but a live tick feed should use a much shorter threshold.
export const MAX_DATA_AGE_DAYS = 30

const AS_OF_MS = Date.parse(DATA_AS_OF)

export function dataAgeDays(now: number = Date.now()): number {
  if (!Number.isFinite(AS_OF_MS)) return 0
  return Math.max(0, (now - AS_OF_MS) / 86_400_000)
}

export function isDataStale(now: number = Date.now()): boolean {
  return dataAgeDays(now) > MAX_DATA_AGE_DAYS
}

export function dataAgeLabel(now: number = Date.now()): string {
  const days = Math.floor(dataAgeDays(now))
  if (days <= 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}
