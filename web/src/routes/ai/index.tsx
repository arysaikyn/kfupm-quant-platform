import { Fragment, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { Sheet } from '../../components/Sheet'
import { Skeleton } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { news, quotes, sectors, strategies } from '../../data/mock'
import { membersChange, membersOf } from '../../data/membership'
import { useOnline } from '../../lib/useOnline'
import { useKeyboardInset } from '../../lib/useKeyboardInset'
import { nowMs } from '../../lib/now'
import { AiApiError, aiApi, eventsUrl } from '../../api/ai'
import type { RunPreview } from '../../api/ai'
import { AgentMarkdown } from './Markdown'
import { ThinkingPanel } from './ThinkingPanel'
import { RunCard } from './RunCard'
import { mergeChips, sameChip, toneOf } from './chat'
import type { CtxRef } from './chat'
import { takeIntake } from './intake'
import { messagesFromHistory, reduceAgentEvent } from './remote'
import type { ChatMessage, CompletedTurn, LiveTurn } from './remote'
import { strings } from './strings'

const MAX_CHIPS = 6
const COMPOSER_MIN = 56
const COMPOSER_MAX = 132
const SESSION_KEY = 'app.ai.session'
const STREAM_EVENTS = [
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

const BAR_OFFSET =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 40px)'
const TAIL_SPACE =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 112px)'

const CAPS = [
  { t: 'cap1t', h: 'cap1h', prompt: 'presetValuePrompt' },
  { t: 'cap2t', h: 'cap2h', prompt: 'cap2Prompt' },
  { t: 'cap3t', h: 'cap3h', prompt: 'cap3Prompt' },
  { t: 'cap4t', h: 'cap4h', prompt: 'cap4Prompt' },
] as const

const ICON_PATHS = [
  'M4 17l4-6 4 4 4-7 4 5',
  'M12 5v14M5 12h14',
  'M7 8h7a4 4 0 010 8H7zM4 5l3 3M4 19l3-3',
  'M5 6h14M5 12h9M5 18h12',
]
const CAP_ICONS = ICON_PATHS.map((d) => (
  <svg key={d} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
))

type ChipView = { label: string; sub: string; change: number | null }

function chipView(ref: CtxRef, lang: 'zh' | 'en' | 'ar', sectorLabel: string): ChipView {
  if (ref.kind === 'quote') {
    const quote = quotes.find((q) => q.symbol === ref.symbol)
    return quote
      ? { label: quote.name[lang], sub: quote.symbol, change: quote.change }
      : { label: ref.symbol, sub: '', change: null }
  }
  if (ref.kind === 'sector') {
    const sector = sectors.find((s) => s.id === ref.id)
    return {
      label: sector?.name[lang] ?? ref.id,
      sub: sectorLabel,
      change: sector && membersOf(sector.id).length > 0 ? membersChange(ref.id, '1d') : null,
    }
  }
  if (ref.kind === 'news') {
    const item = news.find((n) => n.id === ref.id)
    return { label: item?.title[lang] ?? ref.id, sub: item?.source ?? '', change: null }
  }
  const strategy = strategies.find((s) => s.id === ref.id)
  return { label: strategy?.name[lang] ?? ref.id, sub: strategy?.tags.join(' · ') ?? '', change: null }
}

/** Vibe-Trading takes a prompt, not attachments; the selected objects become a preamble. */
function contextBlock(refs: CtxRef[], lang: 'zh' | 'en' | 'ar'): string {
  if (refs.length === 0) return ''
  const lines = refs.flatMap((ref) => {
    if (ref.kind === 'quote') {
      const q = quotes.find((x) => x.symbol === ref.symbol)
      return q ? [`- Stock ${q.symbol} ${q.name[lang]} (${q.price} ${q.currency}, ${fmtPct(q.change, lang)})`] : []
    }
    if (ref.kind === 'sector') {
      const sector = sectors.find((x) => x.id === ref.id)
      return sector ? [`- Sector ${ref.id} ${sector.name[lang]}`] : []
    }
    if (ref.kind === 'news') {
      const item = news.find((x) => x.id === ref.id)
      return item ? [`- News ${item.id}: ${item.title[lang]} (${item.source})`] : []
    }
    const strategy = strategies.find((x) => x.id === ref.id)
    return strategy ? [`- Strategy ${strategy.id}: ${strategy.name[lang]}`] : []
  })
  return `App context selected by the user:\n${lines.join('\n')}\n\n`
}

function statusText(live: LiveTurn, s: (k: 'thinking' | 'working' | 'answering') => string): string {
  return live.status === 'thinking' ? s('thinking') : live.status === 'working' ? s('working') : s('answering')
}

export default function AiPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const online = useOnline()
  const keyboardInset = useKeyboardInset()
  const [params, setParams] = useSearchParams()
  const sessionParam = params.get('session')
  const [sessionId, setSessionId] = useState<string | null>(
    () => sessionParam ?? localStorage.getItem(SESSION_KEY),
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [live, setLive] = useState<LiveTurn | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [chips, setChips] = useState<CtxRef[]>([])
  const [sheet, setSheet] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const liveActive = live !== null

  const liveRef = useRef<LiveTurn | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const finalized = useRef(new Set<string>())
  const previewFetched = useRef(new Set<string>())
  const intakeDone = useRef(false)
  const assistantBaseline = useRef(0)
  const stoppedAt = useRef(0)
  const streamReady = useRef<{
    sid: string | null
    ready: boolean
    waiters: Array<() => void>
  }>({ sid: null, ready: false, waiters: [] })
  const endRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  // Health is a hint, not a gate: messages still load if the check races.
  useEffect(() => {
    let cancelled = false
    aiApi
      .health()
      .then(() => {
        if (!cancelled) setConnected('online')
      })
      .catch(() => {
        if (!cancelled) setConnected('offline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId)
    else localStorage.removeItem(SESSION_KEY)
  }, [sessionId])

  useEffect(() => {
    liveRef.current = live
  }, [live])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Keep the URL in sync so a reload/history link opens the same session.
  useEffect(() => {
    if (sessionParam === sessionId) return
    const next = new URLSearchParams(params)
    if (sessionId) next.set('session', sessionId)
    else next.delete('session')
    setParams(next, { replace: true })
  }, [sessionId, sessionParam, params, setParams])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    // External state: the session body comes from the server.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    setError(null)
    aiApi
      .messages(sessionId)
      .then((items) => {
        if (cancelled) return
        const mapped = messagesFromHistory(items)
        messagesRef.current = mapped
        setMessages(mapped)
        assistantBaseline.current = mapped.filter((m) => m.role === 'assistant').length
        if (mapped[mapped.length - 1]?.role === 'user') setBusy(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof AiApiError && err.status === 404) {
          setSessionId(null)
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load this session.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  // Live event stream. EventSource reconnects on its own; the server replays
  // the active attempt so a reload does not lose the answer.
  useEffect(() => {
    if (!sessionId) return
    streamReady.current.sid = sessionId
    streamReady.current.ready = false
    const source = new EventSource(eventsUrl(sessionId))
    const seen = new Set<string>()

    const finalize = (completed: CompletedTurn | null) => {
      if (!completed) return
      if (finalized.current.has(completed.attemptId)) return
      finalized.current.add(completed.attemptId)
      if (completed.status === 'cancelled' && nowMs() - stoppedAt.current < 10_000) return
      const last = messagesRef.current[messagesRef.current.length - 1]
      if (completed.text && last?.role === 'assistant' && last.text === completed.text) {
        setBusy(false)
        setLive(null)
        liveRef.current = null
        return
      }
      const id = completed.attemptId || `attempt-${Date.now()}`
      const text = completed.text || ''
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: 'assistant',
          text: text || s('noAnswer'),
          at: nowMs(),
          reasoning: completed.reasoning,
          tools: completed.tools,
          status: completed.status,
          elapsedMs: completed.elapsedMs,
          model: completed.model,
          runId: completed.runId,
          error: completed.error,
        },
      ])
      setBusy(false)
      setLive(null)
      liveRef.current = null
      if (completed.runId) {
        aiApi
          .runPreview(completed.runId)
          .then((run: RunPreview) => {
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, run } : m)))
          })
          .catch(() => {})
      }
    }

    const handle = (type: string) => (event: MessageEvent) => {
      if (event.lastEventId) {
        if (seen.has(event.lastEventId)) return
        seen.add(event.lastEventId)
        if (seen.size > 500) seen.clear()
      }
      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(event.data) as Record<string, unknown>
      } catch {
        data = { raw: event.data }
      }
      const outcome = reduceAgentEvent(liveRef.current, type, data)
      if (outcome.live !== liveRef.current) {
        liveRef.current = outcome.live
        setLive(outcome.live)
        setBusy(Boolean(outcome.live))
      }
      if (outcome.completed) finalize(outcome.completed)
      if (type === 'attempt.started' || type === 'attempt.created') setBusy(true)
      if (type === 'done') setBusy(false)
    }

    for (const type of STREAM_EVENTS) source.addEventListener(type, handle(type))
    source.onopen = () => {
      setConnected('online')
      if (streamReady.current.sid === sessionId) {
        streamReady.current.ready = true
        streamReady.current.waiters.forEach((resolve) => resolve())
        streamReady.current.waiters = []
      }
    }
    source.onerror = () => setConnected('offline')

    return () => source.close()
  }, [sessionId, s])

  // Historical turns store run_id in metadata; hydrate their cards once.
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant' || !message.runId || message.run) continue
      if (previewFetched.current.has(message.runId)) continue
      previewFetched.current.add(message.runId)
      aiApi
        .runPreview(message.runId)
        .then((run) => {
          setMessages((prev) =>
            prev.map((item) => (item.runId === message.runId ? { ...item, run } : item)),
          )
        })
        .catch(() => {})
    }
  }, [messages])

  // A missed SSE window must not strand a finished answer. The server has the
  // durable message; poll only while a turn is busy, and stop at the first
  // assistant message beyond the pre-send baseline.
  useEffect(() => {
    if (!busy || !sessionId) return
    let cancelled = false
    const started = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - started > 120_000) {
        window.clearInterval(timer)
        setBusy(false)
        setError('The agent did not finish within two minutes.')
        return
      }
      aiApi
        .messages(sessionId)
        .then((items) => {
          if (cancelled) return
          const mapped = messagesFromHistory(items)
          const assistants = mapped.filter((m) => m.role === 'assistant').length
          if (assistants > assistantBaseline.current) {
            messagesRef.current = mapped
            setMessages(mapped)
            setLive(null)
            liveRef.current = null
            setBusy(false)
          }
        })
        .catch(() => {})
    }, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [busy, sessionId])

  useEffect(() => {
    if (!liveActive) return
    const timer = window.setInterval(() => setNow(Date.now()), 600)
    return () => window.clearInterval(timer)
  }, [liveActive])

  useEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(COMPOSER_MAX, Math.max(COMPOSER_MIN - 20, el.scrollHeight))}px`
  }, [input])

  const liveTextLength = live?.text.length ?? 0
  const liveToolCount = live?.tools.length ?? 0
  useEffect(() => {
    if (messages.length === 0 && !liveActive) return
    const el = endRef.current
    if (!el) return
    const doc = document.documentElement
    const nearBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 260
    if (!nearBottom) return
    el.scrollIntoView({ block: 'end' })
  }, [messages.length, liveActive, liveTextLength, liveToolCount])

  // Long-press handoff: prefill the question and context, never auto-spend tokens.
  useEffect(() => {
    if (intakeDone.current) return
    intakeDone.current = true
    const intake = takeIntake()
    if (!intake) return
    if (intake.chips.length > 0) {
      // oxlint-disable-next-line react/set-state-in-effect
      setChips((prev) => mergeChips(prev, intake.chips, MAX_CHIPS))
    }
    if (intake.prompt) {
      setInput(intake.prompt)
      window.setTimeout(() => composerRef.current?.focus(), 0)
    }
  }, [])

  function waitForStream(sid: string): Promise<void> {
    if (streamReady.current.sid === sid && streamReady.current.ready) return Promise.resolve()
    return new Promise((resolve) => {
      const done = () => resolve()
      streamReady.current.waiters.push(done)
      window.setTimeout(done, 2500)
    })
  }

  async function ensureSession(first: string): Promise<string | null> {
    if (sessionId) return sessionId
    try {
      const title = first.replace(/\s+/g, ' ').trim().slice(0, 60) || 'New session'
      const created = await aiApi.createSession(title)
      setSessionId(created.session_id)
      return created.session_id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a session.')
      return null
    }
  }

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    setError(null)
    setInput('')
    setSheet(false)
    setBusy(true)
    const sid = await ensureSession(text)
    if (!sid) {
      setBusy(false)
      return
    }
    assistantBaseline.current = messages.filter((m) => m.role === 'assistant').length
    await waitForStream(sid)
    const user: ChatMessage = {
      id: `local-${crypto.randomUUID()}`,
      role: 'user',
      text,
      at: nowMs(),
    }
    setMessages((prev) => [...prev, user])
    try {
      await aiApi.sendMessage(sid, `${contextBlock(chips, lang)}${text}`)
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'The agent did not accept the message.')
    }
  }

  async function stop() {
    if (!sessionId) return
    // The SSE connection is separate from this fetch: stamp first so a
    // cancelled frame cannot beat the local marker and create two bubbles.
    stoppedAt.current = nowMs()
    try {
      await aiApi.cancel(sessionId)
    } catch {
      // The run may have completed between the tap and the request.
    }
    setLive(null)
    liveRef.current = null
    setBusy(false)
    setMessages((prev) => [
      ...prev,
      {
        id: `stopped-${crypto.randomUUID()}`,
        role: 'assistant',
        text: '',
        at: nowMs(),
        status: 'cancelled',
      },
    ])
  }

  function newChat() {
    if (sessionId && busy) void aiApi.cancel(sessionId).catch(() => {})
    setSessionId(null)
    setMessages([])
    setLive(null)
    setBusy(false)
    setError(null)
    setInput('')
    setChips([])
    setSheet(false)
    setCopiedId(null)
    liveRef.current = null
    finalized.current.clear()
    composerRef.current?.focus()
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600)
    } catch {
      // Clipboard permission is optional.
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send(input)
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void send(input)
  }

  const chipOptions = [
    ...quotes
      .filter((q) => !chips.some((c) => c.kind === 'quote' && c.symbol === q.symbol))
      .map((q) => ({
        key: `q:${q.symbol}`,
        view: { label: q.name[lang], sub: q.symbol, change: q.change },
        ref: { kind: 'quote', symbol: q.symbol } satisfies CtxRef,
      })),
    ...sectors
      .filter((x) => !chips.some((c) => c.kind === 'sector' && c.id === x.id))
      .map((x) => ({
        key: `s:${x.id}`,
        view: {
          label: x.name[lang],
          sub: s('sectorLabel'),
          change: membersOf(x.id).length > 0 ? membersChange(x.id, '1d') : null,
        },
        ref: { kind: 'sector', id: x.id } satisfies CtxRef,
      })),
    ...news.slice(0, 3).map((n) => ({
      key: `n:${n.id}`,
      view: { label: n.title[lang], sub: n.source, change: null },
      ref: { kind: 'news', id: n.id } satisfies CtxRef,
    })),
    ...strategies.slice(0, 2).map((st) => ({
      key: `st:${st.id}`,
      view: { label: st.name[lang], sub: st.tags.join(' · '), change: null },
      ref: { kind: 'strategy', id: st.id } satisfies CtxRef,
    })),
  ]

  return (
    <>
      <Screen
        title={t('tab.ai')}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/runs"
              className="flex min-h-11 items-center rounded-full border border-line px-3 text-[12px] text-fg transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s('history')}
            </Link>
            <button
              type="button"
              onClick={newChat}
              aria-label={t('common.newChat')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        }
      >
        <div className="-mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected === 'online' ? 'bg-up' : connected === 'offline' ? 'bg-down' : 'bg-muted'
            }`}
            aria-hidden
          />
          <span>
            {connected === 'online'
              ? s('connected')
              : connected === 'offline'
                ? s('offline')
                : s('thinking')}
          </span>
          {!online && <span>· {t('common.offline')}</span>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((ref) => {
            const view = chipView(ref, lang, s('sectorLabel'))
            return (
              <span
                key={`${ref.kind}:${'symbol' in ref ? ref.symbol : ref.id}`}
                className="inline-flex h-11 items-center rounded-full bg-surface ps-3 pe-0.5"
              >
                <span className="max-w-[180px] truncate text-[12px]">{view.label}</span>
                <span className={`num ms-2 text-[11px] ${view.change === null ? 'text-muted' : toneOf(view.change)}`}>
                  {view.change === null ? '—' : fmtPct(view.change, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => setChips((prev) => prev.filter((x) => !sameChip(x, ref)))}
                  aria-label={`${s('remove')} ${view.label}`}
                  className="ms-0.5 flex h-11 w-11 items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            )
          })}
          {chips.length < MAX_CHIPS && (
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
              className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {s('addObject')}
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="panel mt-4 border-danger/40 p-3">
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-1 min-h-11 text-[11px] text-muted underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-8" role="log" aria-label={s('threadLabel')}>
          {loading && <Skeleton rows={3} />}

          {!loading && messages.length === 0 && !live && (
            <div className="pt-1">
              <p className="text-[15px] leading-relaxed text-muted">{s('promise')}</p>
              <p className="t-kicker mt-8 text-muted">{s('capTitle')}</p>
              <ul className="mt-2 grid grid-cols-2 border-t border-line">
                {CAPS.map((cap, i) => (
                  <li key={cap.t} className="border-b border-line odd:border-e">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void send(s(cap.prompt))}
                      className="flex h-full min-h-[84px] w-full items-start gap-2 py-3 text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/10 disabled:opacity-60 odd:pe-3 even:ps-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-muted">
                        {CAP_ICONS[i]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium leading-tight">{s(cap.t)}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted">{s(cap.h)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[11px] text-muted">{s('disclaimer')}</p>
            </div>
          )}

          {messages.map((message, index) => {
            const previous = messages[index - 1]
            const showDay =
              !previous || new Date(previous.at).toDateString() !== new Date(message.at).toDateString()
            return (
              <Fragment key={message.id}>
                {showDay && (
                  <p className="text-center text-[11px] leading-none text-muted">
                    {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(message.at))}
                  </p>
                )}
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-surface px-4 py-2.5">
                      <p dir="auto" className="text-start text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ThinkingPanel message={message} now={now} />
                    {message.text && <AgentMarkdown text={message.text} />}
                    {message.run && <RunCard run={message.run} />}
                    {message.status === 'cancelled' && !message.text && (
                      <p className="text-[12px] text-muted">{s('cancelled')}</p>
                    )}
                    {message.status === 'failed' && message.error && (
                      <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
                        {message.error}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
                      {message.model && <span>{message.model}</span>}
                      {message.elapsedMs != null && (
                        <span className="num">{fmtNum(message.elapsedMs / 1000, lang, 1)}s</span>
                      )}
                      {message.text && (
                        <button
                          type="button"
                          onClick={() => void copy(message.text, message.id)}
                          className="min-h-11 rounded-full px-2 text-[11px] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                        >
                          {copiedId === message.id ? t('common.copied') : t('common.copy')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}

          {live && (
            <div className="space-y-3">
              <ThinkingPanel live={live} now={now} />
              {live.text ? (
                <div>
                  <AgentMarkdown text={live.text} />
                  <span aria-hidden className="ms-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-fg align-baseline motion-reduce:animate-none" />
                </div>
              ) : (
                <p className="text-[13px] text-muted" role="status">
                  {statusText(live, s)}
                </p>
              )}
            </div>
          )}
        </div>

        <div ref={endRef} aria-hidden style={{ height: TAIL_SPACE }} />
      </Screen>

      <div
        className="composer fixed z-40 glass has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-fg"
        style={{
          insetInline: 12,
          maxWidth: 496,
          marginInline: 'auto',
          bottom: `calc(${BAR_OFFSET} + ${keyboardInset}px)`,
          minHeight: COMPOSER_MIN,
        }}
      >
        <form onSubmit={submit} className="flex h-full items-end gap-2 py-1.5 ps-4 pe-1.5">
          <textarea
            ref={composerRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onComposerKey}
            rows={1}
            placeholder={s('placeholder')}
            aria-label={s('placeholder')}
            enterKeyHint="send"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-[1.45] outline-none placeholder:text-muted"
            style={{ maxHeight: COMPOSER_MAX }}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label={t('common.stop')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <span className="block h-3 w-3 rounded-[2px] bg-fg" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={input.trim().length === 0}
              aria-label={s('send')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-40"
              style={{ background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={s('sheetTitle')}
        style={{
          insetInline: 12,
          bottom: `calc(${BAR_OFFSET} + ${keyboardInset}px + ${COMPOSER_MIN + 12}px)`,
          background: 'color-mix(in srgb, var(--color-bg) 97%, transparent)',
          backdropFilter: 'blur(24px) saturate(180%)',
          maxHeight: '58vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <div className="flex items-center justify-between gap-2 ps-4 pe-1 pt-2 pb-1">
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{s('sheetTitle')}</p>
          <span className="shrink-0 text-[11px] text-muted">{s('sheetLimit')}</span>
          <button
            type="button"
            onClick={() => setSheet(false)}
            aria-label={s('close')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="px-2 pb-2">
          {chipOptions.length === 0 && (
            <li className="px-2 py-4 text-[12px] text-muted">{s('noMore')}</li>
          )}
          {chipOptions.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                onClick={() => {
                  setChips((prev) => mergeChips(prev, [option.ref], MAX_CHIPS))
                  setSheet(false)
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{option.view.label}</span>
                  <span className="block truncate text-[11px] text-muted">{option.view.sub}</span>
                </span>
                <span className={`num shrink-0 text-[12px] ${option.view.change === null ? 'text-muted' : toneOf(option.view.change)}`}>
                  {option.view.change === null ? '—' : fmtPct(option.view.change, lang)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
