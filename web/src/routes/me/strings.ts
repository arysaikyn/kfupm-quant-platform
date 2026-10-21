import type { Dict } from '../../i18n'

type Strings = {
  title: string
  name: string
  email: string
  signIn: string
  language: string
  /** Native names — identical in every dictionary on purpose. */
  langZh: string
  langZhEnglish: string
  langEn: string
  langEnEnglish: string
  langAr: string
  langArEnglish: string
  version: string
}

export const strings = {
  zh: {
    title: '我的',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: '登录',
    language: '语言与显示',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    version: '版本',
  },
  en: {
    title: 'Profile',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: 'Sign in',
    language: 'Language & display',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    version: 'Version',
  },
  ar: {
    title: 'حسابي',
    name: 'Arys',
    email: 'arys@example.com',
    signIn: 'تسجيل الدخول',
    language: 'اللغة والعرض',
    langZh: '中文',
    langZhEnglish: 'Chinese',
    langEn: 'English',
    langEnEnglish: 'English',
    langAr: 'العربية',
    langArEnglish: 'Arabic',
    version: 'الإصدار',
  },
} satisfies Dict<Strings>
