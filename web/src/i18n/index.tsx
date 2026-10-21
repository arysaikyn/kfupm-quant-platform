import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

export type Lang = 'zh' | 'en' | 'ar'

/** Every screen owns its own dictionary; keys are checked at compile time. */
export type Dict<T extends Record<string, string>> = { zh: T; en: T; ar: T }

const global = {
  zh: {
    'tab.market': '行情',
    'tab.news': '新闻',
    'tab.ai': 'AI',
    'tab.strategy': '策略',
    'tab.me': '我的',
    'common.retry': '重试',
    'common.empty': '暂时没有内容',
    'common.back': '返回',
    'common.close': '关闭',
    'common.save': '保存',
    'common.cancel': '取消',
  },
  en: {
    'tab.market': 'Markets',
    'tab.news': 'News',
    'tab.ai': 'AI',
    'tab.strategy': 'Strategies',
    'tab.me': 'Profile',
    'common.retry': 'Retry',
    'common.empty': 'Nothing here yet',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
  },
  ar: {
    'tab.market': 'الأسواق',
    'tab.news': 'الأخبار',
    'tab.ai': 'AI',
    'tab.strategy': 'خططي',
    'tab.me': 'حسابي',
    'common.retry': 'إعادة',
    'common.empty': 'لا يوجد شيء بعد',
    'common.back': 'رجوع',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
  },
} as const

export type GlobalKey = keyof (typeof global)['zh']

type Ctx = {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  t: (k: GlobalKey) => string
}

const I18nContext = createContext<Ctx | null>(null)

const STORAGE_KEY = 'app.lang'

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en' || saved === 'ar') return saved
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = dir
    // Market colour convention: red-up is a China-only habit.
    el.dataset.updown = lang === 'zh' ? 'cn' : 'intl'
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const t = useCallback((k: GlobalKey) => global[lang][k], [lang])

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}

/** Per-screen strings: `const s = useStrings(marketStrings); s('title')` */
export function useStrings<T extends Record<string, string>>(d: Dict<T>) {
  const { lang } = useI18n()
  return useCallback((k: keyof T & string) => d[lang][k], [d, lang])
}

const numCache: Record<string, Intl.NumberFormat> = {}

function formatter(lang: Lang, digits: number): Intl.NumberFormat {
  const key = `${lang}:${digits}`
  let f = numCache[key]
  if (!f) {
    f = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : lang, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    numCache[key] = f
  }
  return f
}

/** Western digits in Arabic too — financial readers expect 45, not ٤٥. */
export function fmtNum(n: number, lang: Lang, digits = 2): string {
  // LRI…PDI keeps the figure reading left-to-right inside Arabic text.
  return `\u2066${formatter(lang, digits).format(n)}\u2069`
}

/** The contract stores fractions: 0.12 means 12%. */
export function fmtPct(v: number, lang: Lang, digits = 2): string {
  const body = `${v > 0 ? '+' : ''}${formatter(lang, digits).format(v * 100)}%`
  return `\u2066${body}\u2069`
}
