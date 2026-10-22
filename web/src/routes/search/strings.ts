import type { Dict } from '../../i18n'

const zh = {
  title: '搜索',
  back: '返回',
  placeholder: '代码、名称或币种',
  clearQuery: '清空输入',
  recent: '最近',
  noRecent: '还没有搜索记录',
  clearAll: '清空全部',
  watchlist: '自选',
  results: '结果',
  noResults: '没有找到 “{q}”',
  addWatch: '加入自选',
  removeWatch: '移出自选',
  screenerEntry: '条件选股',
  screenerHint: '按估值、涨跌、成交筛出一组股票',
}

const en: typeof zh = {
  title: 'Search',
  back: 'Back',
  placeholder: 'Symbol, name or currency',
  clearQuery: 'Clear input',
  recent: 'Recent',
  noRecent: 'No recent searches yet',
  clearAll: 'Clear all',
  watchlist: 'Watchlist',
  results: 'Results',
  noResults: 'No results for “{q}”',
  addWatch: 'Add to watchlist',
  removeWatch: 'Remove from watchlist',
  screenerEntry: 'Stock screener',
  screenerHint: 'Filter by valuation, move and volume',
}

const ar: typeof zh = {
  title: 'بحث',
  back: 'رجوع',
  placeholder: 'الرمز أو الاسم أو العملة',
  clearQuery: 'مسح الإدخال',
  recent: 'الأحدث',
  noRecent: 'لا توجد عمليات بحث حديثة',
  clearAll: 'مسح الكل',
  watchlist: 'قائمة المتابعة',
  results: 'النتائج',
  noResults: 'لا توجد نتائج لـ «{q}»',
  addWatch: 'أضف إلى قائمة المتابعة',
  removeWatch: 'أزل من قائمة المتابعة',
  screenerEntry: 'فرز الأسهم',
  screenerHint: 'فلترة حسب التقييم والحركة والسيولة',
}

export const strings = { zh, en, ar } satisfies Dict<typeof zh>
