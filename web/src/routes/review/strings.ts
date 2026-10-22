import type { Dict } from '../../i18n'

type Strings = {
  title: string
  breadthLabel: string
  namesUp: string
  namesDown: string
  namesFlat: string
  bestLabel: string
  worstLabel: string
  /** `{score}` is always an isolated `up–down` pair, so Arabic never reorders it. */
  verdictUp: string
  verdictDown: string
  verdictFlat: string
  rotationLabel: string
  axisX: string
  axisY: string
  tapHint: string
  weightLabel: string
  watchLabel: string
  watchEmpty: string
  takeLabel: string
  takeLead: string
  takeBreadthDown: string
  takeBreadthAllUp: string
  takeBreadthAllFlat: string
  takeWeighted: string
}

export const strings = {
  zh: {
    title: '复盘',
    breadthLabel: '市场宽度',
    namesUp: '上涨',
    namesDown: '下跌',
    namesFlat: '持平',
    bestLabel: '最强',
    worstLabel: '最弱',
    verdictUp: '多方占优 {score}，加权变动 {pct}。',
    verdictDown: '空方占优 {score}，加权变动 {pct}。',
    verdictFlat: '涨跌持平 {score}，加权变动 {pct}。',
    rotationLabel: '板块轮动',
    axisX: '横轴 · 今日涨跌',
    axisY: '纵轴 · 权重',
    tapHint: '点一个圆点，看该板块明细',
    weightLabel: '权重',
    watchLabel: '今日自选',
    watchEmpty: '自选还是空的。去行情页点星标，加一只进来。',
    takeLabel: '三点结论',
    takeLead: '{leader} 领先 {follower} {gap} 个百分点',
    takeBreadthDown: '{total} 只标的里 {down} 只下跌',
    takeBreadthAllUp: '全部 {total} 只标的上涨',
    takeBreadthAllFlat: '全部 {total} 只标的走平',
    takeWeighted: '加权指数变动 {pct}',
  },
  en: {
    title: 'Daily review',
    breadthLabel: 'Market breadth',
    namesUp: 'up',
    namesDown: 'down',
    namesFlat: 'flat',
    bestLabel: 'Best',
    worstLabel: 'Worst',
    verdictUp: 'Buyers lead {score}; weighted move {pct}.',
    verdictDown: 'Sellers lead {score}; weighted move {pct}.',
    verdictFlat: 'Split tape at {score}; weighted move {pct}.',
    rotationLabel: 'Sector rotation',
    axisX: 'x · change today',
    axisY: 'y · index weight',
    tapHint: 'Tap a dot to inspect a sector',
    weightLabel: 'Weight',
    watchLabel: 'Your watchlist today',
    watchEmpty: 'Nothing watched yet. Star a name on Market to add it.',
    takeLabel: 'Three takeaways',
    takeLead: '{leader} leads {follower} by {gap}pp',
    takeBreadthDown: '{down} of {total} names are down',
    takeBreadthAllUp: 'All {total} names are up',
    takeBreadthAllFlat: 'All {total} names are flat',
    takeWeighted: 'Weighted tape moved {pct}',
  },
  ar: {
    title: 'المراجعة اليومية',
    breadthLabel: 'اتساع السوق',
    namesUp: 'صاعد',
    namesDown: 'هابط',
    namesFlat: 'ثابت',
    bestLabel: 'الأقوى',
    worstLabel: 'الأضعف',
    verdictUp: 'المشترون في المقدّمة {score}، والتحرّك المرجّح {pct}.',
    verdictDown: 'البائعون في المقدّمة {score}، والتحرّك المرجّح {pct}.',
    verdictFlat: 'تعادل الطرفان {score}، والتحرّك المرجّح {pct}.',
    rotationLabel: 'دوران القطاعات',
    axisX: 'أفقي · تغيّر اليوم',
    axisY: 'رأسي · وزن المؤشر',
    tapHint: 'اضغط على نقطة لعرض تفاصيل القطاع',
    weightLabel: 'الوزن',
    watchLabel: 'قائمة متابعتك اليوم',
    watchEmpty: 'لا أسهم في المتابعة بعد. أضف سهمًا بالنجمة من صفحة السوق.',
    takeLabel: 'ثلاث ملاحظات',
    takeLead: '{leader} يتقدّم على {follower} بـ{gap} نقطة مئوية',
    takeBreadthDown: '{down} من أصل {total} أسماء هابطة',
    takeBreadthAllUp: 'الأسماء الـ{total} كلها صاعدة',
    takeBreadthAllFlat: 'الأسماء الـ{total} كلها ثابتة',
    takeWeighted: 'المؤشر المرجّح تحرّك {pct}',
  },
} satisfies Dict<Strings>
