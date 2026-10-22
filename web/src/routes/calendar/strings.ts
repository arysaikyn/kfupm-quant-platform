import type { Dict } from '../../i18n'

type CalendarKey =
  | 'title'
  | 'subtitle'
  | 'weekLabel'
  | 'eventOne'
  | 'eventMany'
  | 'watchLabel'
  | 'today'
  | 'noEvents'
  | 'kindEarnings'
  | 'kindDividend'
  | 'kindMacro'
  | 'macroName'
  | 'watchMark'
  | 'range'

export const strings = {
  zh: {
    title: '财经日历',
    subtitle: '未来七天的财报与事件',
    weekLabel: '本周事件',
    eventOne: '个事件',
    eventMany: '个事件',
    watchLabel: '在自选',
    today: '今天',
    noEvents: '无事件',
    kindEarnings: '财报',
    kindDividend: '分红',
    kindMacro: '宏观',
    macroName: '指数半年度调整',
    watchMark: '自选',
    range: '{start} – {end}',
  },
  en: {
    title: 'Calendar',
    subtitle: 'Earnings and events for the next seven days',
    weekLabel: 'This week',
    eventOne: 'event',
    eventMany: 'events',
    watchLabel: 'on watchlist',
    today: 'Today',
    noEvents: 'No events',
    kindEarnings: 'Earnings',
    kindDividend: 'Dividend',
    kindMacro: 'Macro',
    macroName: 'Index rebalance',
    watchMark: 'Watchlist',
    range: '{start} – {end}',
  },
  ar: {
    title: 'التقويم',
    subtitle: 'أرباح الشركات والأحداث خلال الأيام السبعة القادمة',
    weekLabel: 'أحداث الأسبوع',
    eventOne: 'حدث',
    eventMany: 'أحداث',
    watchLabel: 'في قائمتك',
    today: 'اليوم',
    noEvents: 'لا أحداث',
    kindEarnings: 'الأرباح',
    kindDividend: 'التوزيعات',
    kindMacro: 'الاقتصاد الكلي',
    macroName: 'إعادة توازن المؤشر',
    watchMark: 'قائمتي',
    range: '{start} – {end}',
  },
} satisfies Dict<Record<CalendarKey, string>>
