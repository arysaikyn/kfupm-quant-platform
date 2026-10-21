import { visibleParas } from './chat'
import type { AssistantMsg } from './chat'
import { ArtifactCard } from './ArtifactCard'

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
          background: 'rgba(79,140,255,.16)',
          borderColor: 'rgba(79,140,255,.28)',
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

export function AssistantMessage({ m }: { m: AssistantMsg }) {
  const text = visibleParas(m.paras, m.shown)
  const complete = m.shown >= m.total
  const lastFilled = text.reduce((acc, p, i) => (p.length > 0 ? i : acc), -1)

  return (
    <div>
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

      {complete && m.sources.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {m.sources.map((src) => (
            <span
              key={src}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              {src}
            </span>
          ))}
        </div>
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
