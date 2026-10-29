import type { Lang } from '../i18n'
import { costDrag } from './costs'

/** A localised string: one field per supported language. */
export type L10n = Record<Lang, string>

/** One condition a strategy applies, in the order it runs. */
export type StrategyRule = {
  id: string
  label: L10n
  /** The condition itself, in screener notation; digits stay Latin in every language. */
  value: string
}

export type Quote = {
  symbol: string
  name: L10n
  price: number
  /** Fraction: 0.012 means +1.2%. */
  change: number
  currency: string
  spark: number[]
}

export type MarketIndex = {
  symbol: string
  name: L10n
  value: number
  change: number
}

export type Sector = {
  id: string
  name: L10n
  change: number
  /** Relative weight, used for treemap area. */
  weight: number
}

export type NewsItem = {
  id: string
  title: L10n
  source: string
  minutesAgo: number
  symbols: string[]
  body: L10n[]
}

export type Strategy = {
  id: string
  name: L10n
  description: L10n
  /** The conditions behind the description; the detail screen lists exactly these. */
  rules: StrategyRule[]
  /** Fraction. */
  lastReturn: number
  /** One unit of capital, 60 points from 1.0 to exactly 1 + lastReturn. */
  curve: number[]
  /** The same run before fees and slippage, which is why it ends above `curve`. */
  gross: number[]
  updated: string
  tags: string[]
}

const line = (seed: number, n = 40, drift = 0.002) =>
  Array.from({ length: n }, (_, i) => {
    const w = Math.sin((i + seed) * 0.7) * 0.012 + Math.cos(i * 0.31 + seed) * 0.008
    return Number((1 + drift * i + w).toFixed(4))
  })

const CURVE_LEN = 60

/** One unit of capital compounded from 1.0 to exactly 1 + total over the curve's span. */
const curveFor = (seed: number, total: number) =>
  Array.from({ length: CURVE_LEN }, (_, i) => {
    // The wobble fades to zero at both ends, so the start stays 1.0 and the end stays exact.
    const wobble =
      Math.sin((Math.PI * i) / (CURVE_LEN - 1)) *
      (Math.sin((i + seed) * 0.73) * 0.6 + Math.cos(i * 0.37 + seed * 1.7) * 0.4) *
      0.02
    return Number((Math.pow(1 + total, i / (CURVE_LEN - 1)) * (1 + wobble)).toFixed(4))
  })

/** The span every curve covers; the chart axis and the report prose both read it. */
export const equityYears = { first: 2019, last: 2026 }

/** Charges a rerun pays, read from the one cost model in `data/costs.ts`. */
const COST_DRAG = costDrag(equityYears.last - equityYears.first)

/**
 * Both curves come from the one return figure a strategy declares, so a strategy
 * cannot show a headline, a chart and a cost row that disagree.
 */
function withCurves(entry: Omit<Strategy, 'curve' | 'gross'>, seed: number): Strategy {
  return {
    ...entry,
    curve: curveFor(seed, entry.lastReturn),
    gross: curveFor(seed + 1, entry.lastReturn + COST_DRAG),
  }
}

/** One benchmark shared by every strategy; each one's excess is measured against it. */
export const bench: number[] = curveFor(21, 0.052)

export const indices: MarketIndex[] = [
  {
    symbol: 'TASI',
    name: { zh: '沙特全股', en: 'Tadawul', ar: 'تاسي' },
    value: 11248.31,
    change: 0.0084,
  },
  {
    symbol: '000001',
    name: { zh: '上证指数', en: 'SSE Composite', ar: 'شنغهاي' },
    value: 3312.07,
    change: -0.0041,
  },
  {
    symbol: 'HSI',
    name: { zh: '恒生指数', en: 'Hang Seng', ar: 'هانغ سنغ' },
    value: 20114.6,
    change: 0.0122,
  },
]

export const quotes: Quote[] = [
  {
    symbol: '2222',
    name: { zh: '沙特阿美', en: 'Saudi Aramco', ar: 'أرامكو السعودية' },
    price: 25.48,
    change: 0.0072,
    currency: 'SAR',
    spark: line(1),
  },
  {
    symbol: '1120',
    name: { zh: '拉吉希银行', en: 'Al Rajhi Bank', ar: 'الراجحي' },
    price: 60.15,
    change: -0.0134,
    currency: 'SAR',
    spark: line(2, 40, -0.001),
  },
  {
    symbol: '2010',
    name: { zh: '沙特基础工业', en: 'SABIC', ar: 'سابك' },
    price: 72.4,
    change: 0.0211,
    currency: 'SAR',
    spark: line(3),
  },
  {
    symbol: '600519',
    name: { zh: '贵州茅台', en: 'Kweichow Moutai', ar: 'موتاي' },
    price: 1313.29,
    change: 0.0043,
    currency: 'CNY',
    spark: line(4),
  },
  {
    symbol: '0700',
    name: { zh: '腾讯控股', en: 'Tencent', ar: 'تينسنت' },
    price: 402.2,
    change: -0.0068,
    currency: 'HKD',
    spark: line(5, 40, -0.0005),
  },
]

/**
 * The one symbol -> quote lookup. Twelve screens used to rebuild this table
 * locally, half of them typed `Record<string, Quote>`, which is a lie the
 * moment a symbol is missing: a watchlist restored from storage can name a
 * symbol the tape does not carry. `quoteOf` returns `undefined` for that case
 * so the compiler makes every caller decide.
 */
export const quoteBySymbol: Readonly<Record<string, Quote | undefined>> = Object.fromEntries(
  quotes.map((quote) => [quote.symbol, quote] as const),
)

export function quoteOf(symbol: string): Quote | undefined {
  return quoteBySymbol[symbol]
}

export const sectors: Sector[] = [
  { id: 'energy', name: { zh: '能源', en: 'Energy', ar: 'الطاقة' }, change: 0.013, weight: 22 },
  { id: 'banks', name: { zh: '银行', en: 'Banks', ar: 'البنوك' }, change: 0.006, weight: 18 },
  { id: 'materials', name: { zh: '原材料', en: 'Materials', ar: 'المواد' }, change: 0.019, weight: 14 },
  { id: 'tech', name: { zh: '科技', en: 'Tech', ar: 'التقنية' }, change: -0.008, weight: 12 },
  { id: 'retail', name: { zh: '零售', en: 'Retail', ar: 'التجزئة' }, change: -0.015, weight: 10 },
  { id: 'utilities', name: { zh: '公用事业', en: 'Utilities', ar: 'المرافق' }, change: 0.003, weight: 8 },
  { id: 'health', name: { zh: '医疗', en: 'Health', ar: 'الصحة' }, change: 0.009, weight: 7 },
  { id: 'telecom', name: { zh: '电信', en: 'Telecom', ar: 'الاتصالات' }, change: -0.002, weight: 9 },
]

export const news: NewsItem[] = [
  {
    id: 'n1',
    title: {
      zh: '沙特阿美维持季度股息不变，炼化利润率回升',
      en: 'Saudi Aramco holds its quarterly dividend as refining margins recover',
      ar: 'أرامكو تثبت توزيعاتها الربعية مع تحسن هوامش التكرير',
    },
    source: 'Tadawul News',
    minutesAgo: 18,
    symbols: ['2222'],
    body: [
      {
        zh: '公司维持每股派息不变，同时表示下游业务利润率较上季度改善。',
        en: 'The company kept its per-share payout flat and said downstream margins improved from the prior quarter.',
        ar: 'أبقت الشركة على توزيعاتها لكل سهم دون تغيير، وقالت إن هوامش أعمالها في قطاع التكرير تحسنت عن الربع السابق.',
      },
    ],
  },
  {
    id: 'n2',
    title: {
      zh: '沙特央行维持利率不变，银行股走弱',
      en: 'Saudi central bank holds rates, bank stocks slip',
      ar: 'البنك المركزي السعودي يثبت الفائدة مع تراجع أسهم البنوك',
    },
    source: 'Reuters',
    minutesAgo: 42,
    symbols: ['1120'],
    body: [
      {
        zh: '政策利率维持不变，市场此前预期会有一次小幅下调。',
        en: 'The policy rate was left unchanged; the market had expected a small cut.',
        ar: 'تُركت أسعار الفائدة دون تغيير بعد توقعات السوق بخفض طفيف.',
      },
    ],
  },
  {
    id: 'n3',
    title: {
      zh: '中国白酒板块回升，龙头公布渠道改革',
      en: 'Chinese liquor names rebound as the leader details channel changes',
      ar: 'تعافي أسهم المشروبات الصينية مع كشف الشركة الرائدة عن تعديلات القنوات',
    },
    source: '财联社',
    minutesAgo: 96,
    symbols: ['600519'],
    body: [
      {
        zh: '公司称将收紧经销商层级，直营比例提高。',
        en: 'The company said it would cut distributor layers and raise the share of direct sales.',
        ar: 'قالت الشركة إنها ستقلص طبقات الموزعين وترفع نسبة البيع المباشر.',
      },
    ],
  },
  {
    id: 'n4',
    title: {
      zh: '科技股拖累港股，恒指冲高回落',
      en: 'Tech drags Hong Kong shares lower after an early rally',
      ar: 'أسهم التقنية تضغط على سوق هونغ كونغ بعد ارتفاع مبكر',
    },
    source: 'HKEX Wire',
    minutesAgo: 140,
    symbols: ['0700'],
    body: [
      {
        zh: '成分股中科技权重股回落，成交额较昨日放大。',
        en: 'Heavyweight tech names gave back gains on higher turnover than yesterday.',
        ar: 'تراجعت أسهم التقنية الثقيلة مع ارتفاع حجم التداول عن الأمس.',
      },
    ],
  },
]

export const strategies: Strategy[] = [
  withCurves(
    {
      id: 'low-debt-value',
      name: { zh: '低负债价值', en: 'Low-debt value', ar: 'قيمة بدين منخفض' },
      description: {
        zh: '市盈率低于 15，负债率低于 30%，行业排除银行与保险。',
        en: 'P/E under 15, debt ratio under 30%, banks and insurers excluded.',
        ar: 'مكرر الربحية أقل من 15، ونسبة الدين أقل من 30%، مع استثناء البنوك والتأمين.',
      },
      rules: [
        {
          id: 'pe',
          label: { zh: '市盈率（TTM）', en: 'P/E (TTM)', ar: 'مكرر الربحية (TTM)' },
          value: '< 15×',
        },
        {
          id: 'debt',
          label: { zh: '负债率', en: 'Debt to assets', ar: 'الدين إلى الأصول' },
          value: '< 30%',
        },
        {
          id: 'sectors',
          label: {
            zh: '银行与保险权重',
            en: 'Weight in banks and insurers',
            ar: 'الوزن في البنوك والتأمين',
          },
          value: '0%',
        },
        {
          id: 'sharia',
          label: { zh: '教法筛选', en: 'Sharia screen', ar: 'الفحص الشرعي' },
          value: '✓',
        },
      ],
      lastReturn: 0.184,
      updated: '2026-10-19',
      tags: ['value', 'sharia'],
    },
    3,
  ),
  withCurves(
    {
      id: 'dividend-growers',
      name: { zh: '股息增长', en: 'Dividend growers', ar: 'نمو التوزيعات' },
      description: {
        zh: '股息率高于 3%，连续三年提高派息。',
        en: 'Yield above 3% with three consecutive years of dividend growth.',
        ar: 'عائد أعلى من 3% مع ثلاث سنوات متتالية من نمو التوزيعات.',
      },
      rules: [
        {
          id: 'yield',
          label: { zh: '股息率', en: 'Dividend yield', ar: 'عائد التوزيعات' },
          value: '> 3%',
        },
        {
          id: 'growth',
          label: {
            zh: '派息连续增长年数',
            en: 'Years of dividend growth',
            ar: 'سنوات نمو التوزيعات',
          },
          value: '≥ 3',
        },
        {
          id: 'payout',
          label: { zh: '派息率', en: 'Payout ratio', ar: 'نسبة التوزيع' },
          value: '≤ 75%',
        },
      ],
      lastReturn: 0.097,
      updated: '2026-10-11',
      tags: ['income'],
    },
    5,
  ),
  withCurves(
    {
      id: 'sharia-income',
      name: { zh: '教法股息', en: 'Sharia income', ar: 'دخل متوافق' },
      description: {
        zh: '先过教法筛选，再找股息率高于 3%、负债率低于 30% 的名字。',
        en: 'Sharia screen first, then yield above 3% with debt below 30%.',
        ar: 'الفحص الشرعي أولًا، ثم عائد فوق 3% ودين أقل من 30%.',
      },
      rules: [
        {
          id: 'sharia',
          label: { zh: '教法筛选', en: 'Sharia screen', ar: 'الفحص الشرعي' },
          value: '✓',
        },
        {
          id: 'yield',
          label: { zh: '股息率', en: 'Dividend yield', ar: 'عائد التوزيعات' },
          value: '> 3%',
        },
        {
          id: 'debt',
          label: { zh: '负债率', en: 'Debt to assets', ar: 'الدين إلى الأصول' },
          value: '< 30%',
        },
      ],
      lastReturn: 0.126,
      updated: '2026-10-22',
      tags: ['income', 'sharia'],
    },
    13,
  ),
  withCurves(
    {
      id: 'momentum-quality',
      name: { zh: '趋势质量', en: 'Momentum quality', ar: 'جودة الزخم' },
      description: {
        zh: '六个月动量前列，且毛利率不低于行业中位数。',
        en: 'Top six-month momentum with gross margin at or above the industry median.',
        ar: 'زخم ستة أشهر في المقدمة مع هامش إجمالي لا يقل عن وسيط القطاع.',
      },
      rules: [
        {
          id: 'momentum6',
          label: {
            zh: '六个月动量百分位',
            en: 'Six-month momentum percentile',
            ar: 'ترتيب زخم ستة أشهر',
          },
          value: '≤ 10%',
        },
        {
          id: 'return12',
          label: { zh: '十二个月收益', en: 'Twelve-month return', ar: 'عائد اثني عشر شهرًا' },
          value: '> 0%',
        },
        {
          id: 'margin',
          label: {
            zh: '毛利率对比行业中位数',
            en: 'Gross margin vs industry median',
            ar: 'الهامش الإجمالي مقابل وسيط القطاع',
          },
          value: '≥ 1.0×',
        },
        {
          id: 'marginTrend',
          label: {
            zh: '毛利率一年变化',
            en: 'Gross margin, 12-month change',
            ar: 'تغيّر الهامش الإجمالي خلال سنة',
          },
          value: '≥ 0 pp',
        },
        {
          id: 'roe',
          label: {
            zh: 'ROE 对比行业中位数',
            en: 'ROE vs industry median',
            ar: 'العائد على حقوق الملكية مقابل وسيط القطاع',
          },
          value: '≥ 1.0×',
        },
      ],
      lastReturn: -0.032,
      updated: '2026-09-28',
      tags: ['momentum'],
    },
    9,
  ),
]

