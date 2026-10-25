import { fill } from '../../i18n/format'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Market } from '../../data/fundamentals'
import type { CrossRun, MarketReason } from './ledger'
import { featureStrings } from './strings'
import type { FeatureStrings } from './strings'

const MARKET_LABEL: Record<Market, keyof FeatureStrings> = {
  sa: 'marketSa',
  cn_a: 'marketCn',
  hk: 'marketHk',
  us: 'marketUs',
}

const REASON_LABEL: Record<MarketReason, keyof FeatureStrings> = {
  universe: 'marketReasonUniverse',
  sectorMap: 'marketReasonSectorMap',
  aaoifi: 'marketReasonAaoifi',
}

/**
 * The same rules, one market at a time. Every difference is charged to what the
 * demo tape lacks — names, a sector band, AAOIFI inputs — not to the market:
 * five tickers cannot support a claim about a country.
 */
export function CrossMarket({ cross }: { cross: CrossRun }) {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)

  return (
    <section className="border-t border-line pt-5">
      <h2 className="t-section">{s('marketTitle')}</h2>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('marketHint')}
      </p>

      <ul className="mt-2 divide-y divide-line">
        {cross.rows.map((row) => (
          <li key={row.market} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px]">{s(MARKET_LABEL[row.market])}</span>
              <span className="text-[11px] leading-none" style={{ color: 'var(--color-muted)' }}>
                {row.evaluated === 0 ? (
                  s('marketNoNames')
                ) : (
                  <>
                    {fill(s('marketEvaluated'), { n: fmtNum(row.evaluated, lang, 0) })}
                    {' · '}
                    {fill(s('marketRanked'), { n: fmtNum(row.ranked, lang, 0) })}
                  </>
                )}
              </span>
            </div>
            {row.reasons.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {row.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-md px-1.5 py-0.5 text-[10px] leading-none"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
                  >
                    {s(REASON_LABEL[reason])}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {cross.gaps.length > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {s('marketGapNote')}
        </p>
      )}
    </section>
  )
}
