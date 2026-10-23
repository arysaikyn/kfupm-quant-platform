import type { Dict } from '../../i18n'

const zh = {
  title: '对比',
  subtitle: '三只标的，一张表',
  slotsTitle: '选择标的',
  slotA: 'A',
  slotB: 'B',
  slotC: 'C',
  slotSelect: '对比位',
  slotEmpty: '空',
  copyLink: '复制链接',

  tableTitle: '正面比较',
  tableTag: '20 日',
  tableCaption:
    '三列并排：每列一只标的，每行一项 20 日指标，整行最优会高亮。清空的列显示破折号。',
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
  rowScoreHint: '0-100',

  chartTitle: '相对走势',
  chartTag: '起点 = 100',
  axisFrom: '起点',
  axisTo: '最新',
  chartAria: '三只标的归一化走势对比图',
  chartEmpty: '选一只标的，走势就画出来了。',
  legendAria: '图例',

  verdictLead: '{name} 领先 {pts} 分',
  verdictTie: '{a} 与 {b} 基本持平',
  verdictNeedTwo: '选满两只标的才能比较。',
}

const en: typeof zh = {
  title: 'Compare',
  subtitle: 'Three names, one board',
  slotsTitle: 'Picks',
  slotA: 'A',
  slotB: 'B',
  slotC: 'C',
  slotSelect: 'Comparison slot',
  slotEmpty: 'Empty',
  copyLink: 'Copy link',

  tableTitle: 'Head to head',
  tableTag: '20-day',
  tableCaption:
    'Three columns of picks, one row per 20-day metric, with the row winner highlighted. A cleared column reads as a dash.',
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
  rowScoreHint: '0-100',

  chartTitle: 'Relative path',
  chartTag: 'first point = 100',
  axisFrom: 'First',
  axisTo: 'Latest',
  chartAria: 'Normalised price paths of the selected symbols',
  chartEmpty: 'Pick a name and its path is drawn here.',
  legendAria: 'Chart legend',

  verdictLead: '{name} leads by {pts} points',
  verdictTie: '{a} and {b} are level',
  verdictNeedTwo: 'Pick two names to compare them.',
}

const ar: typeof zh = {
  title: 'المقارنة',
  subtitle: 'ثلاثة رموز في لوحة واحدة',
  slotsTitle: 'الرموز',
  slotA: 'أ',
  slotB: 'ب',
  slotC: 'ج',
  slotSelect: 'خانة المقارنة',
  slotEmpty: 'فارغ',
  copyLink: 'نسخ الرابط',

  tableTitle: 'مقارنة مباشرة',
  tableTag: '20 يوماً',
  tableCaption:
    'ثلاثة أعمدة للرموز وصفّ لكل مؤشر على مدى 20 يوماً، مع تظليل الأفضل في كل صف. العمود الفارغ يظهر بشرطة.',
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
  chartAria: 'مخطط مقارنة الأداء الموحّد للرموز المحددة',
  chartEmpty: 'اختر رمزاً واحداً ليُرسم مساره هنا.',
  legendAria: 'مفتاح المخطط',

  verdictLead: '{name} يتقدّم بـ {pts} نقطة',
  verdictTie: '{a} و{b} متعادلان تقريباً',
  verdictNeedTwo: 'اختر رمزين على الأقل للمقارنة.',
}

export const strings = { zh, en, ar } satisfies Dict<typeof zh>
