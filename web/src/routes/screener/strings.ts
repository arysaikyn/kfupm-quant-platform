import type { Dict } from '../../i18n'

export type ScreenerStrings = {
  title: string
  subtitle: string
  presetsLabel: string
  presetValue: string
  presetMomentum: string
  presetCalm: string
  rulesTitle: string
  rulesHelper: string
  addRule: string
  removeRule: string
  fieldLabel: string
  operatorLabel: string
  valueLabel: string
  fieldChange: string
  fieldPrice: string
  fieldTurnover: string
  opLt: string
  opGt: string
  ruleLimit: string
  noRules: string
  filterChipsLabel: string
  removeFilterAria: string
  turnoverHint: string
  resultsTitle: string
  /** Placeholders: n, total. */
  resultsCount: string
  liveHint: string
  shareLink: string
  linkCopied: string
  resultsEmpty: string
  relax: string
  nameHeader: string
  priceHeader: string
  changeHeader: string
  savedTitle: string
  savedEmpty: string
  savePlaceholder: string
  save: string
  saved: string
  savedCount: string
  deleteAria: string
  duplicateAria: string
  loadAria: string
  openAria: string
}

export const screenerStrings = {
  zh: {
    title: '筛选器',
    subtitle: '用价格、涨跌和换手筛出股票',
    presetsLabel: '预设',
    presetValue: '低估值',
    presetMomentum: '强势股',
    presetCalm: '低波动',
    rulesTitle: '条件',
    rulesHelper: '挑几条条件，列表会随输入实时更新。',
    addRule: '添加条件',
    removeRule: '删除条件',
    fieldLabel: '字段',
    operatorLabel: '比较',
    valueLabel: '数值',
    fieldChange: '涨跌',
    fieldPrice: '价格',
    fieldTurnover: '换手',
    opLt: '小于',
    opGt: '大于',
    ruleLimit: '最多 5 条',
    noRules: '还没有条件，先看全部标的',
    filterChipsLabel: '生效条件',
    removeFilterAria: '移除 {name}',
    turnoverHint: '换手由走势长度估算',
    resultsTitle: '筛选结果',
    resultsCount: '符合：{total} 只中 {n} 只',
    liveHint: '演示',
    shareLink: '复制分享链接',
    linkCopied: '已复制',
    resultsEmpty: '没有符合条件的股票',
    relax: '放宽条件',
    nameHeader: '名称',
    priceHeader: '价格',
    changeHeader: '涨跌',
    savedTitle: '我的筛选',
    savedEmpty: '保存一组条件，下次直接调用',
    savePlaceholder: '给这组条件起名',
    save: '保存',
    saved: '已保存',
    savedCount: '组',
    deleteAria: '删除 {name}',
    duplicateAria: '复制 {name}',
    loadAria: '载入 {name}',
    openAria: '打开 {name}',
  },
  en: {
    title: 'Screener',
    subtitle: 'Filter stocks by price, change and turnover',
    presetsLabel: 'Presets',
    presetValue: 'Cheap',
    presetMomentum: 'Uptrend',
    presetCalm: 'Steady',
    rulesTitle: 'Conditions',
    rulesHelper: 'Pick a few conditions. The list updates as you type.',
    addRule: 'Add condition',
    removeRule: 'Remove condition',
    fieldLabel: 'Field',
    operatorLabel: 'Comparison',
    valueLabel: 'Value',
    fieldChange: 'Change',
    fieldPrice: 'Price',
    fieldTurnover: 'Turnover',
    opLt: 'Less than',
    opGt: 'Greater than',
    ruleLimit: '5 max',
    noRules: 'No conditions yet, so every name is shown',
    filterChipsLabel: 'Active filters',
    removeFilterAria: 'Remove {name}',
    turnoverHint: 'Turnover is estimated from the price line',
    resultsTitle: 'Results',
    resultsCount: 'Matches: {n} of {total}',
    liveHint: 'Demo',
    shareLink: 'Copy share link',
    linkCopied: 'Copied',
    resultsEmpty: 'No stocks match these conditions',
    relax: 'Clear conditions',
    nameHeader: 'Name',
    priceHeader: 'Price',
    changeHeader: 'Change',
    savedTitle: 'Saved screens',
    savedEmpty: 'Save a rule set and reuse it',
    savePlaceholder: 'Name this screen',
    save: 'Save',
    saved: 'Saved',
    savedCount: 'saved',
    deleteAria: 'Delete {name}',
    duplicateAria: 'Duplicate {name}',
    loadAria: 'Load {name}',
    openAria: 'Open {name}',
  },
  ar: {
    title: 'الفرز',
    subtitle: 'صفِّ الأسهم بالسعر والتغير ومعدل الدوران',
    presetsLabel: 'إعدادات جاهزة',
    presetValue: 'قيمة منخفضة',
    presetMomentum: 'زخم قوي',
    presetCalm: 'تقلب منخفض',
    rulesTitle: 'الشروط',
    rulesHelper: 'اختر بضعة شروط، وستتحدّث القائمة أثناء الكتابة.',
    addRule: 'إضافة شرط',
    removeRule: 'حذف الشرط',
    fieldLabel: 'الحقل',
    operatorLabel: 'المقارنة',
    valueLabel: 'القيمة',
    fieldChange: 'التغير',
    fieldPrice: 'السعر',
    fieldTurnover: 'الدوران',
    opLt: 'أقل من',
    opGt: 'أكبر من',
    ruleLimit: '5 كحد أقصى',
    noRules: 'لا شروط بعد، لذلك تُعرض كل الأسماء',
    filterChipsLabel: 'عوامل التصفية النشطة',
    removeFilterAria: 'إزالة {name}',
    turnoverHint: 'الدوران مقدَّر من طول خط الحركة',
    resultsTitle: 'النتائج',
    resultsCount: 'المطابق: {n} من {total}',
    liveHint: 'عرض',
    shareLink: 'نسخ رابط المشاركة',
    linkCopied: 'تم النسخ',
    resultsEmpty: 'لا أسهم تطابق هذه الشروط',
    relax: 'مسح الشروط',
    nameHeader: 'الاسم',
    priceHeader: 'السعر',
    changeHeader: 'التغير',
    savedTitle: 'عمليات الفرز المحفوظة',
    savedEmpty: 'احفظ مجموعة شروط لإعادة استخدامها',
    savePlaceholder: 'سمِّ هذه الشاشة',
    save: 'حفظ',
    saved: 'تم الحفظ',
    savedCount: 'محفوظة',
    deleteAria: 'حذف {name}',
    duplicateAria: 'نسخ {name}',
    loadAria: 'تحميل {name}',
    openAria: 'فتح {name}',
  },
} satisfies Dict<ScreenerStrings>
