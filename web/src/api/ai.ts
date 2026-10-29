import { isDemoMode } from '../lib/aiMode'
import type { PaperPosition } from '../lib/positions'
import { demoAi } from './demoAi'
import { AiApiError } from './errors'
import {
  parseAlphaList,
  parseHealth,
  parseLlmSettings,
  parseMessageList,
  parsePaperAccounts,
  parsePortfolio,
  parseRunList,
  parseRunPreview,
  parseScheduledRuns,
  parseSession,
  parseSessionList,
  parseStatus,
  parseUploadResult,
} from './parse'

export { AiApiError } from './errors'

/** Events the Vibe agent stream can emit. */
export const AGENT_EVENTS = [
  'attempt.created',
  'attempt.started',
  'attempt.completed',
  'attempt.failed',
  'attempt.cancelled',
  'text_delta',
  'reasoning_delta',
  'tool_call',
  'tool_result',
  'llm_waiting',
  'grounding_status',
  'done',
  'heartbeat',
] as const

export type AgentStreamHandlers = {
  onEvent: (type: string, event: MessageEvent) => void
  onOpen: () => void
  onError: () => void
}

export type ProviderConfig = {
  baseUrl: string
  model: string
  apiKey?: string
}

/** Thin client for the local backend. The browser never sees the upstream key. */

export type SessionItem = {
  session_id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  last_attempt_id: string | null
}

export type MessageItem = {
  message_id: string
  session_id: string
  /** Narrow on purpose: the parser drops a role this build cannot render. */
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  linked_attempt_id: string | null
  metadata: Record<string, unknown> | null
  tool_trail: unknown[] | null
}

export type EquityPoint = { date?: string; time?: string; equity: number | string }

export type RunPreview = {
  metrics: Record<string, number> | null
  equity_curve: EquityPoint[]
  report_worthy: boolean
}

export type RunListItem = {
  run_id: string
  status: string
  created_at: string
  prompt?: string
  total_return?: number
  sharpe?: number
  codes?: string[]
}

export type PaperAccount = {
  id: string
  label: string
  market: string
  currency: string
  start_on: string
  last_date: string | null
  revision: number
  account_state: {
    cash: number
    positions: PaperPosition[]
    /** Positions the backend published that could not be named. */
    unreadable: number
  }
}

export type PortfolioSnapshot = {
  snapshot_id: string
  created_at: string
  complete: boolean
  display_currency?: string
  totals: { usd: number; cny: number; display?: number }
  positions: PaperPosition[]
  warnings: string[]
}

export type AlphaSummary = {
  id: string
  zoo: string
  theme: string[]
  universe: string[]
  nickname?: string
}

export type ScheduledRun = {
  id: string
  title: string
  prompt: string
  schedule: string
  status: string
  next_run_at: number
  last_error: string | null
}

export type LlmSettings = {
  provider: string
  model_name: string
  base_url: string
  api_key_configured: boolean
  api_key_required: boolean
}

export type UploadResult = { status: string; file_path: string; filename: string }

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

async function request<T>(
  path: string,
  parse: (raw: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 120_000)
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!response.ok) {
      let detail = response.statusText
      try {
        const body = (await response.json()) as { detail?: unknown }
        if (typeof body.detail === 'string') detail = body.detail
      } catch {
        // Non-JSON error body: keep the status text.
      }
      throw new AiApiError(detail, response.status)
    }
    const raw: unknown = await response.json()
    return parse(raw)
  } catch (error) {
    if (error instanceof AiApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiApiError('The agent took too long to respond.', 0)
    }
    // Name the cause: a body this build cannot read is a shape change, not an
    // outage, and telling the two apart is the difference between a useful
    // retry and a wasted one.
    if (error instanceof SyntaxError) {
      throw new AiApiError('The agent returned a response this app cannot read.', 0)
    }
    if (error instanceof TypeError) {
      throw new AiApiError('The local AI backend is not reachable.', 0)
    }
    console.warn('ai transport failure', error)
    throw new AiApiError('The agent request failed.', 0)
  } finally {
    window.clearTimeout(timer)
  }
}

/** The message envelope a send returns; the stream follows on its own channel. */
const parseSendAck = (raw: unknown): { message_id: string; attempt_id: string } => {
  if (!raw || typeof raw !== 'object') throw new AiApiError('The agent returned an unreadable response (send).', 0)
  const record = raw as Record<string, unknown>
  return {
    message_id: typeof record.message_id === 'string' ? record.message_id : '',
    attempt_id: typeof record.attempt_id === 'string' ? record.attempt_id : '',
  }
}

const parseTitleAck = (raw: unknown): { status: string; title?: string } => {
  if (!raw || typeof raw !== 'object') throw new AiApiError('The agent returned an unreadable response (title).', 0)
  const record = raw as Record<string, unknown>
  return {
    status: typeof record.status === 'string' ? record.status : 'ok',
    ...(typeof record.title === 'string' ? { title: record.title } : {}),
  }
}

const liveApi = {
  health: () => request('/api/ai/health', parseHealth),
  listSessions: () => request('/api/ai/sessions', parseSessionList),
  createSession: (title: string) =>
    request('/api/ai/sessions', parseSession, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  renameSession: (id: string, title: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}`, parseStatus, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),
  deleteSession: (id: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}`, parseStatus, {
      method: 'DELETE',
    }),
  messages: (id: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}/messages?limit=200`, parseMessageList),
  sendMessage: (id: string, content: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}/messages`, parseSendAck, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  cancel: (id: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}/cancel`, parseStatus, {
      method: 'POST',
    }),
  autoTitle: (id: string) =>
    request(`/api/ai/sessions/${encodeURIComponent(id)}/title/auto`, parseTitleAck, {
      method: 'POST',
    }),
  runPreview: (runId: string) => request(`/api/ai/runs/${encodeURIComponent(runId)}/preview`, parseRunPreview),
  runs: () => request('/api/ai/runs', parseRunList),
  paperAccounts: () => request('/api/ai/api/paper-accounts', parsePaperAccounts),
  portfolio: () => request('/api/ai/api/portfolio', parsePortfolio),
  alphas: (limit = 60) => request(`/api/ai/alpha/list?limit=${limit}`, parseAlphaList),
  scheduled: () => request('/api/ai/scheduled-runs', parseScheduledRuns),
  llm: () => request('/api/ai/settings/llm', parseLlmSettings),
  upload: async (file: File): Promise<UploadResult> => {
    const form = new FormData()
    form.append('file', file)
    const response = await fetch(`${BASE}/api/ai/upload`, { method: 'POST', body: form })
    if (!response.ok) {
      let detail = response.statusText
      try {
        const body = (await response.json()) as { detail?: unknown }
        if (typeof body.detail === 'string') detail = body.detail
      } catch {
        // Keep the status text.
      }
      throw new AiApiError(detail, response.status)
    }
    return parseUploadResult(await response.json())
  },
  configureProvider: (config: ProviderConfig) =>
    request('/api/ai/settings/llm', parseLlmSettings, {
      method: 'PUT',
      body: JSON.stringify({
        provider: 'openai',
        model_name: config.model,
        base_url: config.baseUrl,
        api_key: config.apiKey || undefined,
        temperature: 0,
        timeout_seconds: 120,
        max_retries: 2,
      }),
    }),
}

export function eventsUrl(sessionId: string): string {
  return `${BASE}/api/ai/sessions/${encodeURIComponent(sessionId)}/events?replay=active`
}

function subscribeLiveSession(
  sessionId: string,
  handlers: AgentStreamHandlers,
): () => void {
  const source = new EventSource(eventsUrl(sessionId))
  for (const type of AGENT_EVENTS) {
    source.addEventListener(type, (event) => {
      handlers.onEvent(type, event as MessageEvent)
    })
  }
  source.onopen = () => handlers.onOpen()
  source.onerror = () => handlers.onError()
  return () => source.close()
}

const transport = () => (isDemoMode() ? demoAi : liveApi)

/**
 * One transport for both modes. Demo methods are local and never touch the
 * backend, so a developer key in the environment cannot be consumed by default.
 */
export const aiApi = {
  /** Resolved per call so switching mode mid-session needs no re-wiring. */
  health: () => transport().health(),
  listSessions: () => transport().listSessions(),
  createSession: (title: string) => transport().createSession(title),
  renameSession: (id: string, title: string) => transport().renameSession(id, title),
  deleteSession: (id: string) => transport().deleteSession(id),
  messages: (id: string) => transport().messages(id),
  sendMessage: (id: string, content: string) => transport().sendMessage(id, content),
  cancel: (id: string) => transport().cancel(id),
  autoTitle: (id: string) => transport().autoTitle(id),
  runPreview: (runId: string) => transport().runPreview(runId),
  runs: () => transport().runs(),
  paperAccounts: () => transport().paperAccounts(),
  portfolio: () => transport().portfolio(),
  alphas: (limit = 60) => transport().alphas(limit),
  scheduled: () => transport().scheduled(),
  llm: () => transport().llm(),
  upload: (file: File) => transport().upload(file),
  // The live stream has a different shape (SSE polling), so it keeps its own arm.
  subscribeSession: (id: string, handlers: AgentStreamHandlers) =>
    isDemoMode()
      ? demoAi.subscribeSession(id, handlers)
      : subscribeLiveSession(id, handlers),
  configureProvider: (config: ProviderConfig) => liveApi.configureProvider(config),
}

