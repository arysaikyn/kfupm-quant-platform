import type { Dict } from '../../i18n'

type Strings = {
  title: string
  subtitle: string
  empty: string
  flat: string
  emptyCta: string
  concentration: string
  largest: string
  aboveLimit: string
  bookValue: string
  exposure: string
  short: string
  weightNote: string
  currency: string
  currencyNote: string
  metrics: string
  varLabel: string
  varCaption: string
  maxLabel: string
  maxCaption: string
  countLabel: string
  countCaption: string
  notes: string
  noteCurrencyOne: string
  noteCurrencyAll: string
  noteCurrencyMany: string
  noteCurrencySplit: string
  noteDominant: string
  noteBalanced: string
  noteSingle: string
}

export const strings = {
  zh: {
    title: '风险',
    subtitle: '模拟账本的实时风险读数',
    empty: '还没有模拟交易。在策略页记录一笔，风险视图就会跟着变化。',
    flat: '持仓已全部平掉，当前没有敞口。',
    emptyCta: '去策略页记录',
    concentration: '持仓集中度',
    largest: '最大持仓',
    aboveLimit: '超过 40% 预警线',
    bookValue: '持仓市值',
    exposure: '敞口明细',
    short: '空头',
    weightNote: '权重按持仓市值的绝对值计算，空头也计入敞口。',
    currency: '货币分布',
    currencyNote: '按各市场报价货币计，未做汇率换算。',
    metrics: '风险指标',
    varLabel: 'VaR 代理值',
    varCaption: '95% 置信度下的一日亏损粗估：1.65 × 加权 20 日波动率 × 名义持仓市值，未做汇率换算。',
    maxLabel: '单一标的最大权重',
    maxCaption: '单个标的占持仓市值的比例，40% 为预警线。',
    countLabel: '持仓数量',
    countCaption: '买卖相抵后净数量不为零的标的个数。',
    notes: '衍生提示',
    noteCurrencyOne: '唯一持仓以 {currency} 计价，汇率风险集中在一个市场。',
    noteCurrencyAll: '全部 {n} 个持仓都以 {currency} 计价，汇率风险集中在一个市场。',
    noteCurrencyMany: '{n} 个持仓以 {currency} 计价，合计占组合的 {pct}。',
    noteCurrencySplit: '每个持仓使用不同货币，汇率风险天然分散。',
    noteDominant: '{symbol} 一只就占 {pct}，单条消息就能左右整体结果。',
    noteBalanced: '最大持仓 {symbol} 占 {pct}，其余标的分散了风险。',
    noteSingle: '目前只有 {symbol} 一个持仓，加入第二个标的才能真正分散。',
  },
  en: {
    title: 'Risk',
    subtitle: 'A live risk read of your paper book',
    empty: 'No paper trades yet. Log one on the strategy screen and this view fills in.',
    flat: 'Every position is closed, so there is no exposure right now.',
    emptyCta: 'Log a trade',
    concentration: 'Concentration',
    largest: 'Largest holding',
    aboveLimit: 'Above the 40% line',
    bookValue: 'Book value',
    exposure: 'Exposure detail',
    short: 'Short',
    weightNote: 'Weights use absolute market value, so shorts count as exposure too.',
    currency: 'Currency split',
    currencyNote: 'Shown in each market’s quote currency; no FX conversion.',
    metrics: 'Risk metrics',
    varLabel: 'VaR proxy',
    varCaption:
      'Rough one-day loss at 95% confidence: 1.65 × weighted 20-session volatility × notional book value. No FX conversion.',
    maxLabel: 'Largest single name',
    maxCaption: 'Share of book value in one symbol; 40% is the warning line.',
    countLabel: 'Positions',
    countCaption: 'Symbols with a non-zero net quantity after buys net against sells.',
    notes: 'Derived notes',
    noteCurrencyOne: 'The only position is priced in {currency}.',
    noteCurrencyAll: 'All {n} positions are priced in {currency}, so FX risk sits in one market.',
    noteCurrencyMany: '{n} positions share {currency}, together {pct} of the book.',
    noteCurrencySplit: 'Each position sits in its own currency, so FX risk is spread.',
    noteDominant:
      '{symbol} alone is {pct} of the book — one headline can swing the whole result.',
    noteBalanced: 'The largest name, {symbol}, is {pct}; the remaining positions spread the risk.',
    noteSingle: 'Only {symbol} is open. A second name would start real diversification.',
  },
  ar: {
    title: 'المخاطر',
    subtitle: 'قراءة حية لمخاطر دفتر المحاكاة',
    empty: 'لا توجد صفقات محاكاة بعد. سجّل صفقة من شاشة الاستراتيجية وستمتلئ هذه الصفحة.',
    flat: 'أُغلقت كل المراكز — لا يوجد تعرض حاليًا.',
    emptyCta: 'سجّل صفقة',
    concentration: 'تركّز المراكز',
    largest: 'أكبر مركز',
    aboveLimit: 'يتجاوز حد 40%',
    bookValue: 'قيمة الدفتر',
    exposure: 'تفصيل التعرض',
    short: 'مركز بيع',
    weightNote: 'تُحسب الأوزان بالقيمة المطلقة للمركز، ويُحتسب المركز البيعي ضمن التعرض.',
    currency: 'توزيع العملات',
    currencyNote: 'بالعملة المسعّرة لكل سوق؛ دون تحويل عملات.',
    metrics: 'مؤشرات المخاطر',
    varLabel: 'تقدير القيمة المعرضة للخطر',
    varCaption:
      'تقدير خسارة يوم واحد بثقة 95%: 1.65 × التقلب المرجّح على 20 جلسة × القيمة الاسمية للدفتر، دون تحويل عملات.',
    maxLabel: 'أكبر وزن لاسم واحد',
    maxCaption: 'نسبة أكبر ورقة من قيمة الدفتر؛ و40% هو خط التحذير.',
    countLabel: 'عدد المراكز',
    countCaption: 'عدد الأوراق ذات الكمية الصافية غير الصفرية بعد مقابلة البيع بالشراء.',
    notes: 'ملاحظات مشتقة',
    noteCurrencyOne: 'المركز الوحيد مسعّر بـ {currency}.',
    noteCurrencyAll: 'كل المراكز ({n}) مسعّرة بـ {currency}، لذا يتركّز خطر العملة في سوق واحد.',
    noteCurrencyMany: '{n} من المراكز بعملة {currency}، وتشكّل مجتمعة {pct} من الدفتر.',
    noteCurrencySplit: 'كل مركز بعملة مختلفة، لذا يتوزّع خطر العملة.',
    noteDominant: '{symbol} وحده يشكّل {pct} من الدفتر — خبر واحد قد يغيّر النتيجة كلها.',
    noteBalanced: 'أكبر مركز هو {symbol} بنسبة {pct}، والبقية موزّعة على أسماء أخرى.',
    noteSingle: 'المركز المفتوح الوحيد هو {symbol} — إضافة اسم ثانٍ تبدأ تنويعًا حقيقيًا.',
  },
} satisfies Dict<Strings>
