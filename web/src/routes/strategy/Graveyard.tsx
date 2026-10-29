import { useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { fill, fmtDate } from '../../i18n/format'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol } from '../../data/mock'
import { postMortem, retired, reviveDiff } from './graveyardData'
import { measureText } from './labels'
import { featureStrings } from './strings'

/**
 * Where dead strategies sit. The post-mortem is recomputed from the demo tape
 * on every visit, so a name that fails the broken rule today is named with its
 * figure. Reviving shows the rule diff first — a restore without one is how a
 * graveyard quietly becomes a zombie list.
 */
export default function GraveyardPage() {
  const { lang } = useI18n()
  const s = useStrings(featureStrings)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Screen title={s('graveTitle')} leading={<BackButton fallback="/strategy" />}>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('graveLead')}
      </p>
      <p className="mt-1 text-2xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {s('graveDemoNote')}{' '}
        {fill(s('graveListCount'), { n: fmtNum(retired.length, lang, 0) })}
      </p>

      <ul className="mt-4 border-t border-line">
        {retired.map((entry) => {
          const pm = postMortem(entry)
          const rule = entry.rules[pm.ruleIndex]
          const diff = reviveDiff(entry)
          const expanded = open === entry.id
          return (
            <li key={entry.id} className="border-b border-line py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg leading-snug font-semibold">{entry.name[lang]}</h2>
                  <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--color-muted)' }}>
                    {entry.description[lang]}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <span
                    dir="ltr"
                    className={`num block text-xl leading-none ${entry.lastReturn < 0 ? 'text-down' : 'text-up'}`}
                  >
                    {fmtPct(entry.lastReturn, lang, 1)}
                  </span>
                  <span className="mt-1 block text-2xs leading-none" style={{ color: 'var(--color-muted)' }}>
                    {s('graveLastReturn')}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-2xs" style={{ color: 'var(--color-muted)' }}>
                {fill(s('graveRetiredOn'), { date: fmtDate(entry.retiredOn, lang) })}
                {' · '}
                {fill(s('graveBrokeOn'), { date: fmtDate(entry.brokeOn, lang) })}
              </p>

              <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
                <p className="text-xs leading-snug font-medium">
                  {fill(s('graveBrokeRule'), {
                    n: String(pm.ruleIndex + 1),
                    rule: rule?.label[lang] ?? pm.ruleId,
                  })}
                </p>
                <p className="mt-1 text-2xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {pm.failing.length > 0 && pm.worst
                    ? fill(s('graveNames'), {
                        n: fmtNum(pm.failing.length, lang, 0),
                        total: fmtNum(pm.total, lang, 0),
                        symbol: quoteBySymbol[pm.worst.symbol]?.name[lang] ?? pm.worst.symbol,
                        value: measureText(pm.worst.measure, lang),
                      })
                    : pm.measurable
                      ? s('graveHealed')
                      : s('graveNoMeasure')}
                </p>
                {pm.failing.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {pm.failing.map((item) => (
                      <li
                        key={item.symbol}
                        className="rounded-md px-1.5 py-0.5 text-2xs leading-none"
                        style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}
                      >
                        <span dir="ltr" className="num">
                          {item.symbol}
                        </span>{' '}
                        {measureText(item.measure, lang)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-2xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {entry.note[lang]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(expanded ? null : entry.id)}
                aria-expanded={expanded}
                className="mt-3 flex min-h-11 items-center rounded-full border border-line px-4 text-xs transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {expanded ? s('graveCancel') : s('graveRevive')}
              </button>

              {expanded && (
                <div className="mt-2 border-t border-line pt-3">
                  <p className="text-xs font-medium">{s('graveDiffTitle')}</p>
                  <p className="mt-0.5 text-2xs" style={{ color: 'var(--color-muted)' }}>
                    {s('graveDiffHint')}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {diff.map((row) => (
                      <li key={`${row.kind}-${row.id}`} className="text-2xs leading-snug">
                        <span
                          className="me-1.5 rounded px-1 py-0.5 text-2xs leading-none"
                          style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
                        >
                          {row.kind === 'changed'
                            ? s('graveChipChanged')
                            : row.kind === 'added'
                              ? s('graveChipAdded')
                              : s('graveChipRemoved')}
                        </span>
                        {row.kind === 'changed'
                          ? fill(s('graveDiffChanged'), {
                              rule: row.label[lang],
                              from: row.from ?? '',
                              to: row.to ?? '',
                            })
                          : row.kind === 'added'
                            ? fill(s('graveDiffAdded'), { rule: row.label[lang], to: row.to ?? '' })
                            : fill(s('graveDiffRemoved'), { rule: row.label[lang] })}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled
                    className="mt-3 min-h-11 w-full rounded-xl border border-line px-4 text-sm font-medium"
                  >
                    {s('graveConfirm')}
                  </button>
                  <p className="mt-1.5 text-center text-2xs" style={{ color: 'var(--color-muted)' }}>
                    {s('graveConfirmNote')}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}
