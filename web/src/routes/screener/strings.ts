import type { Dict } from '../../i18n'
import type { ShariaField } from '../../data/shariaCoverage'

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
  fieldPe: string
  fieldDebt: string
  fieldYield: string
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
  relax: string
  /** Locked stage order, counts are `{kept}` of `{from}`. */
  pipelineTitle: string
  pipelineLocked: string
  pipelineSharia: string
  pipelineRules: string
  pipelineRank: string
  pipelineCount: string
  /** Zero-result autopsy. */
  emptyTitle: string
  emptyBody: string
  funnelStart: string
  funnelRemaining: string
  emptyAtSharia: string
  relaxTitle: string
  relaxDrop: string
  relaxWiden: string
  relaxGain: string
  relaxNone: string
  /** Stale-data refusal. */
  staleTitle: string
  staleBody: string
  staleAsOf: string
  snapshotShow: string
  snapshotHide: string
  snapshotNotice: string
  /** Sharia audit bin, grouped by reason. */
  auditTitle: string
  auditBody: string
  binOrder: string
  binFailedGroup: string
  binMissingGroup: string
  binFailedNote: string
  binMissingNote: string
  nonCompliantTitle: string
  unclassifiedTitle: string
  unclassifiedBody: string
  auditEmpty: string
  shariaDebt: string
  shariaInterestBearing: string
  shariaIncome: string
  shariaReceivables: string
  counterfactualTitle: string
  counterfactualBody: string
  counterfactualNone: string
  statusNonCompliant: string
  statusUnclassified: string
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
  confirmDelete: string
  duplicateAria: string
  loadAria: string
  openAria: string
}

export const SHARIA_FIELD_KEY: Record<ShariaField, keyof ScreenerStrings> = {
  debt: 'shariaDebt',
  interestBearing: 'shariaInterestBearing',
  income: 'shariaIncome',
  receivables: 'shariaReceivables',
}

export type ScreenerText = (key: keyof ScreenerStrings) => string

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
    fieldPe: '市盈率',
    fieldDebt: '负债率',
    fieldYield: '股息率',
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
    relax: '清空条件',
    pipelineTitle: '流程',
    pipelineLocked: '顺序固定：教法筛选 → 条件 → 排序，不可调换。',
    pipelineSharia: '教法筛选',
    pipelineRules: '条件',
    pipelineRank: '排序',
    pipelineCount: '{from} 只中 {kept} 只',
    emptyTitle: '为什么是 0',
    emptyBody: '按顺序查看每条条件剩下的数量，再对照只放宽一条的预览。',
    funnelStart: '合规池：{total} 只中 {n} 只',
    funnelRemaining: '剩 {n} 只',
    emptyAtSharia: '在教法筛选就已归零：没有合规名称，放宽条件也无法挽回。',
    relaxTitle: '只放宽一条',
    relaxDrop: '移除 {rule}',
    relaxWiden: '放宽 {rule}',
    relaxGain: '多出 {n}',
    relaxNone: '单独放宽任何一条都无效：阻塞在上游，或条件彼此不重叠。',
    staleTitle: '数据已过期',
    staleBody: '最后更新：{age}。已暂停输出排名，过期结果不会当作当前数据。',
    staleAsOf: '快照时间：{date}',
    snapshotShow: '查看最后快照',
    snapshotHide: '收起快照',
    snapshotNotice: '审核预览 — 以下为最后快照，不是当前数据。',
    auditTitle: '教法审核',
    auditBody: '只有合规名称参与排序；不合规与未分类只在这里审核。',
    binOrder: '在条件之前已被排除，条件结果不会改变此状态。',
    binFailedGroup: '{field} 高于 {limit}',
    binMissingGroup: '{field} 缺失（上限 {limit}）',
    binFailedNote: '实测 {value}，上限 {limit}。',
    binMissingNote: 'AAOIFI 输入未披露，无法执行该项检查。',
    nonCompliantTitle: '不合规 — 已排除',
    unclassifiedTitle: '未分类 — 缺少输入',
    unclassifiedBody: '默认排除；输入缺失优先于检查不通过，因此不按不合规处理。',
    auditEmpty: '本数据中没有被排除的名称。',
    shariaDebt: '负债',
    shariaInterestBearing: '利息资产',
    shariaIncome: '非合规收入',
    shariaReceivables: '应收账款',
    counterfactualTitle: '如果先排序？',
    counterfactualBody: '被教法筛选排除、但会通过当前条件的名称。真实排序不受影响。',
    counterfactualNone: '没有被排除的名称通过当前条件。',
    statusNonCompliant: '不合规',
    statusUnclassified: '未分类',
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
    confirmDelete: '再点一次删除',
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
    fieldPe: 'P/E',
    fieldDebt: 'Debt ratio',
    fieldYield: 'Dividend yield',
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
    relax: 'Clear conditions',
    pipelineTitle: 'Pipeline',
    pipelineLocked: 'Fixed order: Sharia → rules → rank. The stages cannot be reordered.',
    pipelineSharia: 'Sharia',
    pipelineRules: 'Rules',
    pipelineRank: 'Rank',
    pipelineCount: '{kept} of {from}',
    emptyTitle: 'Why zero?',
    emptyBody: 'Walk the rules in order, then compare the one-rule previews.',
    funnelStart: 'Compliant pool: {n} of {total}',
    funnelRemaining: '{n} left',
    emptyAtSharia: 'Zero at the Sharia stage: no compliant name is left, so loosening a rule cannot help.',
    relaxTitle: 'Loosen exactly one',
    relaxDrop: 'Remove {rule}',
    relaxWiden: 'Widen {rule}',
    relaxGain: 'Recovers {n}',
    relaxNone: 'No single loosening helps here: the block is upstream, or the rules do not overlap.',
    staleTitle: 'Data is stale',
    staleBody: 'Last update {age}. Ranked results are withheld; stale ranks are not shown as current.',
    staleAsOf: 'Snapshot: {date}',
    snapshotShow: 'View last good snapshot',
    snapshotHide: 'Hide snapshot',
    snapshotNotice: 'Audit preview — last good snapshot, not current.',
    auditTitle: 'Sharia audit',
    auditBody: 'Only compliant names are ranked. Non-compliant and unclassified names are audited here.',
    binOrder: 'Excluded before the rules stage; rule results never change this status.',
    binFailedGroup: '{field} above {limit}',
    binMissingGroup: '{field} missing (cap {limit})',
    binFailedNote: 'Measured {value} against the {limit} cap.',
    binMissingNote: 'AAOIFI input not published, so the check cannot run.',
    nonCompliantTitle: 'Non-compliant — excluded',
    unclassifiedTitle: 'Unclassified — missing input',
    unclassifiedBody: 'Excluded by default. A missing input outranks a failed check, so these are not treated as non-compliant.',
    auditEmpty: 'No excluded names on this tape.',
    shariaDebt: 'Debt',
    shariaInterestBearing: 'Interest-bearing assets',
    shariaIncome: 'Non-compliant income',
    shariaReceivables: 'Receivables',
    counterfactualTitle: 'What if ranked first?',
    counterfactualBody: 'Sharia-excluded names that would have passed the current rules. The real ranking is unchanged.',
    counterfactualNone: 'No Sharia-excluded name passes the current rules.',
    statusNonCompliant: 'Non-compliant',
    statusUnclassified: 'Unclassified',
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
    confirmDelete: 'Tap again to delete',
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
    fieldPe: 'مكرر الربحية',
    fieldDebt: 'نسبة الدين',
    fieldYield: 'عائد التوزيعات',
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
    relax: 'مسح الشروط',
    pipelineTitle: 'المسار',
    pipelineLocked: 'ترتيب ثابت: الفحص الشرعي ثم الشروط ثم الترتيب، ولا يمكن تغييره.',
    pipelineSharia: 'الفحص الشرعي',
    pipelineRules: 'الشروط',
    pipelineRank: 'الترتيب',
    pipelineCount: '{kept} من {from}',
    emptyTitle: 'لماذا صفر؟',
    emptyBody: 'راجع الشروط بالترتيب ثم قارن معاينات تخفيف شرط واحد.',
    funnelStart: 'المجموعة المتوافقة: {n} من {total}',
    funnelRemaining: 'بقي {n}',
    emptyAtSharia: 'صفر عند مرحلة الفحص الشرعي: لا يبقى اسم متوافق، لذا لا يفيد تخفيف الشروط.',
    relaxTitle: 'خفّف شرطًا واحدًا',
    relaxDrop: 'إزالة {rule}',
    relaxWiden: 'توسيع {rule}',
    relaxGain: 'يستعيد {n}',
    relaxNone: 'لا يفيد تخفيف شرط واحد هنا: العائق في مرحلة أعلى، أو الشروط لا تتقاطع.',
    staleTitle: 'البيانات قديمة',
    staleBody: 'آخر تحديث {age}. تُحجب النتائج المرتّبة؛ لا يُعرض ترتيب قديم كأنه حالي.',
    staleAsOf: 'اللقطة: {date}',
    snapshotShow: 'عرض آخر لقطة',
    snapshotHide: 'إخفاء اللقطة',
    snapshotNotice: 'معاينة تدقيق — آخر لقطة ناجحة، وليست البيانات الحالية.',
    auditTitle: 'التدقيق الشرعي',
    auditBody: 'تُرتَّب الأسماء المتوافقة فقط. غير المتوافقة وغير المصنّفة تُدقَّق هنا.',
    binOrder: 'استُبعدت قبل مرحلة الشروط؛ نتائج الشروط لا تغيّر هذه الحالة.',
    binFailedGroup: '{field} أعلى من {limit}',
    binMissingGroup: '{field} مفقود (الحد {limit})',
    binFailedNote: 'القياس {value} مقابل الحد {limit}.',
    binMissingNote: 'مدخل أيوفي غير منشور، لذا يتعذر إجراء الفحص.',
    nonCompliantTitle: 'غير متوافقة — مستبعدة',
    unclassifiedTitle: 'غير مصنّفة — مدخلات ناقصة',
    unclassifiedBody: 'مستبعدة افتراضيًا. المدخل الناقص يسبق فشل الفحص، لذا لا تُعدّ غير متوافقة.',
    auditEmpty: 'لا أسماء مستبعدة في هذه البيانات.',
    shariaDebt: 'الدين',
    shariaInterestBearing: 'أصول مدرّة للفائدة',
    shariaIncome: 'دخل غير متوافق',
    shariaReceivables: 'الذمم المدينة',
    counterfactualTitle: 'ماذا لو رُتِّب أولًا؟',
    counterfactualBody: 'أسماء استبعدها الفحص الشرعي وكانت ستجتاز الشروط الحالية. الترتيب الحقيقي لم يتغيّر.',
    counterfactualNone: 'لا اسم مستبعدًا من الفحص الشرعي يجتاز الشروط الحالية.',
    statusNonCompliant: 'غير متوافق',
    statusUnclassified: 'غير مصنّف',
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
    confirmDelete: 'اضغط مرة أخرى للحذف',
    duplicateAria: 'نسخ {name}',
    loadAria: 'تحميل {name}',
    openAria: 'فتح {name}',
  },
} satisfies Dict<ScreenerStrings>
