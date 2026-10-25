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
  cap2Prompt: string
  cap3Prompt: string
  cap4Prompt: string
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

  thinking: string
  working: string
  answering: string
  toolsUnit: string
  reasoning: string
  failed: string
  cancelled: string
  runTitle: string
  modelLabel: string
  connected: string
  offline: string
  connecting: string
  demoStatus: string
  connectProvider: string
  providerSettings: string
  noAnswer: string
  errLoad: string
  errTimeout: string
  errCreate: string
  errSend: string
  jumpLatest: string
  history: string
  workspace: string
  metricReturn: string
  metricAnnual: string
  metricSharpe: string
  metricDrawdown: string
  metricWin: string
  metricTrades: string
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
    cap2Prompt: '解释一下沙特阿美今天为什么涨跌，接下来该看什么。',
    cap3Prompt: '对比沙特阿美和沙特基础工业的估值与风险。',
    cap4Prompt: '读一下沙特阿美最新的新闻，告诉我它影响谁。',
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
    thinking: '思考中',
    working: '调用工具',
    answering: '写答案',
    toolsUnit: '个工具',
    reasoning: '推理过程',
    failed: '这次运行失败了',
    cancelled: '已停止',
    runTitle: '回测结果',
    modelLabel: '模型',
    connected: '本地 Agent 已连接',
    offline: '本地 Agent 未连接',
    connecting: '正在连接本地 Agent',
    demoStatus: '演示模式 · 预录回复',
    connectProvider: '连接 API',
    providerSettings: 'API 设置',
    noAnswer: '这次运行没有返回答案。',
    errLoad: '这次对话没能加载，请重试。',
    errTimeout: '两分钟内没有完成，请重试。',
    errCreate: '没能创建对话，请重试。',
    errSend: '消息没有发出去，请重试。',
    jumpLatest: '回到最新',
    history: '历史会话',
    workspace: '工作台',
    metricReturn: '总收益',
    metricAnnual: '年化',
    metricSharpe: '夏普',
    metricDrawdown: '最大回撤',
    metricWin: '胜率',
    metricTrades: '交易数',
    addWatch: '加入自选',
    addedWatch: '已加入自选',
    saveStrategy: '保存为策略',
    savedStrategy: '已保存',
    sources: '来源',
    runs: '历史',
    disclaimer: '仅供研究，不构成投资建议。',
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
    cap2Prompt: 'Explain why Saudi Aramco moved today and what to watch next.',
    cap3Prompt: 'Compare Saudi Aramco and SABIC on valuation and risk.',
    cap4Prompt: 'Read the latest news on Saudi Aramco and tell me who it affects.',
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
    thinking: 'Thinking',
    working: 'Using a tool',
    answering: 'Writing',
    toolsUnit: 'tools',
    reasoning: 'Reasoning',
    failed: 'This run failed',
    cancelled: 'Stopped',
    runTitle: 'Backtest result',
    modelLabel: 'Model',
    connected: 'Local agent connected',
    offline: 'Local agent offline',
    connecting: 'Connecting to the local agent',
    demoStatus: 'Demo mode · pre-recorded replies',
    connectProvider: 'Connect API',
    providerSettings: 'API settings',
    noAnswer: 'This run ended without an answer.',
    errLoad: 'This conversation could not load. Try again.',
    errTimeout: 'The agent did not finish in two minutes. Try again.',
    errCreate: 'Could not create a conversation. Try again.',
    errSend: 'The message did not send. Try again.',
    jumpLatest: 'Jump to latest',
    history: 'Session history',
    workspace: 'Workspace',
    metricReturn: 'Total return',
    metricAnnual: 'Annual',
    metricSharpe: 'Sharpe',
    metricDrawdown: 'Max drawdown',
    metricWin: 'Win rate',
    metricTrades: 'Trades',
    addWatch: 'Add to watchlist',
    addedWatch: 'In watchlist',
    saveStrategy: 'Save as strategy',
    savedStrategy: 'Saved',
    sources: 'Sources',
    runs: 'History',
    disclaimer: 'Research only. Not investment advice.',
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
    cap2Prompt: 'اشرح لماذا تحرك سهم أرامكو اليوم وما الذي يجب متابعته.',
    cap3Prompt: 'قارن أرامكو وسابك من حيث التقييم والمخاطر.',
    cap4Prompt: 'اقرأ آخر أخبار أرامكو وقل لي من يتأثر بها.',
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
    thinking: 'يفكّر',
    working: 'يستخدم أداة',
    answering: 'يكتب',
    toolsUnit: 'أدوات',
    reasoning: 'مسار التفكير',
    failed: 'فشل هذا التشغيل',
    cancelled: 'أُوقف',
    runTitle: 'نتيجة الاختبار',
    modelLabel: 'النموذج',
    connected: 'الوكيل المحلي متصل',
    offline: 'الوكيل المحلي غير متصل',
    connecting: 'جارٍ الاتصال بالوكيل المحلي',
    demoStatus: 'وضع العرض · ردود مسجلة',
    connectProvider: 'اربط API',
    providerSettings: 'إعدادات API',
    noAnswer: 'انتهى التشغيل دون إجابة.',
    errLoad: 'تعذر تحميل المحادثة. حاول مجددًا.',
    errTimeout: 'لم ينتهِ الوكيل خلال دقيقتين. حاول مجددًا.',
    errCreate: 'تعذر إنشاء محادثة. حاول مجددًا.',
    errSend: 'لم تُرسل الرسالة. حاول مجددًا.',
    jumpLatest: 'الانتقال إلى الأحدث',
    history: 'سجل الجلسات',
    workspace: 'مساحة العمل',
    metricReturn: 'العائد الكلي',
    metricAnnual: 'السنوي',
    metricSharpe: 'شارب',
    metricDrawdown: 'أقصى تراجع',
    metricWin: 'نسبة الفوز',
    metricTrades: 'الصفقات',
    addWatch: 'إضافة إلى المتابعة',
    addedWatch: 'في المتابعة',
    saveStrategy: 'حفظ كخطة',
    savedStrategy: 'تم الحفظ',
    sources: 'المصادر',
    runs: 'السجل',
    disclaimer: 'للبحث فقط، وليست نصيحة استثمارية.',
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
