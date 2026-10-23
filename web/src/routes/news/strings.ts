import type { Dict } from '../../i18n'

export const strings = {
  zh: {
    title: '新闻',
    reviewEntry: '今日复盘',
    reviewHint: '收盘后回答五个问题，留下判断',
    lead: '最新消息',
    today: '今天',
    yesterday: '昨天',
    related: '相关股票',
    askAi: '问 AI 这件事',
    notFound: '没有找到这条新闻',
    empty: '暂时没有新闻',
    emptySource: '这个来源暂时没有新闻',
    back: '返回',
    allSources: '全部',
    filterLabel: '按来源筛选',
    watchMark: '自选',
    calendar: '日历',
    watchAdd: '加入自选',
    watchRemove: '移出自选',
    whyWatched: '其中自选 {count}，今天{dir}。',
    whyStory: '涉及 {count}，今天{dir}。',
    whyStock: '只',
    whyStockOne: '只',
    whyStockTwo: '只',
    whyUp: '涨',
    whyDown: '跌',
    whyFlat: '平',
    whyAllUp: '全线上涨',
    whyAllDown: '全线下挫',
    whyFlatOnly: '走平',
    whyComma: ' ',
  },
  en: {
    title: 'News',
    reviewEntry: "Today's review",
    reviewHint: 'Five questions after the close',
    lead: 'Latest stories',
    today: 'Today',
    yesterday: 'Yesterday',
    related: 'Related stocks',
    askAi: 'Ask AI about this',
    notFound: 'This story is not available',
    empty: 'No stories right now',
    emptySource: 'No stories from this source',
    back: 'Back',
    allSources: 'All',
    filterLabel: 'Filter by source',
    watchMark: 'Watchlist',
    calendar: 'Calendar',
    watchAdd: 'Add to watchlist',
    watchRemove: 'Remove from watchlist',
    whyWatched: '{count} on your watchlist, {dir} today.',
    whyStory: '{count} in this story, {dir} today.',
    whyStock: 'names',
    whyStockOne: 'name',
    whyStockTwo: 'names',
    whyUp: 'up',
    whyDown: 'down',
    whyFlat: 'flat',
    whyAllUp: 'all up',
    whyAllDown: 'all down',
    whyFlatOnly: 'flat',
    whyComma: ', ',
  },
  ar: {
    title: 'الأخبار',
    reviewEntry: 'مراجعة اليوم',
    reviewHint: 'خمسة أسئلة بعد الإغلاق',
    lead: 'آخر الأخبار',
    today: 'اليوم',
    yesterday: 'أمس',
    related: 'الأسهم المرتبطة',
    askAi: 'اسأل AI عن هذا الخبر',
    notFound: 'لم نجد هذا الخبر',
    empty: 'لا توجد أخبار الآن',
    emptySource: 'لا توجد أخبار من هذا المصدر',
    back: 'رجوع',
    allSources: 'الكل',
    filterLabel: 'تصفية حسب المصدر',
    watchMark: 'قائمتي',
    calendar: 'التقويم',
    watchAdd: 'أضف إلى قائمتي',
    watchRemove: 'أزل من قائمتي',
    whyWatched: 'في قائمتك {count}, {dir} اليوم.',
    whyStory: 'في هذا الخبر {count}, {dir} اليوم.',
    whyStock: 'أسهم',
    whyStockOne: 'سهم واحد',
    whyStockTwo: 'سهمان',
    whyUp: 'صاعد',
    whyDown: 'هابط',
    whyFlat: 'دون تغيير',
    whyAllUp: 'كلها صاعدة',
    whyAllDown: 'كلها هابطة',
    whyFlatOnly: 'دون تغيير',
    whyComma: '، ',
  },
} satisfies Dict<{
  title: string
  reviewEntry: string
  reviewHint: string
  lead: string
  today: string
  yesterday: string
  related: string
  askAi: string
  calendar: string
  notFound: string
  empty: string
  emptySource: string
  back: string
  allSources: string
  filterLabel: string
  watchMark: string
  watchAdd: string
  watchRemove: string
  whyWatched: string
  whyStory: string
  whyStock: string
  whyStockOne: string
  whyStockTwo: string
  whyUp: string
  whyDown: string
  whyFlat: string
  whyAllUp: string
  whyAllDown: string
  whyFlatOnly: string
  whyComma: string
}>

export type NewsKey = keyof typeof strings.zh
