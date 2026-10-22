import { fundamentalsFor } from './fundamentals'
import { quotes, sectors } from './mock'
import type { Quote } from './mock'

/** The three frames the map can show. A sector has no series of its own, so
    every frame beyond 1D is derived from its members. */
export type HeatFrame = '1d' | '1w' | '1m'

/** Which stocks sit in which sector. The mock quotes carry no sector field, so
    the named membership is written out; Moutai is the consumer name -> retail. */
const SECTOR_MEMBERS: Record<string, string[]> = {
  energy: ['2222'],
  banks: ['1120'],
  materials: ['2010'],
  tech: ['0700'],
  retail: ['600519'],
}

/** Every quote lands in exactly one sector, so the map accounts for the whole
    universe instead of losing anything a later quote adds: the named rows go
    first, then the rest by a stable hash into the band with the fewest tiles,
    so no band starves while another crowds.

    This is the single membership table: the map, the sector page, the AI chips
    and the review all read it, so no screen can disagree with another. */
export const SECTOR_OF: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {}
  for (const sec of sectors) out[sec.id] = []
  const placed = new Set<string>()
  for (const sec of sectors) {
    for (const symbol of SECTOR_MEMBERS[sec.id] ?? []) {
      const q = quotes.find((x) => x.symbol === symbol)
      if (!q || placed.has(q.symbol)) continue
      out[sec.id].push(q.symbol)
      placed.add(q.symbol)
    }
  }
  for (const q of quotes) {
    if (placed.has(q.symbol)) continue
    const ids = sectors.map((sec) => sec.id)
    const least = Math.min(...ids.map((id) => out[id].length))
    const tied = ids.filter((id) => out[id].length === least)
    // 33 / 100003 spread the ticker characters; the score only picks a band, so
    // the same symbol lands in the same place on every load and in every locale.
    const score = [...q.symbol].reduce(
      (acc, ch) => (acc * 33 + ch.charCodeAt(0)) % 100003,
      7,
    )
    out[tied[score % tied.length]].push(q.symbol)
    placed.add(q.symbol)
  }
  return out
})()

/** Symbol -> quote, built once so every lookup is a single key read. */
const QUOTE_OF: Record<string, Quote> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q]),
)

/** The quotes in a sector. A sector the mock universe does not reach returns
    an empty list, so callers show their empty state instead of inventing
    constituents. */
export function membersOf(sectorId: string): Quote[] {
  const out: Quote[] = []
  for (const symbol of SECTOR_OF[sectorId] ?? []) {
    const quote = QUOTE_OF[symbol]
    if (quote) out.push(quote)
  }
  return out
}

/** The spark has no timestamps, so a week or a month is a fixed number of points
    back from the last one. 40 points ≈ a month of sessions, which makes 1W five
    points and 1M twenty-one; both are clamped, so a short series still works. */
const SERIES_BACK: Record<Exclude<HeatFrame, '1d'>, number> = { '1w': 5, '1m': 21 }

export function frameChange(q: Quote, frame: HeatFrame): number {
  if (frame === '1d') return q.change
  const last = q.spark.length - 1
  if (last < 1) return 0
  const then = q.spark[Math.max(0, last - SERIES_BACK[frame])]
  return then > 0 ? q.spark[last] / then - 1 : 0
}

/** Market-cap-weighted mean of the sector's members: the cap is the same figure
    that sizes their tiles, so a band and the areas under it agree, and a quote
    cannot dominate the band merely because its price is quoted in a unit with
    more digits. Every screen reads a sector's move through this function, so
    the map band, the sector page, the AI chip and the review always print the
    same figure. */
export function membersChange(sectorId: string, frame: HeatFrame = '1d'): number {
  const members = membersOf(sectorId)
  let total = 0
  let weighted = 0
  for (const q of members) {
    const cap = fundamentalsFor(q.symbol, q.price).marketCap
    total += cap
    weighted += frameChange(q, frame) * cap
  }
  return total > 0 ? weighted / total : 0
}
