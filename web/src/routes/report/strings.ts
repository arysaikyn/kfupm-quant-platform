import type { Dict } from '../../i18n'

export type ReportStrings = {
  back: string
  kicker: string
  navLabel: string
  navConclusion: string
  navBasis: string
  navRisk: string
  navWrong: string
  navNext: string
  conclusionLabel: string
  /** Placeholders: name, span, pct. */
  conclusionWithEquity: string
  basisLabel: string
  basisIntro: string
  basisRulesLabel: string
  basisRulesNote: string
  basisReturnLabel: string
  basisReturnNote: string
  /** Placeholder: span. */
  basisExcessLabel: string
  basisExcessNote: string
  rulesUnit: string
  ppUnit: string
  metaUpdated: string
  tagValue: string
  tagSharia: string
  tagIncome: string
  tagMomentum: string
  riskLabel: string
  riskCostTitle: string
  /** Placeholder: pp. */
  riskCostBody: string
  riskSingleTitle: string
  /** Placeholder: pct. */
  riskSingleBody: string
  wrongLabel: string
  wrongWithEquity: string
  nextLabel: string
  nextStrategyTitle: string
  nextStrategyBody: string
  nextAiTitle: string
  nextAiBody: string
  /** Placeholder: time. */
  footerGenerated: string
  disclaimer: string
  notFound: string
  notFoundHint: string
  notFoundAction: string
}

export const strings = {
  zh: {
    back: '返回',
    kicker: '深度报告',
    navLabel: '目录',
    navConclusion: '结论',
    navBasis: '依据',
    navRisk: '风险',
    navWrong: '会改变结论的因素',
    navNext: '下一步',
    conclusionLabel: '结论',
    conclusionWithEquity:
      '{name}在 {span} 内累计回报 {pct}；过去的回测记录不代表未来收益。',
    basisLabel: '依据',
    basisIntro: '每一项都来自这个策略自己的数据；缺哪一项，报告就直接写明。',
    basisRulesLabel: '规则条数',
    basisRulesNote: '这些条件必须同时成立；少一条，名单就会换一批。',
    basisReturnLabel: '区间总回报',
    basisReturnNote: '成本后从第一天到最后一天变化了多少，覆盖 {span} 整段；不是每年的数字，也不是其中某一年。',
    basisExcessLabel: '与基准的差距',
    basisExcessNote: '成本后，策略最终比基准高或低多少，覆盖 {span}；只描述这一段。',
    rulesUnit: '条规则',
    ppUnit: '个百分点',
    metaUpdated: '更新于',
    tagValue: '价值',
    tagSharia: '符合教法',
    tagIncome: '收益',
    tagMomentum: '动量',
    riskLabel: '风险',
    riskCostTitle: '成本拿走了多少',
    riskCostBody:
      '成本让期末值比不计成本时低 {pp} 个百分点；换手越高，这个差越大。',
    riskSingleTitle: '只有一段行情',
    riskSingleBody: '这一段的总回报 {pct} 只说明这一段时间，不能当作下一段的预期。',
    wrongLabel: '如果错了会怎样',
    wrongWithEquity:
      '如果结论错了，最可能错在把这段回测当成未来。成本会先吃掉一部分收益，风格切换会让相对基准的优势收窄；规则仍会按同样的条件选出名单，所以错误不会在筛选层报警，只会出现在收益和回撤上。',
    nextLabel: '下一步',
    nextStrategyTitle: '回到策略页',
    nextStrategyBody: '看完整规则、阈值与运行记录。',
    nextAiTitle: '去 AI 复盘',
    nextAiBody: '把这份报告交给 AI，继续追问。',
    footerGenerated: '生成于 {time}',
    disclaimer: '本报告只使用应用内模拟数据，不构成投资建议。',
    notFound: '找不到这份报告',
    notFoundHint: '这个策略 id 不在当前数据里。请回到策略列表重新选择。',
    notFoundAction: '返回策略列表',
  },
  en: {
    back: 'Back',
    kicker: 'Deep report',
    navLabel: 'Contents',
    navConclusion: 'Conclusion',
    navBasis: 'Evidence',
    navRisk: 'Risks',
    navWrong: 'What would change',
    navNext: 'Next',
    conclusionLabel: 'Conclusion',
    conclusionWithEquity:
      '{name} returned {pct} over {span}; a record of past results is still not a promise about the future.',
    basisLabel: 'Evidence',
    basisIntro:
      'Every row comes from this strategy’s own data; where a number is missing, the report says so.',
    basisRulesLabel: 'Rule count',
    basisRulesNote: 'All conditions must hold at once; drop one and the list changes.',
    basisReturnLabel: 'Total return',
    basisReturnNote:
      'How much the value changed from the first day to the last, after costs, across all of {span}. It is not a yearly figure, and not any single year.',
    basisExcessLabel: 'Gap vs benchmark',
    basisExcessNote:
      'How far the strategy ended above or below the benchmark after costs, across {span}. It describes this stretch only.',
    rulesUnit: 'rules',
    ppUnit: 'points',
    metaUpdated: 'Updated',
    tagValue: 'Value',
    tagSharia: 'Sharia',
    tagIncome: 'Income',
    tagMomentum: 'Momentum',
    riskLabel: 'Risks',
    riskCostTitle: 'What costs take',
    riskCostBody:
      'Costs leave the final value {pp} percentage points below the no-cost result; the more often the rules trade, the wider this gap.',
    riskSingleTitle: 'One period',
    riskSingleBody:
      'A total return of {pct} covers one stretch only; it is not a forecast for the next.',
    wrongLabel: 'If this is wrong',
    wrongWithEquity:
      'If the conclusion is wrong, the likely error is treating this backtest as the future. Cost takes a slice of the return first, then a style shift narrows the lead over the benchmark; the rules still pick the same list, so the mistake raises no alarm at the screening step — it only shows up in returns and drawdown.',
    nextLabel: 'Next',
    nextStrategyTitle: 'Back to the strategy',
    nextStrategyBody: 'See the full rules, thresholds and run history.',
    nextAiTitle: 'Review with AI',
    nextAiBody: 'Hand this report to AI and keep asking.',
    footerGenerated: 'Generated {time}',
    disclaimer: 'This report uses in-app mock data only and is not investment advice.',
    notFound: 'Report not found',
    notFoundHint:
      'That strategy id is not in the current data. Go back to the strategy list and choose one.',
    notFoundAction: 'Back to strategies',
  },
  ar: {
    back: 'رجوع',
    kicker: 'تقرير معمّق',
    navLabel: 'المحتويات',
    navConclusion: 'الخلاصة',
    navBasis: 'الأساس',
    navRisk: 'المخاطر',
    navWrong: 'ما قد يغيّر النتيجة',
    navNext: 'الخطوة التالية',
    conclusionLabel: 'الخلاصة',
    conclusionWithEquity:
      'حقق {name} عائدًا قدره {pct} خلال {span}؛ لكن سجل النتائج الماضية لا يضمن عائدًا مستقبلًا.',
    basisLabel: 'الأساس',
    basisIntro:
      'كل بند مستخرج من بيانات هذه الخطة نفسها؛ وما لا يوجد يُذكر صراحةً.',
    basisRulesLabel: 'عدد القواعد',
    basisRulesNote:
      'يجب أن تتحقق هذه الشروط معًا؛ وإذا غاب شرط واحد تغيّرت القائمة بأكملها.',
    basisReturnLabel: 'إجمالي العائد',
    basisReturnNote:
      'كم ارتفعت القيمة من أول يوم إلى آخر يوم بعد التكلفة خلال {span} كاملة؛ وليس رقمًا سنويًا ولا سنة واحدة منها.',
    basisExcessLabel: 'الفارق عن المرجع',
    basisExcessNote:
      'مقدار ما انتهت به الخطة أعلى أو أدنى من المرجع بعد التكلفة خلال {span}؛ يصف هذه الفترة فقط.',
    rulesUnit: 'قواعد',
    ppUnit: 'نقطة مئوية',
    metaUpdated: 'آخر تحديث',
    tagValue: 'قيمة',
    tagSharia: 'متوافقة مع الشريعة',
    tagIncome: 'دخل',
    tagMomentum: 'زخم',
    riskLabel: 'المخاطر',
    riskCostTitle: 'ما تأخذه التكلفة',
    riskCostBody:
      'تخفض التكلفة قيمة النهاية بمقدار {pp} نقطة مئوية عن النتيجة دون تكلفة؛ وكلما زاد معدل الدوران اتسع هذا الفارق.',
    riskSingleTitle: 'فترة واحدة',
    riskSingleBody:
      'إجمالي العائد {pct} يصف هذه الفترة فقط، ولا يصلح توقعًا للفترة القادمة.',
    wrongLabel: 'إذا أخطأنا',
    wrongWithEquity:
      'إذا كانت الخلاصة خاطئة، فالخطأ الأرجح أن نأخذ هذا الاختبار الخلفي على أنه المستقبل. ستأكل التكلفة جزءًا من العائد أولًا، ثم يضيق تفوقنا على المرجع مع تبدّل الأسلوب؛ وستظل القواعد تختار القائمة نفسها، لذلك لن ينبّهنا الخطأ في مرحلة الفرز، بل سيظهر في العائد والتراجع فقط.',
    nextLabel: 'الخطوة التالية',
    nextStrategyTitle: 'العودة إلى الاستراتيجية',
    nextStrategyBody: 'راجع القواعد والعتبات وسجل التشغيل كاملًا.',
    nextAiTitle: 'المراجعة مع الذكاء الاصطناعي',
    nextAiBody: 'سلّم هذا التقرير للذكاء الاصطناعي وواصل الأسئلة.',
    footerGenerated: 'أُنشئ في {time}',
    disclaimer:
      'يعتمد هذا التقرير على بيانات محاكاة داخل التطبيق فقط، وليس نصيحة استثمارية.',
    notFound: 'هذا التقرير غير موجود',
    notFoundHint:
      'معرّف الاستراتيجية غير موجود في البيانات الحالية. ارجع إلى قائمة الاستراتيجيات واختر واحدة.',
    notFoundAction: 'العودة إلى الاستراتيجيات',
  },
} satisfies Dict<ReportStrings>
