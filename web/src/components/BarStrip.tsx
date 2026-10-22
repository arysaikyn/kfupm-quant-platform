type Props = {
  data: number[]
  /** Colour is taken from the series direction, not from each bar. */
  up: boolean
  bars?: number
  /** Narrow width for tight quote rows. */
  compact?: boolean
}

/**
 * Data as texture: 20 fixed bars instead of a smooth line. Reads as activity
 * at 84px wide where a polyline turns into mush.
 */
export function BarStrip({ data, up, bars = 20, compact = false }: Props) {
  const slice = data.slice(-bars)
  const min = Math.min(...slice)
  const span = Math.max(...slice) - min || 1
  const tone = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <span
      aria-hidden="true"
      className="flex h-[18px] items-end gap-px"
      style={{ width: compact ? 52 : 84, direction: 'ltr' }}
    >
      {slice.map((v, i) => {
        const norm = (v - min) / span
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${38 + norm * 55}%`,
              background: tone,
              opacity: 0.16 + norm * 0.30,
            }}
          />
        )
      })}
    </span>
  )
}
