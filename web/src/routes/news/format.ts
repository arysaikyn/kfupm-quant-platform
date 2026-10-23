import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'

/** News carries bare codes; this is the one lookup back to a named stock. */
export const quoteBySymbol: Record<string, Quote | undefined> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q] as const),
)

export { dayStamp, formatDay, relTime } from '../../i18n/format'
