import type { Dict } from '../../i18n'

const zh = {
  title: '对比',
  subtitle: '三只标的，一张表',
  slotsTitle: '选择标的',
  slotA: 'A',
  slotB: 'B',
  slotC: 'C',
  slotSelect: '对比位',

  tableTitle: '正面比较',
  tableTag: '20 日',
  metric: '指标',
  bestHint: '高亮为整行最优：折价、涨幅、区间位置与综合分取最高，波动率取最低。',
  bestMark: '最优',

  rowDiscount: '折价',
  rowDiscountHint: '相对合理价',
  rowChange: '今日',
  rowChangeHint: '涨跌',
  rowRange: '区间',
  rowRangeHint: '20 日位置',
  rowVol: '波动率',
  rowVolHint: '20 日标准差',
  rowScore: '综合分',
  rowScoreHint: '0–100',

  chartTitle: '相对走势',
  chartTag: '起点 = 100',
  axisFrom: '起点',
  axisTo: '最新',
  chartAria: '三只标的归一化走势对比图',
  legendAria: '图例',

  verdictLead: '{name} 领先 {pts} 分',
  verdictTie: '{a} 与 {b} 基本持平',
}

const en: typeof zh = {
  title: 'Compare',
  subtitle: 'Three names, one board',
  slotsTitle: 'Picks',
  slotA: 'A',
  slotB: 'B',
  slotC: 'C',
  slotSelect: 'Comparison slot',

  tableTitle: 'Head to head',
  tableTag: '20-day',
  metric: 'Metric',
  bestHint: 'Accent marks the row winner: highest discount to fair value, change, range and score; lowest volatility.',
  bestMark: 'best',

  rowDiscount: 'Discount',
  rowDiscountHint: 'to fair value',
  rowChange: 'Today',
  rowChangeHint: 'change',
  rowRange: 'Range',
  rowRangeHint: '20-day position',
  rowVol: 'Volatility',
  rowVolHint: '20-day std',
  rowScore: 'Score',
  rowScoreHint: '0–100',

  chartTitle: 'Relative path',
  chartTag: 'first point = 100',
  axisFrom: 'First',
  axisTo: 'Latest',
  chartAria: 'Normalised price paths of the three selected symbols',
  legendAria: 'Chart legend',

  verdictLead: '{name} leads by {pts} points',
  verdictTie: '{a} and {b} are level',
}

const ar: typeof zh = {
  title: 'المقارنة',
  subtitle: 'ثلاثة رموز في لوحة واحدة',
  slotsTitle: 'الرموز',
  slotA: 'أ',
  slotB: 'ب',
  slotC: 'ج',
  slotSelect: 'خانة المقارنة',

  tableTitle: 'مقارنة مباشرة',
  tableTag: '20 يوماً',
  metric: 'البند',
  bestHint: 'التظليل يحدد الأفضل في الصف: أعلى خصم عن القيمة العادلة وتغيّر وموقع ونقاط، وأقل تقلب.',
  bestMark: 'الأفضل',

  rowDiscount: 'الخصم',
  rowDiscountHint: 'عن القيمة العادلة',
  rowChange: 'اليوم',
  rowChangeHint: 'التغيّر',
  rowRange: 'النطاق',
  rowRangeHint: 'موقع 20 يوماً',
  rowVol: 'التقلب',
  rowVolHint: 'انحراف 20 يوماً',
  rowScore: 'النقاط',
  rowScoreHint: 'من 100',

  chartTitle: 'الأداء النسبي',
  chartTag: 'الأساس 100',
  axisFrom: 'البداية',
  axisTo: 'الأحدث',
  chartAria: 'مخطط مقارنة الأداء الموحّد للرموز الثلاثة',
  legendAria: 'مفتاح المخطط',

  verdictLead: '{name} يتقدّم بـ {pts} نقطة',
  verdictTie: '{a} و{b} متعادلان تقريباً',
}

export const strings = { zh, en, ar } satisfies Dict<typeof zh>
