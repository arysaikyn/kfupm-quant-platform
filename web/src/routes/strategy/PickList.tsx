import { useState } from 'react'
import { fill, fmtDate } from '../../i18n/format'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { quotes } from '../../data/mock'
import type { Quote, Strategy } from '../../data/mock'
import type { Ledger } from './ledger'
import { featureStrings } from './strings'

const QUOTE_OF: Record<string, Quote> = Object.fromEntries(
  quotes.map((quote) => [quote.symbol, quote]),
)

/**
 * A dated sheet you can print or paste: the date, the rules that were applied,
 * the names that cleared them, and the equal target weight. When nothing clears
 * the rules the sheet still prints — an empty list with its blocker is a
 * finding, and a blank page would hide it.
 */
export function PickList({ strategy, ledger }: { strategy: Strategy; ledger: Ledger }) {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)
  const [copied, setCopied] = useState(false)

  const picks = ledger.passed
  const weight = picks.length > 0 ? 1 / picks.length : 0

  const blockerCounts: Record<string, number> = {}
  for (const name of ledger.names) {
    const id = name.blocker?.ruleId
    if (!id) continue
    blockerCounts[id] = (blockerCounts[id] ?? 0) + 1
  }
  const [topId, topCount] = Object.entries(blockerCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0] ?? ['', 0]
  const topRule = strategy.rules.find((rule) => rule.id === topId)

  const listText = () => {
    const lines = [
      fill(s('pickCopyHeader'), { name: strategy.name[lang] }),
      fill(s('pickAsOf'), { date: fmtDate(strategy.updated, lang) }),
      '',
      `${s('pickRules')}:`,
      ...strategy.rules.map((rule, index) => `${index + 1}. ${rule.label[lang]} ${rule.value}`),
      '',
      `${s('pickNames')}:`,
      ...(picks.length > 0
        ? picks.map((pick) => {
            const quote = QUOTE_OF[pick.symbol]
            const price = quote ? `${fmtNum(quote.price, lang, 2)} ${quote.currency}` : ''
            return `${QUOTE_OF[pick.symbol]?.name[lang] ?? pick.symbol} — ${fmtNum(weight * 100, lang, 1, '%')} — ${fmtNum(100 * weight, lang, 2)} — ${price}`
          })
        : [s('pickEmpty')]),
      '',
      s('pickDemoNote'),
    ]
    return lines.join('\n')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listText())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard permission is optional.
    }
  }

  return (
    <section className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="t-section">{s('pickTitle')}</h2>
        <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
          {fill(s('pickAsOf'), { date: fmtDate(strategy.updated, lang) })}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('pickHint')}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('pickPrint')}
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {copied ? s('pickCopied') : s('pickCopy')}
        </button>
      </div>

      <ol className="mt-3 space-y-1.5">
        {strategy.rules.map((rule, index) => (
          <li key={rule.id} className="flex items-baseline gap-2.5 text-[12px] leading-snug">
            <span className="num shrink-0 text-[11px]" style={{ color: 'var(--color-muted)' }} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">{rule.label[lang]}</span>
            <span dir="ltr" className="num shrink-0 text-[11px]">
              {rule.value}
            </span>
          </li>
        ))}
      </ol>

      {picks.length === 0 ? (
        <>
          <p className="mt-3 text-[13px] leading-snug">{s('pickEmpty')}</p>
          {topCount > 0 && (
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {fill(s('pickEmptyHint'), {
                rule: topRule?.label[lang] ?? topId,
                n: fmtNum(topCount, lang, 0),
              })}
            </p>
          )}
        </>
      ) : (
        <div className="mt-3">
          <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {fill(s('pickEqualNote'), { pct: fmtNum(weight * 100, lang, 1, '%') })}
          </p>
          <div
            className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 border-y border-line py-1.5 text-[10px] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            style={{ color: 'var(--color-muted)' }}
          >
            <span>{s('pickNames')}</span>
            <span className="text-end">{s('pickWeight')}</span>
            <span className="text-end">{s('pickPer100')}</span>
            <span className="hidden text-end sm:block">{s('pickPrice')}</span>
          </div>
          <ul>
            {picks.map((pick) => {
              const quote = QUOTE_OF[pick.symbol]
              return (
                <li
                  key={pick.symbol}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-3 border-b border-line py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                >
                  <span className="truncate text-[12px]">{quote?.name[lang] ?? pick.symbol}</span>
                  <span dir="ltr" className="num text-end text-[11px]">
                    {fmtNum(weight * 100, lang, 1, '%')}
                  </span>
                  <span dir="ltr" className="num text-end text-[11px]">
                    {fmtNum(100 * weight, lang, 2)}
                  </span>
                  <span dir="ltr" className="num hidden text-end text-[11px] sm:block">
                    {quote ? `${fmtNum(quote.price, lang, 2)} ${quote.currency}` : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('pickDemoNote')}
      </p>
    </section>
  )
}
