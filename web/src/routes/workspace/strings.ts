import type { Dict } from '../../i18n'

export type WorkspaceStrings = {
  title: string
  subtitle: string
  back: string
  runs: string
  paper: string
  portfolio: string
  alphas: string
  scheduled: string
  model: string
  tools: string
  upload: string
  uploadHint: string
  uploaded: string
  deepResearch: string
  deepResearchPrompt: string
  swarm: string
  swarmPrompt: string
  options: string
  optionsPrompt: string
  correlation: string
  correlationPrompt: string
  runPrompt: string
  alphaPrompt: string
  paperPrompt: string
  scheduledPrompt: string
  portfolioPrompt: string
  askAi: string
  loading: string
  error: string
  retry: string
  empty: string
  emptyRuns: string
  emptyPortfolio: string
  emptyPaper: string
  emptyAlphas: string
  emptyScheduled: string
  startBacktest: string
  startPaper: string
  startAlpha: string
  startSchedule: string
  statusSuccess: string
  statusCompleted: string
  statusCancelled: string
  statusFailed: string
  statusActive: string
  statusPaused: string
  total: string
  uploadDrag: string
  uploading: string
  filePrompt: string
  removeFile: string
  status: string
  date: string
  totalReturn: string
  sharpe: string
  codes: string
  label: string
  market: string
  cash: string
  positions: string
  totalUsd: string
  totalCny: string
  complete: string
  incomplete: string
  warnings: string
  zoo: string
  universe: string
  schedule: string
  nextRun: string
  provider: string
  modelName: string
  baseUrl: string
  keyConfigured: string
  keyMissing: string
  auth: string
  yes: string
  no: string
  modelSavedNote: string
  demoNotice: string
  rebalanceTitle: string
  rebalancePreview: string
  rebalanceHint: string
  rebalanceEntering: string
  rebalanceLeaving: string
  rebalanceUnchanged: string
  rebalanceEmpty: string
  rebalanceClears: string
  rebalanceNotTarget: string
  rebalanceScope: string
  providerSettings: string
  none: string
  snapshots: string
  snapshotFreeze: string
  snapshotName: string
  snapshotNamePlaceholder: string
  snapshotSave: string
  snapshotCancel: string
  snapshotEmpty: string
  snapshotLocal: string
  snapshotFrozen: string
  snapshotDemo: string
  snapshotCompare: string
  snapshotRewind: string
  snapshotAdded: string
  snapshotDropped: string
  snapshotCashDelta: string
  snapshotNoChange: string
  snapshotRestore: string
  snapshotDrop: string
  snapshotRewindNote: string
  snapshotRemove: string
  snapshotConfirmRemove: string
  scheduledRuns: string
  routeTitle: string
  routeHint: string
  routeRun: string
  routeRunAgain: string
  routeWalking: string
  routeDone: string
  routeDoneStop: string
  routeNextStart: string
  routeFinishes: string
  routeSkipped: string
  routeWaiting: string
  routeNow: string
  routeStops: string
  routeKindScreen: string
  routeKindWatchlist: string
  routeKindStrategy: string
  routeKindNews: string
  routeRulesCount: string
  routeSymbolsCount: string
  routeStoriesCount: string
  routeSkipNoScreens: string
  routeSkipNoWatchlists: string
  routeSkipNoStrategies: string
  routeSkipNoNews: string
  routeDemoNote: string
}

const en: WorkspaceStrings = {
  title: 'Workspace',
  subtitle: 'Everything the local agent can do, without a second app.',
  back: 'Back',
  runs: 'Runs',
  paper: 'Paper',
  portfolio: 'Portfolio',
  alphas: 'Alphas',
  scheduled: 'Scheduled',
  model: 'Model',
  tools: 'Tools',
  upload: 'Upload a file',
  uploadHint: 'PDF, Word, Excel, CSV, text or image. The agent reads the path.',
  uploaded: 'Uploaded',
  deepResearch: 'Deep research',
  deepResearchPrompt: 'Start a deep research goal on: ',
  swarm: 'Swarm',
  swarmPrompt: 'Run a swarm to research: ',
  options: 'Options',
  optionsPrompt: 'Analyze an options strategy on: ',
  correlation: 'Correlation',
  correlationPrompt: 'Show the correlation regime for these symbols: ',
  runPrompt: 'Explain backtest run {id} and its metrics.',
  alphaPrompt: 'Benchmark alpha {id} and explain the result.',
  paperPrompt: 'Advance paper account {id} to today and report the positions.',
  scheduledPrompt: 'Explain scheduled research {id}.',
  portfolioPrompt: 'Review my portfolio and explain the risks.',
  askAi: 'Ask AI',
  loading: 'Loading…',
  error: 'The AI backend could not load this.',
  retry: 'Retry',
  empty: 'Nothing here yet.',
  emptyRuns: 'No runs yet. Ask for a backtest to start one.',
  emptyPortfolio: 'No portfolio snapshot yet. Ask the agent to review it.',
  emptyPaper: 'No paper accounts yet. Create one through the agent.',
  emptyAlphas: 'No alphas loaded. Ask the agent what is available.',
  emptyScheduled: 'Nothing scheduled yet. Ask for a recurring review.',
  startBacktest: 'Backtest a buy-and-hold strategy on Saudi Aramco for 2024.',
  startPaper: 'Create a paper account and show me how to start.',
  startAlpha: 'Recommend an alpha from the library and explain it.',
  startSchedule: 'Schedule a weekly review of my watchlist.',
  statusSuccess: 'Success',
  statusCompleted: 'Completed',
  statusCancelled: 'Cancelled',
  statusFailed: 'Failed',
  statusActive: 'Active',
  statusPaused: 'Paused',
  total: 'Total',
  uploadDrag: 'Drop a file here or choose one',
  uploading: 'Uploading…',
  filePrompt: 'Analyze the attached file.\nFilename: {name}\nPath: {path}',
  removeFile: 'Remove file',
  status: 'Status',
  date: 'Date',
  totalReturn: 'Return',
  sharpe: 'Sharpe',
  codes: 'Codes',
  label: 'Label',
  market: 'Market',
  cash: 'Cash',
  positions: 'Positions',
  totalUsd: 'USD',
  totalCny: 'CNY',
  complete: 'Complete',
  incomplete: 'Incomplete',
  warnings: 'Warnings',
  zoo: 'Zoo',
  universe: 'Universe',
  schedule: 'Schedule',
  nextRun: 'Next run',
  provider: 'Provider',
  modelName: 'Model',
  baseUrl: 'Base URL',
  keyConfigured: 'Key configured',
  keyMissing: 'Key missing',
  auth: 'Auth',
  yes: 'Yes',
  no: 'No',
  modelSavedNote: 'Saved settings. The running agent may use environment overrides; a run shows the model that actually answered.',
  demoNotice: 'Sample workspace. No provider is connected, so these runs are not real.',
  rebalanceTitle: 'Next rebalance',
  rebalancePreview: 'Preview only',
  rebalanceHint: 'Read-only preview against the current paper book',
  rebalanceEntering: 'Entering',
  rebalanceLeaving: 'Leaving',
  rebalanceUnchanged: 'Unchanged',
  rebalanceEmpty: 'No names would move.',
  rebalanceClears: 'Clears {n} rules',
  rebalanceNotTarget: 'Not in target',
  rebalanceScope: 'Preview only. No order is staged or sent.',
  providerSettings: 'API settings',
  none: 'None',
  snapshots: 'Snapshots',
  snapshotFreeze: 'Freeze snapshot',
  snapshotName: 'Snapshot name',
  snapshotNamePlaceholder: 'e.g. Before rebalance',
  snapshotSave: 'Save snapshot',
  snapshotCancel: 'Cancel',
  snapshotEmpty: 'No snapshots yet. Freeze the account to compare it later.',
  snapshotLocal: 'Local demo snapshots, not a broker record.',
  snapshotFrozen: 'Frozen',
  snapshotDemo: 'Demo',
  snapshotCompare: 'Compare',
  snapshotRewind: 'Rewind preview',
  snapshotAdded: 'Added',
  snapshotDropped: 'Dropped',
  snapshotCashDelta: 'Cash change',
  snapshotNoChange: 'No change since this snapshot.',
  snapshotRestore: 'Restore',
  snapshotDrop: 'Remove',
  snapshotRewindNote: 'Read-only preview. Nothing is rewound and no order is sent.',
  snapshotRemove: 'Remove snapshot',
  snapshotConfirmRemove: 'Confirm remove',
  scheduledRuns: 'Scheduled runs',
  routeTitle: 'Weekly route',
  routeHint: 'One demo walk through saved screens, watchlists, strategy reruns and news.',
  routeRun: 'Run weekly route',
  routeRunAgain: 'Run again',
  routeWalking: 'Walking the route…',
  routeDone: 'Route finished. Nothing ran on a server.',
  routeDoneStop: 'Done',
  routeNextStart: 'Next start',
  routeFinishes: 'Finishes',
  routeSkipped: 'Skipped',
  routeWaiting: 'Waiting',
  routeNow: 'Now',
  routeStops: 'stops',
  routeKindScreen: 'Saved screen',
  routeKindWatchlist: 'Watchlist',
  routeKindStrategy: 'Strategy rerun',
  routeKindNews: 'News',
  routeRulesCount: '{n} rules',
  routeSymbolsCount: '{n} symbols',
  routeStoriesCount: '{n} stories',
  routeSkipNoScreens: 'No saved screen in this browser.',
  routeSkipNoWatchlists: 'No watchlist has symbols yet.',
  routeSkipNoStrategies: 'No strategy to rerun.',
  routeSkipNoNews: 'No news in this session.',
  routeDemoNote: 'Demo only. No job is created, no screen runs and no order is placed.',
}

export const strings: Dict<WorkspaceStrings> = {
  en,
  zh: {
    ...en,
    title: '工作台',
    subtitle: '本地 Agent 的全部能力，不用再开第二个应用。',
    back: '返回',
    runs: '回测',
    paper: '模拟盘',
    portfolio: '组合',
    alphas: '因子',
    scheduled: '定时',
    model: '模型',
    tools: '工具',
    upload: '上传文件',
    uploadHint: '支持 PDF、Word、Excel、CSV、文本或图片；Agent 读取文件路径。',
    uploaded: '已上传',
    deepResearch: '深度研究',
    deepResearchPrompt: '开始一个深度研究目标：',
    swarm: '多 Agent',
    swarmPrompt: '用多 Agent 研究：',
    options: '期权',
    optionsPrompt: '分析这个期权策略：',
    correlation: '相关性',
    correlationPrompt: '展示这些标的的相关性状态：',
    runPrompt: '解释回测 {id} 的指标。',
    alphaPrompt: '基准测试因子 {id} 并解释结果。',
    paperPrompt: '把模拟盘 {id} 推进到今天，并报告持仓。',
    scheduledPrompt: '解释定时研究 {id}。',
    portfolioPrompt: '检查我的组合并解释风险。',
    askAi: '问 AI',
    loading: '加载中…',
    error: 'AI 后端加载失败。',
    retry: '重试',
    empty: '暂时没有内容。',
    emptyRuns: '还没有回测。让 Agent 跑一个，就有了第一条。',
    emptyPortfolio: '还没有组合快照。让 Agent 帮你检查一次。',
    emptyPaper: '还没有模拟盘。让 Agent 帮你创建一个。',
    emptyAlphas: '还没有因子。问 Agent 现在有什么可用。',
    emptyScheduled: '还没有定时任务。让 Agent 安排一次定期复盘。',
    startBacktest: '回测一个 2024 年买入并持有沙特阿美的策略。',
    startPaper: '创建一个模拟盘，并告诉我怎么开始。',
    startAlpha: '从因子里挑一个适合现在的，并解释它。',
    startSchedule: '每周复盘一次我的自选。',
    statusSuccess: '成功',
    statusCompleted: '完成',
    statusCancelled: '已取消',
    statusFailed: '失败',
    statusActive: '运行中',
    statusPaused: '已暂停',
    total: '合计',
    uploadDrag: '把文件拖到这里，或选择一个文件',
    uploading: '正在上传…',
    filePrompt: '分析这个附件。\n文件名：{name}\n路径：{path}',
    removeFile: '移除文件',
    status: '状态',
    date: '日期',
    totalReturn: '收益',
    sharpe: '夏普',
    codes: '代码',
    label: '名称',
    market: '市场',
    cash: '现金',
    positions: '持仓',
    totalUsd: '美元',
    totalCny: '人民币',
    complete: '完整',
    incomplete: '不完整',
    warnings: '警告',
    zoo: '因子库',
    universe: '范围',
    schedule: '计划',
    nextRun: '下次运行',
    provider: '提供方',
    modelName: '模型',
    baseUrl: '接口地址',
    keyConfigured: '密钥已配置',
    keyMissing: '缺少密钥',
    auth: '认证',
    yes: '是',
    no: '否',
    modelSavedNote: '这里是保存的设置；实际运行的 Agent 可能使用环境变量覆盖，单次运行会显示真正回答的模型。',
    demoNotice: '演示工作台。当前没有连接提供方，这些运行结果不是真实的。',
    rebalanceTitle: '下次再平衡',
    rebalancePreview: '仅预览',
    rebalanceHint: '对当前模拟持仓的只读预览',
    rebalanceEntering: '调入',
    rebalanceLeaving: '调出',
    rebalanceUnchanged: '不变',
    rebalanceEmpty: '没有名字会变动。',
    rebalanceClears: '通过 {n} 条规则',
    rebalanceNotTarget: '不在目标里',
    rebalanceScope: '仅预览，不生成订单，也不会发送。',
    providerSettings: 'API 设置',
    none: '无',
    snapshots: '快照',
    snapshotFreeze: '冻结快照',
    snapshotName: '快照名称',
    snapshotNamePlaceholder: '例如：调仓前',
    snapshotSave: '保存快照',
    snapshotCancel: '取消',
    snapshotEmpty: '还没有快照。冻结当前账户，之后就能对比。',
    snapshotLocal: '本地演示快照，不是券商记录。',
    snapshotFrozen: '冻结于',
    snapshotDemo: '演示',
    snapshotCompare: '对比',
    snapshotRewind: '回看预览',
    snapshotAdded: '新增',
    snapshotDropped: '移出',
    snapshotCashDelta: '现金变化',
    snapshotNoChange: '与这份快照相比没有变化。',
    snapshotRestore: '恢复',
    snapshotDrop: '移除',
    snapshotRewindNote: '只读预览：不会回退，也不会发出任何委托。',
    snapshotRemove: '删除快照',
    snapshotConfirmRemove: '确认删除',
    scheduledRuns: '定时任务',
    routeTitle: '每周路线',
    routeHint: '演示一条固定路线：已存筛选 → 自选 → 策略重跑 → 新闻。',
    routeRun: '运行每周路线',
    routeRunAgain: '再跑一次',
    routeWalking: '正在走路线…',
    routeDone: '路线已走完，服务端没有运行任何任务。',
    routeDoneStop: '完成',
    routeNextStart: '下次开始',
    routeFinishes: '预计结束',
    routeSkipped: '跳过',
    routeWaiting: '等待',
    routeNow: '当前',
    routeStops: '站',
    routeKindScreen: '已存筛选',
    routeKindWatchlist: '自选',
    routeKindStrategy: '策略重跑',
    routeKindNews: '新闻',
    routeRulesCount: '{n} 条规则',
    routeSymbolsCount: '{n} 个标的',
    routeStoriesCount: '{n} 条新闻',
    routeSkipNoScreens: '浏览器里还没有已存筛选。',
    routeSkipNoWatchlists: '还没有带标的的自选分组。',
    routeSkipNoStrategies: '没有可重跑的策略。',
    routeSkipNoNews: '本次会话没有新闻。',
    routeDemoNote: '仅演示：不会创建任务、不会运行筛选，也不会发出任何委托。',
  },
  ar: {
    ...en,
    title: 'مساحة العمل',
    subtitle: 'كل ما يستطيعه الوكيل المحلي دون تطبيق ثانٍ.',
    back: 'رجوع',
    runs: 'الاختبارات',
    paper: 'محفظة تجريبية',
    portfolio: 'المحفظة',
    alphas: 'العوامل',
    scheduled: 'المجدولة',
    model: 'النموذج',
    tools: 'الأدوات',
    upload: 'رفع ملف',
    uploadHint: 'PDF أو Word أو Excel أو CSV أو نص أو صورة. يقرأ الوكيل المسار.',
    uploaded: 'تم الرفع',
    deepResearch: 'بحث معمّق',
    deepResearchPrompt: 'ابدأ هدف بحث معمّق حول: ',
    swarm: 'سرب وكلاء',
    swarmPrompt: 'شغّل سربًا للبحث في: ',
    options: 'الخيارات',
    optionsPrompt: 'حلّل استراتيجية خيارات على: ',
    correlation: 'الارتباط',
    correlationPrompt: 'اعرض نظام الارتباط لهذه الرموز: ',
    runPrompt: 'اشرح اختبار التشغيل {id} ومؤشراته.',
    alphaPrompt: 'قايس العامل {id} واشرح النتيجة.',
    paperPrompt: 'قدّم المحفظة التجريبية {id} إلى اليوم واعرض المراكز.',
    scheduledPrompt: 'اشرح البحث المجدول {id}.',
    portfolioPrompt: 'راجع محفظتي واشرح المخاطر.',
    askAi: 'اسأل AI',
    loading: 'جارٍ التحميل…',
    error: 'تعذّر على الخادم تحميل هذا.',
    retry: 'إعادة',
    empty: 'لا يوجد شيء بعد.',
    emptyRuns: 'لا اختبارات بعد. اطلب اختبارًا ليبدأ الأول.',
    emptyPortfolio: 'لا توجد لقطة للمحفظة بعد. اطلب من الوكيل مراجعتها.',
    emptyPaper: 'لا محافظ تجريبية بعد. اطلب من الوكيل إنشاء واحدة.',
    emptyAlphas: 'لا عوامل محمّلة. اسأل الوكيل عمّا هو متاح.',
    emptyScheduled: 'لا مهام مجدولة بعد. اطلب مراجعة دورية.',
    startBacktest: 'اختبر استراتيجية شراء واحتفاظ في أرامكو لعام 2024.',
    startPaper: 'أنشئ محفظة تجريبية ووضّح لي كيف أبدأ.',
    startAlpha: 'اقترح عاملًا مناسبًا من المكتبة واشرحه.',
    startSchedule: 'جدول مراجعة أسبوعية لقائمة متابعتي.',
    statusSuccess: 'ناجح',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغى',
    statusFailed: 'فشل',
    statusActive: 'نشط',
    statusPaused: 'متوقف',
    total: 'الإجمالي',
    uploadDrag: 'أفلت ملفًا هنا أو اختر ملفًا',
    uploading: 'جارٍ الرفع…',
    filePrompt: 'حلّل المرفق.\nاسم الملف: {name}\nالمسار: {path}',
    removeFile: 'إزالة الملف',
    status: 'الحالة',
    date: 'التاريخ',
    totalReturn: 'العائد',
    sharpe: 'شارب',
    codes: 'الرموز',
    label: 'الاسم',
    market: 'السوق',
    cash: 'النقد',
    positions: 'المراكز',
    totalUsd: 'دولار',
    totalCny: 'يوان',
    complete: 'مكتمل',
    incomplete: 'غير مكتمل',
    warnings: 'تحذيرات',
    zoo: 'المكتبة',
    universe: 'النطاق',
    schedule: 'الجدول',
    nextRun: 'التشغيل التالي',
    provider: 'المزوّد',
    modelName: 'النموذج',
    baseUrl: 'عنوان الواجهة',
    keyConfigured: 'المفتاح مهيأ',
    keyMissing: 'المفتاح مفقود',
    auth: 'المصادقة',
    yes: 'نعم',
    no: 'لا',
    modelSavedNote: 'هذه الإعدادات المحفوظة. قد يستخدم الوكيل متغيرات البيئة؛ يعرض التشغيل النموذج الذي أجاب فعلاً.',
    demoNotice: 'مساحة عرض. لا يوجد مزوّد متصل، لذا هذه النتائج ليست حقيقية.',
    rebalanceTitle: 'إعادة التوازن التالية',
    rebalancePreview: 'معاينة فقط',
    rebalanceHint: 'معاينة للقراءة فقط مقابل المحفظة الورقية الحالية',
    rebalanceEntering: 'داخل',
    rebalanceLeaving: 'خارج',
    rebalanceUnchanged: 'بلا تغيير',
    rebalanceEmpty: 'لا أسماء ستتحرك.',
    rebalanceClears: 'يجتاز {n} قواعد',
    rebalanceNotTarget: 'ليس في الهدف',
    rebalanceScope: 'معاينة فقط. لا يُنشأ أمر ولا يُرسل.',
    providerSettings: 'إعدادات API',
    none: 'لا شيء',
    snapshots: 'اللقطات',
    snapshotFreeze: 'تجميد لقطة',
    snapshotName: 'اسم اللقطة',
    snapshotNamePlaceholder: 'مثال: قبل إعادة التوازن',
    snapshotSave: 'حفظ اللقطة',
    snapshotCancel: 'إلغاء',
    snapshotEmpty: 'لا لقطات بعد. جمّد الحساب للمقارنة لاحقًا.',
    snapshotLocal: 'لقطات تجريبية محلية، وليست سجلاً لدى وسيط.',
    snapshotFrozen: 'جُمّدت',
    snapshotDemo: 'عرض',
    snapshotCompare: 'قارن',
    snapshotRewind: 'معاينة الرجوع',
    snapshotAdded: 'أُضيف',
    snapshotDropped: 'أُزيل',
    snapshotCashDelta: 'تغيّر النقد',
    snapshotNoChange: 'لا تغيير منذ هذه اللقطة.',
    snapshotRestore: 'استعادة',
    snapshotDrop: 'إزالة',
    snapshotRewindNote: 'معاينة للقراءة فقط. لا رجوع فعلي ولا أمر يُرسل.',
    snapshotRemove: 'حذف اللقطة',
    snapshotConfirmRemove: 'تأكيد الحذف',
    scheduledRuns: 'المهام المجدولة',
    routeTitle: 'المسار الأسبوعي',
    routeHint: 'مسار تجريبي ثابت: الشاشات المحفوظة، قوائم المتابعة، إعادة تشغيل الاستراتيجيات، ثم الأخبار.',
    routeRun: 'شغّل المسار الأسبوعي',
    routeRunAgain: 'شغّله مرة أخرى',
    routeWalking: 'جارٍ السير في المسار…',
    routeDone: 'انتهى المسار. لم يُشغّل أي شيء على الخادم.',
    routeDoneStop: 'تم',
    routeNextStart: 'البداية التالية',
    routeFinishes: 'ينتهي',
    routeSkipped: 'متجاوز',
    routeWaiting: 'بالانتظار',
    routeNow: 'الآن',
    routeStops: 'محطات',
    routeKindScreen: 'شاشة محفوظة',
    routeKindWatchlist: 'قائمة متابعة',
    routeKindStrategy: 'إعادة تشغيل استراتيجية',
    routeKindNews: 'الأخبار',
    routeRulesCount: '{n} قواعد',
    routeSymbolsCount: '{n} رموز',
    routeStoriesCount: '{n} أخبار',
    routeSkipNoScreens: 'لا شاشة محفوظة في هذا المتصفح.',
    routeSkipNoWatchlists: 'لا قائمة متابعة تحتوي رموزًا بعد.',
    routeSkipNoStrategies: 'لا استراتيجية لإعادة تشغيلها.',
    routeSkipNoNews: 'لا أخبار في هذه الجلسة.',
    routeDemoNote: 'عرض فقط. لا تُنشأ مهمة ولا تُشغّل شاشة ولا يُرسل أي أمر.',
  },
}
