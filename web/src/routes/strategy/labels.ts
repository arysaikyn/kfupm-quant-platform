import { sectors } from '../../data/mock'
import { fmtNum } from '../../i18n'
import type { Lang } from '../../i18n'
import type { ShariaField } from '../../data/shariaCoverage'
import type { MissingKey, Measure } from '../../lib/ledger'
import type { FeatureStrings } from './strings'

/** One figure, printed the way the ledger read it — percent, multiple or sector band. */
export function measureText(measure: Measure, lang: Lang): string {
  switch (measure.kind) {
    case 'ratio':
      // A measured level (debt ratio, payout, yield) takes no sign: only a
      // change is signed, and a debt ratio of 56% is not "+56%".
      return fmtNum(measure.value * 100, lang, 1, '%')
    case 'multiple':
      return fmtNum(measure.value, lang, 1, '×')
    case 'years':
      return fmtNum(measure.value, lang, 0)
    case 'sector':
      return sectors.find((sector) => sector.id === measure.value)?.name[lang] ?? measure.value
  }
}

export const MISSING_KEY: Record<MissingKey, keyof FeatureStrings> = {
  dividendHistory: 'missingDividendHistory',
  priceHistory: 'missingPriceHistory',
  marginData: 'missingMarginData',
  sectorStats: 'missingSectorStats',
  aaoifi: 'missingAaoifi',
  unmappedRule: 'missingUnmappedRule',
}

export const SHARIA_FIELD_KEY: Record<ShariaField, keyof FeatureStrings> = {
  debt: 'fieldDebt',
  interestBearing: 'fieldInterestBearing',
  income: 'fieldIncome',
  receivables: 'fieldReceivables',
}
