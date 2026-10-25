import { fmtNum, useI18n, useStrings } from '../../i18n'
import { Sparkline } from '../../components/Sparkline'
import type { RunPreview } from '../../api/ai'
import { strings } from './strings'

const PCT = new Set(['total_return', 'annual_return', 'max_drawdown', 'win_rate'])

function metricValue(key: string, value: number, lang: 'zh' | 'en' | 'ar'): string {
  if (PCT.has(key)) return `${value > 0 ? '+' : ''}${fmtNum(value * 100, lang, 2)}%`
  if (key === 'trade_count') return fmtNum(value, lang, 0)
  return fmtNum(value, lang, 2)
}

const ORDER = ['total_return', 'annual_return', 'sharpe', 'max_drawdown', 'win_rate', 'trade_count'] as const
const LABEL = {
  total_return: 'metricReturn',
  annual_return: 'metricAnnual',
  sharpe: 'metricSharpe',
  max_drawdown: 'metricDrawdown',
  win_rate: 'metricWin',
  trade_count: 'metricTrades',
} as const

/** The real backtest card from a run, not a mocked artifact. */
export function RunCard({ run }: { run: RunPreview }) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  if (!run.report_worthy && !run.metrics) return null

  const metrics = run.metrics ?? {}
  const shown = ORDER.filter((key) => metrics[key] != null)
  const curve = run.equity_curve
    .map((point) => Number(point.equity))
    .filter((value) => Number.isFinite(value))

  return (
    <div className="panel mt-3 p-3">
      <p className="text-[11px] font-medium text-muted">{s('runTitle')}</p>
      {shown.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {shown.map((key) => (
            <div key={key}>
              <p className="text-[10px] leading-tight text-muted">{s(LABEL[key])}</p>
              <p className="num mt-0.5 text-[13px] font-semibold">
                {metricValue(key, metrics[key], lang)}
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
