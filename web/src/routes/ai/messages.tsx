import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { fmtClock } from '../../i18n/format'
import type { Lang } from '../../i18n'
import { quotes } from '../../data/mock'
import { Source, Sources, SourcesContent, SourcesTrigger } from '../../vendor/ai-elements/Sources'
import { visibleParas } from './chat'
import type { AssistantMsg } from './chat'
import type { ReactNode } from 'react'
import { ArtifactCard } from './ArtifactCard'
import { StepTimeline } from './timeline'
import { strings } from './strings'

const EVIDENCE_WINDOW = 20

type Evidence = { key: 'vol' | 'above'; title: 'evVol' | 'evAbove'; value: string }

/** Two figures computed from the quote's own spark line, never typed in. */
function evidenceFor(symbol: string | undefined, lang: Lang): Evidence[] {
  const quote = quotes.find((q) => q.symbol === symbol) ?? quotes[0]
  const series = quote.spark.slice(-EVIDENCE_WINDOW)
  if (series.length < 3) return []

  const returns = series.slice(1).map((v, i) => v / series[i] - 1)
  const mean = returns.reduce((a, r) => a + r, 0) / returns.length
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length
  const vol = Math.sqrt(variance) * Math.sqrt(252) * 100

  const average = series.reduce((a, v) => a + v, 0) / series.length
  const vsAverage = series[series.length - 1] / average - 1

  return [
    { key: 'vol', title: 'evVol', value: fmtNum(vol, lang, 1, '%') },
    { key: 'above', title: 'evAbove', value: fmtPct(vsAverage, lang, 1) },
  ]
}

function EvidenceRows({ symbol }: { symbol?: string }) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const rows = evidenceFor(symbol, lang)

  return (
    <div className="border-t border-line divide-y divide-line">
      {rows.map((row) => (
        <div key={row.key} className="flex min-h-11 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
            {row.key === 'vol' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h4l3-7 4 14 3-7h4" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 18L20 6M14 6h6v6" />
              </svg>
            )}
          </span>
          <span className="text-[12px] text-muted">{s(row.title)}</span>
          <span className="num ms-auto text-[13px] font-medium text-fg">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ms-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse motion-reduce:animate-none bg-fg align-baseline"
    />
  )
}

function ActionButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center rounded-full px-2.5 text-[11px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-surface px-4 py-2.5">
        <p
          dir="auto"
          className="text-start text-[14px] leading-relaxed break-words whitespace-pre-wrap"
        >
          {text}
        </p>
      </div>
    </div>
  )
}

export function ErrorRow({
  text,
  onRetry,
  retryLabel,
}: {
  text: string
  onRetry: () => void
  retryLabel: string
}) {
  return (
    <div role="alert" className="panel border-danger/40 p-3">
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-danger)' }}>
        {text}
      </p>
      <ActionButton onClick={onRetry}>{retryLabel}</ActionButton>
    </div>
  )
}

export function AssistantMessage({
  m,
  sourcesLabel,
  onCopy,
  copied,
  copyLabel,
  onRetry,
  retryLabel,
}: {
  m: AssistantMsg
  sourcesLabel: string
  onCopy: () => void
  copied: boolean
  copyLabel: string
  onRetry: () => void
  retryLabel: string
}) {
  const { lang } = useI18n()
  const text = visibleParas(m.paras, m.shown)
  const complete = m.shown >= m.total
  const lastFilled = text.reduce((acc, p, i) => (p.length > 0 ? i : acc), -1)

  return (
    <div className="space-y-3">
      <StepTimeline shown={m.shown} total={m.total} />

      {/* The answer is the focal point: 15px prose on the canvas, no card. */}
      <div className="space-y-3 text-[15px] leading-[1.75] rtl:leading-[1.95]">
        {lastFilled < 0 && !complete && (
          <p>
            <Caret />
          </p>
        )}
        {text.map((p, i) =>
          p.length === 0 ? null : (
            <p key={i} dir="auto" className="break-words whitespace-pre-wrap">
              {p}
              {!complete && i === lastFilled && <Caret />}
            </p>
          ),
        )}
      </div>

      {complete && <EvidenceRows symbol={m.evidenceSymbol} />}

      {complete && m.sources.length > 0 && (
        <Sources defaultOpen className="mb-0">
          <SourcesTrigger count={m.sources.length} className="min-h-11 text-[11px] text-muted">
            {`${sourcesLabel} · ${m.sources.length}`}
          </SourcesTrigger>
          <SourcesContent className="mt-2">
            {m.sources.map((src) => (
              <Source
                key={`${src.label}-${src.href ?? ''}`}
                title={src.label}
                href={src.href ?? '#'}
                className="text-[11px] text-muted"
              >
                {src.label}
              </Source>
            ))}
          </SourcesContent>
        </Sources>
      )}

      {complete && m.artifact && <ArtifactCard artifact={m.artifact} />}

      {complete && (
        <div className="flex flex-wrap items-center gap-1 text-muted">
          <time className="num me-1 text-[10px]" dateTime={new Date(m.at).toISOString()}>
            {fmtClock(m.at, lang)}
          </time>
          <ActionButton onClick={onCopy}>{copyLabel}</ActionButton>
          <ActionButton onClick={onRetry}>{retryLabel}</ActionButton>
          <span className="sr-only" aria-live="polite">
            {copied ? copyLabel : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export function TypingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-muted"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: '820ms' }}
        />
      ))}
    </div>
  )
}
