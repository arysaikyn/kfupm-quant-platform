/* oxlint-disable react/only-export-components -- provider + hooks ship together by design */
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
    'nav.primary': '主导航',
    'route.market': '行情',
    'route.news': '新闻',
    'route.ai': 'AI',
    'route.strategy': '策略',
    'route.me': '我的',
    'route.symbol': '个股',
    'route.article': '新闻',
    'route.strategyDetail': '策略',
    'route.screener': '筛选器',
    'route.alerts': '价格提醒',
    'route.review': '每日复盘',
    'route.calendar': '财经日历',
    'route.compare': '对比',
    'route.runs': '会话',
    'route.learn': '术语',
    'route.search': '搜索',
    'route.sector': '板块',
    'route.report': '报告',
    'route.watchlists': '自选分组',
    'route.settings': '设置',
    'route.workspace': '工作台',
    'route.notFound': '页面不存在',
    'common.retry': '重试',
    'common.empty': '暂时没有内容',
    'common.back': '返回',
    'common.close': '关闭',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.skip': '跳到主要内容',
    'common.offline': '当前离线，显示的是上次数据',
    'common.reload': '重新加载',
    'common.copy': '复制',
    'common.copied': '已复制',
    'common.stop': '停止',
    'common.newChat': '新对话',
    'common.demo': '演示数据',
    'common.notFoundTitle': '这个页面不存在',
    'common.notFoundBody': '链接可能过期，或者地址打错了。',
    'common.goHome': '回到行情',
    'common.boundaryTitle': '这个页面出错了',
    'common.boundaryBody': '你的数据还在。重试通常就能恢复。',
  },
  en: {
    'tab.market': 'Markets',
    'tab.news': 'News',
    'tab.ai': 'AI',
    'tab.strategy': 'Strategies',
    'tab.me': 'Profile',
    'nav.primary': 'Primary',
    'route.market': 'Markets',
    'route.news': 'News',
    'route.ai': 'AI',
    'route.strategy': 'Strategies',
    'route.me': 'Profile',
    'route.symbol': 'Stock',
    'route.article': 'Story',
    'route.strategyDetail': 'Strategy',
    'route.screener': 'Screener',
    'route.alerts': 'Price alerts',
    'route.review': 'Daily review',
    'route.calendar': 'Calendar',
    'route.compare': 'Compare',
    'route.runs': 'Sessions',
    'route.learn': 'Glossary',
    'route.search': 'Search',
    'route.sector': 'Sector',
    'route.report': 'Report',
    'route.watchlists': 'Watchlists',
    'route.settings': 'Settings',
    'route.workspace': 'Workspace',
    'route.notFound': 'Page not found',
    'common.retry': 'Retry',
    'common.empty': 'Nothing here yet',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.skip': 'Skip to content',
    'common.offline': 'Offline — showing the last saved data',
    'common.reload': 'Reload',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.stop': 'Stop',
    'common.newChat': 'New chat',
    'common.demo': 'Demo data',
    'common.notFoundTitle': 'This page does not exist',
    'common.notFoundBody': 'The link may be old, or the address has a typo.',
    'common.goHome': 'Go to markets',
    'common.boundaryTitle': 'This screen broke',
    'common.boundaryBody': 'Your data is still here. Retrying usually fixes it.',
  },
  ar: {
    'tab.market': 'الأسواق',
    'tab.news': 'الأخبار',
    'tab.ai': 'AI',
    'tab.strategy': 'خططي',
    'tab.me': 'حسابي',
    'nav.primary': 'التنقل الرئيسي',
    'route.market': 'الأسواق',
    'route.news': 'الأخبار',
    'route.ai': 'AI',
    'route.strategy': 'خططي',
    'route.me': 'حسابي',
    'route.symbol': 'سهم',
    'route.article': 'خبر',
    'route.strategyDetail': 'خطة',
    'route.screener': 'الفرز',
    'route.alerts': 'تنبيهات الأسعار',
    'route.review': 'مراجعة اليوم',
    'route.calendar': 'التقويم',
    'route.compare': 'المقارنة',
    'route.runs': 'الجلسات',
    'route.learn': 'المصطلحات',
    'route.search': 'البحث',
    'route.sector': 'القطاع',
    'route.report': 'التقرير',
    'route.watchlists': 'قوائم المتابعة',
    'route.settings': 'الإعدادات',
    'route.workspace': 'مساحة العمل',
    'route.notFound': 'الصفحة غير موجودة',
    'common.retry': 'إعادة',
    'common.empty': 'لا يوجد شيء بعد',
    'common.back': 'رجوع',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.skip': 'تخطَّ إلى المحتوى',
    'common.offline': 'أنت غير متصل — هذه آخر بيانات محفوظة',
    'common.reload': 'إعادة التحميل',
    'common.copy': 'نسخ',
    'common.copied': 'تم النسخ',
    'common.stop': 'إيقاف',
    'common.newChat': 'محادثة جديدة',
    'common.demo': 'بيانات عرض',
    'common.notFoundTitle': 'هذه الصفحة غير موجودة',
    'common.notFoundBody': 'قد يكون الرابط قديمًا أو العنوان خاطئًا.',
    'common.goHome': 'إلى الأسواق',
    'common.boundaryTitle': 'تعذّر عرض هذه الصفحة',
    'common.boundaryBody': 'بياناتك ما زالت محفوظة. إعادة المحاولة تكفي عادةً.',
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
  // index.html already resolved this before paint; trust it first.
  const applied = document.documentElement.lang
  if (applied === 'zh' || applied === 'en' || applied === 'ar') return applied
  const saved = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })()
  if (saved === 'zh' || saved === 'en' || saved === 'ar') return saved
  const nav = (navigator.language || 'en').toLowerCase()
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
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Private browsing: keep the in-memory choice, skip persistence.
    }
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
export function fmtNum(n: number, lang: Lang, digits = 2, suffix = ''): string {
  // LRI…PDI keeps the figure and its unit reading left-to-right inside Arabic.
  return `\u2066${formatter(lang, digits).format(n)}${suffix}\u2069`
}

/** The contract stores fractions: 0.12 means 12%. */
export function fmtPct(v: number, lang: Lang, digits = 2): string {
  const body = `${v > 0 ? '+' : ''}${formatter(lang, digits).format(v * 100)}%`
  return `\u2066${body}\u2069`
}
