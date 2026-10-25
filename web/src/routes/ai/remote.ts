import type { MessageItem, RunPreview } from '../../api/ai'

export type ToolStep = {
  id: string
  tool: string
  status: 'running' | 'ok' | 'error'
  args?: Record<string, unknown>
  preview?: string
  elapsedMs?: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  reasoning?: string
  tools?: ToolStep[]
  status?: 'done' | 'failed' | 'cancelled'
  elapsedMs?: number
  model?: string
  run?: RunPreview
  runId?: string
  error?: string
}

export type LiveTurn = {
  attemptId: string
  text: string
  reasoning: string
  tools: ToolStep[]
  status: 'thinking' | 'working' | 'answering'
  startedAt: number
  model?: string
}

export type CompletedTurn = {
  attemptId: string
  text: string
  reasoning: string
  tools: ToolStep[]
  status: 'done' | 'failed' | 'cancelled'
  elapsedMs?: number
  model?: string
  runId?: string
  error?: string
}

export type EventOutcome = {
  live: LiveTurn | null
  completed: CompletedTurn | null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function startedAt(value: unknown): number {
  const seconds = num(value)
  return seconds && seconds > 0 ? seconds * 1000 : Date.now()
}

function runIdFromDir(value: unknown): string | undefined {
  const dir = str(value)
  if (!dir) return undefined
  const parts = dir.split(/[/\\]/).filter(Boolean)
  return parts[parts.length - 1] || undefined
}

export function liveFromAttempt(data: Record<string, unknown>): LiveTurn {
  return {
    attemptId: str(data.attempt_id),
    text: '',
    reasoning: '',
    tools: [],
    status: 'thinking',
    startedAt: startedAt(data.started_at),
  }
}

/**
 * Pure SSE reducer. Vibe-Trading's event names are the contract; the UI only
 * needs text, reasoning, tool progress and a terminal state.
 */
export function reduceAgentEvent(
  live: LiveTurn | null,
  event: string,
  data: Record<string, unknown>,
): EventOutcome {
  if (event === 'attempt.created' || event === 'attempt.started') {
    const attemptId = str(data.attempt_id)
    if (live && attemptId && live.attemptId === attemptId) {
      return { live: { ...live, startedAt: startedAt(data.started_at) || live.startedAt }, completed: null }
    }
    return { live: liveFromAttempt(data), completed: null }
  }

  if (!live) {
    if (event === 'attempt.completed' || event === 'attempt.failed' || event === 'attempt.cancelled') {
      const failed = event === 'attempt.failed'
      return {
        live: null,
        completed: {
          attemptId: str(data.attempt_id),
          text: str(data.summary),
          reasoning: '',
          tools: [],
          status: failed ? 'failed' : event === 'attempt.cancelled' ? 'cancelled' : 'done',
          elapsedMs: num(data.elapsed_ms),
          model: str(data.model) || str(data.configured_model) || undefined,
          runId: runIdFromDir(data.run_dir),
          error: failed ? str(data.summary) || str(data.error) || undefined : undefined,
        },
      }
    }
    return { live, completed: null }
  }

  switch (event) {
    case 'llm_waiting':
      return { live: { ...live, status: 'thinking' }, completed: null }
    case 'text_delta':
      return {
        live: { ...live, text: live.text + str(data.delta), status: 'answering' },
        completed: null,
      }
    case 'reasoning_delta':
      return { live: { ...live, reasoning: str(data.tail), status: 'thinking' }, completed: null }
    case 'tool_call': {
      const tool = str(data.tool) || 'tool'
      const callId = str(data.call_id) || `${tool}#${live.tools.length + 1}`
      return {
        live: {
          ...live,
          status: 'working',
          tools: [
            ...live.tools,
            {
              id: callId,
              tool,
              status: 'running',
              args: (data.arguments as Record<string, unknown> | undefined) ?? undefined,
            },
          ],
        },
        completed: null,
      }
    }
    case 'tool_result': {
      const tool = str(data.tool) || 'tool'
      const callId = str(data.call_id)
      const index = live.tools.findIndex((step) =>
        callId ? step.id === callId : step.tool === tool && step.status === 'running',
      )
      const next: ToolStep = {
        id: callId || `${tool}#${live.tools.length + 1}`,
        tool,
        status: data.status === 'ok' ? 'ok' : 'error',
        preview: str(data.preview) || undefined,
        elapsedMs: num(data.elapsed_ms),
      }
      const tools = [...live.tools]
      if (index >= 0) tools[index] = { ...tools[index], ...next, id: tools[index].id }
      else tools.push(next)
      return { live: { ...live, status: 'working', tools }, completed: null }
    }
    case 'attempt.completed': {
      const text = str(data.summary) || live.text
      return {
        live: null,
        completed: {
          attemptId: str(data.attempt_id) || live.attemptId,
          text,
          reasoning: live.reasoning,
          tools: live.tools,
          status: 'done',
          elapsedMs: num(data.elapsed_ms),
          model: str(data.model) || str(data.configured_model) || undefined,
          runId: runIdFromDir(data.run_dir),
        },
      }
    }
    case 'attempt.failed': {
      const error = str(data.summary) || str(data.error) || undefined
      return {
        live: null,
        completed: {
          attemptId: str(data.attempt_id) || live.attemptId,
          text: live.text,
          reasoning: live.reasoning,
          tools: live.tools,
          status: 'failed',
          elapsedMs: num(data.elapsed_ms),
          error,
        },
      }
    }
    case 'attempt.cancelled':
      return {
        live: null,
        completed: {
          attemptId: str(data.attempt_id) || live.attemptId,
          text: live.text,
          reasoning: live.reasoning,
          tools: live.tools,
          status: 'cancelled',
          elapsedMs: num(data.elapsed_ms),
        },
      }
    default:
      return { live, completed: null }
  }
}

function toolSteps(value: unknown): ToolStep[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const row = entry as Record<string, unknown>
    const tool = typeof row.tool === 'string' ? row.tool : ''
    if (!tool) return []
    return [{
      id: typeof row.call_id === 'string' ? row.call_id : `${tool}#${index + 1}`,
      tool,
      status: row.status === 'ok' ? 'ok' : row.status === 'running' ? 'running' : 'error',
      preview: typeof row.preview === 'string' ? row.preview : undefined,
      elapsedMs: typeof row.elapsed_ms === 'number' ? row.elapsed_ms : undefined,
      args: row.arguments && typeof row.arguments === 'object'
        ? (row.arguments as Record<string, unknown>)
        : undefined,
    } satisfies ToolStep]
  })
}

/** Persisted server messages become the initial transcript. */
export function messagesFromHistory(items: MessageItem[]): ChatMessage[] {
  return items.flatMap((item) => {
    if (item.role !== 'user' && item.role !== 'assistant') return []
    const at = Date.parse(item.created_at)
    const meta = item.metadata ?? {}
    const rawStatus = typeof meta.status === 'string' ? meta.status : 'completed'
    const status = rawStatus === 'cancelled' ? 'cancelled' : rawStatus === 'failed' ? 'failed' : 'done'
    const text = item.content.replace(/^App context selected by the user:\n(?:- [^\n]*\n)*\n/, '')
    return [
      {
        id: item.message_id,
        role: item.role,
        text,
        at: Number.isFinite(at) ? at : Date.now(),
        status: item.role === 'assistant' ? status : 'done',
        reasoning: undefined,
        tools: item.role === 'assistant' ? toolSteps(item.tool_trail) : undefined,
        elapsedMs: typeof meta.elapsed_ms === 'number' ? meta.elapsed_ms : undefined,
        model: typeof meta.model === 'string' ? meta.model : undefined,
        runId: typeof meta.run_id === 'string' ? meta.run_id : undefined,
      } satisfies ChatMessage,
    ]
  })
}

/** A readable label for a tool id from the agent registry. */
export function toolLabel(tool: string): string {
  return tool.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}
