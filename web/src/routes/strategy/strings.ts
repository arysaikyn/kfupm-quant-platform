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
  rule1: string
  rule2: string
  rule3: string
  rule4: string
  chartTitle: string
  chartAria: string
  legendWithCost: string
  legendWithoutCost: string
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
}

export const detailStrings = {
  zh: {
    back: '返回',
    notFound: '找不到这个策略',
    notFoundHint: '这个链接可能已经过期',
    rulesTitle: '选股规则',
    rulesHint: '只读，重跑时按顺序执行',
    fullReport: '查看完整研究报告',
    rule1: '市盈率低于 15',
    rule2: '负债低于资产的三成',
    rule3: '排除银行和保险',
    rule4: '通过教法筛选',
    chartTitle: '净值走势',
    chartAria: '净值走势图',
    legendWithCost: '含成本',
    legendWithoutCost: '不含成本',
    legendBench: '基准',
    axisNote: '时间从左到右',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: '总回报',
    mTotalHint: '五年累计',
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
  },
  en: {
    back: 'Back',
    notFound: 'Strategy not found',
    notFoundHint: 'This link may be out of date',
    rulesTitle: 'Stock rules',
    rulesHint: 'Read only. Applied in order on each run.',
    fullReport: 'Open the full report',
    rule1: 'Price under 15 times earnings',
    rule2: 'Debt under a third of assets',
    rule3: 'Banks and insurers left out',
    rule4: 'Passes the Sharia screen',
    chartTitle: 'How it grew',
    chartAria: 'Equity curve',
    legendWithCost: 'After costs',
    legendWithoutCost: 'Before costs',
    legendBench: 'Benchmark',
    axisNote: 'Time runs left to right',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: 'Total return',
    mTotalHint: 'over five years',
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
  },
  ar: {
    back: 'رجوع',
    notFound: 'لم يتم العثور على الخطة',
    notFoundHint: 'قد يكون هذا الرابط قديمًا',
    rulesTitle: 'قواعد الاختيار',
    rulesHint: 'للقراءة فقط، وتُطبَّق بالترتيب عند كل تشغيل.',
    fullReport: 'افتح التقرير الكامل',
    rule1: 'السعر أقل من 15 ضعف الأرباح',
    rule2: 'الدين أقل من ثلث الأصول',
    rule3: 'استبعاد البنوك وشركات التأمين',
    rule4: 'يجتاز الفحص الشرعي',
    chartTitle: 'مسار النمو',
    chartAria: 'مخطط مسار النمو',
    legendWithCost: 'بعد التكاليف',
    legendWithoutCost: 'قبل التكاليف',
    legendBench: 'المؤشر المرجعي',
    axisNote: 'الزمن من اليسار إلى اليمين',
    axisFrom: '2019',
    axisTo: '2026',
    mTotal: 'العائد الكلي',
    mTotalHint: 'خلال خمس سنوات',
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
  },
} satisfies Dict<DetailStrings>
