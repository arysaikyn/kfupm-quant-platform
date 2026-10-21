import type { Dict } from '../../i18n'

export const strings = {
  zh: {
    title: '新闻',
    lead: '最新消息',
    today: '今天',
    yesterday: '昨天',
    related: '相关股票',
    askAi: '问 AI 这件事',
    notFound: '没有找到这条新闻',
    empty: '暂时没有新闻',
    back: '返回',
  },
  en: {
    title: 'News',
    lead: 'Latest stories',
    today: 'Today',
    yesterday: 'Yesterday',
    related: 'Related stocks',
    askAi: 'Ask AI about this',
    notFound: 'This story is not available',
    empty: 'No stories right now',
    back: 'Back',
  },
  ar: {
    title: 'الأخبار',
    lead: 'آخر الأخبار',
    today: 'اليوم',
    yesterday: 'أمس',
    related: 'الأسهم المرتبطة',
    askAi: 'اسأل AI عن هذا الخبر',
    notFound: 'لم نجد هذا الخبر',
    empty: 'لا توجد أخبار الآن',
    back: 'رجوع',
  },
} satisfies Dict<{
  title: string
  lead: string
  today: string
  yesterday: string
  related: string
  askAi: string
  notFound: string
  empty: string
  back: string
}>
