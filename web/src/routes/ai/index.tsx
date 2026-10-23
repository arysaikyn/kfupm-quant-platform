import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes, sectors } from '../../data/mock'
import { membersChange, membersOf } from '../../data/membership'
import { strings } from './strings'
import { canned, followUps } from './replies'
import type { Reply } from './replies'
import { AssistantMessage, TypingRow, UserBubble } from './messages'
import { STREAM_MS } from './timeline'
import { loadThread, saveThread } from './thread'
import { takeIntake } from './intake'
import { toneOf, tokenize } from './chat'
import type { CtxRef, Msg } from './chat'

const INITIAL_CHIPS: CtxRef[] = [
  { kind: 'quote', symbol: '2222' },
  { kind: 'sector', id: 'energy' },
]

const MAX_CHIPS = 6
const COMPOSER_H = 56

/* Composer sits above the tab bar and above the lifted centre tab.
   Bar top is 72px up; its raised AI icon reaches another 17px. 40px of air
   leaves the composer 23px clear of that icon at 390x844. */
const BAR_OFFSET =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 40px)'
/* Space under the last message so it clears the composer, not just the tab bar. */
const TAIL_SPACE =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 96px)'
const SHEET_OFFSET = `calc(${BAR_OFFSET} + ${COMPOSER_H + 8}px)`

function pickReply(lang: Lang, turn: number): Reply {
  const scripted = canned[lang]
  if (turn < scripted.length) return scripted[turn]
  const pool = followUps[lang]
  return pool[(turn - scripted.length) % pool.length]
}

function sameChip(a: CtxRef, b: CtxRef): boolean {
  if (a.kind === 'quote' && b.kind === 'quote') return a.symbol === b.symbol
  if (a.kind === 'sector' && b.kind === 'sector') return a.id === b.id
  return false
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

export default function AiPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)

  const restored = useRef(loadThread())
  const [msgs, setMsgs] = useState<Msg[]>(() => restored.current?.msgs ?? [])
  const [input, setInput] = useState('')
  const [chips, setChips] = useState<CtxRef[]>(() => restored.current?.chips ?? INITIAL_CHIPS)
  const [sheet, setSheet] = useState(false)
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)

  const seq = useRef(0)
  const turn = useRef(restored.current?.turn ?? 0)
  const shownRef = useRef(0)
  const timeoutRef = useRef(0)
  const intervalRef = useRef(0)
  const busyRef = useRef(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current)
      window.clearInterval(intervalRef.current)
    },
    [],
  )

  // Persist only settled threads: writing every streamed token would thrash.
  useEffect(() => {
    if (busy) return
    saveThread({ msgs, chips, turn: turn.current })
  }, [msgs, chips, busy])

  // A long press on another screen drops its question here. The handler is
  // read from a ref so this effect stays mount-only.
  const sendRef = useRef(send)
  sendRef.current = send
  useEffect(() => {
    const asked = takeIntake()
    if (asked) sendRef.current(asked)
    // Running twice is harmless: takeIntake removes the value.
  }, [])

  const last = msgs[msgs.length - 1]
  const lastShown = last && last.role === 'assistant' ? last.shown : 0
  const quoteChip = chips.find((c) => c.kind === 'quote')
  const evidenceSymbol = quoteChip?.kind === 'quote' ? quoteChip.symbol : undefined

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

  function send(raw: string) {
    const value = raw.trim()
    if (!value || busyRef.current) return

    busyRef.current = true
    setBusy(true)
    setInput('')
    setSheet(false)
    setMsgs((prev) => [...prev, { id: ++seq.current, role: 'user', text: value } satisfies Msg])
    setTyping(true)

    const reply = pickReply(lang, turn.current)
    turn.current += 1
    const paras = reply.paragraphs.map((p) => tokenize(p, lang))
    const total = paras.reduce((n, p) => n + p.length, 0)

    timeoutRef.current = window.setTimeout(() => {
      setTyping(false)
      const id = ++seq.current
      setMsgs((prev) => [
        ...prev,
        {
          id,
          role: 'assistant',
          paras,
          sources: reply.sources,
          artifactTitle: reply.artifactTitle,
          total,
          shown: 0,
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

  function addChip(ref: CtxRef) {
    setChips((prev) => {
      if (prev.length >= MAX_CHIPS) return prev
      return prev.some((c) => sameChip(c, ref)) ? prev : [...prev, ref]
    })
    setSheet(false)
  }

  const options = [
    ...quotes
      .filter((q) => !chips.some((c) => c.kind === 'quote' && c.symbol === q.symbol))
      .map((q) => ({
        key: `q:${q.symbol}`,
        label: q.name[lang],
        sub: q.symbol,
        change: q.change,
        ref: { kind: 'quote', symbol: q.symbol } satisfies CtxRef,
      })),
    ...sectors
      .filter((x) => !chips.some((c) => c.kind === 'sector' && c.id === x.id))
      .map((x) => ({
        key: `s:${x.id}`,
        label: x.name[lang],
        sub: s('sectorLabel'),
        // Same membership mean the markets map draws, so a chip and the band it
        // came from can never disagree.
        change: membersOf(x.id).length > 0 ? membersChange(x.id, '1d') : null,
        ref: { kind: 'sector', id: x.id } satisfies CtxRef,
      })),
  ].slice(0, 5)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    send(input)
  }

  return (
    <>
      <Screen
      title={t('tab.ai')}
      action={
        <Link
          to="/runs"
          className="flex min-h-[44px] items-center rounded-full border border-line px-3.5 text-[12px] text-fg transition-colors hover:bg-fg/5 active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('runs')}
        </Link>
      }
    >
        {/* context tray */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {chips.map((c) => {
            const quote = c.kind === 'quote' ? quotes.find((q) => q.symbol === c.symbol) : undefined
            const sector = c.kind === 'sector' ? sectors.find((x) => x.id === c.id) : undefined
            const label = quote ? quote.name[lang] : sector ? sector.name[lang] : ''
            const change = quote
              ? quote.change
              : sector && membersOf(sector.id).length > 0
                ? membersChange(sector.id, '1d')
                : null
            const key = quote ? `q:${quote.symbol}` : sector ? `s:${sector.id}` : 'unknown'

            return (
              <span
                key={key}
                className="inline-flex h-11 items-center rounded-full bg-surface ps-3 pe-0.5"
              >
                <span className="text-[12px]">{label}</span>
                <span
                  className={`num ms-2 text-[11px] ${
                    change === null ? 'text-muted' : toneOf(change)
                  }`}
                >
                  {change === null ? '—' : fmtPct(change, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => setChips((prev) => prev.filter((x) => !sameChip(x, c)))}
                  aria-label={`${s('remove')} ${label}`}
                  className="ms-0.5 flex h-11 w-11 items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {s('addObject')}
            </button>
          )}
        </div>

        {/* thread */}
        <div className="mt-6 space-y-8">
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
              <p className="mt-6 text-[11px] text-muted">{s('disclaimer')}</p>
            </div>
          )}

          {msgs.map((m) =>
            m.role === 'user' ? (
              <UserBubble key={m.id} text={m.text} />
            ) : (
              <AssistantMessage
                key={m.id}
                m={m}
                sourcesLabel={s('sources')}
                evidenceSymbol={evidenceSymbol}
              />
            ),
          )}

          {typing && <TypingRow label={s('typing')} />}
        </div>

        <div ref={endRef} aria-hidden style={{ height: TAIL_SPACE }} />
      </Screen>

      {/* composer */}
      <div
        className="composer fixed z-40 glass has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-fg"
        style={{
          insetInline: 12,
          maxWidth: 496,
          marginInline: 'auto',
          bottom: BAR_OFFSET,
          height: COMPOSER_H,
        }}
      >
        <form onSubmit={submit} className="flex h-full items-center gap-2 ps-4 pe-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={s('placeholder')}
            aria-label={s('placeholder')}
            enterKeyHint="send"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={input.trim().length === 0 || busy}
            aria-label={s('send')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-40"
            style={{ background: 'var(--color-accent-fill)', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        </form>
      </div>

      {/* context sheet */}
      {sheet && (
        <>
          <div
            className="scrim-enter fixed inset-0 z-40"
            style={{ background: 'rgba(4, 2, 10, 0.55)' }}
            onClick={() => setSheet(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label={s('sheetTitle')}
            className="sheet-enter glass fixed z-40 rounded-2xl border border-line"
            style={{
              insetInline: 12,
              bottom: SHEET_OFFSET,
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ul className="px-2 pb-2">
              {options.length === 0 && (
                <li className="px-2 py-4 text-[12px] text-muted">{s('noMore')}</li>
              )}
              {options.map((o) => (
                <li key={o.key}>
                  <button
                    type="button"
                    onClick={() => addChip(o.ref)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{o.label}</span>
                      <span className="block truncate text-[11px] text-muted">{o.sub}</span>
                    </span>
                    <span
                      className={`num shrink-0 text-[12px] ${
                        o.change === null ? 'text-muted' : toneOf(o.change)
                      }`}
                    >
                      {o.change === null ? '—' : fmtPct(o.change, lang)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
