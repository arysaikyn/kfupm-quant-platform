import type { Quote } from '../data/mock'

type Props = {
  quotes: Quote[]
  name: (q: Quote) => string
  price: (q: Quote) => string
  change: (q: Quote) => string
}

/**
 * Bloomberg-style tape. Two identical tracks so the loop has no seam; the
 * second is hidden from assistive tech. Time order stays LTR in Arabic.
 */
export function TickerTape({ quotes, name, price, change }: Props) {
  const track = (hidden: boolean) => (
    <div className="tape__track" aria-hidden={hidden || undefined} dir="ltr">
      {quotes.map((q) => (
        <span key={`${hidden ? 'b' : 'a'}-${q.symbol}`} className="flex shrink-0 items-baseline gap-1.5">
          <span className="t-kicker" style={{ color: 'var(--color-muted)' }}>
            {q.symbol}
          </span>
          <span className="num text-[12px]">{price(q)}</span>
          <span
            className="num text-[11px]"
            style={{ color: q.change >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
          >
            {change(q)}
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="tape py-2" aria-label={name(quotes[0])}>
      {track(false)}
      {track(true)}
    </div>
  )
}
