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
    navWrong: '如果错了',
    navNext: '下一步',
    conclusionLabel: '结论',
    conclusionWithEquity:
      '{name}的净值曲线覆盖 {span}，最近一期收益为 {pct}，但有回测记录不等于未来收益。',
    basisLabel: '依据',
    basisIntro: '每一项都来自策略快照或净值数据；没有的数据，直接写明。',
    basisRulesLabel: '规则条数',
    basisRulesNote: '这些条件必须同时成立；少一条，名单就会换一批。',
    basisReturnLabel: '区间累计收益',
    basisReturnNote: '成本后净值末值减 1，覆盖 {span} 整段；不年化，也不是其中某一年。',
    basisExcessLabel: '相对基准（末值差）',
    basisExcessNote: '成本后末值减基准末值，覆盖区间为 {span}；只描述这段曲线。',
    rulesUnit: '条规则',
    ppUnit: '个百分点',
    metaUpdated: '更新于',
    tagValue: '价值',
    tagSharia: '符合教法',
    tagIncome: '收益',
    tagMomentum: '动量',
    riskLabel: '风险',
    riskCostTitle: '成本差',
    riskCostBody:
      '成本后与不含成本的末值相差 {pp} 个百分点；换手上升时，这个差会先扩大。',
    riskSingleTitle: '单一区间',
    riskSingleBody: '区间累计收益 {pct} 只覆盖一个区间，不能当作下一期的预期。',
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
    navWrong: 'If wrong',
    navNext: 'Next',
    conclusionLabel: 'Conclusion',
    conclusionWithEquity:
      '{name} has an equity curve covering {span} and a latest-period return of {pct}, but a backtest record is not a promise about the future.',
    basisLabel: 'Evidence',
    basisIntro:
      'Every row comes from the strategy snapshot or the equity data; where none exists, the report says so.',
    basisRulesLabel: 'Rule count',
    basisRulesNote: 'All conditions must hold at once; drop one and the list changes.',
    basisReturnLabel: 'Cumulative return',
    basisReturnNote:
      'The cost-inclusive curve end minus 1, covering the whole of {span}; not annualised and not one year inside it.',
    basisExcessLabel: 'Excess vs benchmark',
    basisExcessNote:
      'Cost-inclusive end value minus the benchmark end value over {span}; it describes this curve only.',
    rulesUnit: 'rules',
    ppUnit: 'pp',
    metaUpdated: 'Updated',
    tagValue: 'Value',
    tagSharia: 'Sharia',
    tagIncome: 'Income',
    tagMomentum: 'Momentum',
    riskLabel: 'Risks',
    riskCostTitle: 'Cost gap',
    riskCostBody:
      'The cost-inclusive and pre-cost end values differ by {pp} pp; as turnover rises, this gap widens first.',
    riskSingleTitle: 'One window',
    riskSingleBody:
      'A cumulative return of {pct} covers one window only; it is not a forecast for the next.',
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
    navWrong: 'إذا أخطأنا',
    navNext: 'الخطوة التالية',
    conclusionLabel: 'الخلاصة',
    conclusionWithEquity:
      'يغطي منحنى أداء الاستراتيجية {name} الفترة {span}، ويبلغ عائد أحدث فترة {pct}، لكن سجل الاختبار الخلفي لا يضمن عائدًا مستقبلًا.',
    basisLabel: 'الأساس',
    basisIntro:
      'كل بند مستخرج من لقطة الاستراتيجية أو بيانات الأداء؛ وما لا يوجد يُذكر صراحةً.',
    basisRulesLabel: 'عدد القواعد',
    basisRulesNote:
      'يجب أن تتحقق هذه الشروط معًا؛ وإذا غاب شرط واحد تغيّرت القائمة بأكملها.',
    basisReturnLabel: 'العائد التراكمي',
    basisReturnNote:
      'قيمة نهاية المنحنى بعد التكلفة ناقص 1، وتغطي كامل الفترة {span}؛ وليست سنوية ولا سنة واحدة منها.',
    basisExcessLabel: 'الفارق عن المرجع',
    basisExcessNote:
      'قيمة النهاية بعد التكلفة ناقص قيمة نهاية المرجع خلال {span}؛ يصف هذه السلسلة فقط.',
    rulesUnit: 'قواعد',
    ppUnit: 'نقطة مئوية',
    metaUpdated: 'آخر تحديث',
    tagValue: 'قيمة',
    tagSharia: 'متوافقة مع الشريعة',
    tagIncome: 'دخل',
    tagMomentum: 'زخم',
    riskLabel: 'المخاطر',
    riskCostTitle: 'فرق التكلفة',
    riskCostBody:
      'تختلف قيمة النهاية بعد التكلفة عن قيمتها قبل التكلفة بمقدار {pp} نقطة مئوية؛ وكلما ارتفع معدل الدوران اتسع هذا الفارق أولًا.',
    riskSingleTitle: 'فترة واحدة',
    riskSingleBody:
      'العائد التراكمي {pct} يغطي فترة واحدة فقط، ولا يصلح توقعًا للفترة القادمة.',
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
