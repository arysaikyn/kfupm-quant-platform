import { useMemo } from 'react'
import { AreaChart } from '../../vendor/tremor/AreaChart'
import { useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity } from '../../data/mock'
import { detailStrings } from './strings'

const FIRST_YEAR = 2019

/**
 * The equity curve renders through the vendored Tremor AreaChart
 * (src/vendor/tremor). Only the data mapping and the labels are ours.
 */
export function EquityChart({ lang }: { lang: Lang }) {
  const s = useStrings(detailStrings)
  const withCost = s('legendWithCost')
  const withoutCost = s('legendWithoutCost')
  const bench = s('legendBench')

  const rows = useMemo(
    () =>
      equity.withCost.map((v, i) => {
        const year = FIRST_YEAR + Math.round((i / Math.max(equity.withCost.length - 1, 1)) * 7)
        return {
          period: String(year),
          [withCost]: Number(((v - 1) * 100).toFixed(2)),
          [withoutCost]: Number(((equity.withoutCost[i] - 1) * 100).toFixed(2)),
          [bench]: Number(((equity.bench[i] - 1) * 100).toFixed(2)),
        }
      }),
    [withCost, withoutCost, bench],
  )

  return (
    <div dir="ltr" className="text-fg">
      <AreaChart
        data={rows}
        index="period"
        categories={[withCost, withoutCost, bench]}
        colors={['violet', 'cyan', 'gray']}
        valueFormatter={(value: number) => `${value.toFixed(1)}%`}
        showLegend
        showGridLines
        startEndOnly
        autoMinValue
        yAxisWidth={48}
        fill="gradient"
        className="h-[190px]"
        aria-label={s('chartAria')}
      />
      <p className="mt-1 text-[10px] text-muted" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {s('axisNote')}
      </p>
    </div>
  )
}
