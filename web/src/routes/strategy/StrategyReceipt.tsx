import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fill, fmtDate } from '../../i18n/format'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Strategy } from '../../data/mock'
import { compareReceipt, decodeReceipt, encodeReceipt, hashOf, receiptFor } from './receipt'
import type { ReceiptChange, ReceiptCosts } from './receipt'
import { featureStrings } from './strings'
import type { FeatureStrings } from './strings'

const COST_KEY: Record<keyof ReceiptCosts, keyof FeatureStrings> = {
  capital: 'costCapital',
  feeBps: 'costFee',
  slipBps: 'costSlip',
  turnoverPct: 'costTurnover',
}

const OK_CHIP = {
  color: 'var(--color-accent)',
  background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
}

const BAD_CHIP = {
  color: 'var(--color-fg)',
  border: '1px solid var(--color-line)',
}

/**
 * The receipt is the reproducibility claim: what was run, on which date, over
 * which names, at which costs. Opened from a shared link it recomputes the
 * claim on the spot and says Reproduced or names the field that moved.
 */
export function StrategyReceipt({ strategy, costs }: { strategy: Strategy; costs: ReceiptCosts }) {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)
  const [params] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const current = receiptFor(strategy, costs)
  const hash = hashOf(current)
  const token = params.get('receipt')
  const claimed = token ? decodeReceipt(token) : null
  const verdict = claimed ? compareReceipt(claimed, current) : null
  const foreign = claimed !== null && claimed.id !== strategy.id

  const ruleLabel = (id: string) =>
    strategy.rules.find((rule) => rule.id === id)?.label[lang] ?? id

  const changeText = (change: ReceiptChange): string => {
    if (change.field === 'asOf') {
      return fill(s('receiptChangedAsOf'), {
        from: fmtDate(change.from, lang),
        to: fmtDate(change.to, lang),
      })
    }
    if (change.field === 'universe') {
      return fill(
        s(change.kind === 'added' ? 'receiptUniverseAdded' : 'receiptUniverseRemoved'),
        { symbol: change.symbol },
      )
    }
    if (change.field === 'costs') {
      return fill(s('receiptChangedCost'), {
        field: s(COST_KEY[change.key]),
        from: fmtNum(change.from, lang, 0),
        to: fmtNum(change.to, lang, 0),
      })
    }
    if (change.kind === 'value') {
      return fill(s('receiptChangedRule'), {
        rule: ruleLabel(change.ruleId),
        from: change.from ?? '',
        to: change.to ?? '',
      })
    }
    if (change.kind === 'order') {
      return fill(s('receiptChangedOrder'), { rule: ruleLabel(change.ruleId) })
    }
    if (change.kind === 'added') {
      return fill(s('receiptRuleAdded'), { rule: ruleLabel(change.ruleId) })
    }
    return fill(s('receiptRuleRemoved'), { rule: ruleLabel(change.ruleId) })
  }

  const copy = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('receipt', encodeReceipt(current))
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard permission is optional.
    }
  }

  return (
    <section className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="t-section">{s('receiptTitle')}</h2>
        <span dir="ltr" className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
          {s('receiptHash')} {hash}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('receiptHint')}
      </p>

      {/* What the receipt pins, one cell per field. */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-[10px] leading-none" style={{ color: 'var(--color-muted)' }}>
            {s('receiptAsOf')}
          </dt>
          <dd dir="ltr" className="num mt-1 text-[12px] leading-none">
            {fmtDate(current.asOf, lang)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] leading-none" style={{ color: 'var(--color-muted)' }}>
            {s('receiptRules')}
          </dt>
          <dd dir="ltr" className="num mt-1 text-[12px] leading-none">
            {fmtNum(current.rules.length, lang, 0)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] leading-none" style={{ color: 'var(--color-muted)' }}>
            {s('receiptUniverse')}
          </dt>
          <dd dir="ltr" className="num mt-1 text-[12px] leading-none">
            {fmtNum(current.universe.length, lang, 0)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] leading-none" style={{ color: 'var(--color-muted)' }}>
            {s('receiptCosts')}
          </dt>
          <dd dir="ltr" className="num mt-1 text-[12px] leading-none">
            {fmtNum(costs.feeBps, lang, 0)} + {fmtNum(costs.slipBps, lang, 0)} bp
          </dd>
        </div>
      </dl>

      {foreign && claimed ? (
        <p className="mt-2.5 text-[12px]" style={{ color: 'var(--color-muted)' }}>
          {fill(s('receiptOtherStrategy'), { id: claimed.id })}
        </p>
      ) : verdict ? (
        <div className="mt-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] leading-none"
            style={verdict.ok ? OK_CHIP : BAD_CHIP}
          >
            <span aria-hidden="true">{verdict.ok ? '✓' : '!'}</span>
            {verdict.ok ? s('receiptOk') : s('receiptMismatch')}
          </span>
          {verdict.changes.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
              {verdict.changes.map((change, index) => (
                <li key={`${change.field}-${index}`}>· {changeText(change)}</li>
              ))}
            </ul>
          )}
        </div>
      ) : token ? (
        <p className="mt-2.5 text-[12px]" style={{ color: 'var(--color-muted)' }}>
          {s('receiptBadLink')}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={copy}
          className="flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {copied ? s('receiptCopied') : s('receiptCopy')}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? s('receiptCopied') : ''}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('receiptScope')}
      </p>
    </section>
  )
}
