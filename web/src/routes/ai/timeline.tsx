import { fmtNum, useI18n, useStrings } from '../../i18n'
import { strings } from './strings'

/** One token per tick, so the summary duration matches the stream exactly. */
export const STREAM_MS = 18

/* Completion points as a share of the streamed tokens: they advance in order. */
const STEPS = [
  { key: 'stepUnderstand', at: 0.12 },
  { key: 'stepRead', at: 0.55 },
  { key: 'stepConclude', at: 0.9 },
] as const

export function StepTimeline({ shown, total }: { shown: number; total: number }) {
  const { lang } = useI18n()
  const s = useStrings(strings)

  if (total > 0 && shown >= total) {
    return (
      <p role="status" className="text-[11px] leading-[1.4] text-muted">
        {STEPS.length} {s('stepsUnit')} · {fmtNum((total * STREAM_MS) / 1000, lang, 1)}
        {s('secUnit')}
      </p>
    )
  }

  const progress = total > 0 ? Math.min(1, shown / total) : 0

  return (
    <ol className="divide-y divide-line">
      {STEPS.map((step) => {
        const done = progress >= step.at
        return (
          <li key={step.key} className="flex items-center gap-2 py-1.5 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${
                done ? 'bg-accent' : 'bg-muted'
              }`}
            />
            <span
              className={`text-[11px] leading-[1.4] transition-colors duration-200 ${
                done ? 'text-fg' : 'text-muted'
              }`}
            >
              {s(step.key)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
