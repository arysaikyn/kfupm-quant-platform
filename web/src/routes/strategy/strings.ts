import type { Dict } from '../../i18n'

export type ListStrings = {
  title: string
  subtitle: string
  leaderboard: string
  sortLabel: string
  sortRecent: string
  sortReturn: string
  rulesUnit: string
  vsBench: string
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
  vsBench: '基准 {pct}',
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
  vsBench: '{pct} vs benchmark',
    updated: 'Updated',
    lastReturn: 'Last year',
    oos: 'OOS',
    oosHint: 'Measured on a period the strategy never saw while being built',
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
  vsBench: '{pct} مقابل المؤشر',
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
  rerunOffline: string
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
    rerunOffline: '重跑需要后端的回测引擎；这个演示版本没有接入。',
    oosFrom: '未参与建模的数据：{date} 起',
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
    rerunOffline: 'Re-running needs the backtest engine; this demo does not include it.',
    oosFrom: 'Data not used to build the strategy, from {date}',
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
    rerunOffline: 'إعادة التشغيل تحتاج محرك الاختبار الخلفي، وهذه النسخة لا تتضمنه.',
    oosFrom: 'بيانات لم تُستخدم في بناء الخطة، من {date}',
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

export type FeatureStrings = {
  receiptTitle: string
  receiptHint: string
  receiptCopy: string
  receiptCopied: string
  receiptOk: string
  receiptMismatch: string
  receiptBadLink: string
  receiptHash: string
  receiptAsOf: string
  receiptRules: string
  receiptUniverse: string
  receiptCosts: string
  receiptScope: string
  receiptChangedAsOf: string
  receiptChangedRule: string
  receiptChangedOrder: string
  receiptRuleAdded: string
  receiptRuleRemoved: string
  receiptUniverseAdded: string
  receiptUniverseRemoved: string
  receiptChangedCost: string
  receiptOtherStrategy: string
  costCapital: string
  costFee: string
  costSlip: string
  costTurnover: string
  ledgerTitle: string
  ledgerHint: string
  ledgerEvaluated: string
  ledgerScreened: string
  ledgerRanked: string
  ledgerExcluded: string
  ledgerUnproven: string
  ledgerPassed: string
  ledgerMeasured: string
  ledgerRule: string
  ledgerDemoNote: string
  missingDividendHistory: string
  missingPriceHistory: string
  missingMarginData: string
  missingSectorStats: string
  missingAaoifi: string
  missingUnmappedRule: string
  fieldDebt: string
  fieldInterestBearing: string
  fieldIncome: string
  fieldReceivables: string
  marketTitle: string
  marketHint: string
  marketSa: string
  marketCn: string
  marketHk: string
  marketUs: string
  marketEvaluated: string
  marketRanked: string
  marketNoNames: string
  marketReasonUniverse: string
  marketReasonSectorMap: string
  marketReasonAaoifi: string
  marketGapNote: string
  pickTitle: string
  pickHint: string
  pickPrint: string
  pickCopy: string
  pickCopied: string
  pickAsOf: string
  pickRules: string
  pickNames: string
  pickWeight: string
  pickPer100: string
  pickPrice: string
  pickEmpty: string
  pickEmptyHint: string
  pickEqualNote: string
  pickCopyHeader: string
  pickDemoNote: string
  jarTitle: string
  jarHint: string
  jarYear: string
  jarCoins: string
  jarShares: string
  jarCash: string
  jarEmpty: string
  jarEmptyHint: string
  jarDeposit: string
  jarWhatIf: string
  jarDemo: string
  jarIdle: string
  plainLabel: string
  plainNote: string
  plainUnchanged: string
  plainCost: string
  plainLuck: string
  plainSummaryFallback: string
  graveTitle: string
  graveLead: string
  graveRetiredOn: string
  graveBrokeOn: string
  graveBrokeRule: string
  graveNames: string
  graveNoMeasure: string
  graveHealed: string
  graveRevive: string
  graveCancel: string
  graveDiffTitle: string
  graveDiffHint: string
  graveDiffChanged: string
  graveDiffAdded: string
  graveDiffRemoved: string
  graveChipChanged: string
  graveChipAdded: string
  graveChipRemoved: string
  graveConfirm: string
  graveConfirmNote: string
  graveLastReturn: string
  graveDemoNote: string
  graveListLink: string
  graveListCount: string
}

/** Copy for everything added to the strategy screens; the shared dictionary stays untouched. */
export const featureStrings = {
  zh: {
    receiptTitle: '运行凭据',
    receiptHint: '锁定规则、数据截止日、股票池和成本假设。凭据相同，两次运行就该给出同样的数字。',
    receiptCopy: '复制凭据链接',
    receiptCopied: '链接已复制',
    receiptOk: '可复现',
    receiptMismatch: '对不上',
    receiptBadLink: '链接里的凭据读不出来。',
    receiptHash: '哈希',
    receiptAsOf: '数据截止',
    receiptRules: '规则',
    receiptUniverse: '股票池',
    receiptCosts: '成本',
    receiptScope: '凭据复现的是这一屏：同样的股票、规则和成本。它复现不了那条历史回报——演示数据只有 5 只股票，不是整个市场。',
    receiptChangedAsOf: '数据截止日从 {from} 变成 {to}',
    receiptChangedRule: '规则 {rule} 从 {from} 改成 {to}',
    receiptChangedOrder: '规则顺序变了（{rule} 换了位置）',
    receiptRuleAdded: '新增了规则 {rule}',
    receiptRuleRemoved: '删除了规则 {rule}',
    receiptUniverseAdded: '股票池里多了 {symbol}',
    receiptUniverseRemoved: '股票池里少了 {symbol}',
    receiptChangedCost: '{field} 假设从 {from} 变成 {to}',
    receiptOtherStrategy: '这张凭据属于 {id}，不是当前策略。',
    costCapital: '初始资金',
    costFee: '费用（基点）',
    costSlip: '滑点（基点）',
    costTurnover: '换手',
    ledgerTitle: '剔除账本',
    ledgerHint: '每只股票为什么不在今天的名单里：先过教法筛选，再按列表顺序，第一条拦住它的规则，和它读到的数字。',
    ledgerEvaluated: '已读',
    ledgerScreened: '过筛',
    ledgerRanked: '入榜',
    ledgerExcluded: '被规则剔除',
    ledgerUnproven: '无法证实',
    ledgerPassed: '全部通过',
    ledgerMeasured: '实测',
    ledgerRule: '第 {n} 条',
    ledgerDemoNote: '演示数据只有 5 只：读不出来的写「无法证实」，绝不算通过。',
    missingDividendHistory: '演示数据没有派息历史',
    missingPriceHistory: '演示数据没有这个窗口的价格历史',
    missingMarginData: '演示数据没有毛利率',
    missingSectorStats: '演示数据没有行业中位数',
    missingAaoifi: 'AAOIFI 输入缺失',
    missingUnmappedRule: '这条规则还没有数据源',
    fieldDebt: '负债',
    fieldInterestBearing: '生息资产',
    fieldIncome: '不合规收入',
    fieldReceivables: '应收款',
    marketTitle: '同一套规则，换个市场',
    marketHint: '演示视角，不是市场结论：每个市场在演示数据里只有几只股票。',
    marketSa: '沙特',
    marketCn: '中国 A 股',
    marketHk: '香港',
    marketUs: '美国',
    marketEvaluated: '读了 {n} 只',
    marketRanked: '入榜 {n} 只',
    marketNoNames: '没有股票',
    marketReasonUniverse: '演示数据里股票更少',
    marketReasonSectorMap: '有股票没有行业归位',
    marketReasonAaoifi: 'AAOIFI 输入缺失',
    marketGapNote: '共同缺口：行业规则还要排除保险，但演示的行业表没有保险这一格，所以这条规则在哪个市场都跑不全。',
    pickTitle: '当日名单',
    pickHint: '过了全部规则的股票，等权分配。',
    pickPrint: '打印',
    pickCopy: '复制',
    pickCopied: '已复制',
    pickAsOf: '数据截止 {date}',
    pickRules: '应用的规则',
    pickNames: '股票',
    pickWeight: '权重',
    pickPer100: '每 100',
    pickPrice: '价格',
    pickEmpty: '今天的演示数据里，没有股票通过全部规则。',
    pickEmptyHint: '主要卡点：{rule} 拦下了 {n} 只。',
    pickEqualNote: '等权：每只 {pct}。',
    pickCopyHeader: '{name} — 当日名单',
    pickDemoNote: '示例名单来自演示数据，不构成投资建议。',
    jarTitle: '100 里亚尔罐',
    jarHint: '100 里亚尔等分给通过的股票，会变成什么。',
    jarYear: '入场年份',
    jarCoins: '{n} 枚',
    jarShares: '{n} 股',
    jarCash: '现金',
    jarEmpty: '罐子里没有股票：没有一只通过全部规则，100 里亚尔留在现金里。',
    jarEmptyHint: '一枚硬币等于一股；主要卡在 {rule}。',
    jarDeposit: '本金',
    jarWhatIf: '假设价格',
    jarDemo: '演示：硬币是按假设价格买到的整股，剩下的钱留在现金。',
    jarIdle: '没有名单，本金就不增值：策略并没有真的持有这笔钱。',
    plainLabel: '大白话',
    plainNote: '只换说法；关掉以后数字一模一样。',
    plainUnchanged: '只有说法变了，这一屏的数字一个没变。',
    plainCost: '大白话：买卖是要花钱的。费用拿走 {fees}，滑点拿走 {slip}，合起来大约是期末金额的 {pct}。',
    plainLuck: '大白话：试的想法多了，总有一个是碰巧好看的。这个分数是 {pct}，低于 95% 就说明排除不了运气。',
    plainSummaryFallback: '大白话：只留下把上面每条规则都过了的公司，其余都剔掉。',
    graveTitle: '策略墓地',
    graveLead: '停用的策略都放在这里：弄垮它的规则，和那一天。',
    graveRetiredOn: '{date} 停用',
    graveBrokeOn: '{date} 失效',
    graveBrokeRule: '第 {n} 条 — {rule}',
    graveNames: '今天 {total} 只里有 {n} 只不过：最差 {symbol}，{value}。',
    graveNoMeasure: '演示数据测不了这条规则，所以结论是「没数据」，不是「没影响」。',
    graveHealed: '今天已经没有任何股票卡在这条规则上：它不再起作用了。',
    graveRevive: '复活',
    graveCancel: '收起',
    graveDiffTitle: '复活要改什么',
    graveDiffHint: '不会悄悄恢复：每一条要动的条件都列出来。',
    graveDiffChanged: '{rule}：{from} → {to}',
    graveDiffAdded: '{rule}：新增 {to}',
    graveDiffRemoved: '{rule}：删除',
    graveChipChanged: '改',
    graveChipAdded: '加',
    graveChipRemoved: '删',
    graveConfirm: '按这些规则复活',
    graveConfirmNote: '保存需要策略库；这个演示版本没有接入。',
    graveLastReturn: '最近一年',
    graveDemoNote: '示例策略；死因是从演示数据里读出来的。',
    graveListLink: '停用的策略',
    graveListCount: '{n} 条已停用',
  },
  en: {
    receiptTitle: 'Receipt',
    receiptHint: 'Pins the rules, the as-of date, the universe and the cost assumptions. Two runs with the same receipt must print the same figures.',
    receiptCopy: 'Copy receipt link',
    receiptCopied: 'Link copied',
    receiptOk: 'Reproduced',
    receiptMismatch: 'Mismatch',
    receiptBadLink: 'The receipt in this link is not readable.',
    receiptHash: 'Hash',
    receiptAsOf: 'As of',
    receiptRules: 'Rules',
    receiptUniverse: 'Universe',
    receiptCosts: 'Costs',
    receiptScope: 'A receipt reproduces the screen — the same names, rules and costs. It cannot re-create the recorded return: the demo tape holds 5 names, not a market.',
    receiptChangedAsOf: 'the as-of date moved from {from} to {to}',
    receiptChangedRule: 'rule {rule} changed from {from} to {to}',
    receiptChangedOrder: 'the rules now run in a different order ({rule} moved)',
    receiptRuleAdded: 'rule {rule} was added',
    receiptRuleRemoved: 'rule {rule} was removed',
    receiptUniverseAdded: '{symbol} joined the universe',
    receiptUniverseRemoved: '{symbol} left the universe',
    receiptChangedCost: 'the {field} assumption moved from {from} to {to}',
    receiptOtherStrategy: 'This receipt belongs to {id}, not to this strategy.',
    costCapital: 'capital',
    costFee: 'fee (bps)',
    costSlip: 'slippage (bps)',
    costTurnover: 'turnover',
    ledgerTitle: 'Drop ledger',
    ledgerHint: 'Why each name is not in today’s list. Sharia first, then the list in order: the first rule that stopped it, and the figure it read.',
    ledgerEvaluated: 'read',
    ledgerScreened: 'screened',
    ledgerRanked: 'ranked',
    ledgerExcluded: 'Dropped by a rule',
    ledgerUnproven: 'Not proven',
    ledgerPassed: 'Passed every rule',
    ledgerMeasured: 'measured',
    ledgerRule: 'Rule {n}',
    ledgerDemoNote: 'Demo tape of 5 names. A name the tape cannot measure is “not proven”, never a pass.',
    missingDividendHistory: 'the tape carries no dividend history',
    missingPriceHistory: 'the tape carries no price history for this window',
    missingMarginData: 'the tape carries no gross margin',
    missingSectorStats: 'no industry median on the tape',
    missingAaoifi: 'AAOIFI input missing',
    missingUnmappedRule: 'this rule has no data source yet',
    fieldDebt: 'debt',
    fieldInterestBearing: 'interest-bearing assets',
    fieldIncome: 'non-compliant income',
    fieldReceivables: 'receivables',
    marketTitle: 'Same rules, other markets',
    marketHint: 'A demo lens, not a market claim: the tape carries only a handful of names per market.',
    marketSa: 'Saudi',
    marketCn: 'China A',
    marketHk: 'Hong Kong',
    marketUs: 'United States',
    marketEvaluated: '{n} read',
    marketRanked: '{n} ranked',
    marketNoNames: 'no names',
    marketReasonUniverse: 'fewer names on the tape',
    marketReasonSectorMap: 'a name has no sector band',
    marketReasonAaoifi: 'AAOIFI inputs missing',
    marketGapNote: 'Shared gap: the sector rule also bans insurers, and the demo map has no insurer band — so the rule cannot be applied in full in any market.',
    pickTitle: 'Dated pick list',
    pickHint: 'Equal target weights across the names that clear every rule.',
    pickPrint: 'Print',
    pickCopy: 'Copy',
    pickCopied: 'Copied',
    pickAsOf: 'As of {date}',
    pickRules: 'Rules applied',
    pickNames: 'Name',
    pickWeight: 'Weight',
    pickPer100: 'Per 100',
    pickPrice: 'Price',
    pickEmpty: 'No name clears every rule on the demo tape today.',
    pickEmptyHint: 'Main blocker: {rule} stopped {n} of the names read.',
    pickEqualNote: 'Equal weight: {pct} each.',
    pickCopyHeader: '{name} — pick list',
    pickDemoNote: 'Sample picks from the demo tape; not investment advice.',
    jarTitle: 'The 100-riyal jar',
    jarHint: 'What 100 riyals becomes when it is split equally across the names that pass.',
    jarYear: 'Entry year',
    jarCoins: '{n} coins',
    jarShares: '{n} shares',
    jarCash: 'cash',
    jarEmpty: 'Nothing goes in the jar: no name clears every rule, so the 100 riyals stay in cash.',
    jarEmptyHint: 'One coin is one whole share. {rule} is the main blocker.',
    jarDeposit: 'Deposit',
    jarWhatIf: 'What-if price',
    jarDemo: 'Demo: coins are whole shares bought at the assumed price; leftover riyals stay as cash.',
    jarIdle: 'No picks, so the deposit does not grow: the strategy never held this money.',
    plainLabel: 'Plain words',
    plainNote: 'Rewrites the words only. Switch it off and the numbers are exactly the same.',
    plainUnchanged: 'Only the words changed. Every number on this screen is unchanged.',
    plainCost: 'In everyday words: trading costs money. Fees take {fees} and slippage takes {slip} — about {pct} of the final amount.',
    plainLuck: 'In everyday words: try enough ideas and one will look good by luck. This score is {pct}; below 95% means luck cannot be ruled out.',
    plainSummaryFallback: 'In everyday words: it keeps only the companies that clear every rule above, and drops the rest.',
    graveTitle: 'Strategy graveyard',
    graveLead: 'Strategies that stopped working. Each keeps the rule that broke it, and the day it broke.',
    graveRetiredOn: 'Retired {date}',
    graveBrokeOn: 'Broke on {date}',
    graveBrokeRule: 'Rule {n} — {rule}',
    graveNames: '{n} of {total} names fail it today; worst {symbol} at {value}.',
    graveNoMeasure: 'The tape cannot measure this rule, so the post-mortem is “no data”, not “no effect”.',
    graveHealed: 'Nothing fails this rule today, so it no longer binds.',
    graveRevive: 'Revive',
    graveCancel: 'Close',
    graveDiffTitle: 'What reviving would change',
    graveDiffHint: 'Nothing is restored silently: every condition that moves is listed.',
    graveDiffChanged: '{rule}: {from} → {to}',
    graveDiffAdded: '{rule}: new, {to}',
    graveDiffRemoved: '{rule}: removed',
    graveChipChanged: 'changed',
    graveChipAdded: 'added',
    graveChipRemoved: 'removed',
    graveConfirm: 'Revive with these rules',
    graveConfirmNote: 'Saving needs the strategy store; this demo does not include it.',
    graveLastReturn: 'Last 12 months',
    graveDemoNote: 'Sample strategies; the post-mortems are read off the demo tape.',
    graveListLink: 'Retired strategies',
    graveListCount: '{n} retired',
  },
  ar: {
    receiptTitle: 'إيصال التشغيل',
    receiptHint: 'يثبّت القواعد وتاريخ البيانات ومجموعة الأسهم وافتراضات التكلفة؛ الإيصال نفسه يعني الأرقام نفسها.',
    receiptCopy: 'انسخ رابط الإيصال',
    receiptCopied: 'تم نسخ الرابط',
    receiptOk: 'أُعيد إنتاجها',
    receiptMismatch: 'غير مطابق',
    receiptBadLink: 'تعذّرت قراءة الإيصال في هذا الرابط.',
    receiptHash: 'البصمة',
    receiptAsOf: 'حتى تاريخ',
    receiptRules: 'القواعد',
    receiptUniverse: 'مجموعة الأسهم',
    receiptCosts: 'التكاليف',
    receiptScope: 'الإيصال يعيد إنتاج الشاشة: الأسماء والقواعد والتكاليف نفسها، لكنه لا يعيد إنتاج العائد المسجّل؛ فبيانات العرض تحمل 5 أسهم فقط.',
    receiptChangedAsOf: 'تغيّر تاريخ البيانات من {from} إلى {to}',
    receiptChangedRule: 'تغيّرت القاعدة {rule} من {from} إلى {to}',
    receiptChangedOrder: 'تغيّر ترتيب القواعد ({rule})',
    receiptRuleAdded: 'أُضيفت القاعدة {rule}',
    receiptRuleRemoved: 'حُذفت القاعدة {rule}',
    receiptUniverseAdded: '{symbol} دخل المجموعة',
    receiptUniverseRemoved: '{symbol} خرج من المجموعة',
    receiptChangedCost: 'تغيّر افتراض {field} من {from} إلى {to}',
    receiptOtherStrategy: 'هذا الإيصال يخص {id} لا هذه الخطة.',
    costCapital: 'رأس المال',
    costFee: 'الرسوم (نقطة أساس)',
    costSlip: 'الانزلاق (نقطة أساس)',
    costTurnover: 'معدل الدوران',
    ledgerTitle: 'سجل الاستبعاد',
    ledgerHint: 'لماذا لا يظهر كل سهم في قائمة اليوم: الفحص الشرعي أولًا ثم القواعد بالترتيب، وأول قاعدة أوقفته والرقم الذي قرأته.',
    ledgerEvaluated: 'قُرئ',
    ledgerScreened: 'اجتاز الفحص',
    ledgerRanked: 'دخل الترتيب',
    ledgerExcluded: 'استُبعد بقاعدة',
    ledgerUnproven: 'غير مُثبت',
    ledgerPassed: 'اجتاز كل القواعد',
    ledgerMeasured: 'المقيس',
    ledgerRule: 'القاعدة {n}',
    ledgerDemoNote: 'بيانات العرض تحمل 5 أسهم: ما لا يمكن قياسه يُكتب «غير مُثبت» ولا يُعدّ اجتيازًا.',
    missingDividendHistory: 'لا تحمل البيانات تاريخ توزيعات',
    missingPriceHistory: 'لا تحمل البيانات تاريخ أسعار لهذه الفترة',
    missingMarginData: 'لا تحمل البيانات الهامش الإجمالي',
    missingSectorStats: 'لا يوجد وسيط قطاع في البيانات',
    missingAaoifi: 'مدخل AAOIFI ناقص',
    missingUnmappedRule: 'لا مصدر بيانات لهذه القاعدة بعد',
    fieldDebt: 'الدين',
    fieldInterestBearing: 'الأصول ذات الفائدة',
    fieldIncome: 'دخل غير متوافق',
    fieldReceivables: 'الذمم المدينة',
    marketTitle: 'القواعد نفسها، أسواق أخرى',
    marketHint: 'عدسة عرض لا حكم سوق: البيانات تحمل أسهمًا قليلة لكل سوق.',
    marketSa: 'السعودية',
    marketCn: 'الصين أ',
    marketHk: 'هونغ كونغ',
    marketUs: 'الولايات المتحدة',
    marketEvaluated: 'قُرئ {n}',
    marketRanked: 'دخل {n}',
    marketNoNames: 'لا أسهم',
    marketReasonUniverse: 'أسهم أقل في البيانات',
    marketReasonSectorMap: 'سهم بلا شريحة قطاعية',
    marketReasonAaoifi: 'مدخلات AAOIFI ناقصة',
    marketGapNote: 'ثغرة مشتركة: قاعدة القطاع تستبعد التأمين أيضًا، وخريطة العرض بلا شريحة تأمين، فلا تُطبَّق القاعدة كاملة في أي سوق.',
    pickTitle: 'قائمة اليوم',
    pickHint: 'أوزان متساوية للأسماء التي تجتاز كل القواعد.',
    pickPrint: 'طباعة',
    pickCopy: 'نسخ',
    pickCopied: 'تم النسخ',
    pickAsOf: 'حتى {date}',
    pickRules: 'القواعد المطبَّقة',
    pickNames: 'السهم',
    pickWeight: 'الوزن',
    pickPer100: 'لكل 100',
    pickPrice: 'السعر',
    pickEmpty: 'لا سهم يجتاز كل القواعد في بيانات اليوم.',
    pickEmptyHint: 'العائق الأكبر: {rule} أوقفت {n} سهمًا.',
    pickEqualNote: 'وزن متساوٍ: {pct} لكل سهم.',
    pickCopyHeader: '{name} — قائمة اليوم',
    pickDemoNote: 'قائمة تجريبية من بيانات العرض وليست نصيحة استثمارية.',
    jarTitle: 'جرة المئة ريال',
    jarHint: 'ماذا يصير 100 ريال إذا قُسّمت بالتساوي على الأسماء المجتازة.',
    jarYear: 'سنة الدخول',
    jarCoins: '{n} قطعة',
    jarShares: '{n} سهم',
    jarCash: 'نقد',
    jarEmpty: 'لا شيء يدخل الجرة: لا سهم يجتاز كل القواعد، فيبقى المئة ريال نقدًا.',
    jarEmptyHint: 'القطعة سهم كامل، والعائق الأكبر {rule}.',
    jarDeposit: 'الإيداع',
    jarWhatIf: 'سعر افتراضي',
    jarDemo: 'عرض: القطع أسهم كاملة بالسعر المفترض، والباقي يبقى نقدًا.',
    jarIdle: 'لا أسماء، فلا ينمو الإيداع: الخطة لم تحتفظ بهذا المال.',
    plainLabel: 'بكلام بسيط',
    plainNote: 'يغيّر الصياغة فقط؛ أطفئه وتبقى الأرقام كما هي.',
    plainUnchanged: 'تغيّرت الكلمات فقط، وكل رقم في الشاشة كما هو.',
    plainCost: 'ببساطة: التداول مكلّف. الرسوم تأخذ {fees} والانزلاق يأخذ {slip}، أي نحو {pct} من المبلغ النهائي.',
    plainLuck: 'ببساطة: كلما جرّبت أفكارًا أكثر بدا أحدها جيدًا بالحظ. الدرجة {pct}، وما دون 95% يعني أن الحظ لم يُستبعد.',
    plainSummaryFallback: 'ببساطة: يُبقي الشركات التي تجتاز كل القواعد أعلاه ويستبعد الباقي.',
    graveTitle: 'مقبرة الخطط',
    graveLead: 'خطط توقفت عن العمل؛ كل واحدة تحتفظ بالقاعدة التي كسرتها ويوم كسرها.',
    graveRetiredOn: 'أُوقفت في {date}',
    graveBrokeOn: 'انهارت في {date}',
    graveBrokeRule: 'القاعدة {n} — {rule}',
    graveNames: 'يفشل فيها اليوم {n} من {total}: الأسوأ {symbol} عند {value}.',
    graveNoMeasure: 'لا يمكن قياس هذه القاعدة في البيانات، فالنتيجة «لا بيانات» لا «لا أثر».',
    graveHealed: 'لا سهم يفشل فيها اليوم، فلم تعد تُقيّد شيئًا.',
    graveRevive: 'إحياء',
    graveCancel: 'إغلاق',
    graveDiffTitle: 'ما الذي سيغيّره الإحياء',
    graveDiffHint: 'لا استعادة صامتة: كل شرط سيتغيّر مذكور.',
    graveDiffChanged: '{rule}: {from} → {to}',
    graveDiffAdded: '{rule}: جديد، {to}',
    graveDiffRemoved: '{rule}: محذوف',
    graveChipChanged: 'تغيير',
    graveChipAdded: 'إضافة',
    graveChipRemoved: 'حذف',
    graveConfirm: 'أحيِ بهذه القواعد',
    graveConfirmNote: 'الحفظ يحتاج مخزن الخطط، وهذه النسخة لا تتضمنه.',
    graveLastReturn: 'آخر 12 شهرًا',
    graveDemoNote: 'خطط تجريبية؛ أسباب الوفاة مقروءة من بيانات العرض.',
    graveListLink: 'خطط موقوفة',
    graveListCount: '{n} موقوفة',
  },
} satisfies Dict<FeatureStrings>
