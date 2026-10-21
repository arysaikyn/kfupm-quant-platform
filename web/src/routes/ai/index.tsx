import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Screen } from '../../components/Screen'
import { fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes, sectors } from '../../data/mock'
import { strings } from './strings'
import { canned, followUps } from './replies'
import type { Reply } from './replies'
import { AssistantMessage, TypingRow, UserBubble } from './messages'
import { toneOf, tokenize } from './chat'
import type { CtxRef, Msg } from './chat'

const INITIAL_CHIPS: CtxRef[] = [
  { kind: 'quote', symbol: '2222' },
  { kind: 'sector', id: 'energy' },
]

const MAX_CHIPS = 6
const COMPOSER_H = 56

/* Composer sits above the tab bar, clearing the raised centre icon. */
const BAR_OFFSET =
  'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + var(--tabbar-gap) + 16px)'
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

export default function AiPage() {
  const { t, lang } = useI18n()
  const s = useStrings(strings)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [chips, setChips] = useState<CtxRef[]>(INITIAL_CHIPS)
  const [sheet, setSheet] = useState(false)
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)

  const seq = useRef(0)
  const turn = useRef(0)
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

  const last = msgs[msgs.length - 1]
  const lastShown = last && last.role === 'assistant' ? last.shown : 0

  useEffect(() => {
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
      }, 18)
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
        change: x.change,
        ref: { kind: 'sector', id: x.id } satisfies CtxRef,
      })),
  ].slice(0, 5)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    send(input)
  }

  return (
    <>
      <Screen title={t('tab.ai')} subtitle={s('promise')}>
        {/* context tray */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {chips.map((c) => {
            const quote = c.kind === 'quote' ? quotes.find((q) => q.symbol === c.symbol) : undefined
            const sector = c.kind === 'sector' ? sectors.find((x) => x.id === c.id) : undefined
            const label = quote ? quote.name[lang] : sector ? sector.name[lang] : ''
            const change = quote ? quote.change : sector ? sector.change : 0
            const key = quote ? `q:${quote.symbol}` : sector ? `s:${sector.id}` : 'unknown'

            return (
              <span
                key={key}
                className="inline-flex h-11 items-center rounded-full border border-line bg-surface ps-3 pe-0.5"
              >
                <span className="text-[12px]">{label}</span>
                <span className={`num ms-2 text-[11px] ${toneOf(change)}`}>
                  {fmtPct(change, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => setChips((prev) => prev.filter((x) => !sameChip(x, c)))}
                  aria-label={`${s('remove')} ${label}`}
                  className="ms-1 flex h-11 w-10 items-center justify-center rounded-full text-muted"
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
              className="inline-flex h-11 items-center gap-1 rounded-full border border-dashed border-line px-3 text-[12px] text-muted"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {s('addObject')}
            </button>
          )}
        </div>

        {/* thread */}
        <div className="mt-5 space-y-5">
          {msgs.length === 0 && (
            <div className="pt-1">
              <p className="text-[12px] text-muted">{s('suggestTitle')}</p>
              <div className="mt-2 flex flex-col gap-2">
                {[s('suggest1'), s('suggest2'), s('suggest3'), s('suggest4')].map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={busy}
                    onClick={() => send(text)}
                    className="rounded-2xl border border-line bg-surface px-4 py-3 text-start text-[14px] disabled:opacity-60"
                  >
                    {text}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-muted">{s('disclaimer')}</p>
            </div>
          )}

          {msgs.map((m) =>
            m.role === 'user' ? (
              <UserBubble key={m.id} text={m.text} />
            ) : (
              <AssistantMessage key={m.id} m={m} />
            ),
          )}

          {typing && <TypingRow label={s('typing')} />}
        </div>

        <div ref={endRef} aria-hidden style={{ height: TAIL_SPACE }} />
      </Screen>

      {/* composer */}
      <div
        className="fixed z-40 glass"
        style={{
          insetInline: 12,
          maxWidth: 496,
          marginInline: 'auto',
          bottom: BAR_OFFSET,
          height: COMPOSER_H,
          borderRadius: 20,
          background: 'rgba(255,255,255,.9)',
          border: '1px solid var(--color-line)',
          boxShadow: 'var(--shadow-float)',
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
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={input.trim().length === 0 || busy}
            aria-label={s('send')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
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
          <div className="fixed inset-0 z-40" onClick={() => setSheet(false)} aria-hidden />
          <div
            role="dialog"
            aria-label={s('sheetTitle')}
            className="fixed z-40 rounded-2xl border border-line bg-surface"
            style={{
              insetInline: 12,
              bottom: SHEET_OFFSET,
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted"
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
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{o.label}</span>
                      <span className="block truncate text-[11px] text-muted">{o.sub}</span>
                    </span>
                    <span className={`num shrink-0 text-[12px] ${toneOf(o.change)}`}>
                      {fmtPct(o.change, lang)}
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
