import { useMemo } from 'react'
import type { PaperAccount } from '../../api/ai'
import { fmtDate } from '../../i18n/format'
import { fmtNum } from '../../i18n'
import { useI18n } from '../../i18n'
import { strategies } from '../../data/mock'
import { runLedger } from '../strategy/ledger'
import { accountLedger } from '../../store/paper'
import type { WorkspaceStrings } from './strings'

type S = (key: keyof WorkspaceStrings) => string

/**
 * A read-only look at what the next rebalance would change. The target is the
 * demo Sharia-income strategy; current names come from the paper account. No
 * order is staged and nothing is sent to the broker.
 */
export function RebalancePreview({ account, s }: { account: PaperAccount; s: S }) {
  const { lang } = useI18n()
  const target = strategies.find((strategy) => strategy.id === 'sharia-income') ?? strategies[0]
  const targetNames = useMemo(() => {
    if (!target) return []
    return runLedger(target).passed.map((name) => name.symbol)
  }, [target])
  const current = accountLedger(account).positions.map((position) => position.symbol)
  const entering = targetNames.filter((symbol) => !current.includes(symbol))
  const leaving = current.filter((symbol) => !targetNames.includes(symbol))
  const unchanged = targetNames.filter((symbol) => current.includes(symbol))
  if (!target) return null

  return (
    <section className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="t-section">{s('rebalanceTitle')}</h3>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          {s('rebalancePreview')}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">
        {s('rebalanceHint')} · {target.name[lang]} · {fmtDate(account.last_date || account.start_on, lang)}
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-muted">{s('rebalanceEntering')}</dt>
          <dd className="num mt-0.5 text-[16px] font-semibold">{fmtNum(entering.length, lang, 0)}</dd>
        </div>
        <div>
          <dt className="text-muted">{s('rebalanceLeaving')}</dt>
          <dd className="num mt-0.5 text-[16px] font-semibold">{fmtNum(leaving.length, lang, 0)}</dd>
        </div>
        <div>
          <dt className="text-muted">{s('rebalanceUnchanged')}</dt>
          <dd className="num mt-0.5 text-[16px] font-semibold">{fmtNum(unchanged.length, lang, 0)}</dd>
        </div>
      </dl>
      {entering.length === 0 && leaving.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted">{s('rebalanceEmpty')}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-[12px]">
          {entering.map((symbol) => (
            <li key={`in-${symbol}`} className="flex items-center justify-between gap-2">
              <span>
                <span className="text-muted">+</span> {symbol}
              </span>
              <span className="text-[11px] text-muted">
                {s('rebalanceClears').replace('{n}', fmtNum(target.rules.length, lang, 0))}
              </span>
            </li>
          ))}
          {leaving.map((symbol) => (
            <li key={`out-${symbol}`} className="flex items-center justify-between gap-2">
              <span>
                <span className="text-muted">−</span> {symbol}
              </span>
              <span className="text-[11px] text-muted">{s('rebalanceNotTarget')}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-snug text-muted">{s('rebalanceScope')}</p>
    </section>
  )
}
