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
  none: string
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
  none: 'None',
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
    none: '无',
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
    none: 'لا شيء',
  },
}
