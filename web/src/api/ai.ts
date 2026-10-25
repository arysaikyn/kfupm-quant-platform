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
  role: 'user' | 'assistant' | 'system' | string
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
  account_state: { cash: number; positions: unknown[] }
}

export type PortfolioSnapshot = {
  snapshot_id: string
  created_at: string
  complete: boolean
  display_currency?: string
  totals: { usd: number; cny: number; display?: number }
  positions: unknown[]
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

export class AiApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AiApiError'
    this.status = status
  }
}

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof AiApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiApiError('The agent took too long to respond.', 0)
    }
    throw new AiApiError('The local AI backend is not reachable.', 0)
  } finally {
    window.clearTimeout(timer)
  }
}

export const aiApi = {
  health: () => request<{ ok: boolean; upstream: string }>('/api/ai/health'),
  listSessions: () => request<SessionItem[]>('/api/ai/sessions'),
  createSession: (title: string) =>
    request<SessionItem>('/api/ai/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  renameSession: (id: string, title: string) =>
    request<{ status: string }>(`/api/ai/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),
  deleteSession: (id: string) =>
    request<{ status: string }>(`/api/ai/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  messages: (id: string) =>
    request<MessageItem[]>(`/api/ai/sessions/${encodeURIComponent(id)}/messages?limit=200`),
  sendMessage: (id: string, content: string) =>
    request<{ message_id: string; attempt_id: string }>(
      `/api/ai/sessions/${encodeURIComponent(id)}/messages`,
      { method: 'POST', body: JSON.stringify({ content }) },
    ),
  cancel: (id: string) =>
    request<{ status: string }>(`/api/ai/sessions/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),
  autoTitle: (id: string) =>
    request<{ status: string; title?: string }>(
      `/api/ai/sessions/${encodeURIComponent(id)}/title/auto`,
      { method: 'POST' },
    ),
  runPreview: (runId: string) =>
    request<RunPreview>(`/api/ai/runs/${encodeURIComponent(runId)}/preview`),
  runs: () => request<RunListItem[]>('/api/ai/runs'),
  paperAccounts: () => request<PaperAccount[]>('/api/ai/api/paper-accounts'),
  portfolio: () => request<{ status: string; snapshot: PortfolioSnapshot | null }>('/api/ai/api/portfolio'),
  alphas: (limit = 60) => request<{ alphas: AlphaSummary[]; total: number }>(`/api/ai/alpha/list?limit=${limit}`),
  scheduled: () => request<ScheduledRun[]>('/api/ai/scheduled-runs'),
  llm: () => request<LlmSettings>('/api/ai/settings/llm'),
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
    return (await response.json()) as UploadResult
  },
}

export function eventsUrl(sessionId: string): string {
  return `${BASE}/api/ai/sessions/${encodeURIComponent(sessionId)}/events?replay=active`
}
