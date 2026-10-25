import { quotes } from '../../data/mock'
import type { L10n, StrategyRule } from '../../data/mock'
import { limitOf, runRule } from './ledger'
import type { Measure } from './ledger'
import { diffRules } from './plain'
import type { DiffRow } from './plain'

/**
 * Three strategies that stopped working, kept as evidence. The story is seeded
 * — the dates and the losses — but the post-mortem is read off the demo tape
 * every time the screen opens: which names fail the broken rule today, and by
 * how much. A revival is a proposal, never a restore.
 */

export type Retired = {
  id: string
  name: L10n
  description: L10n
  rules: StrategyRule[]
  lastReturn: number
  retiredOn: string
  /** The day the rule below first failed for long enough to notice. */
  brokeOn: string
  brokeRuleId: string
  /** What a revival would run instead; the diff is computed against `rules`. */
  revive: StrategyRule[]
  note: L10n
}

export type NameMeasure = { symbol: string; measure: Measure }

export type PostMortem = {
  ruleId: string
  ruleIndex: number
  brokeOn: string
  total: number
  failing: NameMeasure[]
  worst: NameMeasure | null
  measurable: boolean
}

const label = (zh: string, en: string, ar: string): L10n => ({ zh, en, ar })

export const retired: Retired[] = [
  {
    id: 'low-debt-tight',
    name: label('低负债（旧版）', 'Low debt, tight', 'دين منخفض (قديم)'),
    description: label(
      '负债率低于 25%，市盈率低于 20 倍，过教法筛选。',
      'Debt under 25%, P/E under 20×, Sharia screen.',
      'الدين أقل من 25%، ومكرر الربحية أقل من 20، مع الفحص الشرعي.',
    ),
    rules: [
      { id: 'debt', label: label('负债率', 'Debt to assets', 'الدين إلى الأصول'), value: '< 25%' },
      { id: 'pe', label: label('市盈率（TTM）', 'P/E (TTM)', 'مكرر الربحية (TTM)'), value: '< 20×' },
      { id: 'sharia', label: label('教法筛选', 'Sharia screen', 'الفحص الشرعي'), value: '✓' },
    ],
    lastReturn: -0.124,
    retiredOn: '2025-09-30',
    brokeOn: '2025-03-14',
    brokeRuleId: 'debt',
    revive: [
      { id: 'debt', label: label('负债率', 'Debt to assets', 'الدين إلى الأصول'), value: '< 45%' },
      { id: 'pe', label: label('市盈率（TTM）', 'P/E (TTM)', 'مكرر الربحية (TTM)'), value: '< 20×' },
      { id: 'sharia', label: label('教法筛选', 'Sharia screen', 'الفحص الشرعي'), value: '✓' },
    ],
    note: label(
      '疫情期间加杠杆的公司，负债率一路走高，25% 这条线把名单挤空了。',
      'Companies that levered up after the pandemic kept crossing 25%, and the list emptied out.',
      'الشركات التي رفعت ديونها بعد الجائحة تجاوزت 25%، ففرغت القائمة.',
    ),
  },
  {
    id: 'dividend-first',
    name: label('分红优先（旧版）', 'Dividend first', 'التوزيعات أولًا (قديم)'),
    description: label(
      '股息率高于 5%，派息率不高于 60%，派息连增三年。',
      'Yield above 5%, payout at most 60%, three years of dividend growth.',
      'عائد فوق 5%، ونسبة توزيع لا تزيد على 60%، ونمو التوزيعات ثلاث سنوات.',
    ),
    rules: [
      { id: 'yield', label: label('股息率', 'Dividend yield', 'عائد التوزيعات'), value: '> 5%' },
      { id: 'payout', label: label('派息率', 'Payout ratio', 'نسبة التوزيع'), value: '≤ 60%' },
      {
        id: 'growth',
        label: label('派息连续增长年数', 'Years of dividend growth', 'سنوات نمو التوزيعات'),
        value: '≥ 3',
      },
    ],
    lastReturn: -0.061,
    retiredOn: '2025-02-17',
    brokeOn: '2024-11-08',
    brokeRuleId: 'yield',
    revive: [
      { id: 'yield', label: label('股息率', 'Dividend yield', 'عائد التوزيعات'), value: '> 4%' },
      { id: 'payout', label: label('派息率', 'Payout ratio', 'نسبة التوزيع'), value: '≤ 80%' },
      {
        id: 'growth',
        label: label('派息连续增长年数', 'Years of dividend growth', 'سنوات نمو التوزيعات'),
        value: '≥ 2',
      },
    ],
    note: label(
      '利率见顶后高股息不再稀缺，5% 的门槛把能买的都筛掉了。',
      'Once rates peaked, a 5% yield stopped being scarce — and the rule screened out everything worth buying.',
      'بعد بلوغ الفائدة ذروتها لم يعد عائد 5% نادرًا، فاستبعدت القاعدة كل ما يستحق الشراء.',
    ),
  },
  {
    id: 'deep-value',
    name: label('深度价值（旧版）', 'Deep value', 'قيمة عميقة (قديم)'),
    description: label(
      '市盈率低于 12 倍，负债率低于 35%，过教法筛选。',
      'P/E under 12×, debt under 35%, Sharia screen.',
      'مكرر ربحية أقل من 12، ودين أقل من 35%، مع الفحص الشرعي.',
    ),
    rules: [
      { id: 'pe', label: label('市盈率（TTM）', 'P/E (TTM)', 'مكرر الربحية (TTM)'), value: '< 12×' },
      { id: 'debt', label: label('负债率', 'Debt to assets', 'الدين إلى الأصول'), value: '< 35%' },
      { id: 'sharia', label: label('教法筛选', 'Sharia screen', 'الفحص الشرعي'), value: '✓' },
    ],
    lastReturn: -0.213,
    retiredOn: '2026-01-12',
    brokeOn: '2025-06-02',
    brokeRuleId: 'pe',
    revive: [
      { id: 'pe', label: label('市盈率（TTM）', 'P/E (TTM)', 'مكرر الربحية (TTM)'), value: '< 20×' },
      { id: 'debt', label: label('负债率', 'Debt to assets', 'الدين إلى الأصول'), value: '< 35%' },
      { id: 'sharia', label: label('教法筛选', 'Sharia screen', 'الفحص الشرعي'), value: '✓' },
    ],
    note: label(
      '市场整体重估之后，12 倍以下几乎没有名字，策略一直空仓。',
      'After the whole market re-rated, almost nothing traded under 12×, so the strategy sat in cash.',
      'بعد إعادة تقييم السوق لم يبقَ شيء دون 12 ضعفًا، فبقيت الخطة نقدًا.',
    ),
  },
]

/** Which names fail the broken rule today, and the worst of them. */
export function postMortem(entry: Retired): PostMortem {
  const ruleIndex = entry.rules.findIndex((rule) => rule.id === entry.brokeRuleId)
  const rule = entry.rules[ruleIndex] ?? entry.rules[0]
  const failing: NameMeasure[] = []
  for (const q of quotes) {
    const check = runRule(rule, q)
    if (check.status === 'fail') failing.push({ symbol: q.symbol, measure: check.measure })
  }
  const limit = limitOf(rule.value)
  // A "below" threshold is broken worst by the largest figure; an "above" one
  // by the smallest. Sector failures carry no number, so they rank last.
  const wantLower = limit ? limit.op === 'gt' || limit.op === 'gte' : false
  let worst: NameMeasure | null = null
  for (const item of failing) {
    if (item.measure.kind === 'sector') continue
    const value = item.measure.value
    const current =
      worst && worst.measure.kind !== 'sector' ? worst.measure.value : null
    if (current === null || (wantLower ? value < current : value > current)) worst = item
  }
  if (!worst && failing.length > 0) worst = failing[0]
  return {
    ruleId: rule.id,
    ruleIndex,
    brokeOn: entry.brokeOn,
    total: quotes.length,
    failing,
    worst,
    measurable: quotes.some((q) => runRule(rule, q).status !== 'unknown'),
  }
}

export function reviveDiff(entry: Retired): DiffRow[] {
  return diffRules(entry.rules, entry.revive)
}
