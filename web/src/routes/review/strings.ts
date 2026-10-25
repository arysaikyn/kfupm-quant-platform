import type { Dict } from '../../i18n'

type Strings = {
  title: string
  share: string
  breadthLabel: string
  namesUp: string
  namesDown: string
  namesFlat: string
  bestLabel: string
  worstLabel: string
  /** `{score}` is always an isolated `up–down` pair, so Arabic never reorders it. */
  verdictUp: string
  verdictDown: string
  verdictFlat: string
  rotationLabel: string
  axisX: string
  axisY: string
  tapHint: string
  weightLabel: string
  watchLabel: string
  watchEmpty: string
  takeLabel: string
  takeLead: string
  takeBreadthDown: string
  takeBreadthAllUp: string
  takeBreadthAllFlat: string
  takeWeighted: string
  confTitle: string
  confIntro: string
  confScore: string
  confVsCoin: string
  confBetter: string
  confWorse: string
  confLevel: string
  /** `{n}` is the number of settled calls behind the score. */
  confSample: string
  confCalibration: string
  confBucketLow: string
  confBucketMid: string
  confBucketHigh: string
  confSampleNote: string
  confFormTitle: string
  confSymbol: string
  confDir: string
  confUp: string
  confDown: string
  confFlat: string
  confConfidence: string
  confScale: string
  confSubmit: string
  confLogged: string
  confOpen: string
  confResolve: string
  confLog: string
  confSaid: string
  confHitRate: string
  /** `{n}` is the number of settled calls in a confidence band. */
  confCalls: string
  confActual: string
  confHitChip: string
  confMissChip: string
  confEmptyScore: string
  confBarLegend: string
}

export const strings = {
  zh: {
    title: '复盘',
    share: '复制链接',
    breadthLabel: '市场宽度',
    namesUp: '上涨',
    namesDown: '下跌',
    namesFlat: '持平',
    bestLabel: '最强',
    worstLabel: '最弱',
    verdictUp: '多方占优 {score}，加权变动 {pct}。',
    verdictDown: '空方占优 {score}，加权变动 {pct}。',
    verdictFlat: '涨跌持平 {score}，加权变动 {pct}。',
    rotationLabel: '板块轮动',
    axisX: '横轴 · 今日涨跌',
    axisY: '纵轴 · 权重',
    tapHint: '点一个圆点，看该板块明细',
    weightLabel: '权重',
    watchLabel: '今日自选',
    watchEmpty: '自选还是空的。去行情页点星标，加一只进来。',
    takeLabel: '三点结论',
    takeLead: '{leader} 领先 {follower} {gap} 个百分点',
    takeBreadthDown: '{total} 只标的里 {down} 只下跌',
    takeBreadthAllUp: '全部 {total} 只标的上涨',
    takeBreadthAllFlat: '全部 {total} 只标的走平',
    takeWeighted: '加权指数变动 {pct}',
    confTitle: '判断账本',
    confIntro:
      '给下一周的方向记一笔判断，标上 1–5 的把握。它只衡量你自己的准确度：没有钱、没有奖励，也不构成建议。',
    confScore: 'Brier 分数',
    confVsCoin: '硬币基准 0.25',
    confBetter: '比硬币准',
    confWorse: '还不如硬币',
    confLevel: '和硬币持平',
    confSample: '基于 {n} 次已结算判断',
    confCalibration: '校准 · 你说的 vs 实际',
    confBucketLow: '把握 1–2',
    confBucketMid: '把握 3',
    confBucketHigh: '把握 4–5',
    confSampleNote: '样例数据：结算读的是样例走势里最近一周，不是真实结果。',
    confFormTitle: '记一笔下周判断',
    confSymbol: '标的',
    confDir: '方向',
    confUp: '上涨',
    confDown: '下跌',
    confFlat: '走平',
    confConfidence: '把握程度',
    confScale: '1 约两成把握 · 5 是十成',
    confSubmit: '记下这笔',
    confLogged: '已记下，等下周结算。',
    confOpen: '待结算',
    confResolve: '用样例周结算',
    confLog: '记录',
    confSaid: '你说',
    confHitRate: '命中',
    confCalls: '{n} 次',
    confActual: '实际',
    confHitChip: '对了',
    confMissChip: '错了',
    confEmptyScore: '还没有结算过的判断。',
    confBarLegend: '长条 = 实际命中率',
  },
  en: {
    title: 'Daily review',
    share: 'Copy link',
    breadthLabel: 'Market breadth',
    namesUp: 'up',
    namesDown: 'down',
    namesFlat: 'flat',
    bestLabel: 'Best',
    worstLabel: 'Worst',
    verdictUp: 'Buyers lead {score}; weighted move {pct}.',
    verdictDown: 'Sellers lead {score}; weighted move {pct}.',
    verdictFlat: 'Split tape at {score}; weighted move {pct}.',
    rotationLabel: 'Sector rotation',
    axisX: 'x · change today',
    axisY: 'y · index weight',
    tapHint: 'Tap a dot to inspect a sector',
    weightLabel: 'Weight',
    watchLabel: 'Your watchlist today',
    watchEmpty: 'Nothing watched yet. Star a name on Market to add it.',
    takeLabel: 'Three takeaways',
    takeLead: '{leader} leads {follower} by {gap}pp',
    takeBreadthDown: '{down} of {total} names are down',
    takeBreadthAllUp: 'All {total} names are up',
    takeBreadthAllFlat: 'All {total} names are flat',
    takeWeighted: 'Weighted tape moved {pct}',
    confTitle: 'Confidence book',
    confIntro:
      'Log a direction call for next week and rate your confidence 1–5. It only measures your own accuracy: no money, no reward, no advice.',
    confScore: 'Brier score',
    confVsCoin: 'coin baseline 0.25',
    confBetter: 'Sharper than a coin',
    confWorse: 'Worse than a coin',
    confLevel: 'Level with a coin',
    confSample: 'from {n} resolved calls',
    confCalibration: 'Calibration · you said vs what happened',
    confBucketLow: 'Confidence 1–2',
    confBucketMid: 'Confidence 3',
    confBucketHigh: 'Confidence 4–5',
    confSampleNote: 'Sample data: a settlement reads the latest week of the sample path, not a real result.',
    confFormTitle: 'Call next week',
    confSymbol: 'Symbol',
    confDir: 'Direction',
    confUp: 'Up',
    confDown: 'Down',
    confFlat: 'Flat',
    confConfidence: 'Confidence',
    confScale: '1 is roughly 20% sure, 5 is certain',
    confSubmit: 'Log this call',
    confLogged: 'Logged. It settles next week.',
    confOpen: 'Open',
    confResolve: 'Score on the sample week',
    confLog: 'Call log',
    confSaid: 'Said',
    confHitRate: 'Hit',
    confCalls: '{n} calls',
    confActual: 'Actual',
    confHitChip: 'Hit',
    confMissChip: 'Miss',
    confEmptyScore: 'No resolved calls yet.',
    confBarLegend: 'Bar = hit rate',
  },
  ar: {
    title: 'المراجعة اليومية',
    share: 'نسخ الرابط',
    breadthLabel: 'اتساع السوق',
    namesUp: 'صاعد',
    namesDown: 'هابط',
    namesFlat: 'ثابت',
    bestLabel: 'الأقوى',
    worstLabel: 'الأضعف',
    verdictUp: 'المشترون في المقدّمة {score}، والتحرّك المرجّح {pct}.',
    verdictDown: 'البائعون في المقدّمة {score}، والتحرّك المرجّح {pct}.',
    verdictFlat: 'تعادل الطرفان {score}، والتحرّك المرجّح {pct}.',
    rotationLabel: 'دوران القطاعات',
    axisX: 'أفقي · تغيّر اليوم',
    axisY: 'رأسي · وزن المؤشر',
    tapHint: 'اضغط على نقطة لعرض تفاصيل القطاع',
    weightLabel: 'الوزن',
    watchLabel: 'قائمة متابعتك اليوم',
    watchEmpty: 'لا أسهم في المتابعة بعد. أضف سهمًا بالنجمة من صفحة السوق.',
    takeLabel: 'ثلاث ملاحظات',
    takeLead: '{leader} يتقدّم على {follower} بـ{gap} نقطة مئوية',
    takeBreadthDown: '{down} من أصل {total} أسماء هابطة',
    takeBreadthAllUp: 'الأسماء الـ{total} كلها صاعدة',
    takeBreadthAllFlat: 'الأسماء الـ{total} كلها ثابتة',
    takeWeighted: 'المؤشر المرجّح تحرّك {pct}',
    confTitle: 'دفتر الثقة',
    confIntro:
      'سجّل توقّع اتجاه الأسبوع القادم وحدّد ثقتك من 1 إلى 5. يقيس دقّتك أنت فقط: لا مال ولا مكافأة ولا نصيحة.',
    confScore: 'درجة برير',
    confVsCoin: 'أساس العملة المعدنية 0.25',
    confBetter: 'أدقّ من عملة معدنية',
    confWorse: 'أضعف من عملة معدنية',
    confLevel: 'بمستوى عملة معدنية',
    confSample: 'من {n} توقّعات محسومة',
    confCalibration: 'المعايرة · ما قلته مقابل ما حدث',
    confBucketLow: 'ثقة 1–2',
    confBucketMid: 'ثقة 3',
    confBucketHigh: 'ثقة 4–5',
    confSampleNote: 'بيانات عيّنة: الحساب يقرأ آخر أسبوع في مسار العيّنة، وليس نتيجة حقيقية.',
    confFormTitle: 'توقّع الأسبوع القادم',
    confSymbol: 'السهم',
    confDir: 'الاتجاه',
    confUp: 'صاعد',
    confDown: 'هابط',
    confFlat: 'ثابت',
    confConfidence: 'مستوى الثقة',
    confScale: '1 نحو 20٪، و5 ثقة تامة',
    confSubmit: 'سجّل التوقّع',
    confLogged: 'تم التسجيل، ويُحسم الأسبوع القادم.',
    confOpen: 'قيد الانتظار',
    confResolve: 'احسبه على أسبوع العيّنة',
    confLog: 'السجل',
    confSaid: 'قلت',
    confHitRate: 'أصبت',
    confCalls: '{n} توقعات',
    confActual: 'الفعلي',
    confHitChip: 'إصابة',
    confMissChip: 'خطأ',
    confEmptyScore: 'لا توقّعات محسومة بعد.',
    confBarLegend: 'الشريط = نسبة الإصابة',
  },
} satisfies Dict<Strings>
