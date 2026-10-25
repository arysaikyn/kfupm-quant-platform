import type { Quote } from '../data/mock'

type Props = {
  quotes: Quote[]
  price: (q: Quote) => string
  change: (q: Quote) => string
  label?: string
}

/**
 * Moving tape. Two identical tracks so the loop has no seam; the second is
 * hidden from assistive tech. Both edges fade, so the item leaving the frame
 * dissolves instead of being chopped in half. Time order stays LTR in Arabic.
 */
export function TickerTape({ quotes, price, change, label }: Props) {
  const track = (hidden: boolean) => (
    <div className="tape__track" dir="ltr" aria-hidden={hidden || undefined}>
      {quotes.map((q) => (
        <span key={`${hidden ? 'b' : 'a'}-${q.symbol}`} className="flex shrink-0 items-baseline gap-1.5">
          <span aria-hidden="true" className="me-1" style={{ color: 'var(--color-muted)', opacity: 0.5 }}>
            ·
          </span>
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
    <div className="tape py-2" role="group" aria-label={label} tabIndex={0}>
      {track(false)}
      {track(true)}
    </div>
  )
}
