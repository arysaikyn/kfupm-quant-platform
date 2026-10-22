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
  version: string
  journalTitle: string
  journalTotal: string
  journalNotional: string
  journalEmpty: string
  sideBuy: string
  sideSell: string
  journalDelete: string
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
    version: '版本',
    journalTitle: '交易记录',
    journalTotal: '总笔数',
    journalNotional: '名义金额',
    journalEmpty: '在「策略」中记录一笔交易，这里会显示明细。',
    sideBuy: '买入',
    sideSell: '卖出',
    journalDelete: '删除',
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
    version: 'Version',
    journalTitle: 'Trade log',
    journalTotal: 'Entries',
    journalNotional: 'Notional',
    journalEmpty: 'Log a trade from Strategies and it shows up here.',
    sideBuy: 'Buy',
    sideSell: 'Sell',
    journalDelete: 'Delete',
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
    version: 'الإصدار',
    journalTitle: 'سجل التداول',
    journalTotal: 'عدد الصفقات',
    journalNotional: 'القيمة الاسمية',
    journalEmpty: 'سجّل صفقة من «خططي» وستظهر هنا.',
    sideBuy: 'شراء',
    sideSell: 'بيع',
    journalDelete: 'حذف',
  },
} satisfies Dict<Strings>
