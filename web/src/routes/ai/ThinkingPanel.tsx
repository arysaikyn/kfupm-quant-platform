import { useI18n, useStrings } from '../../i18n'
import { fmtNum } from '../../i18n'
import type { ChatMessage, LiveTurn } from './remote'
import { toolLabel } from './remote'
import { strings } from './strings'

function StatusDot({ status }: { status: 'running' | 'ok' | 'error' }) {
  if (status === 'running') {
    return (
      <span
        aria-hidden
        className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-fg motion-reduce:animate-none"
      />
    )
  }
  return (
    <span
      aria-hidden
      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
        status === 'ok' ? 'bg-up' : 'bg-down'
      }`}
    />
  )
}

/**
 * The agent's working memory: a stable summary after the run, expandable
 * detail while it works. Reasoning is a rolling tail, never appended.
 */
export function ThinkingPanel({
  live,
  message,
  now,
}: {
  live?: LiveTurn | null
  message?: ChatMessage
  now: number
}) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const tools = live?.tools ?? message?.tools ?? []
  const reasoning = live?.reasoning ?? message?.reasoning ?? ''
  const busy = Boolean(live)
  if (!busy && tools.length === 0 && !reasoning) return null

  const seconds = live
    ? Math.max(0, (now - live.startedAt) / 1000)
    : (message?.elapsedMs ?? 0) / 1000
  const stateLabel = busy
    ? live?.status === 'thinking'
      ? s('thinking')
      : live?.status === 'working'
        ? s('working')
        : s('answering')
    : message?.status === 'failed'
      ? s('failed')
      : message?.status === 'cancelled'
        ? s('cancelled')
        : `${tools.length} ${s('toolsUnit')}`

  return (
    <details open={busy} className="group border-t border-line pt-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[11px] text-muted [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
        <span>{stateLabel}</span>
        {seconds > 0.4 && (
          <>
            <span aria-hidden>·</span>
            <span className="num">{fmtNum(seconds, lang, 1)}s</span>
          </>
        )}
      </summary>

      {reasoning && (
        <div className="mt-2 rounded-lg bg-surface p-2.5">
          <p className="text-[11px] font-medium text-muted">{s('reasoning')}</p>
          <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted">
            {reasoning}
          </pre>
        </div>
      )}

      {tools.length > 0 && (
        <ul className="mt-2 space-y-1">
          {tools.map((tool) => (
            <li key={tool.id} className="rounded-lg border border-line px-2.5 py-2">
              <div className="flex items-center gap-2">
                <StatusDot status={tool.status} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                  {toolLabel(tool.tool)}
                </span>
                {tool.elapsedMs != null && tool.elapsedMs > 0 && (
                  <span className="num shrink-0 text-[10px] text-muted">
                    {fmtNum(tool.elapsedMs / 1000, lang, 1)}s
                  </span>
                )}
              </div>
              {tool.preview && (
                <pre className="mt-1 line-clamp-2 whitespace-pre-wrap break-words font-mono text-[10px] leading-snug text-muted">
                  {tool.preview}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
