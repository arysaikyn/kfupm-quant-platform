import { useEffect, useRef } from 'react'
import { useI18n, useStrings } from '../../i18n'
import { Sparkline } from '../../components/Sparkline'
import type { RunPreview } from '../../api/ai'
import { METRIC_LABEL, METRIC_ORDER, metricDisplay } from './metrics'
import type { MetricKey } from './metrics'
import { strings } from './strings'

/** The real backtest card from a run, not a mocked artifact. */
export function RunCard({
  run,
  pulseMetric,
}: {
  run: RunPreview
  pulseMetric?: MetricKey | null
}) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const pulseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pulseMetric) pulseRef.current?.scrollIntoView({ block: 'nearest' })
  }, [pulseMetric])

  if (!run.report_worthy && !run.metrics) return null

  const metrics = run.metrics ?? {}
  const shown = METRIC_ORDER.filter((key) => Number.isFinite(metrics[key]))
  const curve = run.equity_curve
    .map((point) => Number(point.equity))
    .filter((value) => Number.isFinite(value))

  return (
    <div className="panel mt-3 p-3">
      <p className="text-[11px] font-medium text-muted">{s('runTitle')}</p>
      {shown.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {shown.map((key) => (
            <div
              key={key}
              ref={pulseMetric === key ? pulseRef : undefined}
              data-run-metric={key}
              className={
                pulseMetric === key ? 'rounded bg-fg/10 motion-safe:animate-pulse' : undefined
              }
            >
              <p className="text-[10px] leading-tight text-muted">{s(METRIC_LABEL[key])}</p>
              <p className="num mt-0.5 text-[13px] font-semibold">
                {metricDisplay(key, metrics[key], lang)}
              </p>
            </div>
          ))}
        </div>
      )}
      {curve.length > 1 && (
        <div className="mt-3 text-muted" aria-hidden>
          <Sparkline data={curve} w={280} h={56} />
        </div>
      )}
    </div>
  )
}
