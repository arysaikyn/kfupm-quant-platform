import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes } from '../../data/mock'
import { Source, Sources, SourcesContent, SourcesTrigger } from '../../vendor/ai-elements/Sources'
import { visibleParas } from './chat'
import type { AssistantMsg } from './chat'
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
    <div className="mt-3 space-y-1">
      {rows.map((row) => (
        <div key={row.key} className="flex min-h-6 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted">
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
          <span className="text-[11px] text-muted">{s(row.title)}</span>
          <span className="num ms-auto text-[11px] font-medium text-fg">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ms-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-fg align-baseline"
    />
  )
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl border px-4 py-2.5"
        style={{
          background: 'rgba(168,85,247,.18)',
          borderColor: 'rgba(168,85,247,.32)',
        }}
      >
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

export function AssistantMessage({
  m,
  sourcesLabel,
  evidenceSymbol,
}: {
  m: AssistantMsg
  sourcesLabel: string
  evidenceSymbol?: string
}) {
  const text = visibleParas(m.paras, m.shown)
  const complete = m.shown >= m.total
  const lastFilled = text.reduce((acc, p, i) => (p.length > 0 ? i : acc), -1)

  return (
    <div>
      <StepTimeline shown={m.shown} total={m.total} />

      <div className="space-y-2 text-[14px] leading-relaxed">
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

      {complete && <EvidenceRows symbol={evidenceSymbol} />}

      {complete && m.sources.length > 0 && (
        <Sources defaultOpen className="mt-3 mb-0">
          <SourcesTrigger count={m.sources.length} className="text-[11px] text-muted">
            {`${sourcesLabel} · ${m.sources.length}`}
          </SourcesTrigger>
          <SourcesContent className="mt-2">
            {m.sources.map((src) => (
              <Source key={src} title={src} href="#" className="text-[11px] text-muted">
                {src}
              </Source>
            ))}
          </SourcesContent>
        </Sources>
      )}

      {complete && m.artifactTitle && <ArtifactCard title={m.artifactTitle} />}
    </div>
  )
}

export function TypingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: '820ms' }}
        />
      ))}
    </div>
  )
}
