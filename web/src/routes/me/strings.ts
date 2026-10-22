import type { Dict } from '../../i18n'

type Strings = {
  title: string
  name: string
  email: string
  signIn: string
  appearance: string
  light: string
  dark: string
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
  moreSettings: string
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
    moreSettings: '设置',
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
    moreSettings: 'Settings',
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
    moreSettings: 'الإعدادات',
    version: 'الإصدار',
  },
} satisfies Dict<Strings>
