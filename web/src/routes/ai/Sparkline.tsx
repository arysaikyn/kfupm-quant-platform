type Props = {
  data: number[]
  w?: number
  h?: number
  color?: string
}

export function Sparkline({ data, w = 64, h = 20, color = 'currentColor' }: Props) {
  const min = Math.min(...data)
  const span = Math.max(...data) - min || 1
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
