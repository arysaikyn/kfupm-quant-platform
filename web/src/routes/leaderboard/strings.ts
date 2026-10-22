import type { Dict } from '../../i18n'

export type LeaderboardStrings = {
  title: string
  subtitle: string
  sortLabel: string
  sortReturn: string
  sortRules: string
  sortRecent: string
  lastYear: string
  rulesUnit: string
  summaryStrategies: string
  summaryMedian: string
  openStrategy: string
  copy: string
  copied: string
  copyAck: string
  rankLabel: string
}

export const leaderboardStrings: Dict<LeaderboardStrings> = {
  zh: {
    title: '社区榜单',
    subtitle: '社区策略，按收益、规则数或更新时间排序',
    sortLabel: '排序方式',
    sortReturn: '收益',
    sortRules: '规则数',
    sortRecent: '最新',
    lastYear: '近一年',
    rulesUnit: '条规则',
    summaryStrategies: '策略数',
    summaryMedian: '收益中位数',
    openStrategy: '浏览策略库',
    copy: '复制到我的',
    copied: '已复制',
    copyAck: '已复制到我的',
    rankLabel: '名次',
  },
  en: {
    title: 'Community board',
    subtitle: 'Ranked by return, rules or recency',
    sortLabel: 'Sort by',
    sortReturn: 'Return',
    sortRules: 'Rules',
    sortRecent: 'Latest',
    lastYear: 'Last year',
    rulesUnit: 'rules',
    summaryStrategies: 'Strategies',
    summaryMedian: 'Median return',
    openStrategy: 'Browse strategies',
    copy: 'Copy to mine',
    copied: 'Copied',
    copyAck: 'Copied to mine',
    rankLabel: 'Rank',
  },
  ar: {
    title: 'لوحة الصدارة',
    subtitle: 'خطط المجتمع حسب العائد أو عدد القواعد أو آخر تحديث',
    sortLabel: 'الترتيب حسب',
    sortReturn: 'العائد',
    sortRules: 'عدد القواعد',
    sortRecent: 'الأحدث',
    lastYear: 'آخر سنة',
    rulesUnit: 'قواعد',
    summaryStrategies: 'عدد الخطط',
    summaryMedian: 'وسيط العائد',
    openStrategy: 'تصفّح الخطط',
    copy: 'انسخ إلى خططي',
    copied: 'تم النسخ',
    copyAck: 'نُسخت إلى خططي',
    rankLabel: 'المرتبة',
  },
}
