import { useMemo } from 'react'
import { useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equityYears } from '../../data/mock'
import { detailStrings } from './strings'

type Series = { key: string; values: number[]; tone: string }

const W = 320
const H = 170
const PAD = { top: 8, right: 6, bottom: 18, start: 34 }

/**
 * Two line series over one axis, drawn here rather than through the vendored
 * chart: the only consumer of that vendor pulled a 400 KB chunk into the
 * Strategy detail route, which is the route a user opens most often.
 */
export function EquityChart({
  lang,
  curve,
  bench,
}: {
  lang: Lang
  /** The strategy's own cost-inclusive series. */
  curve: number[]
  /** The shared benchmark, ending wherever it ends. */
  bench: number[]
}) {
  const s = useStrings(detailStrings)

  const series = useMemo<Series[]>(
    () => [
      { key: s('legendWithCost'), values: curve, tone: 'var(--color-accent)' },
      { key: s('legendBench'), values: bench, tone: 'var(--color-muted)' },
    ],
    [s, curve, bench],
  )

  const { paths, min, max, ticks } = useMemo(() => {
    const all = series.flatMap((x) => x.values)
    const lo = Math.min(...all)
    const hi = Math.max(...all)
    const span = hi - lo || 1
    const innerW = W - PAD.start - PAD.right
    const innerH = H - PAD.top - PAD.bottom

    const toPath = (values: number[]) =>
      values
        .map((v, i) => {
          const x = PAD.start + (i / Math.max(values.length - 1, 1)) * innerW
          const y = PAD.top + (1 - (v - lo) / span) * innerH
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')

    const step = (hi - lo) / 3
    return {
      paths: series.map((x) => toPath(x.values)),
      min: lo,
      max: hi,
      ticks: [0, 1, 2, 3].map((i) => ({
        value: lo + step * i,
        y: PAD.top + innerH - (i / 3) * innerH,
      })),
    }
  }, [series])

  const pct = (v: number) => `${((v - 1) * 100).toFixed(0)}%`

  return (
    <div dir="ltr" className="text-fg">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[190px] w-full"
        role="img"
        aria-label={s('chartAria')}
      >
        {ticks.map((t) => (
          <g key={t.y}>
            <line
              x1={PAD.start}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={PAD.start - 6}
              y={t.y + 3}
              textAnchor="end"
              className="num"
              fontSize="10"
              fill="var(--color-muted)"
            >
              {pct(t.value)}
            </text>
          </g>
        ))}

        {paths.map((d, i) => (
          <path
            key={series[i].key}
            d={d}
            fill="none"
            stroke={series[i].tone}
            strokeOpacity={i === 0 ? 0.9 : 0.55}
            strokeWidth={i === 0 ? 1.5 : 1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <text x={PAD.start} y={H - 4} fontSize="10" fill="var(--color-muted)">
          {equityYears.first}
        </text>
        <text
          x={W - PAD.right}
          y={H - 4}
          fontSize="10"
          textAnchor="end"
          fill="var(--color-muted)"
        >
          {equityYears.last}
        </text>
      </svg>

      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((x) => (
          <li key={x.key} className="flex items-center gap-1.5 text-2xs">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: x.tone }} />
            <span style={{ color: 'var(--color-muted)' }}>{x.key}</span>
            <span className="num" style={{ color: 'var(--color-fg)' }}>
              {pct(x.values[x.values.length - 1])}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-1 text-2xs text-muted" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {s('axisNote')}
      </p>
      <span className="sr-only">
        {min.toFixed(2)} - {max.toFixed(2)}
      </span>
    </div>
  )
}
