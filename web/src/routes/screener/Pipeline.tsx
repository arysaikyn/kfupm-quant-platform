import type { Lang } from '../../i18n'
import { fmtNum } from '../../i18n'
import { fill } from '../../i18n/format'
import type { CounterfactualEntry } from './audit'
import type { ScreenerStrings, ScreenerText } from './strings'

const muted = { color: 'var(--color-muted)' }

type StageKey = Extract<
  keyof ScreenerStrings,
  'pipelineSharia' | 'pipelineRules' | 'pipelineRank'
>

export type PipelineStage = { key: StageKey; kept: number; from: number }

export function Pipeline({
  s,
  lang,
  stages,
}: {
  s: ScreenerText
  lang: Lang
  stages: PipelineStage[]
}) {
  return (
    <section className="mt-8" aria-labelledby="screener-pipeline">
      <h2 id="screener-pipeline" className="t-section">
        {s('pipelineTitle')}
      </h2>
      <p className="mt-1 text-[12px] leading-snug" style={muted}>
        {s('pipelineLocked')}
      </p>
      <ol className="mt-2 divide-y divide-line border-y border-line">
        {stages.map((stage, index) => (
          <li key={stage.key} className="flex min-h-11 items-center gap-3 py-2">
            <span
              aria-hidden="true"
              className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
              style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
            >
              {fmtNum(index + 1, lang, 0)}
            </span>
            <span className="text-[13px]">{s(stage.key)}</span>
            <span className="num ms-auto shrink-0 text-[11px]" style={muted}>
              {fill(s('pipelineCount'), {
                kept: fmtNum(stage.kept, lang, 0),
                from: fmtNum(stage.from, lang, 0),
              })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * Audit only. The entries are computed from the rules screen but never feed
 * the ranked list, which stays built from the compliant pool.
 */
export function Counterfactual({
  s,
  lang,
  entries,
}: {
  s: ScreenerText
  lang: Lang
  entries: CounterfactualEntry[]
}) {
  return (
    <section className="mt-8" aria-label={s('counterfactualTitle')}>
      <details className="border-t border-line pt-1">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">
          <span>{s('counterfactualTitle')}</span>
          <span className="num text-[11px] font-normal" style={muted}>
            {fmtNum(entries.length, lang, 0)}
          </span>
        </summary>
        <p className="mt-1 text-[12px] leading-snug" style={muted}>
          {s('counterfactualBody')}
        </p>
        {entries.length === 0 ? (
          <p className="mt-2 text-[12px] leading-snug" style={muted}>
            {s('counterfactualNone')}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-t border-line">
            {entries.map(({ quote, status }) => (
              <li key={quote.symbol} className="flex min-h-11 items-center gap-2 py-2">
                <span className="min-w-0 truncate text-[13px]">{quote.name[lang]}</span>
                <span className="num shrink-0 text-[11px]" style={muted}>
                  {quote.symbol}
                </span>
                <span className="ms-auto shrink-0 text-[11px]" style={muted}>
                  {status === 'non-compliant'
                    ? s('statusNonCompliant')
                    : s('statusUnclassified')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  )
}
