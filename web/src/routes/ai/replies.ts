import type { Lang } from '../../i18n'
import type { Artifact, SourceRef } from './chat'

export type ReplyArtifact = Omit<Artifact, 'symbols'>

export type Reply = {
  paragraphs: string[]
  sources: SourceRef[]
  artifact?: ReplyArtifact
}

/** The first three exchanges are scripted; the third one returns the rule card. */
export const canned: Record<Lang, Reply[]> = {
  zh: [
    {
      paragraphs: [
        '先用大白话说结论：在沙特、香港和中国内地这三个市场里，你能先看到已经通过教法筛选、基本面还算稳的公司。',
        '这是演示数据。我会把你说的话变成可编辑的规则，不会替你下单，也不会假装跑过真实回测。',
      ],
      sources: [
        { label: '行情快照 · Tadawul', href: '/' },
        { label: '教法筛选规则', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        '明白。把「便宜」换成规则，就是价格或市盈率不超过一个数；把「稳」换成规则，就是波动和负债有限。',
        '这条规则可以在筛选器里逐行编辑，也能存成自己的 screen。演示版只筛本地样本，不跑历史回测。',
      ],
      sources: [
        { label: '筛选器', href: '/screener' },
        { label: '演示规则 · 1 条', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        '这是规则卡：在演示样本里按价格筛出一组。数字只来自这一屏的样本，不代表市场全貌。',
        '你可以打开筛选器改条件，或者去看一条已经写好的策略报告。',
      ],
      sources: [
        { label: '筛选器 · 演示', href: '/screener' },
        { label: '策略报告', href: '/report/low-debt-value' },
      ],
      artifact: { title: '便宜且稳（演示）', rule: '价格 < 80 · 先过教法筛选', preset: 'value' },
    },
  ],
  en: [
    {
      paragraphs: [
        'Plain answer first: across Saudi, Hong Kong and mainland China you can look at companies that already pass the Sharia screen and hold up on the basics.',
        'This is demo data. I turn your words into editable rules; I do not place orders or pretend a real backtest ran.',
      ],
      sources: [
        { label: 'Price snapshot · Tadawul', href: '/' },
        { label: 'Sharia screen', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        'Got it. In rules, “cheap” means a price or P/E below a number; “steady” means limited swing and limited debt.',
        'You can edit each row in the screener and save it as your own screen. The demo filters the local sample only; it does not run a historical backtest.',
      ],
      sources: [
        { label: 'Screener', href: '/screener' },
        { label: 'Demo rule · 1 condition', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        'Here is the rule card: the demo sample filtered by price. The numbers come from this sample, not the whole market.',
        'Open the screener to change the condition, or read a strategy report that already exists.',
      ],
      sources: [
        { label: 'Screener · demo', href: '/screener' },
        { label: 'Strategy report', href: '/report/low-debt-value' },
      ],
      artifact: { title: 'Value screen (demo)', rule: 'Price < 80 · Sharia first', preset: 'value' },
    },
  ],
  ar: [
    {
      paragraphs: [
        'الخلاصة بكلمات بسيطة: في السعودية وهونغ كونغ والصين القارية تستطيع أن ترى شركات اجتازت فحص الشريعة وأساسياتها متماسكة.',
        'هذه بيانات عرض. أحوّل كلامك إلى قواعد قابلة للتعديل، ولا أنفّذ أوامر ولا أدّعي أن اختبارًا تاريخيًا حقيقيًا جرى.',
      ],
      sources: [
        { label: 'لقطة أسعار · تداول', href: '/' },
        { label: 'قواعد فحص الشريعة', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        '«رخيص» بقواعد الأرقام يعني سعرًا أو مكرر ربحية تحت رقم محدد، و«مستقر» يعني تقلبًا ودينًا محدودين.',
        'يمكنك تعديل كل صف في الفرز وحفظه كشاشة خاصة. نسخة العرض تفرز العينة المحلية فقط، ولا تشغّل اختبارًا تاريخيًا.',
      ],
      sources: [
        { label: 'الفرز', href: '/screener' },
        { label: 'قاعدة عرض · شرط واحد', href: '/screener' },
      ],
    },
    {
      paragraphs: [
        'هذه بطاقة القاعدة: العينة التجريبية بعد فرز السعر. الأرقام من هذه العينة فقط، وليست صورة للسوق كله.',
        'افتح الفرز لتغيير الشرط، أو اقرأ تقرير خطة موجودًا بالفعل.',
      ],
      sources: [
        { label: 'الفرز · عرض', href: '/screener' },
        { label: 'تقرير الخطة', href: '/report/low-debt-value' },
      ],
      artifact: { title: 'فرز القيمة (عرض)', rule: 'السعر < 80 · فحص الشريعة أولًا', preset: 'value' },
    },
  ],
}

/** Anything after the third exchange keeps the thread alive without repeating the card. */
export const followUps: Record<Lang, Reply[]> = {
  zh: [
    {
      paragraphs: [
        '记下了。这个演示能聊的范围是：行情、新闻、策略报告，还有教法筛选。',
        '想看别的，可以换个说法再问一次，或者从上面的对象里挑一只具体看。',
      ],
      sources: [{ label: '范围说明', href: '/learn' }],
    },
    {
      paragraphs: [
        '换一种问法也行，比如直接给数字条件：「价格低于 80 的都有哪些」。',
        '数字越具体，我越容易把它变成可编辑的规则。',
      ],
      sources: [{ label: '筛选器', href: '/screener' }],
    },
  ],
  en: [
    {
      paragraphs: [
        'Noted. In this demo I can cover prices, news, strategy reports and the Sharia screen.',
        'Try another angle, or pick one of the objects above and I will go deeper on it.',
      ],
      sources: [{ label: 'Scope note', href: '/learn' }],
    },
    {
      paragraphs: [
        'Different wording works too — give me a number: “anything under 80?”',
        'The more concrete the number, the easier it becomes an editable rule.',
      ],
      sources: [{ label: 'Screener', href: '/screener' }],
    },
  ],
  ar: [
    {
      paragraphs: [
        'سُجّل. في هذا العرض أستطيع التحدث عن الأسعار والأخبار وتقارير الخطط وفحص الشريعة.',
        'جرّب زاوية أخرى، أو اختر أحد العناصر أعلاه وسأتعمق فيه.',
      ],
      sources: [{ label: 'نطاق العمل', href: '/learn' }],
    },
    {
      paragraphs: [
        'صيغة أخرى تنفع أيضًا، مثل شرط رقمي: «ما هي الأسعار تحت 80؟».',
        'كلما كان الرقم أدق، سهل تحويله إلى قاعدة قابلة للتعديل.',
      ],
      sources: [{ label: 'الفرز', href: '/screener' }],
    },
  ],
}
