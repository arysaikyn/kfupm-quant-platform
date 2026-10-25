import type { Lang } from '../../i18n'
import { fmtNum } from '../../i18n'
import type { Field, Op, Rule } from './rules'
import type { ScreenerStrings } from './strings'

export const FIELD_ORDER: readonly Field[] = ['change', 'price', 'turnover']

export const FIELD_KEY: Record<Field, keyof ScreenerStrings> = {
  change: 'fieldChange',
  price: 'fieldPrice',
  turnover: 'fieldTurnover',
}

export const OP_SYMBOL: Record<Op, string> = { lt: '<', gt: '>' }

/** Input precision per field; chips and row reasons print the same digits. */
const FIELD_DIGITS: Record<Field, number> = { change: 2, price: 2, turnover: 1 }

export const FIELD_STEP: Record<Field, number> = { change: 0.1, price: 0.01, turnover: 0.5 }

export const FIELD_UNIT: Record<Field, string | null> = { change: '%', price: null, turnover: '%' }

/**
 * One rule written out. Without `current` it reads as the chip ("涨跌 > 0%");
 * with it, as the reason a row cleared ("涨跌 0.60% > 0%").
 */
export function ruleText(
  rule: Rule,
  threshold: number,
  label: string,
  lang: Lang,
  current?: number,
) {
  const unit = FIELD_UNIT[rule.field] ?? ''
  const digits = FIELD_DIGITS[rule.field]
  const limit = fmtNum(threshold, lang, digits, unit)
  if (current === undefined) return `${label} ${OP_SYMBOL[rule.op]} ${limit}`
  return `${label} ${fmtNum(current, lang, digits, unit)} ${OP_SYMBOL[rule.op]} ${limit}`
}

/** AAOIFI caps print exactly: 30%, 5%, 33.33%. */
export function shariaCap(value: number, lang: Lang): string {
  const pct = value * 100
  const digits = Math.abs(pct - Math.round(pct)) < 1e-6 ? 0 : 2
  return fmtNum(pct, lang, digits, '%')
}

/** A measured coverage ratio prints one decimal: 55.3%. */
export function shariaPct(value: number, lang: Lang): string {
  return fmtNum(value * 100, lang, 1, '%')
}
