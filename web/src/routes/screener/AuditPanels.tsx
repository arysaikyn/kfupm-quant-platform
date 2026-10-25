import { useState } from 'react'
import type { Lang } from '../../i18n'
import { fmtNum } from '../../i18n'
import { countNames, fill, fmtDateTime, relTime } from '../../i18n/format'
import { DATA_AS_OF, dataAgeDays } from '../../lib/freshness'
import type { AuditGroup, FunnelStage, Relaxation, ShariaBuckets } from './audit'
import { reasonGroups } from './audit'
import { FIELD_KEY, ruleText, shariaCap, shariaPct } from './format'
import { SHARIA_FIELD_KEY } from './strings'
import type { ScreenerText } from './strings'

const muted = { color: 'var(--color-muted)' }
const surface = { background: 'var(--color-surface)' }

type Common = { s: ScreenerText; lang: Lang }

export function StaleNotice({
  s,
  lang,
  now,
  snapshotOpen,
  onToggle,
}: Common & { now: number; snapshotOpen: boolean; onToggle: () => void }) {
  return (
    <section
      className="mt-6 rounded-2xl p-4"
      style={{ ...surface, border: '1px solid var(--color-line)' }}
      aria-labelledby="screener-stale"
    >
      <p id="screener-stale" className="text-[14px] font-semibold">
        {s('staleTitle')}
      </p>
      <p className="mt-1 text-[12px] leading-snug">
        {fill(s('staleBody'), { age: relTime(dataAgeDays(now) * 24 * 60, lang) })}
      </p>
      <p className="num mt-1 text-[11px]" style={muted}>
        {fill(s('staleAsOf'), { date: fmtDateTime(DATA_AS_OF, lang) })}
      </p>
      <button
        type="button"
        aria-pressed={snapshotOpen}
        onClick={onToggle}
        className="mt-3 min-h-11 rounded-full px-4 text-[12px] transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        style={{ border: '1px solid var(--color-line)' }}
      >
        {snapshotOpen ? s('snapshotHide') : s('snapshotShow')}
      </button>
    </section>
  )
}

export function ZeroAutopsy({
  s,
  lang,
  buckets,
  stages,
  candidates,
  onApply,
  onClear,
}: Common & {
  buckets: ShariaBuckets
  stages: FunnelStage[]
  candidates: Relaxation[]
  onApply: (candidate: Relaxation) => void
  onClear: () => void
}) {
  return (
    <div className="py-6">
      <h3 className="text-[15px] font-semibold">{s('emptyTitle')}</h3>
      <p className="mt-1 text-[12px] leading-snug" style={muted}>
        {s('emptyBody')}
      </p>
      <p className="num mt-4 text-[12px]">
        {fill(s('funnelStart'), {
          n: fmtNum(buckets.compliant.length, lang, 0),
          total: fmtNum(buckets.total, lang, 0),
        })}
      </p>

      {buckets.compliant.length === 0 ? (
        <p className="mt-2 text-[13px] leading-snug">{s('emptyAtSharia')}</p>
      ) : (
        <>
          <ol className="mt-2 divide-y divide-line border-y border-line">
            {stages.map((stage) => (
              <li
                key={stage.rule.id}
                className="flex min-h-11 items-center justify-between gap-3 py-2"
              >
                <span className="num min-w-0 truncate text-[12px]">
                  {ruleText(stage.rule, stage.threshold, s(FIELD_KEY[stage.rule.field]), lang)}
                </span>
                <span className="num shrink-0 text-[11px]" style={muted}>
                  {fill(s('funnelRemaining'), { n: fmtNum(stage.kept, lang, 0) })}
                </span>
              </li>
            ))}
          </ol>

          <h4 className="mt-5 text-[12px] font-semibold">{s('relaxTitle')}</h4>
          {candidates.length === 0 ? (
            <p className="mt-1 text-[12px] leading-snug" style={muted}>
              {s('relaxNone')}
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {candidates.map((candidate) => {
                const threshold =
                  candidate.kind === 'widen'
                    ? (candidate.nextValue ?? candidate.threshold)
                    : candidate.threshold
                const rule = ruleText(
                  candidate.rule,
                  threshold,
                  s(FIELD_KEY[candidate.rule.field]),
                  lang,
                )
                const template = candidate.kind === 'drop' ? 'relaxDrop' : 'relaxWiden'
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => onApply(candidate)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                      style={surface}
                    >
                      <span className="text-[12px] leading-snug">
                        {fill(s(template), { rule })}
                      </span>
                      <span
                        className="num shrink-0 text-[11px]"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        {fill(s('relaxGain'), {
                          n: `${fmtNum(candidate.gained, lang, 0)} ${countNames(
                            lang,
                            candidate.gained,
                          )}`,
                        })}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={onClear}
            className="mt-3 min-h-11 text-[12px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            style={muted}
          >
            {s('relax')}
          </button>
        </>
      )}
    </div>
  )
}

function Group({
  group,
  s,
  lang,
  open,
  onToggle,
}: Common & { group: AuditGroup; open: string | null; onToggle: (key: string) => void }) {
  const field = s(SHARIA_FIELD_KEY[group.field])
  const heading = fill(s(group.kind === 'failed' ? 'binFailedGroup' : 'binMissingGroup'), {
    field,
    limit: shariaCap(group.limit, lang),
  })
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 pb-1 pt-3">
        <span className="text-[12px] font-medium">{heading}</span>
        <span className="num shrink-0 text-[11px]" style={muted}>
          {fmtNum(group.entries.length, lang, 0)}
        </span>
      </div>
      <ul className="border-t border-line">
        {group.entries.map(({ quote, value }) => {
          const key = `${group.kind}:${group.field}:${quote.symbol}`
          const expanded = open === key
          const note =
            value === null
              ? s('binMissingNote')
              : fill(s('binFailedNote'), {
                  value: shariaPct(value, lang),
                  limit: shariaCap(group.limit, lang),
                })
          return (
            <li key={key} className="border-b border-line">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => onToggle(key)}
                className="flex min-h-11 w-full items-center gap-2 py-1 text-start transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                <span className="min-w-0 truncate text-[13px]">{quote.name[lang]}</span>
                <span className="num shrink-0 text-[11px]" style={muted}>
                  {quote.symbol}
                </span>
                <span aria-hidden="true" className="ms-auto text-[13px]" style={muted}>
                  {expanded ? '−' : '+'}
                </span>
              </button>
              {expanded && (
                <p className="num pb-2 text-[11px] leading-snug" style={muted}>
                  {note}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </li>
  )
}

export function ShariaAudit({ s, lang, buckets }: Common & { buckets: ShariaBuckets }) {
  const [open, setOpen] = useState<string | null>(null)
  const failed = reasonGroups(buckets.nonCompliant, 'failed')
  const missing = reasonGroups(buckets.unclassified, 'missing')
  const excluded = buckets.nonCompliant.length + buckets.unclassified.length
  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key))

  return (
    <section className="mt-8" aria-labelledby="screener-audit">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="screener-audit" className="t-section">
          {s('auditTitle')}
        </h2>
        <span className="num text-[11px]" style={muted}>
          {fmtNum(excluded, lang, 0)}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug" style={muted}>
        {s('auditBody')}
      </p>
      <p className="mt-1 text-[11px] leading-snug" style={muted}>
        {s('binOrder')}
      </p>

      {excluded === 0 && (
        <p className="mt-3 text-[12px]" style={muted}>
          {s('auditEmpty')}
        </p>
      )}

      {buckets.nonCompliant.length > 0 && (
        <div className="mt-4">
          <h3 className="flex items-baseline justify-between gap-3 text-[12px] font-semibold">
            <span>{s('nonCompliantTitle')}</span>
            <span className="num text-[11px]" style={muted}>
              {fmtNum(buckets.nonCompliant.length, lang, 0)}
            </span>
          </h3>
          <ul className="mt-1">
            {failed.map((group) => (
              <Group
                key={`failed:${group.field}`}
                group={group}
                s={s}
                lang={lang}
                open={open}
                onToggle={toggle}
              />
            ))}
          </ul>
        </div>
      )}

      {buckets.unclassified.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-baseline justify-between gap-3 text-[12px] font-semibold">
            <span>{s('unclassifiedTitle')}</span>
            <span className="num text-[11px]" style={muted}>
              {fmtNum(buckets.unclassified.length, lang, 0)}
            </span>
          </h3>
          <p className="mt-1 text-[11px] leading-snug" style={muted}>
            {s('unclassifiedBody')}
          </p>
          <ul className="mt-1">
            {missing.map((group) => (
              <Group
                key={`missing:${group.field}`}
                group={group}
                s={s}
                lang={lang}
                open={open}
                onToggle={toggle}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
