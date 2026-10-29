import type {
  AgentStreamHandlers,
  AlphaSummary,
  LlmSettings,
  MessageItem,
  PaperAccount,
  PortfolioSnapshot,
  RunListItem,
  RunPreview,
  ScheduledRun,
  SessionItem,
  UploadResult,
} from './ai'

type DemoSession = {
  id: string
  title: string
  created: string
  updated: string
  messages: MessageItem[]
}

const STORE_KEY = 'app.ai.demo.sessions'

function loadSessions(): Map<string, DemoSession> {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw) as DemoSession[]
    return new Map(parsed.map((session) => [session.id, session]))
  } catch {
    return new Map()
  }
}

let sessions = loadSessions()
function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...sessions.values()]))
  } catch {
    // Private browsing: the in-memory demo still works.
  }
}
const listeners = new Map<string, Set<AgentStreamHandlers>>()
const timers = new Map<string, Set<number>>()
const activeAttempts = new Map<string, string>()
const partialText = new Map<string, string>()
const cancelled = new Set<string>()

const now = () => new Date().toISOString()

const ANSWERS = [
  `## Demo answer

This is a **pre-recorded response**. No market data was fetched and no tool ran.

| Check | Demo result |
|---|---|
| Sharia screen | illustrative only |
| Valuation | illustrative only |
| Backtest | not run |

Connect an API in **API settings** to replace this with a real model and real tools.`,

  `## What this screen is showing

The app is in **demo mode**. The text and workspace samples are pre-recorded so the interface can be tested without a developer API key.

- Nothing is sent to an LLM.
- No backtest runs.
- No position or price is read.

Add your own base API URL and key in **API settings** to switch to live mode.`,

  `## Demo walkthrough

A real answer would load the quote, run the Sharia filter, rank the universe and cite every number.

Demo mode returns this fixed text instead. The surrounding session, streaming and Stop behaviour are real UI; the content is not.`,
]

function answerFor(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes('backtest') || lower.includes('回测') || lower.includes('sharpe')) {
    return `## Demo backtest

**No backtest ran.** This is a pre-recorded sample.

| Metric | Demo value |
|---|---|
| Total return | 12.30% |
| Sharpe | 1.20 |
| Max drawdown | -8.00% |

Connect a provider to execute the strategy against real history.`
  }
  let hash = 0
  for (const char of prompt) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return ANSWERS[hash % ANSWERS.length]
}

function sessionItem(session: DemoSession): SessionItem {
  return {
    session_id: session.id,
    title: session.title,
    status: 'active',
    created_at: session.created,
    updated_at: session.updated,
    last_attempt_id: null,
  }
}

function emit(sessionId: string, type: string, data: Record<string, unknown>, id: string) {
  const event = new MessageEvent(type, {
    data: JSON.stringify(data),
    lastEventId: id,
  })
  for (const handler of listeners.get(sessionId) ?? []) handler.onEvent(type, event)
}

function schedule(sessionId: string, attemptId: string, fn: () => void, delay: number) {
  const timer = window.setTimeout(() => {
    const set = timers.get(sessionId)
    set?.delete(timer)
    if (!cancelled.has(attemptId)) fn()
  }, delay)
  const set = timers.get(sessionId) ?? new Set<number>()
  set.add(timer)
  timers.set(sessionId, set)
}

function createSession(title: string): SessionItem {
  const id = `demo-${crypto.randomUUID()}`
  const created = now()
  const session: DemoSession = {
    id,
    title: title.trim().slice(0, 60) || 'Demo session',
    created,
    updated: created,
    messages: [],
  }
  sessions.set(id, session)
  persist()
  return sessionItem(session)
}

function pushUser(sessionId: string, content: string) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.updated = now()
  session.messages.push({
    message_id: `demo-message-${crypto.randomUUID()}`,
    session_id: sessionId,
    role: 'user',
    content,
    created_at: session.updated,
    linked_attempt_id: null,
    metadata: null,
    tool_trail: null,
  })
  persist()
}

function pushAssistant(sessionId: string, attemptId: string, text: string, elapsedMs: number) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.updated = now()
  session.messages.push({
    message_id: `demo-message-${crypto.randomUUID()}`,
    session_id: sessionId,
    role: 'assistant',
    content: text,
    created_at: session.updated,
    linked_attempt_id: attemptId,
    metadata: {
      status: 'completed',
      elapsed_ms: elapsedMs,
      model: 'demo-agent',
    },
    tool_trail: [],
  })
  persist()
}

function runDemoTurn(sessionId: string, content: string): string {
  const attemptId = `demo-attempt-${crypto.randomUUID()}`
  activeAttempts.set(sessionId, attemptId)
  partialText.set(sessionId, '')
  const answer = answerFor(content)
  const started = Date.now()
  emit(sessionId, 'attempt.started', { attempt_id: attemptId, started_at: started / 1000 }, `${attemptId}-0`)
  const chunks = answer.match(/[\s\S]{1,28}/g) ?? [answer]
  chunks.forEach((delta, index) => {
    schedule(sessionId, attemptId, () => {
      partialText.set(sessionId, (partialText.get(sessionId) ?? '') + delta)
      emit(sessionId, 'text_delta', { attempt_id: attemptId, delta }, `${attemptId}-t${index}`)
    }, 260 + index * 38)
  })

  schedule(sessionId, attemptId, () => {
    const elapsed = Date.now() - started
    partialText.delete(sessionId)
    pushAssistant(sessionId, attemptId, answer, elapsed)
    emit(
      sessionId,
      'attempt.completed',
      {
        attempt_id: attemptId,
        status: 'completed',
        summary: answer,
        elapsed_ms: elapsed,
        model: 'demo-agent',
      },
      `${attemptId}-done`,
    )
    emit(sessionId, 'done', {}, `${attemptId}-end`)
  }, 300 + chunks.length * 38)
  return attemptId
}

export const demoAi = {
  health: async () => ({ ok: true, upstream: 'demo', demo: true }),

  listSessions: async () =>
    [...sessions.values()]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .map(sessionItem),

  createSession: async (title: string) => createSession(title),

  renameSession: async (id: string, title: string) => {
    const session = sessions.get(id)
    if (session) {
      session.title = title
      session.updated = now()
      persist()
    }
    return { status: 'ok' }
  },

  deleteSession: async (id: string) => {
    sessions.delete(id)
    listeners.delete(id)
    persist()
    return { status: 'ok' }
  },

  messages: async (id: string) => sessions.get(id)?.messages ?? [],

  sendMessage: async (id: string, content: string) => {
    pushUser(id, content)
    const attemptId = runDemoTurn(id, content)
    return { message_id: `demo-message-${crypto.randomUUID()}`, attempt_id: attemptId }
  },

  cancel: async (id: string) => {
    const attemptId = activeAttempts.get(id) ?? 'demo-attempt'
    cancelled.add(attemptId)
    for (const timer of timers.get(id) ?? []) window.clearTimeout(timer)
    timers.delete(id)
    activeAttempts.delete(id)
    const partial = partialText.get(id) ?? ''
    partialText.delete(id)
    const session = sessions.get(id)
    if (session) {
      session.updated = now()
      session.messages.push({
        message_id: `demo-message-${crypto.randomUUID()}`,
        session_id: id,
        role: 'assistant',
        content: partial,
        created_at: session.updated,
        linked_attempt_id: attemptId,
        metadata: { status: 'cancelled', model: 'demo-agent' },
        tool_trail: [],
      })
      persist()
    }
    emit(id, 'attempt.cancelled', { attempt_id: attemptId, status: 'cancelled' }, `${attemptId}-cancel`)
    emit(id, 'done', {}, `${attemptId}-cancel-done`)
    return { status: 'cancelled' }
  },

  autoTitle: async (id: string) => {
    const session = sessions.get(id)
    const first = session?.messages.find((message) => message.role === 'user')
    if (session && first) {
      session.title = first.content.slice(0, 60)
      session.updated = now()
      persist()
    }
    return { status: 'ok', title: session?.title }
  },

  runPreview: async (): Promise<RunPreview> => ({
    metrics: null,
    equity_curve: [],
    report_worthy: false,
  }),

  runs: async (): Promise<RunListItem[]> => [
    {
      run_id: 'demo-run-1',
      status: 'success',
      created_at: now(),
      prompt: 'Demo: Sharia screen and value rank',
      total_return: 0.123,
      sharpe: 1.2,
      codes: ['2222'],
    },
    {
      run_id: 'demo-run-2',
      status: 'completed',
      created_at: now(),
      prompt: 'Demo: compare two Saudi banks',
      total_return: 0.041,
      sharpe: 0.7,
      codes: ['1120', '2010'],
    },
  ],

  paperAccounts: async (): Promise<PaperAccount[]> => [
    {
      id: 'demo-paper-1',
      label: 'Demo paper account',
      market: 'sa',
      currency: 'SAR',
      start_on: '2026-01-02',
      last_date: '2026-10-23',
      revision: 1,
      account_state: { cash: 100000, positions: [], unreadable: 0 },
    },
  ],

  portfolio: async (): Promise<{ status: string; snapshot: PortfolioSnapshot | null }> => ({
    status: 'ok',
    snapshot: {
      snapshot_id: 'demo-snapshot',
      created_at: now(),
      complete: true,
      display_currency: 'USD',
      totals: { usd: 100000, cny: 720000 },
      positions: [],
      warnings: [],
    },
  }),

  alphas: async (limit = 60): Promise<{ alphas: AlphaSummary[]; total: number }> => {
    const alphas: AlphaSummary[] = [
      { id: 'demo-value', nickname: 'Demo value', zoo: 'demo', theme: ['value'], universe: ['sa'] },
      { id: 'demo-momentum', nickname: 'Demo momentum', zoo: 'demo', theme: ['momentum'], universe: ['sa'] },
    ]
    return { alphas: alphas.slice(0, limit), total: alphas.length }
  },

  scheduled: async (): Promise<ScheduledRun[]> => [
    {
      id: 'demo-schedule',
      title: 'Demo weekly review',
      prompt: 'Review the demo watchlist',
      schedule: '0 9 * * 1',
      status: 'active',
      next_run_at: Date.now() + 86_400_000,
      last_error: null,
    },
  ],

  llm: async (): Promise<LlmSettings> => ({
    provider: 'demo',
    model_name: 'demo-agent',
    base_url: '',
    api_key_configured: false,
    api_key_required: false,
  }),

  upload: async (file: File): Promise<UploadResult> => ({
    status: 'ok',
    file_path: `/demo/${file.name}`,
    filename: file.name,
  }),

  subscribeSession(sessionId: string, handlers: AgentStreamHandlers): () => void {
    const set = listeners.get(sessionId) ?? new Set<AgentStreamHandlers>()
    set.add(handlers)
    listeners.set(sessionId, set)
    queueMicrotask(() => {
      if (set.has(handlers)) handlers.onOpen()
    })
    return () => {
      set.delete(handlers)
      if (set.size === 0) listeners.delete(sessionId)
    }
  },
}
