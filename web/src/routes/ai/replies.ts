import type { Lang } from '../../i18n'

export type Reply = {
  paragraphs: string[]
  sources: string[]
  artifactTitle?: string
}

/** The first three exchanges are scripted; the third one returns the artifact. */
export const canned: Record<Lang, Reply[]> = {
  zh: [
    {
      paragraphs: [
        '先用大白话说结论：在沙特、香港和中国内地这三个市场里，你能先看到已经通过教法筛选、基本面还算稳的公司。',
        '我不会直接叫你买哪一只。我能做的是把符合你条件的公司列出来，告诉你每家的理由，也告诉你它可能出问题的地方。',
      ],
      sources: ['行情快照 · Tadawul', '教法筛选规则'],
    },
    {
      paragraphs: [
        '明白。把「便宜」换成规则，就是市盈率不高、负债有限；把「稳」换成规则，就是盈利没有大起大落，现金流撑得住。',
        '这两个条件我已经丢进引擎里跑了，结果会直接接在这条对话下面。',
      ],
      sources: ['回测引擎 · 4 条规则'],
    },
    {
      paragraphs: [
        '跑完了，有 5 家同时满足。都先过了教法筛选，再按估值从低到高排。',
        '要留意的一点：能源和原材料占了三家。如果油价回落，这一组会一起难受。',
      ],
      sources: ['回测结果 · 近 3 年', '行情快照 · Tadawul'],
      artifactTitle: '便宜且稳 · 5 只',
    },
  ],
  en: [
    {
      paragraphs: [
        'Plain answer first: across Saudi, Hong Kong and mainland China you can look at companies that already pass the Sharia screen and hold up on the basics.',
        'I won’t tell you to buy one name. What I can do is list what fits your rule, explain the reason for each, and show where it could go wrong.',
      ],
      sources: ['Price snapshot · Tadawul', 'Sharia screen'],
    },
    {
      paragraphs: [
        'Got it. In rules, “cheap” means a modest P/E and limited debt; “steady” means earnings that do not swing and cash flow that holds.',
        'Both conditions are running through the engine now — the result lands right below in this thread.',
      ],
      sources: ['Backtest engine · 4 rules'],
    },
    {
      paragraphs: [
        'Done — five names pass both rules. All clear the Sharia screen first, then ranked from the cheapest valuation.',
        'One thing to watch: energy and materials make up three of the five. If oil rolls over, this group hurts together.',
      ],
      sources: ['Backtest · last 3 years', 'Price snapshot · Tadawul'],
      artifactTitle: 'Cheap and steady · 5 names',
    },
  ],
  ar: [
    {
      paragraphs: [
        'الخلاصة بكلمات بسيطة: في السعودية وهونغ كونغ والصين القارية تستطيع أن ترى شركات اجتازت فحص الشريعة وأساسياتها متماسكة.',
        'لن أقول لك اشترِ هذه بالتحديد. ما أستطيعه هو سرد الشركات التي تناسب شرطك، وشرح سبب كل واحدة، وأين قد تتعثر.',
      ],
      sources: ['لقطة أسعار · تداول', 'قواعد فحص الشريعة'],
    },
    {
      paragraphs: [
        '«رخيص» بقواعد الأرقام يعني مكرر ربحية معتدلًا ودينًا محدودًا، و«مستقر» يعني أرباحًا لا تتأرجح وتدفقًا نقديًا يصمد.',
        'شغّلت الشرطين في المحرك الآن، والنتيجة ستظهر أدناه في هذه المحادثة.',
      ],
      sources: ['محرك الاختبار · 4 قواعد'],
    },
    {
      paragraphs: [
        'انتهى الفحص: خمس شركات تحقق الشرطين. كلها اجتازت فحص الشريعة أولًا، ثم رُتبت من الأرخص تقييمًا.',
        'انتبه إلى نقطة واحدة: الطاقة والمواد تشكل ثلاثًا من الخمس. إذا تراجع النفط ستتألم المجموعة معًا.',
      ],
      sources: ['نتيجة الاختبار · 3 سنوات', 'لقطة أسعار · تداول'],
      artifactTitle: 'رخيص ومستقر · 5 أسهم',
    },
  ],
}

/** Anything after the third exchange keeps the thread alive without repeating the card. */
export const followUps: Record<Lang, Reply[]> = {
  zh: [
    {
      paragraphs: [
        '记下了。这个演示里我能聊的范围是：行情、新闻、策略回测，还有教法筛选。',
        '想看别的，可以换个说法再问一次，或者从上面的对象里挑一只具体看。',
      ],
      sources: ['范围说明'],
    },
    {
      paragraphs: [
        '换一种问法也行，比如直接给数字条件：「负债率低于 30% 的都有哪些」。',
        '数字越具体，我越容易把它变成可回测的规则。',
      ],
      sources: ['策略模板'],
    },
  ],
  en: [
    {
      paragraphs: [
        'Noted. In this demo I can cover prices, news, strategy backtests and the Sharia screen.',
        'Try another angle, or pick one of the objects above and I will go deeper on it.',
      ],
      sources: ['Scope note'],
    },
    {
      paragraphs: [
        'Different wording works too — give me a number: “anything with debt under 30%?”',
        'The more concrete the number, the easier it becomes a rule I can backtest.',
      ],
      sources: ['Strategy template'],
    },
  ],
  ar: [
    {
      paragraphs: [
        'سُجّل. في هذا العرض أستطيع التحدث عن الأسعار والأخبار واختبار الخطط وفحص الشريعة.',
        'جرّب زاوية أخرى، أو اختر أحد العناصر أعلاه وسأتعمق فيه.',
      ],
      sources: ['نطاق العمل'],
    },
    {
      paragraphs: [
        'صيغة أخرى تنفع أيضًا، مثل شرط رقمي: «ما هي الشركات التي دينها أقل من 30%؟».',
        'كلما كان الرقم أدق، سهل تحويله إلى قاعدة قابلة للاختبار.',
      ],
      sources: ['قالب خطة'],
    },
  ],
}
