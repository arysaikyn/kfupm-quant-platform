import { Fragment, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { Sheet } from '../../components/Sheet'
import { fmtPct, useI18n, useStrings } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import type { Lang } from '../../i18n'
import { news, quotes, sectors, strategies } from '../../data/mock'
import { membersChange, membersOf } from '../../data/membership'
import { applyRules, presetRules } from '../screener/rules'
import { useOnline } from '../../lib/useOnline'
import { useKeyboardInset } from '../../lib/useKeyboardInset'
import { strings } from './strings'
import { canned, followUps } from './replies'
import type { Reply } from './replies'
import { AssistantMessage, ErrorRow, TypingRow, UserBubble } from './messages'
import { STREAM_MS } from './timeline'
import { clearThread, loadThread, nextId, saveThread } from './thread'
import { takeIntake } from './intake'
import { mergeChips, sameChip, tokenize, toneOf } from './chat'
import type { Artifact, CtxRef, Msg } from './chat'

const INITIAL_CHIPS: CtxRef[] = [
  { kind: 'quote', symbol: '2222' },
  { kind: 'sector', id: 'energy' },
]

const MAX_CHIPS = 6
const COMPOSER_MIN = 56
const COMPOSER_MAX = 132

/* Composer sits above the tab bar and above the lifted centre tab.
   Bar top is 72px up; its raised AI icon reaches another 17px. 40px of air
   leaves the composer clear of that icon at 390x844. */
const BAR_OFFSET =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 40px)'
/* Space under the last message so it clears the composer, not just the tab bar. */
const TAIL_SPACE =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 112px)'

function pickReply(lang: Lang, turn: number): Reply {
  const scripted = canned[lang]
  if (turn < scripted.length) return scripted[turn]
  const pool = followUps[lang]
  return pool[(turn - scripted.length) % pool.length]
}

const CAPS = [
  { t: 'cap1t', h: 'cap1h' },
  { t: 'cap2t', h: 'cap2h' },
  { t: 'cap3t', h: 'cap3h' },
  { t: 'cap4t', h: 'cap4h' },
  { t: 'cap5t', h: 'cap5h' },
  { t: 'cap6t', h: 'cap6h' },
] as const

const PRESETS = [
  { label: 'presetValue', prompt: 'presetValuePrompt' },
  { label: 'presetDividend', prompt: 'presetDividendPrompt' },
  { label: 'presetSharia', prompt: 'presetShariaPrompt' },
  { label: 'presetMomentum', prompt: 'presetMomentumPrompt' },
] as const

const ICON_PATHS = [
  'M4 17l4-6 4 4 4-7 4 5',
  'M12 5v14M5 12h14',
  'M7 8h7a4 4 0 010 8H7zM4 5l3 3M4 19l3-3',
  'M5 6h14M5 12h9M5 18h12',
  'M4 18V9m5 9V5m5 13v-6m5 6V8',
  'M12 4l7 3.5v5c0 4-3 6.6-7 7.5-4-.9-7-3.5-7-7.5v-5z',
]
const CAP_ICONS = ICON_PATHS.map((d) => (
  <svg key={d} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
))

type ChipView = { label: string; sub: string; change: number | null }

function chipView(ref: CtxRef, lang: Lang, sectorLabel: string): ChipView {
  if (ref.kind === 'quote') {
    const quote = quotes.find((q) => q.symbol === ref.symbol)
    return quote
      ? { label: quote.name[lang], sub: quote.symbol, change: quote.change }
      : { label: ref.symbol, sub: '', change: null }
  }
  if (ref.kind === 'sector') {
    const sector = sectors.find((s) => s.id === ref.id)
    const membership = sector ? membersOf(sector.id) : []
    return {
      label: sector?.name[lang] ?? ref.id,
      sub: sectorLabel,
      change: membership.length > 0 ? membersChange(ref.id, '1d') : null,
    }
  }
  if (ref.kind === 'news') {
    const item = news.find((n) => n.id === ref.id)
    return { label: item?.title[lang] ?? ref.id, sub: item?.source ?? '', change: null }
  }
  const strategy = strategies.find((s) => s.id === ref.id)
  return { label: strategy?.name[lang] ?? ref.id, sub: strategy?.tags.join(' · ') ?? '', change: null }
}

export default function AiPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)
  const online = useOnline()
  const keyboardInset = useKeyboardInset()

  const restored = useRef(loadThread())
  const [msgs, setMsgs] = useState<Msg[]>(() => restored.current?.msgs ?? [])
  const [input, setInput] = useState('')
  const [chips, setChips] = useState<CtxRef[]>(() => restored.current?.chips ?? INITIAL_CHIPS)
  const [sheet, setSheet] = useState(false)
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const seq = useRef(nextId(restored.current?.msgs ?? []))
  const turn = useRef(restored.current?.turn ?? 0)
  const shownRef = useRef(0)
  const timeoutRef = useRef(0)
  const intervalRef = useRef(0)
  const busyRef = useRef(false)
  const activeId = useRef(0)
  const endRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const chipsRef = useRef(chips)
  const msgsRef = useRef(msgs)

  useEffect(() => {
    chipsRef.current = chips
  }, [chips])

  useEffect(() => {
    msgsRef.current = msgs
  }, [msgs])

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current)
      window.clearInterval(intervalRef.current)
    },
    [],
  )

  // Autosize the composer between one and four lines.
  useEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(COMPOSER_MAX, Math.max(COMPOSER_MIN - 20, el.scrollHeight))}px`
  }, [input])

  // Persist only settled threads: writing every streamed token would thrash.
  useEffect(() => {
    if (busy) return
    saveThread({ version: 2, msgs, chips, turn: turn.current })
  }, [msgs, chips, busy])

  // Context handed over by another screen. The timer is deliberately not
  // cleared: StrictMode's simulated unmount would otherwise eat the question.
  const sendRef = useRef(send)

  useEffect(() => {
    sendRef.current = send
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const intake = takeIntake()
      if (!intake) return
      if (intake.chips.length > 0) {
        const next = mergeChips(chipsRef.current, intake.chips, MAX_CHIPS)
        chipsRef.current = next
        setChips(next)
      }
      if (intake.prompt.trim()) sendRef.current(intake.prompt, intake.chips)
    }, 0)
    return () => void timer
  }, [])

  const last = msgs[msgs.length - 1]
  const lastShown = last && last.role === 'assistant' ? last.shown : 0
  const completed = msgs.filter(
    (m) => m.role === 'assistant' && m.shown >= m.total,
  ).length

  useEffect(() => {
    // An empty thread opens at the top: the title is the first thing the
    // screen says, and the tail spacer would otherwise scroll it away.
    if (msgs.length === 0) return
    const el = endRef.current
    if (!el) return
    const doc = document.documentElement
    const nearBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 260
    if (!nearBottom) return
    el.scrollIntoView({ block: 'end' })
  }, [msgs.length, typing, lastShown])

  function send(raw: string, context: CtxRef[] = []) {
    const value = raw.trim()
    if (!value || busyRef.current) return

    if (!online) {
      const errorId = ++seq.current
      setMsgs((prev) => [
        ...prev,
        { id: errorId, role: 'error', text: s('offlineSend'), at: Date.now() } satisfies Msg,
      ])
      return
    }

    const nextChips = mergeChips(chipsRef.current, context, MAX_CHIPS)
    chipsRef.current = nextChips
    setChips(nextChips)

    busyRef.current = true
    setBusy(true)
    setInput('')
    setSheet(false)
    const userId = ++seq.current
    setMsgs((prev) => [
      ...prev,
      { id: userId, role: 'user', text: value, at: Date.now() } satisfies Msg,
    ])
    setTyping(true)

    const reply = pickReply(lang, turn.current)
    turn.current += 1
    const paras = reply.paragraphs.map((p) => tokenize(p, lang))
    const total = paras.reduce((n, p) => n + p.length, 0)
    const evidenceSymbol =
      context.find((c) => c.kind === 'quote')?.symbol ??
      nextChips.find((c) => c.kind === 'quote')?.symbol
    const artifact: Artifact | undefined = reply.artifact
      ? {
          ...reply.artifact,
          symbols: applyRules(quotes, presetRules(reply.artifact.preset)).map((q) => q.symbol),
        }
      : undefined

    timeoutRef.current = window.setTimeout(() => {
      setTyping(false)
      const id = ++seq.current
      activeId.current = id
      setMsgs((prev) => [
        ...prev,
        {
          id,
          role: 'assistant',
          paras,
          sources: reply.sources,
          artifact,
          total,
          shown: 0,
          at: Date.now(),
          evidenceSymbol,
        } satisfies Msg,
      ])

      shownRef.current = 0
      intervalRef.current = window.setInterval(() => {
        shownRef.current += 1
        const shown = shownRef.current
        setMsgs((prev) =>
          prev.map((m) => (m.id === id && m.role === 'assistant' ? { ...m, shown } : m)),
        )
        if (shown >= total) {
          window.clearInterval(intervalRef.current)
          intervalRef.current = 0
          busyRef.current = false
          setBusy(false)
        }
      }, STREAM_MS)
    }, 700)
  }

  function stop() {
    window.clearTimeout(timeoutRef.current)
    window.clearInterval(intervalRef.current)
    if (activeId.current) {
      const id = activeId.current
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === id && m.role === 'assistant' ? { ...m, shown: m.total } : m,
        ),
      )
    }
    busyRef.current = false
    setBusy(false)
    setTyping(false)
  }

  function retry() {
    const source = msgsRef.current
    let index = -1
    for (let i = source.length - 1; i >= 0; i -= 1) {
      if (source[i].role === 'user') {
        index = i
        break
      }
    }
    if (index < 0) return
    const lastUser = source[index]
    if (lastUser.role !== 'user') return
    stop()
    setMsgs(source.slice(0, index))
    send(lastUser.text)
  }

  function newChat() {
    stop()
    clearThread()
    seq.current = 0
    turn.current = 0
    activeId.current = 0
    setMsgs([])
    setChips(INITIAL_CHIPS)
    chipsRef.current = INITIAL_CHIPS
    setInput('')
    setSheet(false)
    composerRef.current?.focus()
  }

  function addChip(ref: CtxRef) {
    const next = mergeChips(chipsRef.current, [ref], MAX_CHIPS)
    chipsRef.current = next
    setChips(next)
    setSheet(false)
  }

  async function copy(text: string, id: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600)
    } catch {
      // Clipboard permission is optional; the answer remains selectable.
    }
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    send(input)
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send(input)
  }

  return (
    <>
      <Screen
        title={t('tab.ai')}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/runs"
              className="flex min-h-11 items-center rounded-full border border-line px-3 text-[12px] text-fg transition-colors hover:bg-fg/5 active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s('runs')}
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
        <p className="mt-1 text-[11px] leading-snug text-muted">{s('demoNote')}</p>

        {/* context tray */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((ref) => {
            const view = chipView(ref, lang, s('sectorLabel'))
            return (
              <span
                key={`${ref.kind}:${'symbol' in ref ? ref.symbol : ref.id}`}
                className="inline-flex h-11 items-center rounded-full bg-surface ps-3 pe-0.5"
              >
                <span className="max-w-[180px] truncate text-[12px]">{view.label}</span>
                <span
                  className={`num ms-2 text-[11px] ${
                    view.change === null ? 'text-muted' : toneOf(view.change)
                  }`}
                >
                  {view.change === null ? '—' : fmtPct(view.change, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = chipsRef.current.filter((x) => !sameChip(x, ref))
                    chipsRef.current = next
                    setChips(next)
                  }}
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
              onClick={() => setSheet((v) => !v)}
              aria-expanded={sheet}
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

        {/* thread */}
        <div className="mt-6 space-y-8" role="log" aria-label={s('threadLabel')}>
          {msgs.length === 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={busy}
                    onClick={() => send(s(preset.prompt))}
                    className="inline-flex h-11 items-center rounded-full bg-surface px-3 text-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-60"
                  >
                    {s(preset.label)}
                  </button>
                ))}
              </div>
              <p className="t-kicker mt-8 text-muted">{s('capTitle')}</p>
              <ul className="mt-2 grid grid-cols-2 border-t border-line">
                {CAPS.map((c, i) => (
                  <li key={c.t} className="border-b border-line odd:border-e">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => send(s(c.t))}
                      className="flex h-full min-h-[72px] w-full items-start gap-2 py-3 text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/10 disabled:opacity-60 odd:pe-3 even:ps-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-muted">
                        {CAP_ICONS[i]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium leading-tight">{s(c.t)}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted">
                          {s(c.h)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/review"
                className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-line pt-3 text-[13px] transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                {s('reviewLink')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)] text-muted" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>

              <p className="mt-6 text-[11px] text-muted">{s('disclaimer')}</p>
            </div>
          )}

          {msgs.map((m, index) => {
            const previous = msgs[index - 1]
            const showDay =
              !previous || new Date(previous.at).toDateString() !== new Date(m.at).toDateString()
            return (
              <Fragment key={m.id}>
                {showDay && (
                  <p className="text-center text-[11px] leading-none text-muted">
                    {fmtDate(m.at, lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                )}
                {m.role === 'user' ? (
                  <UserBubble text={m.text} />
                ) : m.role === 'error' ? (
                  <ErrorRow text={m.text} onRetry={retry} retryLabel={t('common.retry')} />
                ) : (
                  <AssistantMessage
                    m={m}
                    sourcesLabel={s('sources')}
                    onCopy={() => copy(m.paras.map((p) => p.join('')).join('\n\n'), m.id)}
                    copied={copiedId === m.id}
                    copyLabel={copiedId === m.id ? t('common.copied') : t('common.copy')}
                    onRetry={retry}
                    retryLabel={t('common.retry')}
                  />
                )}
              </Fragment>
            )
          })}

          {typing && <TypingRow label={s('typing')} />}
        </div>

        <div aria-live="polite" className="sr-only">
          {completed > 0 ? `${s('answerReady')} ${completed}` : ''}
        </div>

        <div ref={endRef} aria-hidden style={{ height: TAIL_SPACE }} />
      </Screen>

      {/* composer */}
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
        <form onSubmit={submit} className="flex h-full items-end gap-2 ps-4 pe-1.5 py-1.5">
          <textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
              onClick={stop}
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
                onClick={() => addChip(option.ref)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{option.view.label}</span>
                  <span className="block truncate text-[11px] text-muted">{option.view.sub}</span>
                </span>
                <span
                  className={`num shrink-0 text-[12px] ${
                    option.view.change === null ? 'text-muted' : toneOf(option.view.change)
                  }`}
                >
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
