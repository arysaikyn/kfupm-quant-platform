type Props = {
  /** One score per axis, first entry on the upward spoke. Missing entries read as 0. */
  scores: number[]
  /** Axis names for the accessible description; the caller draws the visible labels. */
  labels: string[]
  /** Score that reaches the outer ring. */
  max?: number
  size?: number
  aria: string
}

const AXES = 5
const RINGS = 6
const MID_TONE = '#d8a63a'

/** Unit vectors, first spoke straight up, then 72° apart. */
const DIRECTIONS = Array.from({ length: AXES }, (_, i) => {
  const angle = ((-90 + i * (360 / AXES)) * Math.PI) / 180
  return { cos: Math.cos(angle), sin: Math.sin(angle) }
})

/**
 * One colour for the whole shape: down → muted yellow → up across the score
 * range. color-mix keeps the CSS tokens instead of copying hexes.
 */
function tone(total: number, ceiling: number): string {
  const t = ceiling > 0 ? Math.min(1, Math.max(0, total / ceiling)) : 0
  if (t <= 0) return 'var(--color-down)'
  if (t >= 1) return 'var(--color-up)'
  if (t === 0.5) return MID_TONE
  if (t < 0.5) {
    return `color-mix(in srgb, ${MID_TONE} ${Math.round(t * 200)}%, var(--color-down))`
  }
  return `color-mix(in srgb, var(--color-up) ${Math.round((t - 0.5) * 200)}%, ${MID_TONE})`
}

/** Closed five-sided outline through one radius per axis. */
function outline(cx: number, cy: number, radii: number[]): string {
  return DIRECTIONS.map(({ cos, sin }, i) => {
    const r = radii.at(i) ?? 0
    return `${(cx + r * cos).toFixed(2)},${(cy + r * sin).toFixed(2)}`
  }).join(' ')
}

/**
 * Five-axis radar in the Simply Wall St geometry: first spoke straight up,
 * six concentric rings, filled polygon through radius · score / max.
 */
export function Snowflake({ scores, labels, max = 6, size = 240, aria }: Props) {
  const stroke = Math.max(1.5, size * 0.011)
  const hairline = Math.max(0.75, size * 0.0035)
  const cx = size / 2
  const cy = size / 2
  const radius = cx - stroke - size * 0.02
  const ceiling = max > 0 ? max : 1
  const values = Array.from({ length: AXES }, (_, i) =>
    Math.min(ceiling, Math.max(0, scores.at(i) ?? 0)),
  )
  const color = tone(
    values.reduce((sum, v) => sum + v, 0),
    ceiling * AXES,
  )
  const shape = outline(
    cx,
    cy,
    values.map((v) => (radius * v) / ceiling),
  )
  const rings = Array.from({ length: RINGS }, (_, i) =>
    outline(cx, cy, Array<number>(AXES).fill((radius * (i + 1)) / RINGS)),
  )
  const described = labels
    .slice(0, AXES)
    .map((label, i) => `${label} ${values.at(i) ?? 0}/${ceiling}`)
    .join(' · ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={aria}
    >
      <desc>{described}</desc>
      <g aria-hidden="true">
        {rings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={hairline}
          />
        ))}
        {DIRECTIONS.map(({ cos, sin }, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * cos}
            y2={cy + radius * sin}
            stroke="var(--color-line)"
            strokeWidth={hairline}
          />
        ))}
      </g>
      <polygon
        points={shape}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={Math.max(1, size * 0.006)} fill={color} />
    </svg>
  )
}
