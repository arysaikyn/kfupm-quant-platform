import { fill } from '../../i18n/format'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol } from '../../data/mock'
import type { Strategy } from '../../data/mock'
import type { Ledger, NameRun } from '../../lib/ledger'
import { MISSING_KEY, SHARIA_FIELD_KEY, measureText } from './labels'
import { featureStrings } from './strings'

/**
 * The excluded names, in the order the engine read them. Each row keeps the
 * first rule that stopped the name and the figure that rule measured, because
 * "dropped" without a number is an opinion.
 */
export function DropLedger({ strategy, ledger }: { strategy: Strategy; ledger: Ledger }) {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)
  const share = (n: number) => (ledger.evaluated === 0 ? 0 : (n / ledger.evaluated) * 100)
  const ruleNumber = (id: string) => strategy.rules.findIndex((rule) => rule.id === id) + 1

  const blockerText = (name: NameRun): string => {
    if (!name.blocker) return s('ledgerPassed')
    const rule = strategy.rules.find((item) => item.id === name.blocker?.ruleId)
    const head = fill(s('ledgerRule'), { n: String(ruleNumber(name.blocker.ruleId)) })
    const label = rule?.label[lang] ?? name.blocker.ruleId
    if (name.blocker.status === 'unknown') {
      const missing = name.blocker.missing
      return `${head} · ${label} · ${s(missing ? MISSING_KEY[missing] : 'missingUnmappedRule')}`
    }
    const measure = name.blocker.measure
    if (!measure) return `${head} · ${label}`
    if (measure.kind === 'sector') {
      return `${head} · ${label} · ${measureText(measure, lang)}`
    }
    if (name.blocker.field && name.blocker.limit !== undefined) {
      // AAOIFI: name the line it crossed, not just the figure it printed.
      const limit = fmtNum(name.blocker.limit * 100, lang, 1, '%')
      return `${head} · ${label} · ${s(SHARIA_FIELD_KEY[name.blocker.field])} ${measureText(measure, lang)} > ${limit}`
    }
    return `${head} · ${label} ${rule?.value ?? ''} · ${s('ledgerMeasured')} ${measureText(measure, lang)}`
  }

  return (
    <section className="border-t border-line pt-5">
      <h2 className="t-section">{s('ledgerTitle')}</h2>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('ledgerHint')}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { value: ledger.evaluated, label: s('ledgerEvaluated') },
          { value: ledger.screened, label: s('ledgerScreened') },
          { value: ledger.ranked, label: s('ledgerRanked') },
        ].map((item, index) => (
          <div key={item.label} className={index === 0 ? 'min-w-0' : 'min-w-0 border-s border-line ps-3'}>
            <div dir="ltr" className="num text-[19px] leading-none font-semibold">
              {fmtNum(item.value, lang, 0)}
            </div>
            <div className="mt-1 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* One bar, three states: dropped, unproven, ranked. */}
      <div
        aria-hidden="true"
        className="mt-3 flex h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--color-surface)' }}
      >
        <div
          style={{
            width: `${share(ledger.names.filter((name) => name.status === 'excluded').length)}%`,
            background: 'var(--color-muted)',
          }}
        />
        <div
          style={{
            width: `${share(ledger.names.filter((name) => name.status === 'unproven').length)}%`,
            background: 'color-mix(in srgb, var(--color-fg) 20%, transparent)',
          }}
        />
        <div
          style={{
            width: `${share(ledger.ranked)}%`,
            background: 'var(--color-accent)',
          }}
        />
      </div>

      <ul className="mt-2 divide-y divide-line">
        {ledger.names.map((name) => (
          <li key={name.symbol} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span dir="ltr" className="num shrink-0 text-[12px]">
                  {name.symbol}
                </span>
                <span className="truncate text-[13px]">{quoteBySymbol[name.symbol]?.name[lang] ?? name.symbol}</span>
              </div>
              <span
                className="shrink-0 text-[10px] leading-none"
                style={{ color: 'var(--color-muted)' }}
              >
                {name.status === 'passed'
                  ? s('ledgerPassed')
                  : name.status === 'excluded'
                    ? s('ledgerExcluded')
                    : s('ledgerUnproven')}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
              {blockerText(name)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('ledgerDemoNote')}
      </p>
    </section>
  )
}
