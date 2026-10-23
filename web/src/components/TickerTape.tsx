import type { Quote } from '../data/mock'

type Props = {
  quotes: Quote[]
  name: (q: Quote) => string
  price: (q: Quote) => string
  change: (q: Quote) => string
}

/**
 * Quote strip. Swipeable, not a marquee: a scrolling ticker cut the first
 * number in half at the edge. Time order stays LTR in Arabic.
 */
export function TickerTape({ quotes, name, price, change }: Props) {
  const track = () => (
    <div className="tape__track" dir="ltr">
      {quotes.map((q) => (
        <span key={q.symbol} className="flex shrink-0 items-baseline gap-1.5">
          <span className="t-sym" style={{ color: 'var(--color-muted)' }}>
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
      {track()}
    </div>
  )
}
