import type { Dict } from '../../i18n'

export type ListStrings = {
  title: string
  subtitle: string
  leaderboard: string
  sortLabel: string
  sortRecent: string
  sortReturn: string
  rulesUnit: string
  updated: string
  lastReturn: string
  oos: string
  oosHint: string
  empty: string
  emptyCta: string
  'tag.value': string
  'tag.sharia': string
  'tag.income': string
  'tag.momentum': string
}

export const listStrings = {
  zh: {
    title: '策略库',
    subtitle: '一句话形成的规则，都收在这里',
  leaderboard: '排行榜',
    sortLabel: '排序方式',
    sortRecent: '最近更新',
    sortReturn: '收益最高',
    rulesUnit: '条规则',
    updated: '更新于',
    lastReturn: '近一年',
    oos: 'OOS',
    oosHint: '样本外：结果取自策略没有参与构建的时段',
    empty: '还没有策略',
    emptyCta: '用一句话建一个',
    'tag.value': '价值',
    'tag.sharia': '教法筛选',
    'tag.income': '分红',
    'tag.momentum': '动量',
  },
  en: {
    title: 'Strategies',
    subtitle: 'Rules you built from one sentence',
  leaderboard: 'Leaderboard',
    sortLabel: 'Sort by',
    sortRecent: 'Recently updated',
    sortReturn: 'Best return',
    rulesUnit: 'rules',
    updated: 'Updated',
    lastReturn: 'Last year',
    oos: 'OOS',
    oosHint: 'Out-of-sample: measured on a period the strategy was not built on',
    empty: 'No strategies yet',
    emptyCta: 'Build one from a sentence',
    'tag.value': 'Value',
    'tag.sharia': 'Sharia screen',
    'tag.income': 'Dividend',
    'tag.momentum': 'Momentum',
  },
  ar: {
    title: 'خططي',
    subtitle: 'قواعد بنيتها من جملة واحدة',
    leaderboard: 'المتصدرون',
    sortLabel: 'الترتيب حسب',
    sortRecent: 'الأحدث تحديثًا',
    sortReturn: 'الأعلى عائدًا',
    rulesUnit: 'قواعد',
    updated: 'حُدِّثت',
    lastReturn: 'آخر سنة',
    oos: 'OOS',
    oosHint: 'خارج العينة: قياس على فترة لم تُبنَ عليها الخطة',
    empty: 'لا توجد خطط بعد',
    emptyCta: 'ابنِ خطة من جملة',
    'tag.value': 'قيمة',
    'tag.sharia': 'فحص شرعي',
    'tag.income': 'توزيعات',
    'tag.momentum': 'زخم',
  },
} satisfies Dict<ListStrings>

/** Mock tag ids -> dictionary keys, shared by the list and the detail screen. */
export const TAG_KEY: Record<string, keyof ListStrings> = {
  value: 'tag.value',
  sharia: 'tag.sharia',
  income: 'tag.income',
  momentum: 'tag.momentum',
}

export type DetailStrings = {
  back: string
  notFound: string
  notFoundHint: string
  rulesTitle: string
  rulesHint: string
  fullReport: string
  chartTitle: string
  chartAria: string
  legendWithCost: string
  legendBench: string
  axisNote: string
  axisFrom: string
  axisTo: string
  mTotal: string
  mTotalHint: string
  mDrawdown: string
  mDrawdownHint: string
  mTurnover: string
  mTurnoverHint: string
  rerun: string
  stepFetch: string
  stepFilter: string
  stepCompute: string
  stepDone: string
  runningNote: string
  updatedNote: string
  oosFrom: string
  costTitle: string
  costStart: string
  costFinal: string
  costFees: string
  costFeesHint: string
  costSlippage: string
  costSlippageHint: string
  costNote: string
}

export const detailStrings = {
  zh: {
    back: '返回',
    notFound: '找不到这个策略',
    notFoundHint: '这个链接可能已经过期',
    rulesTitle: '选股规则',
    rulesHint: '只读，重跑时按顺序执行',
    fullReport: '查看完整研究报告',
    chartTitle: '净值走势',
    chartAria: '净值走势图',
    legendWithCost: '含成本',
    legendBench: '基准',
    axisNote: '时间从左到右',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: '总回报',
    mTotalHint: '区间累计',
    mDrawdown: '最大回撤',
    mDrawdownHint: '最深一次下跌',
    mTurnover: '换手',
    mTurnoverHint: '每年换掉的比例',
    rerun: '重跑',
    stepFetch: '取数',
    stepFilter: '筛选',
    stepCompute: '计算',
    stepDone: '完成',
    runningNote: '正在重跑',
    updatedNote: '结果已更新',
    oosFrom: '样本外自 {date}',
    costTitle: '成本模拟',
    costStart: '初始资金',
    costFinal: '期末价值',
    costFees: '费用',
    costFeesHint: '期末的 0.15%',
    costSlippage: '滑点',
    costSlippageHint: '期末的 0.5%',
    costNote: '模拟：初始资金按净值曲线的区间累计收益增长到期末，再按期末价值扣费用与滑点。',
  },
  en: {
    back: 'Back',
    notFound: 'Strategy not found',
    notFoundHint: 'This link may be out of date',
    rulesTitle: 'Stock rules',
    rulesHint: 'Read only. Applied in order on each run.',
    fullReport: 'Open the full report',
    chartTitle: 'How it grew',
    chartAria: 'Equity curve',
    legendWithCost: 'After costs',
    legendBench: 'Benchmark',
    axisNote: 'Time runs left to right',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: 'Total return',
    mTotalHint: 'over the whole span',
    mDrawdown: 'Worst drop',
    mDrawdownHint: 'deepest fall',
    mTurnover: 'Turnover',
    mTurnoverHint: 'replaced each year',
    rerun: 'Run again',
    stepFetch: 'Fetching data',
    stepFilter: 'Filtering',
    stepCompute: 'Computing',
    stepDone: 'Done',
    runningNote: 'Running',
    updatedNote: 'Results updated',
    oosFrom: 'Out-of-sample from {date}',
    costTitle: 'Simulated costs',
    costStart: 'Starting capital',
    costFinal: 'Final value',
    costFees: 'Fees',
    costFeesHint: '0.15% of final',
    costSlippage: 'Slippage',
    costSlippageHint: '0.5% of final',
    costNote: 'Simulated: the starting capital compounds at the curve’s cumulative return to its end value, then fees and slippage come off that final value.',
  },
  ar: {
    back: 'رجوع',
    notFound: 'لم يتم العثور على الخطة',
    notFoundHint: 'قد يكون هذا الرابط قديمًا',
    rulesTitle: 'قواعد الاختيار',
    rulesHint: 'للقراءة فقط، وتُطبَّق بالترتيب عند كل تشغيل.',
    fullReport: 'افتح التقرير الكامل',
    chartTitle: 'مسار النمو',
    chartAria: 'مخطط مسار النمو',
    legendWithCost: 'بعد التكاليف',
    legendBench: 'المؤشر المرجعي',
    axisNote: 'الزمن من اليسار إلى اليمين',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: 'العائد الكلي',
    mTotalHint: 'خلال الفترة كاملة',
    mDrawdown: 'أقصى تراجع',
    mDrawdownHint: 'أعمق هبوط',
    mTurnover: 'معدل الدوران',
    mTurnoverHint: 'نسبة الاستبدال سنويًا',
    rerun: 'أعد التشغيل',
    stepFetch: 'جلب البيانات',
    stepFilter: 'الفرز',
    stepCompute: 'الحساب',
    stepDone: 'تم',
    runningNote: 'جارٍ التشغيل',
    updatedNote: 'تم تحديث النتائج',
    oosFrom: 'خارج العينة من {date}',
    costTitle: 'تكاليف محاكاة',
    costStart: 'رأس المال الابتدائي',
    costFinal: 'القيمة النهائية',
    costFees: 'الرسوم',
    costFeesHint: '0.15% من القيمة النهائية',
    costSlippage: 'الانزلاق السعري',
    costSlippageHint: '0.5% من القيمة النهائية',
    costNote: 'محاكاة: يتراكم رأس المال الابتدائي بعائد المنحنى التراكمي حتى قيمته النهائية، ثم تُخصم الرسوم والانزلاق من تلك القيمة.',
  },
} satisfies Dict<DetailStrings>
