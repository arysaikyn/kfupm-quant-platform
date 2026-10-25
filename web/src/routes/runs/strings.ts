import type { Dict } from '../../i18n'

export type RunsStrings = {
  title: string
  sessionLabel: string
  empty: string
  delete: string
  confirmDelete: string
  offline: string
  retry: string
  loading: string
  lead: string
  newQuestion: string
  askCta: string
  askFirst: string
  statusActive: string
  statusIdle: string
  clear: string
  confirmClear: string
  runsLabel: string
  sourcesLabel: string
  sourcesShort: string
  sourcesTitle: string
  noSources: string
  pending: string
  untitled: string
  runLabel: string
  expand: string
  collapse: string
  sampleNote: string
  seed1q: string
  seed1a: string
  seed2q: string
  seed2a: string
  seed3q: string
  seed3a: string
  srcQuote: string
  srcFilings: string
  srcNews: string
  srcDividend: string
  srcPeers: string
  srcSector: string
  srcScreener: string
}

export const strings = {
  zh: {
    title: '对话记录',
    sessionLabel: '个会话',
    empty: '还没有对话。',
    delete: '删除',
    confirmDelete: '再点一次删除',
    offline: 'AI 后端未连接。',
    retry: '重试',
    loading: '正在加载…',
    lead: '每一次提问，和它得到的回答。',
    newQuestion: '新提问',
    askCta: '再问一个',
    askFirst: '问第一个问题',
    statusActive: '进行中',
    statusIdle: '空闲',
    clear: '清空提问记录',
    confirmClear: '再点一次确认清空',
    runsLabel: '次提问',
    sourcesLabel: '条引用',
    sourcesShort: '引用',
    sourcesTitle: '引用来源',
    noSources: '这条回答没有标注来源。',
    pending: '还没生成回答。',
    untitled: '未命名的提问',
    runLabel: '第 {n} 次',
    expand: '展开引用',
    collapse: '收起引用',
    sampleNote: '以下为示例记录，你的提问会出现在这里。',
    seed1q: '为什么沙特阿美 2222 今天跌了 2.1%？',
    seed1a:
      '这轮下跌跟随布伦特原油回落 1.4%，此前公布的美国库存高于预期。阿美跟的是油价而不是 TASI 指数，两者的分歧解释了今天大部分跌幅。',
    seed2q: '银行板块里股息最高的三只是哪几只？',
    seed2a:
      '拉吉希以 3.8% 的股息率居首，五年分红持续增长；阿赫利和利雅得银行分列其后。排序用的是当前股息率，不看派息日期。',
    seed3q: '本周能源板块相比大盘表现如何？',
    seed3a:
      '能源板块上涨 1.3%，TASI 上涨 0.4%。能源占指数权重 22%，本周指数一半的涨幅来自这里。',
    srcQuote: '行情快照 · 2222',
    srcFilings: 'Tadawul 公告',
    srcNews: '新闻 · 阿美',
    srcDividend: '分红历史',
    srcPeers: '同业估值',
    srcSector: '板块行情 · 能源',
    srcScreener: '筛选结果',
  },
  en: {
    title: 'Sessions',
    sessionLabel: 'sessions',
    empty: 'No conversations yet.',
    delete: 'Delete',
    confirmDelete: 'Tap again to delete',
    offline: 'The AI backend is not reachable.',
    retry: 'Retry',
    loading: 'Loading…',
    lead: 'Every question, and the answer it earned.',
    newQuestion: 'New question',
    askCta: 'Ask another',
    askFirst: 'Ask a question',
    statusActive: 'Active',
    statusIdle: 'Idle',
    clear: 'Clear history',
    confirmClear: 'Tap again to clear',
    runsLabel: 'runs',
    sourcesLabel: 'sources cited',
    sourcesShort: 'sources',
    sourcesTitle: 'Sources',
    noSources: 'This answer cited no sources.',
    pending: 'No answer yet.',
    untitled: 'Untitled question',
    runLabel: 'Run {n}',
    expand: 'Show sources',
    collapse: 'Hide sources',
    sampleNote: 'Example runs, your questions land here.',
    seed1q: 'Why did Saudi Aramco (2222) fall 2.1% today?',
    seed1a:
      'The drop tracks Brent crude down 1.4% after US inventories came in above consensus. Aramco follows the barrel, not the TASI index, the gap between them explains most of the move.',
    seed2q: 'Which three banks pay the best dividends right now?',
    seed2a:
      'Al Rajhi leads at a 3.8% yield with five years of dividend growth, ahead of SNB and Riyad Bank. The ranking uses the current yield, not the last payment date.',
    seed3q: 'How is energy performing against the market this week?',
    seed3a:
      'Energy is up 1.3% against 0.4% for TASI. At a 22% index weight, the sector supplied about half of the index move this week.',
    srcQuote: 'Quote snapshot · 2222',
    srcFilings: 'Tadawul filings',
    srcNews: 'News · Aramco',
    srcDividend: 'Dividend history',
    srcPeers: 'Peer multiples',
    srcSector: 'Sector tape · Energy',
    srcScreener: 'Screener result',
  },
  ar: {
    title: 'سجل الجلسات',
    sessionLabel: 'جلسات',
    empty: 'لا توجد محادثات بعد.',
    delete: 'حذف',
    confirmDelete: 'اضغط مرة أخرى للحذف',
    offline: 'خادم الذكاء الاصطناعي غير متصل.',
    retry: 'إعادة',
    loading: 'جارٍ التحميل…',
    lead: 'كل سؤال طرحته، والإجابة التي حصل عليها.',
    newQuestion: 'سؤال جديد',
    askCta: 'اسأل سؤالًا آخر',
    askFirst: 'اسأل سؤالًا',
    statusActive: 'نشطة',
    statusIdle: 'خاملة',
    clear: 'مسح السجل',
    confirmClear: 'اضغط مرة أخرى للمسح',
    runsLabel: 'أسئلة',
    sourcesLabel: 'مصادر مستشهد بها',
    sourcesShort: 'مصادر',
    sourcesTitle: 'المصادر',
    noSources: 'لم تُذكر مصادر لهذه الإجابة.',
    pending: 'لا توجد إجابة بعد.',
    untitled: 'سؤال بلا نص',
    runLabel: 'المحاولة {n}',
    expand: 'إظهار المصادر',
    collapse: 'إخفاء المصادر',
    sampleNote: 'أمثلة توضيحية، ستظهر أسئلتك هنا.',
    seed1q: 'لماذا انخفض سهم أرامكو 2222 بنسبة 2.1% اليوم؟',
    seed1a:
      'التحرّك يتبع تراجع خام برنت 1.4% بعد بيانات مخزونات أمريكية أعلى من المتوقع. أرامكو تتحرّك مع الخام لا مع مؤشر تاسي، والفارق بينهما يفسّر معظم الانخفاض.',
    seed2q: 'ما هي البنوك الثلاثة الأعلى توزيعات أرباح الآن؟',
    seed2a:
      'الراجحي في المقدمة بعائد 3.8% مع نمو التوزيعات خمس سنوات، يليه الأهلي ثم الرياض. الترتيب يعتمد على العائد الحالي لا على تاريخ آخر دفعة.',
    seed3q: 'كيف أداء قطاع الطاقة مقابل السوق هذا الأسبوع؟',
    seed3a:
      'قطاع الطاقة مرتفع 1.3% مقابل 0.4% لتاسي. وبوزن 22% في المؤشر، جاء منه نحو نصف حركة المؤشر هذا الأسبوع.',
    srcQuote: 'لقطة سعر · 2222',
    srcFilings: 'إفصاحات تداول',
    srcNews: 'أخبار · أرامكو',
    srcDividend: 'سجلّ التوزيعات',
    srcPeers: 'مضاعفات الأقران',
    srcSector: 'مؤشر القطاع · الطاقة',
    srcScreener: 'نتيجة الفلتر',
  },
} satisfies Dict<RunsStrings>
