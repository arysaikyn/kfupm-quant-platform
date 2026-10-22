import type { Dict } from '../../i18n'

type Strings = {
  skip: string
  back: string
  continue: string
  /** `{n}` is replaced with the current step number. */
  stepOf: string

  valueTitle: string
  valueBody: string
  valueQuery: string
  valueParsed: string
  valueRule1: string
  valueRule1Value: string
  valueRule2: string
  valueRule2Value: string
  valueRule3: string
  valueRule3Value: string
  valueFootLabel: string
  valueFootValue: string

  evidenceTitle: string
  evidenceBody: string
  evidenceHead: string
  evPrice: string
  evPriceValue: string
  evPe: string
  evPeValue: string
  evYield: string
  evYieldValue: string
  evEngineTag: string
  evidenceFoot: string

  shariaTitle: string
  shariaBody: string
  shariaHead: string
  shariaCount: string
  shDebt: string
  shDebtValue: string
  shInterest: string
  shInterestValue: string
  shIncome: string
  shIncomeValue: string
  shReceivable: string
  shReceivableValue: string
  shCore: string
  shCoreValue: string
  shSub: string
  shSubValue: string
  shariaFoot: string

  marketTitle: string
  marketBody: string
  marketHint: string
  mSa: string
  mSaSub: string
  mCn: string
  mCnSub: string
  mHk: string
  mHkSub: string

  doneTitle: string
  doneBody: string
  doneFollowing: string
  doneOpen: string
  doneBrowse: string
}

export const strings: Dict<Strings> = {
  en: {
    skip: 'Skip',
    back: 'Back',
    continue: 'Continue',
    stepOf: '{n} of 5',

    valueTitle: 'Ask in one sentence. Get a tested strategy.',
    valueBody:
      'Say what you want — “high dividend, low debt”. It becomes rule cards you can edit, then test against years of history.',
    valueQuery: 'High dividend, low debt, steady cash flow',
    valueParsed: '3 rules, editable',
    valueRule1: 'Dividend yield',
    valueRule1Value: '≥ 3.5%',
    valueRule2: 'Debt to assets',
    valueRule2Value: '< 50%',
    valueRule3: 'Operating cash flow',
    valueRule3Value: '> 0',
    valueFootLabel: 'Annualised · 5-year backtest',
    valueFootValue: '+9.8%',

    evidenceTitle: 'Every number comes from the engine, never the model.',
    evidenceBody:
      'The model only turns your sentence into rules and explains the result. Each figure points back to the row it came from.',
    evidenceHead: 'Same screen, cited',
    evPrice: 'Last price',
    evPriceValue: '32.15',
    evPe: 'P/E',
    evPeValue: '14.2',
    evYield: 'Dividend yield',
    evYieldValue: '4.1%',
    evEngineTag: 'engine',
    evidenceFoot: 'No figure is written by the model.',

    shariaTitle: 'The screen is a filter before ranking, not a badge.',
    shariaBody:
      'AAOIFI thresholds run first. A company that fails leaves the ranking; it is never shown greyed out at the bottom.',
    shariaHead: 'AAOIFI screen',
    shariaCount: '5/6',
    shDebt: 'Debt / assets',
    shDebtValue: '12% ≤ 30%',
    shInterest: 'Interest-bearing assets',
    shInterestValue: '18% ≤ 30%',
    shIncome: 'Non-compliant income',
    shIncomeValue: '0.4% ≤ 5%',
    shReceivable: 'Receivables / assets',
    shReceivableValue: '21% ≤ 33%',
    shCore: 'Core business',
    shCoreValue: 'Retail',
    shSub: 'Subsidiary income',
    shSubValue: 'Conventional bank',
    shariaFoot: '1 rule failed — the company is out of the list.',

    marketTitle: 'Which market do you follow?',
    marketBody:
      'This picks the market you land on. You can change it any time from the board.',
    marketHint: 'Choose one to continue.',
    mSa: 'Saudi Arabia',
    mSaSub: 'Tadawul · SAR',
    mCn: 'China A-shares',
    mCnSub: 'Shanghai & Shenzhen · CNY',
    mHk: 'Hong Kong',
    mHkSub: 'HKEX · HKD',

    doneTitle: "You're set.",
    doneBody:
      'Markets, news and strategies are ready. Everything stays on this device — no account, no email.',
    doneFollowing: 'Following',
    doneOpen: 'Open markets',
    doneBrowse: 'Take a look around',
  },

  zh: {
    skip: '跳过',
    back: '返回',
    continue: '继续',
    stepOf: '{n} / 5',

    valueTitle: '一句话说清想要什么，拿到一条验证过的策略。',
    valueBody:
      '比如「高股息、低负债」。这句话会变成可编辑的规则卡片，再用多年历史数据检验。',
    valueQuery: '高股息、低负债、现金流稳定',
    valueParsed: '已拆成 3 条规则',
    valueRule1: '股息率',
    valueRule1Value: '≥ 3.5%',
    valueRule2: '资产负债率',
    valueRule2Value: '< 50%',
    valueRule3: '经营现金流',
    valueRule3Value: '> 0',
    valueFootLabel: '年化 · 近 5 年回测',
    valueFootValue: '+9.8%',

    evidenceTitle: '每个数字都来自引擎，不来自模型。',
    evidenceBody:
      '模型只负责把你的话翻译成规则、解释结果。任何一个数字都能追回到它所在的那一行。',
    evidenceHead: '同一屏，有出处',
    evPrice: '最新价',
    evPriceValue: '32.15',
    evPe: '市盈率',
    evPeValue: '14.2',
    evYield: '股息率',
    evYieldValue: '4.1%',
    evEngineTag: '引擎',
    evidenceFoot: '没有一个数字由模型写出。',

    shariaTitle: '沙里亚筛选是排序前的过滤，不是一枚徽章。',
    shariaBody:
      '先过 AAOIFI 门槛。不合格的公司直接离开排名，不会灰掉塞在列表末尾。',
    shariaHead: 'AAOIFI 筛选',
    shariaCount: '5/6',
    shDebt: '负债 / 资产',
    shDebtValue: '12% ≤ 30%',
    shInterest: '利息类资产',
    shInterestValue: '18% ≤ 30%',
    shIncome: '非合规收入',
    shIncomeValue: '0.4% ≤ 5%',
    shReceivable: '应收账款',
    shReceivableValue: '21% ≤ 33%',
    shCore: '主营业务',
    shCoreValue: '零售',
    shSub: '子公司收入',
    shSubValue: '传统银行',
    shariaFoot: '1 条未通过，这家公司已从名单剔除。',

    marketTitle: '你主要看哪个市场？',
    marketBody: '这会决定你落地时看到的市场。之后可以在榜单上方随时切换。',
    marketHint: '选一个才能继续。',
    mSa: '沙特阿拉伯',
    mSaSub: 'Tadawul · SAR',
    mCn: '中国 A 股',
    mCnSub: '沪深 · CNY',
    mHk: '中国香港',
    mHkSub: 'HKEX · HKD',

    doneTitle: '设置好了。',
    doneBody:
      '行情、新闻和策略都已就位。所有内容只留在这台设备上——不用账号，不用邮箱。',
    doneFollowing: '关注市场',
    doneOpen: '进入行情',
    doneBrowse: '随便看看',
  },

  ar: {
    skip: 'تخطٍّ',
    back: 'رجوع',
    continue: 'متابعة',
    stepOf: '{n} من 5',

    valueTitle: 'اسأل بجملة واحدة، واحصل على استراتيجية مُختبَرة.',
    valueBody:
      'قل ما تريده — «توزيعات مرتفعة ودين منخفض». تتحوّل الجملة إلى بطاقات قواعد قابلة للتعديل، ثم تُختبر على سنوات من البيانات.',
    valueQuery: 'توزيعات مرتفعة، دين منخفض، تدفق نقدي مستقر',
    valueParsed: '3 قواعد قابلة للتعديل',
    valueRule1: 'عائد التوزيعات',
    valueRule1Value: '≥ 3.5%',
    valueRule2: 'الدين إلى الأصول',
    valueRule2Value: '< 50%',
    valueRule3: 'التدفق النقدي التشغيلي',
    valueRule3Value: '> 0',
    valueFootLabel: 'سنويًا · اختبار 5 سنوات',
    valueFootValue: '+9.8%',

    evidenceTitle: 'كل رقم يأتي من المحرّك، لا من النموذج.',
    evidenceBody:
      'النموذج يترجم جملتك إلى قواعد ويشرح النتيجة فقط. كل رقم يعود إلى السطر الذي جاء منه.',
    evidenceHead: 'الشاشة نفسها، بمصدر',
    evPrice: 'آخر سعر',
    evPriceValue: '32.15',
    evPe: 'مكرر الربحية',
    evPeValue: '14.2',
    evYield: 'عائد التوزيعات',
    evYieldValue: '4.1%',
    evEngineTag: 'المحرّك',
    evidenceFoot: 'لا يكتب النموذج أي رقم.',

    shariaTitle: 'الفحص الشرعي مرشّح قبل الترتيب، وليس شارة.',
    shariaBody:
      'تُطبَّق حدود أيوفي أولًا. الشركة التي لا تجتاز تخرج من الترتيب، ولا تُعرض باهتة في آخره.',
    shariaHead: 'فحص أيوفي',
    shariaCount: '5/6',
    shDebt: 'الدين / الأصول',
    shDebtValue: '12% ≤ 30%',
    shInterest: 'الأصول ذات الفائدة',
    shInterestValue: '18% ≤ 30%',
    shIncome: 'الدخل غير المتوافق',
    shIncomeValue: '0.4% ≤ 5%',
    shReceivable: 'الذمم المدينة',
    shReceivableValue: '21% ≤ 33%',
    shCore: 'النشاط الأساسي',
    shCoreValue: 'تجزئة',
    shSub: 'دخل شركة تابعة',
    shSubValue: 'بنك تقليدي',
    shariaFoot: 'قاعدة واحدة لم تُجتز — استُبعدت الشركة من القائمة.',

    marketTitle: 'أي سوق تتابع؟',
    marketBody:
      'يحدّد هذا السوق الذي تفتح عليه. يمكنك تغييره لاحقًا من أعلى اللوحة.',
    marketHint: 'اختر سوقًا للمتابعة.',
    mSa: 'السعودية',
    mSaSub: 'تداول · SAR',
    mCn: 'الصين أ',
    mCnSub: 'شنغهاي وشنتشن · CNY',
    mHk: 'هونغ كونغ',
    mHkSub: 'HKEX · HKD',

    doneTitle: 'كل شيء جاهز.',
    doneBody:
      'الأسواق والأخبار والخطط جاهزة. كل شيء يبقى على هذا الجهاز — بلا حساب وبلا بريد.',
    doneFollowing: 'السوق المتابَع',
    doneOpen: 'افتح الأسواق',
    doneBrowse: 'ألقِ نظرة',
  },
}
