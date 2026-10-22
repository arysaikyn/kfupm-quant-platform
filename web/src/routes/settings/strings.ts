import type { Dict } from '../../i18n'

type Strings = {
  title: string
  subtitle: string
  back: string

  readingTitle: string
  densityLabel: string
  comfortable: string
  compact: string
  densityHint: string
  previewTitle: string
  previewHint: string

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

  notificationsTitle: string
  alertsLabel: string
  alertsHint: string

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

    readingTitle: '阅读偏好',
    densityLabel: '列表密度',
    comfortable: '舒适',
    compact: '紧凑',
    densityHint: '只改变本页预览的疏密，不会影响其他页面。',
    previewTitle: '预览',
    previewHint: '用三只沙特股票演示当前密度。',

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

    notificationsTitle: '通知',
    alertsLabel: '价格提醒',
    alertsHint: '开关只保存在本机；当前版本未接入后端，不会发送任何通知。',

    aboutTitle: '关于',
    appLabel: '应用',
    appName: 'Quant Desk',
    versionLabel: '版本',
    learn: '术语表',
    learnHint: '遇到不认识的词，从这里查。',

    resetTitle: '重置本地数据',
    resetHint:
      '清除自选、AI 对话、提醒、筛选方案、搜索记录、策略规则、已复制的策略和本页设置。此操作无法撤销；语言与主题会保留。',
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

    readingTitle: 'Reading',
    densityLabel: 'List density',
    comfortable: 'Comfortable',
    compact: 'Compact',
    densityHint: 'Changes the preview below only. Other screens are unaffected.',
    previewTitle: 'Preview',
    previewHint: 'Three Saudi stocks shown at the selected density.',

    sourcesTitle: 'Data sources',
    sourcesHint: 'Read-only list. This demo build makes no live requests.',
    chipDemo: 'DEMO',
    tadawul: 'Tadawul',
    tadawulMarket: 'Saudi Exchange',
    sse: 'SSE',
    sseMarket: 'Shanghai Stock Exchange',
    hkex: 'HKEX',
    hkexMarket: 'Hong Kong Exchanges',
    reuters: 'Reuters',
    reutersMarket: 'News wire',

    notificationsTitle: 'Notifications',
    alertsLabel: 'Price alerts',
    alertsHint:
      'The switch is stored on this device only. No backend is connected, so nothing is sent.',

    aboutTitle: 'About',
    appLabel: 'App',
    appName: 'Quant Desk',
    versionLabel: 'Version',
    learn: 'Glossary',
    learnHint: 'Look up a term you do not know.',

    resetTitle: 'Reset local data',
    resetHint:
      'Clears watchlists, AI threads, alerts, screens, recent searches, strategy rules, copied strategies and the settings on this page. This cannot be undone; language and theme are kept.',
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

    readingTitle: 'تفضيلات القراءة',
    densityLabel: 'كثافة القوائم',
    comfortable: 'مريحة',
    compact: 'مضغوطة',
    densityHint: 'تغيّر هذه الكثافة المعاينة في هذه الصفحة فقط، ولا تؤثر في بقية الشاشات.',
    previewTitle: 'معاينة',
    previewHint: 'ثلاثة أسهم سعودية بالكثافة المختارة.',

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

    notificationsTitle: 'الإشعارات',
    alertsLabel: 'تنبيهات الأسعار',
    alertsHint:
      'يُحفظ المفتاح على هذا الجهاز فقط. لا توجد خدمة خلفية متصلة، لذا لن يُرسل أي تنبيه.',

    aboutTitle: 'حول',
    appLabel: 'التطبيق',
    appName: 'Quant Desk',
    versionLabel: 'الإصدار',
    learn: 'المصطلحات',
    learnHint: 'ابحث عن مصطلح لا تعرفه.',

    resetTitle: 'مسح البيانات المحلية',
    resetHint:
      'يمسح قوائم المتابعة ومحادثات الذكاء الاصطناعي والتنبيهات وخطط الفرز وعمليات البحث وقواعد الخطط والخطط المنسوخة وإعدادات هذه الصفحة. لا يمكن التراجع، وتُحفظ اللغة والمظهر.',
    resetButton: 'مسح البيانات المحلية',
    resetConfirm: 'اضغط مرة أخرى للتأكيد',
    resetCancel: 'إلغاء',
    resetArmedHint: 'اضغط مرة أخرى لمسح البيانات المحلية وإعادة التحميل.',
    resetError: 'منع المتصفح الوصول إلى التخزين المحلي، ولم يُمسح أي شيء.',
  },
} satisfies Dict<Strings>
