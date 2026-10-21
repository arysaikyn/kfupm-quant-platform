import { fmtPct, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity } from '../../data/mock'
import { detailStrings } from './strings'

const W = 320
const H = 150
const PAD_L = 42
const PAD_R = 6
const PAD_T = 10
const PAD_B = 16

/**
 * Three-series equity curve on a fixed viewBox. The plot is always drawn
 * left to right, so the parent pins it to `dir="ltr"` even in Arabic.
 */
export function EquityChart({ lang }: { lang: Lang }) {
  const s = useStrings(detailStrings)
  const all = [...equity.withCost, ...equity.withoutCost, ...equity.bench]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const spread = (hi - lo) * 0.08 || 0.01
  const min = lo - spread
  const max = hi + spread
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B

  const px = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * plotW
  const py = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH

  const path = (data: number[]) =>
    data.map((v, i) => `${px(i, data.length).toFixed(1)},${py(v).toFixed(1)}`).join(' ')

  const area = [
    `M ${px(0, equity.withCost.length).toFixed(1)} ${(PAD_T + plotH).toFixed(1)}`,
    `L ${path(equity.withCost).replaceAll(' ', ' L ')}`,
    `L ${px(equity.withCost.length - 1, equity.withCost.length).toFixed(1)} ${(
      PAD_T + plotH
    ).toFixed(1)}`,
    'Z',
  ].join(' ')

  const marks = [hi, (hi + lo) / 2, lo]
  const baseline = 1 > min && 1 < max ? py(1) : null
  const last = equity.withCost[equity.withCost.length - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      role="img"
      aria-label={s('chartAria')}
    >
      <defs>
        <linearGradient id="strategy-equity" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {marks.map((v) => (
        <line
          key={v}
          x1={PAD_L}
          x2={W - PAD_R}
          y1={py(v)}
          y2={py(v)}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}

      {baseline !== null && (
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={baseline}
          y2={baseline}
          stroke="var(--color-muted)"
          strokeWidth="1"
          strokeOpacity="0.35"
          strokeDasharray="2 3"
        />
      )}

      <path d={area} fill="url(#strategy-equity)" />

      <polyline
        points={path(equity.withoutCost)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.2"
        strokeOpacity="0.3"
        strokeLinejoin="round"
      />
      <polyline
        points={path(equity.bench)}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth="1.2"
        strokeOpacity="0.85"
        strokeDasharray="4 3"
        strokeLinejoin="round"
      />
      <polyline
        points={path(equity.withCost)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={px(equity.withCost.length - 1, equity.withCost.length)}
        cy={py(last)}
        r="2.6"
        fill="var(--color-accent)"
      />

      {marks.map((v) => (
        <text
          key={`t${v}`}
          x={PAD_L - 6}
          y={py(v) + 3}
          textAnchor="end"
          fontSize="9"
          fill="var(--color-muted)"
        >
          {fmtPct(v - 1, lang, 1)}
        </text>
      ))}

      <text x={PAD_L} y={H - 4} fontSize="9" fill="var(--color-muted)" textAnchor="start">
        {s('axisFrom')}
      </text>
      <text x={W - PAD_R} y={H - 4} fontSize="9" fill="var(--color-muted)" textAnchor="end">
        {s('axisTo')}
      </text>
    </svg>
  )
}
