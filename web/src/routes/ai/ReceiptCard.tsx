import { useStrings } from '../../i18n'
import type { RefusalReceipt, RefusalRule } from './refusal'
import { strings } from './strings'
import type { AiStrings } from './strings'

const RULE_KEY = {
  advice: 'ruleAdvice',
  execution: 'ruleExecution',
  guarantee: 'ruleGuarantee',
} as const satisfies Record<RefusalRule, keyof AiStrings>

const REWRITE_KEY = {
  advice: 'rewriteAdvice',
  execution: 'rewriteExecution',
  guarantee: 'rewriteGuarantee',
} as const satisfies Record<RefusalRule, keyof AiStrings>

/**
 * A stamped receipt for a request or answer that crossed the product
 * boundary. It names the phrase, the rule class, and a compliant rewrite —
 * product scope copy, never a legal opinion.
 */
export function ReceiptCard({
  receipt,
  compact = false,
}: {
  receipt: RefusalReceipt
  compact?: boolean
}) {
  const s = useStrings(strings)
  return (
    <figure className={`panel mt-2 border-dashed ${compact ? 'p-2.5' : 'p-3'}`} role="note">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-muted">
            {receipt.role === 'user' ? s('receiptAsked') : s('receiptAnswered')}
          </p>
          <p className={`${compact ? 'text-[12px]' : 'text-[13px]'} font-medium`}>
            {s('receiptTitle')}
          </p>
        </div>
        <span className="shrink-0 -rotate-3 rounded border border-line px-2 py-0.5 text-[10px] font-semibold text-muted">
          {s('receiptStamp')}
        </span>
      </div>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-[10px] text-muted">{s('receiptTrigger')}</dt>
          <dd dir="auto" className="mt-0.5 text-[12px] leading-snug">
            “{receipt.trigger}”
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted">{s('receiptRule')}</dt>
          <dd className="text-[12px]">{s(RULE_KEY[receipt.rule])}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted">{s('receiptRewrite')}</dt>
          <dd className="mt-0.5 text-[12px] leading-relaxed text-muted">
            {s(REWRITE_KEY[receipt.rule])}
          </dd>
        </div>
      </dl>
    </figure>
  )
}
