import type { Dict } from '../../i18n'

/** Copy owned by the symbol deep-dive. Existing page copy stays in strings.ts. */
const zh = {
  watchAdd: '加入自选',
  watchOn: '已自选',

  factorsTitle: '因子评分',
  factorsHint: '0–100，越高信号越强',
  factorValue: '价值',
  factorQuality: '质量',
  factorMomentum: '动能',
  factorVolatility: '波动',

  peersTitle: '同类对比',
  peersHint: '另外三只今天的表现',
  colName: '名称',
  colPrice: '现价',
  colChg: '涨跌',

  whyTitle: '为什么动了',
  whyHint: '只看价格，不猜消息',
  whyAttrStreak: '收盘统计',
  whyAttrPulse: '日内',
  whyAttrMomentum: '动量',
  whyStreakUp: '近 {n} 个交易日有 {k} 天收涨',
  whyStreakDown: '近 {n} 个交易日有 {k} 天收跌',
  whyPulse: '今日 {chg}，是日均波动的 {x} 倍',
  whyMomentumUp: '40 日累计 {move}，方向仍向上',
  whyMomentumDown: '40 日累计 {move}，方向仍向下',
}

const en: typeof zh = {
  watchAdd: 'Watch',
  watchOn: 'Watching',

  factorsTitle: 'Factor scores',
  factorsHint: '0–100, higher means stronger',
  factorValue: 'Value',
  factorQuality: 'Quality',
  factorMomentum: 'Momentum',
  factorVolatility: 'Volatility',

  peersTitle: 'Peers',
  peersHint: 'How three other names are trading today',
  colName: 'Name',
  colPrice: 'Last',
  colChg: 'Chg',

  whyTitle: 'Why it moved',
  whyHint: 'Price only, no news guessing',
  whyAttrStreak: 'Sessions',
  whyAttrPulse: 'Today',
  whyAttrMomentum: 'Momentum',
  whyStreakUp: '{k} of the last {n} sessions closed higher',
  whyStreakDown: '{k} of the last {n} sessions closed lower',
  whyPulse: 'Today {chg}, {x}× the average daily move',
  whyMomentumUp: '{move} over 40 sessions, still pointing up',
  whyMomentumDown: '{move} over 40 sessions, still pointing down',
}

const ar: typeof zh = {
  watchAdd: 'متابعة',
  watchOn: 'في المتابعة',

  factorsTitle: 'درجات العوامل',
  factorsHint: 'من 0 إلى 100، الأعلى إشارة أقوى',
  factorValue: 'القيمة',
  factorQuality: 'الجودة',
  factorMomentum: 'الزخم',
  factorVolatility: 'التقلب',

  peersTitle: 'نظراء',
  peersHint: 'أداء ثلاثة أسهم أخرى اليوم',
  colName: 'الاسم',
  colPrice: 'السعر',
  colChg: 'التغير',

  whyTitle: 'لماذا تحرك',
  whyHint: 'السعر فقط، دون تخمين الأخبار',
  whyAttrStreak: 'الإغلاقات',
  whyAttrPulse: 'اليوم',
  whyAttrMomentum: 'الزخم',
  whyStreakUp: 'أغلق {k} من آخر {n} جلسات على ارتفاع',
  whyStreakDown: 'أغلق {k} من آخر {n} جلسات على انخفاض',
  whyPulse: 'اليوم {chg}، أي {x} ضعف متوسط الحركة اليومية',
  whyMomentumUp: '{move} خلال 40 جلسة، والاتجاه ما زال صاعدًا',
  whyMomentumDown: '{move} خلال 40 جلسة، والاتجاه ما زال هابطًا',
}

export const symbolStrings = { zh, en, ar } satisfies Dict<typeof zh>
