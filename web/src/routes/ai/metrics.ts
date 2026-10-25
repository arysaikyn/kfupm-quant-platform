import { fmtNum } from '../../i18n'
import type { Lang } from '../../i18n'
import type { AiStrings } from './strings'

/** Cards and numeral provenance share this order, so "first match" is stable. */
export const METRIC_ORDER = [
  'total_return',
  'annual_return',
  'sharpe',
  'max_drawdown',
  'win_rate',
  'trade_count',
] as const

export type MetricKey = (typeof METRIC_ORDER)[number]

export const METRIC_LABEL = {
  total_return: 'metricReturn',
  annual_return: 'metricAnnual',
  sharpe: 'metricSharpe',
  max_drawdown: 'metricDrawdown',
  win_rate: 'metricWin',
  trade_count: 'metricTrades',
} as const satisfies Record<MetricKey, keyof AiStrings>

const PERCENT: Partial<Record<MetricKey, true>> = {
  total_return: true,
  annual_return: true,
  max_drawdown: true,
  win_rate: true,
}

/**
 * The one place a metric becomes a display string. Provenance compares the
 * model's text against exactly these strings, so the card and the trace can
 * never disagree about what "12.30%" means.
 */
export function metricDisplay(key: MetricKey, value: number, lang: Lang): string {
  if (PERCENT[key]) return `${value > 0 ? '+' : ''}${fmtNum(value * 100, lang, 2)}%`
  if (key === 'trade_count') return fmtNum(value, lang, 0)
  return fmtNum(value, lang, 2)
}
