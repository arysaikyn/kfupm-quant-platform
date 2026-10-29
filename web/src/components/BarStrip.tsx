type Props = {
  data: number[]
  /** Colour is taken from the series direction, not from each bar. */
  up: boolean
  bars?: number
  /** Narrow width for tight quote rows. */
  compact?: boolean
  /** 44px, 16px tall: the strip a sector row can afford. */
  dense?: boolean
}

/**
 * Data as texture: 20 fixed bars instead of a smooth line. Reads as activity
 * at 84px wide where a polyline turns into mush.
 */
export function BarStrip({ data, up, bars = 20, compact = false, dense = false }: Props) {
  const slice = data.slice(-bars)
  const min = Math.min(...slice)
  const span = Math.max(...slice) - min || 1
  const tone = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <span
      aria-hidden="true"
      className={dense ? 'flex h-4 w-11 shrink-0 items-end gap-px' : 'flex h-[18px] items-end gap-px'}
      style={dense ? { direction: 'ltr' } : { width: compact ? 52 : 84, direction: 'ltr' }}
    >
      {slice.map((v, i) => {
        const norm = (v - min) / span
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${(dense ? 32 : 38) + norm * (dense ? 60 : 55)}%`,
              background: tone,
              opacity: (dense ? 0.22 : 0.16) + norm * (dense ? 0.32 : 0.30),
            }}
          />
        )
      })}
    </span>
  )
}
