import type { Dict } from '../../i18n'

export type AiStrings = {
  promise: string
  placeholder: string
  send: string
  addObject: string
  remove: string
  sheetTitle: string
  sheetLimit: string
  noMore: string
  sectorLabel: string
  capTitle: string
  reviewLink: string
  cap1t: string
  cap1h: string
  cap2t: string
  cap2h: string
  cap3t: string
  cap3h: string
  cap4t: string
  cap4h: string
  cap5t: string
  cap5h: string
  cap6t: string
  cap6h: string
  typing: string
  artifactCount: string
  artifactEmpty: string
  editRules: string
  offlineSend: string
  answerReady: string
  demoNote: string
  threadLabel: string
  addWatch: string
  addedWatch: string
  saveStrategy: string
  savedStrategy: string
  sources: string
  runs: string
  disclaimer: string
  close: string
  presetValue: string
  presetValuePrompt: string
  presetDividend: string
  presetDividendPrompt: string
  presetSharia: string
  presetShariaPrompt: string
  presetMomentum: string
  presetMomentumPrompt: string
  stepUnderstand: string
  stepRead: string
  stepConclude: string
  stepsUnit: string
  secUnit: string
  evVol: string
  evAbove: string
}

export const strings = {
  zh: {
    promise: '用一句话问，看懂能买什么、为什么。',
    placeholder: '问点具体的，比如：有什么便宜又稳的？',
    send: '发送',
    addObject: '添加',
    remove: '移除',
    sheetTitle: '把哪件事放进对话？',
    sheetLimit: '最多 6 个',
    noMore: '能加的都加进来了',
    sectorLabel: '板块',
    capTitle: '能帮你做什么',
    reviewLink: '打开今日复盘',
    cap1t: '帮我选股', cap1h: '说一句条件就行',
    cap2t: '看一只股票', cap2h: '它为什么涨跌',
    cap3t: '对比两家', cap3h: '同一行业谁更好',
    cap4t: '读懂新闻', cap4h: '这条消息影响谁',
    cap5t: '读一条策略', cap5h: '为什么这两年失效',
    cap6t: '按教法筛', cap6h: '先过 Sharia 再排名',
    typing: '正在回复',
    artifactCount: '5 只',
    artifactEmpty: '演示样本里没有符合的股票。',
    editRules: '在筛选器里改',
    offlineSend: '当前离线。恢复网络后再试。',
    answerReady: '回答完成',
    demoNote: '演示：固定回复 + 本地样本，不是真实回测。',
    threadLabel: '对话',
    addWatch: '加入自选',
    addedWatch: '已加入自选',
    saveStrategy: '保存为策略',
    savedStrategy: '已保存',
    sources: '来源',
    runs: '历史',
    disclaimer: '演示数据，不构成投资建议。',
    close: '关闭',
    presetValue: '低估值',
    presetValuePrompt: '按低估值帮我筛一遍：市盈率低、负债不高。',
    presetDividend: '高股息',
    presetDividendPrompt: '高股息的有哪些？股息率 3% 以上、还在提高派息。',
    presetSharia: '教法筛选',
    presetShariaPrompt: '先过教法筛选，再按基本面排名。',
    presetMomentum: '动量',
    presetMomentumPrompt: '最近六个月动量最强的有哪些？',
    stepUnderstand: '理解问题',
    stepRead: '读取行情',
    stepConclude: '生成结论',
    stepsUnit: '步',
    secUnit: 's',
    evVol: '近 20 日波动',
    evAbove: '现价对 20 日均值',
  },
  en: {
    promise: 'Ask in plain words. See what fits and why.',
    placeholder: 'Try: anything cheap and steady right now?',
    send: 'Send',
    addObject: 'Add',
    remove: 'Remove',
    sheetTitle: 'What should I look at?',
    sheetLimit: 'Up to 6',
    noMore: 'Everything is already in the thread',
    sectorLabel: 'Sector',
    capTitle: 'What I can do',
    reviewLink: "Open today's review",
    cap1t: 'Find stocks', cap1h: 'Start with one sentence',
    cap2t: 'Explain a stock', cap2h: 'Why it moved',
    cap3t: 'Compare two', cap3h: 'Who is better in the sector',
    cap4t: 'Read the news', cap4h: 'Who this affects',
    cap5t: 'Read a strategy', cap5h: 'Why it stopped working',
    cap6t: 'Sharia screen', cap6h: 'Filter before ranking',
    typing: 'Replying',
    artifactCount: '5 names',
    artifactEmpty: 'No symbol in the demo sample matches.',
    editRules: 'Edit in screener',
    offlineSend: 'You are offline. Reconnect and retry.',
    answerReady: 'Answer ready',
    demoNote: 'Demo: scripted replies and a local sample, not a real backtest.',
    threadLabel: 'Conversation',
    addWatch: 'Add to watchlist',
    addedWatch: 'In watchlist',
    saveStrategy: 'Save as strategy',
    savedStrategy: 'Saved',
    sources: 'Sources',
    runs: 'History',
    disclaimer: 'Demo data. Not investment advice.',
    close: 'Close',
    presetValue: 'Value',
    presetValuePrompt: 'Screen for low valuation: modest P/E and low debt.',
    presetDividend: 'Income',
    presetDividendPrompt: 'Which names pay high dividends? Yield above 3% and still rising.',
    presetSharia: 'Sharia',
    presetShariaPrompt: 'Run the Sharia screen first, then rank on fundamentals.',
    presetMomentum: 'Momentum',
    presetMomentumPrompt: 'Which names have the strongest six-month momentum?',
    stepUnderstand: 'Understanding the question',
    stepRead: 'Reading the market',
    stepConclude: 'Writing the answer',
    stepsUnit: 'steps',
    secUnit: 's',
    evVol: '20-day volatility',
    evAbove: 'Price vs 20-day mean',
  },
  ar: {
    promise: 'اسأل بكلمات بسيطة، وشاهد ما يناسبك ولماذا.',
    placeholder: 'جرّب: ما الأسهم الرخيصة والمستقرة الآن؟',
    send: 'إرسال',
    addObject: 'إضافة',
    remove: 'حذف',
    sheetTitle: 'ما الذي تريد أن أنظر إليه؟',
    sheetLimit: 'حتى 6 عناصر',
    noMore: 'كل العناصر موجودة أصلًا',
    sectorLabel: 'قطاع',
    capTitle: 'ما أستطيع فعله',
    reviewLink: 'افتح مراجعة اليوم',
    cap1t: 'ابحث عن أسهم', cap1h: 'جملة واحدة تكفي',
    cap2t: 'اشرح سهمًا', cap2h: 'لماذا تحرك',
    cap3t: 'قارن بين سهمين', cap3h: 'أيهما أفضل في القطاع',
    cap4t: 'اقرأ الخبر', cap4h: 'من يتأثر به',
    cap5t: 'اقرأ خطة', cap5h: 'لماذا توقفت عن العمل',
    cap6t: 'فحص شرعي', cap6h: 'التصفية قبل الترتيب',
    typing: 'جارٍ الرد',
    artifactCount: '5 أسهم',
    artifactEmpty: 'لا يوجد سهم مطابق في العينة التجريبية.',
    editRules: 'عدّل في الفرز',
    offlineSend: 'أنت غير متصل. أعد الاتصال ثم حاول مجددًا.',
    answerReady: 'اكتمل الرد',
    demoNote: 'عرض: ردود ثابتة وعينة محلية، وليس اختبارًا تاريخيًا حقيقيًا.',
    threadLabel: 'المحادثة',
    addWatch: 'إضافة إلى المتابعة',
    addedWatch: 'في المتابعة',
    saveStrategy: 'حفظ كخطة',
    savedStrategy: 'تم الحفظ',
    sources: 'المصادر',
    runs: 'السجل',
    disclaimer: 'بيانات عرض، وليست نصيحة استثمارية.',
    close: 'إغلاق',
    presetValue: 'قيمة منخفضة',
    presetValuePrompt: 'رشّح لي بالقيمة المنخفضة: مكرر ربحية منخفض ودين محدود.',
    presetDividend: 'توزيعات مرتفعة',
    presetDividendPrompt: 'ما الأسهم ذات التوزيعات المرتفعة؟ عائد فوق 3% ويرتفع باستمرار.',
    presetSharia: 'فحص شرعي',
    presetShariaPrompt: 'طبّق الفحص الشرعي أولًا ثم رتّب على الأساسيات.',
    presetMomentum: 'زخم',
    presetMomentumPrompt: 'ما أقوى الأسهم زخمًا خلال الأشهر الستة الماضية؟',
    stepUnderstand: 'فهم السؤال',
    stepRead: 'قراءة الأسعار',
    stepConclude: 'صياغة الخلاصة',
    stepsUnit: 'خطوات',
    secUnit: 'ث',
    evVol: 'تقلب 20 يومًا',
    evAbove: 'السعر مقابل متوسط 20 يومًا',
  },
} satisfies Dict<AiStrings>
