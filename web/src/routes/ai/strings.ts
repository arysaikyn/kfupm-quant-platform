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
  suggestTitle: string
  suggest1: string
  suggest2: string
  suggest3: string
  suggest4: string
  typing: string
  artifactCount: string
  addWatch: string
  addedWatch: string
  saveStrategy: string
  savedStrategy: string
  disclaimer: string
  close: string
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
    suggestTitle: '试着这样问',
    suggest1: '我完全不懂，能买什么？',
    suggest2: '找 5 只便宜又稳的股票',
    suggest3: '这只股票最近为什么跌？',
    suggest4: '按教法帮我筛一遍',
    typing: '正在回复',
    artifactCount: '5 只',
    addWatch: '加入自选',
    addedWatch: '已加入自选',
    saveStrategy: '保存为策略',
    savedStrategy: '已保存',
    disclaimer: '演示数据，不构成投资建议。',
    close: '关闭',
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
    suggestTitle: 'Try asking',
    suggest1: 'I know nothing — what can I buy?',
    suggest2: 'Find 5 cheap and steady stocks',
    suggest3: 'Why did this stock fall?',
    suggest4: 'Screen this for Sharia compliance',
    typing: 'Replying',
    artifactCount: '5 names',
    addWatch: 'Add to watchlist',
    addedWatch: 'In watchlist',
    saveStrategy: 'Save as strategy',
    savedStrategy: 'Saved',
    disclaimer: 'Demo data. Not investment advice.',
    close: 'Close',
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
    suggestTitle: 'جرّب أن تسأل',
    suggest1: 'لا أفهم شيئًا، ماذا أشتري؟',
    suggest2: 'ابحث لي عن 5 أسهم رخيصة ومستقرة',
    suggest3: 'لماذا انخفض هذا السهم؟',
    suggest4: 'افحص السوق وفق الشريعة',
    typing: 'جارٍ الرد',
    artifactCount: '5 أسهم',
    addWatch: 'إضافة إلى المتابعة',
    addedWatch: 'في المتابعة',
    saveStrategy: 'حفظ كخطة',
    savedStrategy: 'تم الحفظ',
    disclaimer: 'بيانات عرض، وليست نصيحة استثمارية.',
    close: 'إغلاق',
  },
} satisfies Dict<AiStrings>
