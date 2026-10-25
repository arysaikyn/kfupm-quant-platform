import type { Dict } from '../../i18n'

type Strings = {
  title: string
  subtitle: string
  back: string


  sourcesTitle: string
  sourcesHint: string
  chipDemo: string
  tadawul: string
  tadawulMarket: string
  sse: string
  sseMarket: string
  hkex: string
  hkexMarket: string
  reuters: string
  reutersMarket: string


  aboutTitle: string
  appLabel: string
  appName: string
  versionLabel: string
  learn: string
  learnHint: string

  resetTitle: string
  resetHint: string
  resetButton: string
  resetConfirm: string
  resetCancel: string
  resetArmedHint: string
  resetError: string
}

export const strings = {
  zh: {
    title: '设置',
    subtitle: '偏好只保存在这台设备上。',
    back: '返回',


    sourcesTitle: '数据源',
    sourcesHint: '只读清单。演示版本不会发起真实请求。',
    chipDemo: '演示',
    tadawul: 'Tadawul',
    tadawulMarket: '沙特交易所',
    sse: 'SSE',
    sseMarket: '上海证券交易所',
    hkex: 'HKEX',
    hkexMarket: '香港交易所',
    reuters: 'Reuters',
    reutersMarket: '路透社',


    aboutTitle: '关于',
    appLabel: '应用',
    appName: 'Quant Desk',
    versionLabel: '版本',
    learn: '术语表',
    learnHint: '遇到不认识的词，从这里查。',

    resetTitle: '重置本地数据',
    resetHint:
      '清除自选、AI 对话、AI 提供方选择、提醒、筛选方案、搜索记录和已保存新闻。此操作无法撤销；语言、主题、市场与引导状态会保留。',
    resetButton: '重置本地数据',
    resetConfirm: '再次点击确认清除',
    resetCancel: '取消',
    resetArmedHint: '再次点击将清除本机数据并重新加载。',
    resetError: '浏览器拒绝访问本地存储，未清除任何数据。',
  },
  en: {
    title: 'Settings',
    subtitle: 'Preferences stay on this device.',
    back: 'Back',


    sourcesTitle: 'Data sources',
    sourcesHint: 'Read-only list. This demo build makes no live requests.',
    chipDemo: 'Demo',
    tadawul: 'Tadawul',
    tadawulMarket: 'Saudi Exchange',
    sse: 'SSE',
    sseMarket: 'Shanghai Stock Exchange',
    hkex: 'HKEX',
    hkexMarket: 'Hong Kong Exchanges',
    reuters: 'Reuters',
    reutersMarket: 'News wire',


    aboutTitle: 'About',
    appLabel: 'App',
    appName: 'Quant Desk',
    versionLabel: 'Version',
    learn: 'Glossary',
    learnHint: 'Look up a term you do not know.',

    resetTitle: 'Reset local data',
    resetHint:
      'Clears watchlists, AI threads, AI provider selection, alerts, saved screens, recent searches and saved news. This cannot be undone; language, theme, market and onboarding stay.',
    resetButton: 'Reset local data',
    resetConfirm: 'Tap again to confirm',
    resetCancel: 'Cancel',
    resetArmedHint: 'Tap again to erase local data and reload.',
    resetError: 'The browser blocked local storage. Nothing was cleared.',
  },
  ar: {
    title: 'الإعدادات',
    subtitle: 'تبقى تفضيلاتك على هذا الجهاز.',
    back: 'رجوع',


    sourcesTitle: 'مصادر البيانات',
    sourcesHint: 'قائمة للقراءة فقط. النسخة التجريبية لا ترسل طلبات حقيقية.',
    chipDemo: 'تجريبي',
    tadawul: 'تداول',
    tadawulMarket: 'السوق السعودية',
    sse: 'SSE',
    sseMarket: 'بورصة شنغهاي',
    hkex: 'HKEX',
    hkexMarket: 'بورصة هونغ كونغ',
    reuters: 'رويترز',
    reutersMarket: 'وكالة أخبار',


    aboutTitle: 'حول',
    appLabel: 'التطبيق',
    appName: 'Quant Desk',
    versionLabel: 'الإصدار',
    learn: 'المصطلحات',
    learnHint: 'ابحث عن مصطلح لا تعرفه.',

    resetTitle: 'مسح البيانات المحلية',
    resetHint:
      'يمسح قوائم المتابعة ومحادثات الذكاء الاصطناعي واختيار مزوّد AI والتنبيهات وخطط الفرز والبحث والأخبار المحفوظة. لا يمكن التراجع، وتُحفظ اللغة والمظهر والسوق والتهيئة.',
    resetButton: 'مسح البيانات المحلية',
    resetConfirm: 'اضغط مرة أخرى للتأكيد',
    resetCancel: 'إلغاء',
    resetArmedHint: 'اضغط مرة أخرى لمسح البيانات المحلية وإعادة التحميل.',
    resetError: 'منع المتصفح الوصول إلى التخزين المحلي، ولم يُمسح أي شيء.',
  },
} satisfies Dict<Strings>
