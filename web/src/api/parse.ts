import type {
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
import { parsePositions } from '../lib/positions'
import { AiApiError } from './errors'

/**
 * The HTTP boundary.
 *
 * `request` used to end in `(await response.json()) as T`, which made every
 * response shape a compile-time lie: a 200 carrying the wrong object reached the
 * render and threw there, past the point where the screen could say what went
 * wrong. Every parser here either returns the declared type or throws
 * `AiApiError`, so a shape change fails at the call, not inside a component.
 *
 * The rule for each field: a missing optional value becomes its empty form
 * (`[]`, `null`, `0`), a missing required value throws, and a number that is not
 * finite never reaches the DOM.
 */

const unexpected = (what: string) =>
  new AiApiError(`The agent returned an unreadable response (${what}).`, 0)

function asRecord(raw: unknown, what: string): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw unexpected(what)
  return raw as Record<string, unknown>
}

function asArray(raw: unknown, what: string): unknown[] {
  if (!Array.isArray(raw)) throw unexpected(what)
  return raw
}

function needString(raw: unknown, what: string): string {
  if (typeof raw !== 'string') throw unexpected(what)
  return raw
}

function optionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined
}

function stringOrNull(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null
}

function finiteNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  // The agent writes equity as a number or a formatted string; both are accepted.
  if (typeof raw === 'string') {
    const parsed = Number(raw.replace(/[,\s%]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function stringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []
}

export function parseSession(raw: unknown): SessionItem {
  const record = asRecord(raw, 'session')
  return {
    session_id: needString(record.session_id, 'session id'),
    title: typeof record.title === 'string' ? record.title : '',
    status: typeof record.status === 'string' ? record.status : 'unknown',
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : '',
    last_attempt_id: stringOrNull(record.last_attempt_id),
  }
}

/** A list endpoint may wrap its rows; both a bare array and `{items}` are accepted. */
function rowsOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const record = asRecord(raw, 'list')
  for (const key of ['items', 'sessions', 'messages', 'data', 'runs']) {
    if (Array.isArray(record[key])) return record[key] as unknown[]
  }
  throw unexpected('list rows')
}

export function parseSessionList(raw: unknown): SessionItem[] {
  return asArray(rowsOf(raw), 'sessions').map(parseSession)
}

const ROLES: ReadonlySet<string> = new Set(['user', 'assistant', 'system'])

export function parseMessage(raw: unknown): MessageItem | null {
  const record = asRecord(raw, 'message')
  const role = record.role
  // A role this build does not know is dropped, not guessed: rendering it as a
  // user turn would put words in the user's mouth.
  if (typeof role !== 'string' || !ROLES.has(role)) return null
  return {
    message_id: needString(record.message_id, 'message id'),
    session_id: typeof record.session_id === 'string' ? record.session_id : '',
    role: role as MessageItem['role'],
    content: typeof record.content === 'string' ? record.content : '',
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
    linked_attempt_id: stringOrNull(record.linked_attempt_id),
    metadata:
      record.metadata && typeof record.metadata === 'object'
        ? (record.metadata as Record<string, unknown>)
        : null,
    tool_trail: Array.isArray(record.tool_trail) ? record.tool_trail : null,
  }
}

export function parseMessageList(raw: unknown): MessageItem[] {
  return asArray(rowsOf(raw), 'messages')
    .map(parseMessage)
    .filter((message): message is MessageItem => message !== null)
}

export function parseRunPreview(raw: unknown): RunPreview {
  const record = asRecord(raw, 'run preview')
  const metrics = asRecord(record.metrics ?? {}, 'run metrics')
  const finite: Record<string, number> = {}
  for (const [key, value] of Object.entries(metrics)) {
    const parsed = finiteNumber(value)
    if (parsed !== null) finite[key] = parsed
  }
  const curve = Array.isArray(record.equity_curve) ? record.equity_curve : []
  return {
    metrics: Object.keys(finite).length > 0 ? finite : null,
    equity_curve: curve.flatMap((point) => {
      if (!point || typeof point !== 'object') return []
      const entry = point as Record<string, unknown>
      const equity = finiteNumber(entry.equity)
      if (equity === null) return []
      return [
        {
          equity,
          ...(typeof entry.date === 'string' ? { date: entry.date } : {}),
          ...(typeof entry.time === 'string' ? { time: entry.time } : {}),
        },
      ]
    }),
    report_worthy: record.report_worthy === true,
  }
}

export function parseRunList(raw: unknown): RunListItem[] {
  return asArray(rowsOf(raw), 'runs').flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.run_id !== 'string') return []
    return [
      {
        run_id: record.run_id,
        status: typeof record.status === 'string' ? record.status : 'unknown',
        created_at: typeof record.created_at === 'string' ? record.created_at : '',
        prompt: optionalString(record.prompt),
        total_return: finiteNumber(record.total_return) ?? undefined,
        sharpe: finiteNumber(record.sharpe) ?? undefined,
        codes: stringList(record.codes),
      },
    ]
  })
}

export function parsePaperAccount(raw: unknown): PaperAccount {
  const record = asRecord(raw, 'paper account')
  const state = asRecord(record.account_state ?? {}, 'account state')
  const read = parsePositions(state.positions)
  return {
    id: needString(record.id, 'account id'),
    label: typeof record.label === 'string' ? record.label : '',
    market: typeof record.market === 'string' ? record.market : '',
    currency: typeof record.currency === 'string' ? record.currency : '',
    start_on: typeof record.start_on === 'string' ? record.start_on : '',
    last_date: stringOrNull(record.last_date),
    revision: finiteNumber(record.revision) ?? 0,
    account_state: {
      cash: finiteNumber(state.cash) ?? 0,
      positions: read.positions,
      unreadable: read.unreadable,
    },
  }
}

export function parsePaperAccounts(raw: unknown): PaperAccount[] {
  return asArray(rowsOf(raw), 'paper accounts').map(parsePaperAccount)
}

export function parsePortfolio(raw: unknown): {
  status: string
  snapshot: PortfolioSnapshot | null
} {
  const record = asRecord(raw, 'portfolio')
  const snapshotRaw = record.snapshot
  if (!snapshotRaw || typeof snapshotRaw !== 'object') {
    return { status: typeof record.status === 'string' ? record.status : 'unknown', snapshot: null }
  }
  const snapshot = asRecord(snapshotRaw, 'snapshot')
  const totals = asRecord(snapshot.totals ?? {}, 'snapshot totals')
  const read = parsePositions(snapshot.positions)
  return {
    status: typeof record.status === 'string' ? record.status : 'ok',
    snapshot: {
      snapshot_id: needString(snapshot.snapshot_id, 'snapshot id'),
      created_at: typeof snapshot.created_at === 'string' ? snapshot.created_at : '',
      complete: snapshot.complete === true,
      display_currency: optionalString(snapshot.display_currency),
      totals: {
        usd: finiteNumber(totals.usd) ?? 0,
        cny: finiteNumber(totals.cny) ?? 0,
        ...(finiteNumber(totals.display) !== null ? { display: finiteNumber(totals.display)! } : {}),
      },
      positions: read.positions,
      warnings: stringList(snapshot.warnings),
    },
  }
}

export function parseAlphaList(raw: unknown): { alphas: AlphaSummary[]; total: number } {
  const record = asRecord(raw, 'alphas')
  const rows = asArray(record.alphas ?? [], 'alpha rows')
  const alphas = rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const entry = row as Record<string, unknown>
    if (typeof entry.id !== 'string') return []
    return [
      {
        id: entry.id,
        zoo: typeof entry.zoo === 'string' ? entry.zoo : '',
        theme: stringList(entry.theme),
        universe: stringList(entry.universe),
        nickname: optionalString(entry.nickname),
      },
    ]
  })
  return { alphas, total: finiteNumber(record.total) ?? alphas.length }
}

export function parseScheduledRuns(raw: unknown): ScheduledRun[] {
  return asArray(rowsOf(raw), 'scheduled runs').flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.id !== 'string') return []
    return [
      {
        id: record.id,
        title: typeof record.title === 'string' ? record.title : '',
        prompt: typeof record.prompt === 'string' ? record.prompt : '',
        schedule: typeof record.schedule === 'string' ? record.schedule : '',
        status: typeof record.status === 'string' ? record.status : 'unknown',
        next_run_at: finiteNumber(record.next_run_at) ?? 0,
        last_error: stringOrNull(record.last_error),
      },
    ]
  })
}

export function parseLlmSettings(raw: unknown): LlmSettings {
  const record = asRecord(raw, 'llm settings')
  return {
    provider: typeof record.provider === 'string' ? record.provider : '',
    model_name: typeof record.model_name === 'string' ? record.model_name : '',
    base_url: typeof record.base_url === 'string' ? record.base_url : '',
    api_key_configured: record.api_key_configured === true,
    api_key_required: record.api_key_required === true,
  }
}

export function parseUploadResult(raw: unknown): UploadResult {
  const record = asRecord(raw, 'upload')
  return {
    status: typeof record.status === 'string' ? record.status : 'unknown',
    file_path: typeof record.file_path === 'string' ? record.file_path : '',
    filename: typeof record.filename === 'string' ? record.filename : '',
  }
}

export function parseHealth(raw: unknown): { ok: boolean; upstream: string } {
  const record = asRecord(raw, 'health')
  return {
    ok: record.ok === true,
    upstream: typeof record.upstream === 'string' ? record.upstream : '',
  }
}

/** An endpoint that answers `{ status: "ok" }`; the body itself carries nothing else. */
export function parseStatus(raw: unknown): { status: string } {
  const record = asRecord(raw, 'status')
  return { status: typeof record.status === 'string' ? record.status : 'ok' }
}
