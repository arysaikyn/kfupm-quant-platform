import { useI18n } from '../i18n'
import type { Lang } from '../i18n'
import type { RefusalReceipt, RefusalRule } from '../lib/refusal'

/**
 * A stamped receipt for a request or answer that crossed the product
 * boundary. It names the phrase, the rule class, and a compliant rewrite —
 * product scope copy, never a legal opinion.
 *
 * The copy lives here because the card is used by two screens (the AI tab and
 * the runs list) and belongs to neither: a component that borrowed one
 * screen's string table would make that screen the owner of shared UI.
 */

type Copy = {
  asked: string
  answered: string
  title: string
  stamp: string
  trigger: string
  rule: string
  rewrite: string
  ruleOf: Record<RefusalRule, string>
  rewriteOf: Record<RefusalRule, string>
}

const COPY: Record<Lang, Copy> = {
  zh: {
    asked: '你的提问',
    answered: '这次回答',
    title: '超出这个 App 的范围',
    stamp: '超出范围',
    trigger: '触发说法',
    rule: '规则类别',
    rewrite: '可以改成',
    ruleOf: { advice: '投资建议', execution: '代下单', guarantee: '保证收益' },
    rewriteOf: {
      advice:
        '我可以按你的条件筛出候选，并标出每条规则的通过、不通过和缺失；买不买由你决定。',
      execution: '这里不连接券商、不下单。我可以跑一次历史回测，让你看这条规则过去的表现。',
      guarantee:
        '没有任何收益能被保证。我能给的是历史区间、最大回撤和样本量，以及它们在什么条件下失效。',
    },
  },
  en: {
    asked: 'Your request',
    answered: 'This answer',
    title: 'Outside what this app does',
    stamp: 'Out of scope',
    trigger: 'Trigger phrase',
    rule: 'Rule class',
    rewrite: 'Compliant rewrite',
    ruleOf: { advice: 'Investment advice', execution: 'Order execution', guarantee: 'Guaranteed returns' },
    rewriteOf: {
      advice:
        'I can screen names against your rules and mark every condition pass, fail or missing. The buy decision stays with you.',
      execution:
        'This app has no broker connection and places no orders. I can run a historical backtest so you can see how the rule behaved.',
      guarantee:
        'No return can be guaranteed. What I can show is the historical range, the worst drawdown, the sample size, and the conditions where it breaks.',
    },
  },
  ar: {
    asked: 'طلبك',
    answered: 'هذه الإجابة',
    title: 'خارج ما يفعله هذا التطبيق',
    stamp: 'خارج النطاق',
    trigger: 'العبارة المسبِّبة',
    rule: 'فئة القاعدة',
    rewrite: 'صياغة مقبولة',
    ruleOf: { advice: 'نصيحة استثمارية', execution: 'تنفيذ أمر', guarantee: 'عوائد مضمونة' },
    rewriteOf: {
      advice:
        'أستطيع فرز الأسهم وفق شروطك وتحديد كل شرط: ناجح أو فاشل أو بياناته ناقصة. قرار الشراء يبقى لك.',
      execution:
        'هذا التطبيق لا يتصل بوسيط ولا ينفّذ أوامر. أستطيع تشغيل اختبار تاريخي لترى كيف تصرّفت القاعدة سابقًا.',
      guarantee:
        'لا يمكن ضمان أي عائد. ما أستطيع عرضه هو النطاق التاريخي وأسوأ تراجع وحجم العينة والشروط التي تتعطّل عندها.',
    },
  },
}

export function ReceiptCard({
  receipt,
  compact = false,
}: {
  receipt: RefusalReceipt
  compact?: boolean
}) {
  const { lang } = useI18n()
  const s = COPY[lang]
  return (
    <figure className={`panel mt-2 border-dashed ${compact ? 'p-2.5' : 'p-3'}`} role="note">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs text-muted">
            {receipt.role === 'user' ? s.asked : s.answered}
          </p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>{s.title}</p>
        </div>
        <span className="shrink-0 -rotate-3 rounded border border-line px-2 py-0.5 text-2xs font-semibold text-muted">
          {s.stamp}
        </span>
      </div>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-2xs text-muted">{s.trigger}</dt>
          <dd dir="auto" className="mt-0.5 text-xs leading-snug">
            “{receipt.trigger}”
          </dd>
        </div>
        <div>
          <dt className="text-2xs text-muted">{s.rule}</dt>
          <dd className="text-xs">{s.ruleOf[receipt.rule]}</dd>
        </div>
        <div>
          <dt className="text-2xs text-muted">{s.rewrite}</dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-muted">
            {s.rewriteOf[receipt.rule]}
          </dd>
        </div>
      </dl>
    </figure>
  )
}
