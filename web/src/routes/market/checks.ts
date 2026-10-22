import { fundamentalsFor, marketConstants, marketFor } from '../../data/fundamentals'
import type { Fundamentals, Market, MarketConstants } from '../../data/fundamentals'
import type { Lang } from '../../i18n'

/** The five pillars Simply Wall St scores a share on, plus the Sharia screen. */
export type Axis = 'value' | 'growth' | 'past' | 'health' | 'sharia'

export type CheckLabel = Record<Lang, string>

export type Check = {
  id: string
  axis: Axis
  label: CheckLabel
  pass: boolean
  /** The measured figure the verdict was read from, formatted for display. */
  value: string
}

const AXES: Axis[] = ['value', 'growth', 'past', 'health', 'sharia']

/** The model is fixed at six checks per axis, so a score is always out of six. */
const PER_AXIS = 6

const CURRENCY: Record<Market, string> = {
  sa: 'SAR',
  cn_a: 'CNY',
  hk: 'HKD',
  us: 'USD',
}

const n = (v: number, digits = 2): string => v.toFixed(digits)

const pct = (v: number, digits = 1): string => `${(v * 100).toFixed(digits)}%`

type Facts = {
  price: number
  f: Fundamentals
  mc: MarketConstants
  currency: string
}

type Rule = {
  id: string
  axis: Axis
  label: CheckLabel
  test: (x: Facts) => boolean
  value: (x: Facts) => string
}

const RULES: Rule[] = [
  // ── value ──────────────────────────────────────────────────
  {
    id: 'value-price-20',
    axis: 'value',
    label: {
      zh: '现价低于合理价的 80%',
      en: 'Price at least 20% below fair value',
      ar: 'السعر أقل من القيمة العادلة بـ20% على الأقل',
    },
    test: (x) => x.price <= x.f.fairValue * 0.8,
    value: (x) => `${n(x.price)} vs FV ${n(x.f.fairValue)}`,
  },
  {
    id: 'value-price-40',
    axis: 'value',
    label: {
      zh: '现价低于合理价的 60%',
      en: 'Price at least 40% below fair value',
      ar: 'السعر أقل من القيمة العادلة بـ40% على الأقل',
    },
    test: (x) => x.price <= x.f.fairValue * 0.6,
    value: (x) => `${n(x.price)} vs FV ${n(x.f.fairValue)}`,
  },
  {
    id: 'value-pe',
    axis: 'value',
    label: {
      zh: '市盈率低于市场平均',
      en: 'P/E below the market average',
      ar: 'مكرر الربحية أقل من متوسط السوق',
    },
    test: (x) => x.f.pe > 0 && x.f.pe < x.mc.marketPe,
    value: (x) => `${n(x.f.pe, 1)} vs ${n(x.mc.marketPe, 1)}`,
  },
  {
    id: 'value-pe-tight',
    axis: 'value',
    label: {
      zh: '市盈率低于市场平均的 85%',
      en: 'P/E at least 15% below the market average',
      ar: 'مكرر الربحية أقل بـ15% من متوسط السوق',
    },
    test: (x) => x.f.pe > 0 && x.f.pe < x.mc.marketPe * 0.85,
    value: (x) => `${n(x.f.pe, 1)} vs ${n(x.mc.marketPe * 0.85, 1)}`,
  },
  {
    id: 'value-peg',
    axis: 'value',
    label: {
      zh: '市盈增长比不高于 1',
      en: 'PEG ratio of 1 or less',
      ar: 'نسبة السعر إلى النمو 1 أو أقل',
    },
    test: (x) => x.f.peg >= 0 && x.f.peg <= 1,
    value: (x) => `PEG ${n(x.f.peg)}`,
  },
  {
    id: 'value-pb',
    axis: 'value',
    label: {
      zh: '市净率低于市场平均',
      en: 'P/B below the market average',
      ar: 'مكرر القيمة الدفترية أقل من متوسط السوق',
    },
    test: (x) => x.f.pb > 0 && x.f.pb < x.mc.marketPb,
    value: (x) => `${n(x.f.pb)} vs ${n(x.mc.marketPb)}`,
  },

  // ── growth ─────────────────────────────────────────────────
  {
    id: 'growth-eps-10',
    axis: 'growth',
    label: {
      zh: '每股收益增长超过 10%',
      en: 'Earnings per share grew more than 10%',
      ar: 'نمو ربحية السهم أكثر من 10%',
    },
    test: (x) => x.f.epsGrowth > 0.1,
    value: (x) => `EPS ${pct(x.f.epsGrowth)}`,
  },
  {
    id: 'growth-eps-market',
    axis: 'growth',
    label: {
      zh: '每股收益增长快于市场',
      en: 'Earnings growing faster than the market',
      ar: 'نمو الأرباح أسرع من السوق',
    },
    test: (x) => x.f.epsGrowth > x.mc.marketEpsGrowth,
    value: (x) => `${pct(x.f.epsGrowth)} vs ${pct(x.mc.marketEpsGrowth)}`,
  },
  {
    id: 'growth-revenue-market',
    axis: 'growth',
    label: {
      zh: '营收增长快于市场',
      en: 'Revenue growing faster than the market',
      ar: 'نمو الإيرادات أسرع من السوق',
    },
    test: (x) => x.f.revenueGrowth > x.mc.marketRevenueGrowth,
    value: (x) => `${pct(x.f.revenueGrowth)} vs ${pct(x.mc.marketRevenueGrowth)}`,
  },
  {
    id: 'growth-eps-20',
    axis: 'growth',
    label: {
      zh: '每股收益增长超过 20%',
      en: 'Earnings per share grew more than 20%',
      ar: 'نمو ربحية السهم أكثر من 20%',
    },
    test: (x) => x.f.epsGrowth > 0.2,
    value: (x) => `EPS ${pct(x.f.epsGrowth)}`,
  },
  {
    id: 'growth-revenue-20',
    axis: 'growth',
    label: {
      zh: '营收增长超过 20%',
      en: 'Revenue grew more than 20%',
      ar: 'نمو الإيرادات أكثر من 20%',
    },
    test: (x) => x.f.revenueGrowth > 0.2,
    value: (x) => `Rev ${pct(x.f.revenueGrowth)}`,
  },
  {
    id: 'growth-roe-20',
    axis: 'growth',
    label: {
      zh: '净资产收益率高于 20%',
      en: 'Return on equity above 20%',
      ar: 'العائد على حقوق الملكية أعلى من 20%',
    },
    test: (x) => x.f.roe > 0.2,
    value: (x) => `ROE ${pct(x.f.roe)}`,
  },

  // ── past ───────────────────────────────────────────────────
  {
    id: 'past-roe-15',
    axis: 'past',
    label: {
      zh: '净资产收益率高于 15%',
      en: 'Return on equity above 15%',
      ar: 'العائد على حقوق الملكية أعلى من 15%',
    },
    test: (x) => x.f.roe > 0.15,
    value: (x) => `ROE ${pct(x.f.roe)}`,
  },
  {
    id: 'past-roa-8',
    axis: 'past',
    label: {
      zh: '总资产回报率高于 8%',
      en: 'Return on assets above 8%',
      ar: 'العائد على الأصول أعلى من 8%',
    },
    test: (x) => x.f.roa > 0.08,
    value: (x) => `ROA ${pct(x.f.roa)}`,
  },
  {
    id: 'past-roce-12',
    axis: 'past',
    label: {
      zh: '已动用资本回报率高于 12%',
      en: 'Return on capital employed above 12%',
      ar: 'العائد على رأس المال المستخدم أعلى من 12%',
    },
    test: (x) => x.f.roce > 0.12,
    value: (x) => `ROCE ${pct(x.f.roce)}`,
  },
  {
    id: 'past-eps-up',
    axis: 'past',
    label: {
      zh: '每股收益仍在增长',
      en: 'Earnings per share still growing',
      ar: 'ربحية السهم ما زالت تنمو',
    },
    test: (x) => x.f.epsGrowth > 0,
    value: (x) => `EPS ${pct(x.f.epsGrowth)}`,
  },
  {
    id: 'past-revenue-up',
    axis: 'past',
    label: {
      zh: '营收仍在增长',
      en: 'Revenue still growing',
      ar: 'الإيرادات ما زالت تنمو',
    },
    test: (x) => x.f.revenueGrowth > 0,
    value: (x) => `Rev ${pct(x.f.revenueGrowth)}`,
  },
  {
    id: 'past-roe-market',
    axis: 'past',
    label: {
      zh: '净资产收益率高于市场盈利增速',
      en: 'Return on equity above market earnings growth',
      ar: 'العائد على حقوق الملكية أعلى من نمو أرباح السوق',
    },
    test: (x) => x.f.roe > x.mc.marketEpsGrowth,
    value: (x) => `${pct(x.f.roe)} vs ${pct(x.mc.marketEpsGrowth)}`,
  },

  // ── health ─────────────────────────────────────────────────
  {
    id: 'health-current-15',
    axis: 'health',
    label: {
      zh: '流动比率高于 1.5',
      en: 'Current ratio above 1.5',
      ar: 'النسبة الجارية أعلى من 1.5',
    },
    test: (x) => x.f.currentRatio > 1.5,
    value: (x) => `Current ${n(x.f.currentRatio)}`,
  },
  {
    id: 'health-current-10',
    axis: 'health',
    label: {
      zh: '流动比率高于 1',
      en: 'Current ratio above 1',
      ar: 'النسبة الجارية أعلى من 1',
    },
    test: (x) => x.f.currentRatio > 1,
    value: (x) => `Current ${n(x.f.currentRatio)}`,
  },
  {
    id: 'health-debt-40',
    axis: 'health',
    label: {
      zh: '负债率低于 40%',
      en: 'Debt ratio below 40%',
      ar: 'نسبة الدين أقل من 40%',
    },
    test: (x) => x.f.debtRatio < 0.4,
    value: (x) => `Debt ${pct(x.f.debtRatio)}`,
  },
  {
    id: 'health-debt-60',
    axis: 'health',
    label: {
      zh: '负债率低于 60%',
      en: 'Debt ratio below 60%',
      ar: 'نسبة الدين أقل من 60%',
    },
    test: (x) => x.f.debtRatio < 0.6,
    value: (x) => `Debt ${pct(x.f.debtRatio)}`,
  },
  {
    id: 'health-cover-5',
    axis: 'health',
    label: {
      zh: '利息覆盖高于 5 倍',
      en: 'Interest cover above 5×',
      ar: 'تغطية الفائدة أعلى من 5 أضعاف',
    },
    test: (x) => x.f.interestCover > 5,
    value: (x) => `Cover ${n(x.f.interestCover, 1)}×`,
  },
  {
    id: 'health-fcf',
    axis: 'health',
    label: {
      zh: '自由现金流为正',
      en: 'Free cash flow is positive',
      ar: 'التدفق النقدي الحر موجب',
    },
    test: (x) => x.f.fcf > 0,
    value: (x) => `FCF ${n(x.f.fcf / 1e9)}B ${x.currency}`,
  },

  // ── sharia ─────────────────────────────────────────────────
  {
    id: 'sharia-debt-30',
    axis: 'sharia',
    label: {
      zh: '负债率低于 30%：AAOIFI 债务门槛',
      en: 'Debt ratio below 30%: AAOIFI debt threshold',
      ar: 'نسبة الدين أقل من 30%: حد أيوفي للدين',
    },
    test: (x) => x.f.debtRatio < 0.3,
    value: (x) => `Debt ${pct(x.f.debtRatio)}`,
  },
  {
    id: 'sharia-cover',
    axis: 'sharia',
    label: {
      zh: '利息覆盖高于 0.5 倍：利息负债不重',
      en: 'Interest cover above 0.5×: interest-bearing debt is light',
      ar: 'تغطية الفائدة أعلى من 0.5 ضعف: الدين بفوائد خفيف',
    },
    test: (x) => x.f.interestCover > 0.5,
    value: (x) => `Cover ${n(x.f.interestCover, 1)}×`,
  },
  {
    id: 'sharia-dividend',
    axis: 'sharia',
    label: {
      zh: '股息率低于 5%：非合规收入占比代理',
      en: 'Dividend yield below 5%: proxy for non-compliant income',
      ar: 'عائد التوزيعات أقل من 5%: مؤشر بديل للدخل غير المتوافق',
    },
    test: (x) => x.f.dividendYield < 0.05,
    value: (x) => `Yield ${pct(x.f.dividendYield, 2)}`,
  },
  {
    id: 'sharia-payout',
    axis: 'sharia',
    label: {
      zh: '派息率低于 90%：应收占比代理',
      en: 'Payout ratio below 90%: proxy for receivables',
      ar: 'نسبة التوزيع أقل من 90%: مؤشر بديل للذمم المدينة',
    },
    test: (x) => x.f.payoutRatio < 0.9,
    value: (x) => `Payout ${pct(x.f.payoutRatio)}`,
  },
  {
    id: 'sharia-no-dividend',
    axis: 'sharia',
    label: {
      zh: '不派息，或派息率低于 90%',
      en: 'No dividend, or payout below 90%',
      ar: 'لا توزيعات، أو نسبة توزيع أقل من 90%',
    },
    test: (x) => x.f.dividendYield === 0 || x.f.payoutRatio < 0.9,
    value: (x) => `Yield ${pct(x.f.dividendYield, 2)} · payout ${pct(x.f.payoutRatio)}`,
  },
  {
    id: 'sharia-debt-33',
    axis: 'sharia',
    label: {
      zh: '负债率低于 33.33%',
      en: 'Debt ratio below 33.33%',
      ar: 'نسبة الدين أقل من 33.33%',
    },
    test: (x) => x.f.debtRatio < 0.33,
    value: (x) => `Debt ${pct(x.f.debtRatio)}`,
  },
]

export function checkList(symbol: string, price: number): Check[] {
  const market = marketFor(symbol)
  const facts: Facts = {
    price,
    f: fundamentalsFor(symbol, price),
    mc: marketConstants(market),
    currency: CURRENCY[market],
  }

  return RULES.map((rule) => ({
    id: rule.id,
    axis: rule.axis,
    label: rule.label,
    pass: rule.test(facts),
    value: rule.value(facts),
  }))
}

/** Passes per axis, in the same order the checks are listed. */
export function axisScores(checks: Check[]): { axis: Axis; score: number; total: number }[] {
  return AXES.map((axis) => ({
    axis,
    score: checks.filter((c) => c.axis === axis && c.pass).length,
    total: PER_AXIS,
  }))
}

/**
 * Round-robin across axes. Taking the first N in table order returned three
 * earnings checks in a row, which read as one fact repeated.
 */
function spread(checks: Check[], max: number): Check[] {
  const out: Check[] = []
  const seenValues = new Set<string>()
  const byAxis = new Map<Axis, Check[]>()
  for (const c of checks) {
    const list = byAxis.get(c.axis) ?? []
    list.push(c)
    byAxis.set(c.axis, list)
  }
  let round = 0
  while (out.length < max) {
    let added = false
    for (const axis of AXES) {
      const list = byAxis.get(axis)
      const next = list?.[round]
      if (!next || seenValues.has(next.value)) continue
      seenValues.add(next.value)
      out.push(next)
      added = true
      if (out.length === max) break
    }
    if (!added) break
    round += 1
  }
  return out
}

export function strengthsAndRisks(
  checks: Check[],
  max = 3,
): { rewards: Check[]; risks: Check[] } {
  return {
    rewards: spread(checks.filter((c) => c.pass), max),
    risks: spread(checks.filter((c) => !c.pass), max),
  }
}
