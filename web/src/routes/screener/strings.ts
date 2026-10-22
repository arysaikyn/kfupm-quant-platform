import type { Dict } from '../../i18n'

export type ScreenerStrings = {
  title: string
  subtitle: string
  presetsLabel: string
  presetValue: string
  presetMomentum: string
  presetCalm: string
  rulesTitle: string
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
  turnoverHint: string
  resultsTitle: string
  resultsMatch: string
  liveHint: string
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
  loadAria: string
  openAria: string
}

export const screenerStrings = {
  zh: {
    title: '筛选器',
    subtitle: '用价格、涨跌与换手筛出标的',
    presetsLabel: '预设',
    presetValue: '低估值',
    presetMomentum: '强动量',
    presetCalm: '低波动',
    rulesTitle: '条件',
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
    turnoverHint: '换手由走势长度估算',
    resultsTitle: '筛选结果',
    resultsMatch: '命中',
    liveHint: '即时更新',
    resultsEmpty: '没有符合条件的标的',
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
    loadAria: '载入 {name}',
    openAria: '打开 {name}',
  },
  en: {
    title: 'Screener',
    subtitle: 'Filter the tape by price, change and turnover',
    presetsLabel: 'Presets',
    presetValue: 'Low value',
    presetMomentum: 'Momentum',
    presetCalm: 'Low volatility',
    rulesTitle: 'Conditions',
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
    noRules: 'No conditions yet — showing every name',
    turnoverHint: 'Turnover is estimated from the sparkline',
    resultsTitle: 'Results',
    resultsMatch: 'matched',
    liveHint: 'Live',
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
    noRules: 'لا شروط بعد — تُعرض كل الأسماء',
    turnoverHint: 'الدوران مقدَّر من طول خط الحركة',
    resultsTitle: 'النتائج',
    resultsMatch: 'مطابق',
    liveHint: 'يتحدث فورًا',
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
    loadAria: 'تحميل {name}',
    openAria: 'فتح {name}',
  },
} satisfies Dict<ScreenerStrings>
