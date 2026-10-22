import type { Dict, Lang } from '../../i18n'

type Strings = {
  title: string
  intro: string
  search: string
  clear: string
  why: string
  countAll: string
  countHit: string
  empty: string
  emptyAction: string
}

/**
 * Chrome only. The entries themselves live in `terms` below, because a
 * glossary entry is three related lines and a flat `Dict` would split them.
 */
export const strings = {
  zh: {
    title: '术语表',
    intro: '这里的每个词，你都会在 App 里遇到。解释尽量不用行话。',
    search: '搜索词条或解释',
    clear: '清除',
    why: '为什么重要',
    countAll: '共 {n} 个词条',
    countHit: '找到 {n} 个词条',
    empty: '没有匹配的词条，换个说法试试。',
    emptyAction: '清除搜索',
  },
  en: {
    title: 'Glossary',
    intro: 'Every term here turns up somewhere in the app. No jargon in the explanations.',
    search: 'Search a term or explanation',
    clear: 'Clear',
    why: 'Why it matters',
    countAll: '{n} terms',
    countHit: '{n} matches',
    empty: 'Nothing matched. Try another word.',
    emptyAction: 'Clear search',
  },
  ar: {
    title: 'المصطلحات',
    intro: 'كل مصطلح هنا تصادفه داخل التطبيق، والشرح خالٍ من التعقيد.',
    search: 'ابحث عن مصطلح أو شرح',
    clear: 'مسح',
    why: 'لماذا يهم',
    countAll: '{n} مصطلحات',
    countHit: '{n} نتيجة',
    empty: 'لا نتائج مطابقة. جرّب كلمة أخرى.',
    emptyAction: 'امسح البحث',
  },
} satisfies Dict<Strings>

export type Term = {
  /** The headword itself, in this language. */
  term: string
  /** One sentence of plain speech. No undefined jargon inside it. */
  plain: string
  /** The second half of the entry: why a reader should care. */
  why: string
}

export const terms: Record<Lang, Term[]> = {
  zh: [
    {
      term: '市盈率',
      plain: '按今天的价格买下这家公司，靠它每年赚的钱，要多少年才收回本钱。',
      why: '数字越高，价格里装的期待越多；一旦增长没兑现，回落也更快。',
    },
    {
      term: '负债率',
      plain: '公司用的每一百块钱里，有多少是借来的，而不是自己赚来的。',
      why: '借钱能把赚的放大，也能把亏的放大；生意变差时，欠得多的公司最先扛不住。',
    },
    {
      term: '股息率',
      plain: '公司每年从利润里分给你的现金，占你买入价格的多少。',
      why: '这笔钱是实打实到账的，不用等别人出更高价接盘；股价下跌时，它也能垫一层。',
    },
    {
      term: '回撤',
      plain: '从最高点跌到最低点，账户最多缩水了多少。',
      why: '亏掉一半，要涨回一倍才回本；先知道最坏能跌多少，再决定放多少钱进去。',
    },
    {
      term: '波动率',
      plain: '价格平时上上下下晃得有多厉害。',
      why: '晃得越厉害，短期越难猜；多数人不是看错方向，而是在晃动里被甩下车。',
    },
    {
      term: '夏普比率',
      plain: '价格多晃动一分，你能多拿多少回报。数字越高，说明这份收益不是靠大起大落硬撑出来的。',
      why: '只看收益，赌得最凶的那只最好看；它把晃动也算进去，比较才公平。',
    },
    {
      term: '换手率',
      plain: '一段时间里，同一批股票被买卖了几轮。',
      why: '买卖拥挤时，价格容易一下冲高又一下砸下来，想走的时候还可能堵在门口。',
    },
    {
      term: '市净率',
      plain: '你付的价格，是公司把资产全卖掉、欠款全还清后剩下价值的多少倍。',
      why: '低于一倍，说明市场觉得公司还不如账面上值钱；看银行、工厂这类靠资产吃饭的生意，它比利润更说明问题。',
    },
    {
      term: '教法筛选',
      plain: '把条件一条条写下来，比如市盈率低于 15、股息率高于 3%，再让系统照着挑。',
      why: '写下来的条件能重复用、能回头核对，你也会慢慢看懂它为什么挑中这一只。',
    },
    {
      term: '基准',
      plain: '拿来对照的尺子，比如整个市场，或者一批同类基金的平均成绩。',
      why: '赚了 8% 不算本事，如果同期市场涨了 15%，你其实落后了。',
    },
  ],
  en: [
    {
      term: 'P/E ratio',
      plain: 'How many years of the company’s current profit it would take to earn back the price you pay today.',
      why: 'A high number means the price already carries a lot of hope; when growth disappoints, the fall is faster.',
    },
    {
      term: 'Debt ratio',
      plain: 'Out of every hundred the company spends, how much was borrowed rather than earned.',
      why: 'Borrowing magnifies both gains and losses; when trade slows, the most indebted firms go first.',
    },
    {
      term: 'Dividend yield',
      plain: 'The cash a company hands you each year, as a share of what you paid for the stock.',
      why: 'It arrives without needing a buyer to pay more later, and it softens the blow when the price falls.',
    },
    {
      term: 'Drawdown',
      plain: 'How far a holding fell from its peak to its lowest point.',
      why: 'A loss of half needs a double to recover; knowing the worst fall tells you how much you can put in.',
    },
    {
      term: 'Volatility',
      plain: 'How hard the price swings from day to day.',
      why: 'The wilder it swings, the less anyone can guess next month; most people are shaken out, not proven wrong.',
    },
    {
      term: 'Sharpe ratio',
      plain: 'How much extra return you got for the amount the price bounced around.',
      why: 'Return alone crowns the wildest bet; this weighs the result against the swings it took.',
    },
    {
      term: 'Turnover rate',
      plain: 'How many times the same shares change hands over a period.',
      why: 'Crowds make prices jump both ways, and a crowded exit can jam when you want out.',
    },
    {
      term: 'Price-to-book ratio',
      plain: 'What you pay compared with what would be left if the company sold everything and cleared every debt.',
      why: 'Below one, the market values the firm under its own books; for banks and factories that matters more than profit.',
    },
    {
      term: 'Rule-based screening',
      plain: 'A list of conditions you write down — price below one number, dividend above another — that the app then runs over the market.',
      why: 'Written rules can be rerun and checked, and each pick comes with a reason you can read.',
    },
    {
      term: 'Benchmark',
      plain: 'The yardstick you compare against, such as the whole market or a group of similar funds.',
      why: 'Up 8% is not skill if the market gained 15%; a number alone tells you nothing.',
    },
  ],
  ar: [
    {
      term: 'مضاعف الربحية',
      plain: 'كم سنة من أرباح الشركة الحالية تحتاج كي تستعيد الثمن الذي تدفعه اليوم.',
      why: 'الرقم المرتفع يعني أن السعر يحمل آمالًا كبيرة، وحين يخيب النمو يكون الهبوط أسرع.',
    },
    {
      term: 'نسبة المديونية',
      plain: 'من كل مئة تنفقها الشركة، كم منها جاء بالاقتراض لا من كسبها.',
      why: 'الاقتراض يكبّر الربح والخسارة معًا، وحين تتباطأ الأعمال تتعثر أولًا الشركات الأكثر مديونية.',
    },
    {
      term: 'عائد التوزيعات',
      plain: 'النقد الذي تدفعه لك الشركة كل سنة كنسبة من سعر السهم الذي اشتريته.',
      why: 'يصل إليك دون انتظار مشترٍ يدفع أكثر لاحقًا، ويخفف الأثر عندما يهبط السعر.',
    },
    {
      term: 'أقصى تراجع',
      plain: 'أقصى هبوط من قمة السعر إلى أدنى نقطة بعده.',
      why: 'خسارة النصف تحتاج مضاعفة للعودة، ومعرفة أسوأ هبوط تحدد ما يمكنك تحمّله.',
    },
    {
      term: 'التقلب',
      plain: 'مدى حدّة تأرجح السعر يومًا بعد يوم.',
      why: 'كلما اشتد التأرجح صعب توقع الشهر القادم، وكثيرون يخرجون بالاهتزاز لا بالخطأ في الاتجاه.',
    },
    {
      term: 'نسبة شارب',
      plain: 'مقدار العائد الإضافي مقابل مقدار تأرجح السعر.',
      why: 'العائد وحده يجعل أعنف الرهانات تبدو الأفضل، وهذه النسبة تضع التقلب في الحساب.',
    },
    {
      term: 'معدل الدوران',
      plain: 'عدد مرات تداول الأسهم نفسها خلال فترة.',
      why: 'الازدحام يرفع السعر ويهبط به سريعًا، وقد يزدحم باب الخروج حين تريد الخروج.',
    },
    {
      term: 'مضاعف الدفترية',
      plain: 'ما تدفعه مقارنة بما يتبقى لو باعت الشركة أصولها وسددت كل ديونها.',
      why: 'أقل من واحد يعني أن السوق يقيّم الشركة بأقل من دفاترها، وهذا يهم البنوك والمصانع أكثر من الأرباح.',
    },
    {
      term: 'الفرز وفق قواعد',
      plain: 'شروط تكتبها سطرًا سطرًا، مثل سعر تحت رقم أو توزيع فوق نسبة، ثم يمر بها التطبيق على السوق.',
      why: 'الشروط المكتوبة يمكن تكرارها ومراجعتها، وكل اختيار يأتي بسبب تستطيع قراءته.',
    },
    {
      term: 'المؤشر المرجعي',
      plain: 'المسطرة التي تقارن بها، مثل السوق كله أو مجموعة صناديق مشابهة.',
      why: 'ربح 8 بالمئة ليس مهارة إذا ربح السوق 15 بالمئة، والرقم وحده لا يقول شيئًا.',
    },
  ],
}
