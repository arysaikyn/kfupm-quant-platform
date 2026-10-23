import type { Dict } from '../../i18n'

type Strings = {
  title: string
  name: string
  email: string
  signIn: string
  appearance: string
  light: string
  dark: string
  system: string
  language: string
  /** Native names — identical in every dictionary on purpose. */
  langZh: string
  langZhEnglish: string
  langEn: string
  langEnEnglish: string
  langAr: string
  langArEnglish: string
  glossary: string
  moreTitle: string
  moreWatchlists: string
  moreAlerts: string
  moreCalendar: string
  moreReview: string
  moreSettings: string
  replayOnboarding: string
  version: string
}

export const strings = {
  zh: {
    title: '我的',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: '登录',
    appearance: '外观',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    language: '语言',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    glossary: '术语',
    moreTitle: '更多',
    moreWatchlists: '自选分组',
    moreAlerts: '价格提醒',
    moreCalendar: '财经日历',
    moreReview: '每日复盘',
    moreSettings: '设置',
    replayOnboarding: '重看新手引导',
    version: '版本',
  },
  en: {
    title: 'Profile',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: 'Sign in',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    glossary: 'Glossary',
    moreTitle: 'More',
    moreWatchlists: 'Watchlist groups',
    moreAlerts: 'Price alerts',
    moreCalendar: 'Calendar',
    moreReview: 'Daily review',
    moreSettings: 'Settings',
    replayOnboarding: 'Replay onboarding',
    version: 'Version',
  },
  ar: {
    title: 'حسابي',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: 'تسجيل الدخول',
    appearance: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب النظام',
    language: 'اللغة',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    glossary: 'المصطلحات',
    moreTitle: 'المزيد',
    moreWatchlists: 'مجموعات المتابعة',
    moreAlerts: 'تنبيهات الأسعار',
    moreCalendar: 'التقويم',
    moreReview: 'المراجعة اليومية',
    moreSettings: 'الإعدادات',
    replayOnboarding: 'إعادة الجولة التعريفية',
    version: 'الإصدار',
  },
} satisfies Dict<Strings>
