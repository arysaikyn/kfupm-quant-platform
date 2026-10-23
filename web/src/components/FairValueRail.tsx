type Props = {
  price: number
  fairValue: number
  /** Localised words, so the rail never carries English in zh/ar builds. */
  labels: {
    title: string
    price: string
    fair: string
    undervalued: string
    overvalued: string
    aboutRight: string
  }
  format: (n: number) => string
  /** Percent number without a sign, already localised. */
  percent?: (n: number) => string
}

/**
 * Simply Wall St's fair-value rail: one axis, two markers, a green zone below
 * fair value and a red zone above it. The verdict flips inside a ±5% dead band
 * so a 1% gap does not read as a signal.
 */
export function FairValueRail({ price, fairValue, labels, format, percent = (n) => `${n}%` }: Props) {
  const gap = fairValue > 0 ? price / fairValue - 1 : 0
  const verdict =
    Math.abs(gap) <= 0.05
      ? { text: labels.aboutRight, tone: 'var(--color-muted)' }
      : gap < 0
        ? { text: `${labels.undervalued} ${percent(Math.round(-gap * 100))}`, tone: 'var(--color-up)' }
        : { text: `${labels.overvalued} ${percent(Math.round(gap * 100))}`, tone: 'var(--color-down)' }

  // The axis spans fair value ±40%, which keeps both markers on screen for
  // every quote in the mock (the widest gap is 35%).
  const span = 0.4
  const clamp = (n: number) => Math.max(0.04, Math.min(0.94, n))
  const pricePos = clamp(0.5 + gap / span / 2)
  const fairPos = 0.5

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="t-kicker" style={{ color: 'var(--color-muted)' }}>
          {labels.title}
        </p>
        <p className="num text-[12px]" style={{ color: verdict.tone }}>
          {verdict.text}
        </p>
      </div>

      <div className="relative mt-3 h-1" aria-hidden="true">
        <div
          className="absolute inset-y-0 start-0 end-1/2 rounded-s-full"
          style={{ background: 'color-mix(in srgb, var(--color-up) 14%, transparent)' }}
        />
        <div
          className="absolute inset-y-0 start-1/2 end-0 rounded-e-full"
          style={{ background: 'color-mix(in srgb, var(--color-down) 14%, transparent)' }}
        />
        <div
          className="absolute inset-y-0 w-px"
          style={{ insetInlineStart: `${fairPos * 100}%`, background: 'var(--color-fg)' }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            insetInlineStart: `${pricePos * 100}%`,
            background: 'var(--color-fg)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-fg) 16%, transparent)',
          }}
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between text-[12px]">
        <span style={{ color: 'var(--color-muted)' }}>
          {labels.price} <span className="num" style={{ color: 'var(--color-fg)' }}>{format(price)}</span>
        </span>
        <span style={{ color: 'var(--color-muted)' }}>
          {labels.fair} <span className="num" style={{ color: 'var(--color-fg)' }}>{format(fairValue)}</span>
        </span>
      </div>
    </div>
  )
}
