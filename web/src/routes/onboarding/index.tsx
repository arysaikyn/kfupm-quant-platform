import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useI18n, useStrings } from '../../i18n'
import { completeOnboarding } from '../../store/prefs'
import type { Market } from '../../store/prefs'
import { strings } from './strings'

type StringKey = keyof (typeof strings)['en']
type S = (k: StringKey) => string

const TOTAL = 5
const MARKETS: Market[] = ['sa', 'cn', 'hk']

const MARKET_COPY: Record<Market, { name: StringKey; sub: StringKey; code: string }> = {
  sa: { name: 'mSa', sub: 'mSaSub', code: 'SA' },
  cn: { name: 'mCn', sub: 'mCnSub', code: 'CN' },
  hk: { name: 'mHk', sub: 'mHkSub', code: 'HK' },
}

const TITLES: StringKey[] = ['valueTitle', 'evidenceTitle', 'shariaTitle', 'marketTitle', 'doneTitle']
const BODIES: StringKey[] = ['valueBody', 'evidenceBody', 'shariaBody', 'marketBody', 'doneBody']

const RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/** 180ms slide+fade. The offset is set per step, so RTL slides from the other side. */
const MOTION_CSS = `
@keyframes onb-slide {
  from { opacity: 0; transform: translate3d(var(--onb-x, 14px), 0, 0); }
  to { opacity: 1; transform: none; }
}
.onb-step { animation: onb-slide 180ms var(--ease-soft) both; }
@media (prefers-reduced-motion: reduce) {
  .onb-step { animation: none; }
}
`

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

function PassMark() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  )
}

function FailMark() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

/** One rule line: the same rhythm as `.row`, smaller because it is a picture. */
function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 border-t border-line px-4">
      <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{label}</span>
      <span dir="ltr" className="num shrink-0 text-[13px] font-medium">
        {value}
      </span>
    </div>
  )
}

function EvidenceRow({ label, value, tag }: { label: string; value: string; tag: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2.5 border-t border-line px-4 first:border-t-0">
      <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{label}</span>
      <span dir="ltr" className="num text-[14px] font-medium">
        {value}
      </span>
      <span className="shrink-0 rounded-full bg-fg/10 px-2 py-1 text-[11px] leading-none font-medium text-fg">
        {tag}
      </span>
    </div>
  )
}

function ShariaRow({
  label,
  value,
  ok,
  ltr = true,
}: {
  label: string
  value: string
  ok: boolean
  ltr?: boolean
}) {
  return (
    <div className="flex min-h-11 items-center gap-2.5 border-t border-line px-4">
      <span
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${
          ok ? 'bg-fg/15 text-fg' : 'border border-line text-muted'
        }`}
      >
        {ok ? <PassMark /> : <FailMark />}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[12px] ${ok ? 'text-fg' : 'text-muted'}`}
      >
        {label}
      </span>
      <span
        dir={ltr ? 'ltr' : undefined}
        className={`shrink-0 text-[11px] ${ltr ? 'num' : ''} ${
          ok ? 'text-muted' : 'text-muted line-through'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function ValueCard({ s }: { s: S }) {
  return (
    <div className="panel overflow-hidden">
      <p className="px-4 pt-4 pb-3.5 text-[13px] leading-[1.5]">“{s('valueQuery')}”</p>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
        {s('valueParsed')}
      </p>
      <RuleRow label={s('valueRule1')} value={s('valueRule1Value')} />
      <RuleRow label={s('valueRule2')} value={s('valueRule2Value')} />
      <RuleRow label={s('valueRule3')} value={s('valueRule3Value')} />
      <div className="flex items-baseline justify-between gap-3 border-t border-line px-4 py-3">
        <span className="text-[11px] text-muted">{s('valueFootLabel')}</span>
        <span dir="ltr" className="num shrink-0 text-[13px] font-semibold text-fg">
          {s('valueFootValue')}
        </span>
      </div>
    </div>
  )
}

function EvidenceCard({ s }: { s: S }) {
  const { lang } = useI18n()
  return (
    <div className="panel overflow-hidden">
      <p
        className="t-kicker px-4 pt-3.5 pb-3 text-muted"
        style={{ letterSpacing: lang === 'ar' ? 0 : undefined }}
      >
        {s('evidenceHead')}
      </p>
      <div className="border-t border-line">
        <EvidenceRow label={s('evPrice')} value={s('evPriceValue')} tag={s('evEngineTag')} />
        <EvidenceRow label={s('evPe')} value={s('evPeValue')} tag={s('evEngineTag')} />
        <EvidenceRow label={s('evYield')} value={s('evYieldValue')} tag={s('evEngineTag')} />
      </div>
      <p className="border-t border-line px-4 py-2.5 text-[10.5px] leading-snug text-muted">
        {s('evidenceFoot')}
      </p>
    </div>
  )
}

function ShariaCard({ s }: { s: S }) {
  const { lang } = useI18n()
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <span className="t-kicker text-muted" style={{ letterSpacing: lang === 'ar' ? 0 : undefined }}>
          {s('shariaHead')}
        </span>
        <span dir="ltr" className="num rounded-full bg-fg/10 px-2 py-1 text-[10.5px] leading-none font-medium text-fg">
          {s('shariaCount')}
        </span>
      </div>
      <ShariaRow label={s('shDebt')} value={s('shDebtValue')} ok />
      <ShariaRow label={s('shInterest')} value={s('shInterestValue')} ok />
      <ShariaRow label={s('shIncome')} value={s('shIncomeValue')} ok />
      <ShariaRow label={s('shReceivable')} value={s('shReceivableValue')} ok />
      <ShariaRow label={s('shCore')} value={s('shCoreValue')} ok ltr={false} />
      <ShariaRow label={s('shSub')} value={s('shSubValue')} ok={false} ltr={false} />
      <p className="border-t border-line px-4 py-2.5 text-[10.5px] leading-snug text-muted">
        {s('shariaFoot')}
      </p>
    </div>
  )
}

export default function OnboardingPage() {
  const { lang, dir } = useI18n()
  const s = useStrings(strings)

  const [step, setStep] = useState(1)
  const [market, setMarket] = useState<Market | null>(null)
  // +1 slides in from the end, -1 from the start; RTL flips the offset below.
  const [slide, setSlide] = useState(1)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLElement>(null)
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const firstPaint = useRef(true)

  const go = useCallback(
    (target: number) => {
      setSlide(target > step ? 1 : -1)
      setStep(target)
    },
    [step],
  )

  const finish = useCallback(() => {
    if (!market) return
    completeOnboarding(market)
    // A hard replace: no back button walks into onboarding, and the guard in
    // App re-reads the stored flag on the next paint.
    window.location.replace(import.meta.env.BASE_URL)
  }, [market])

  const next = useCallback(() => {
    if (step === TOTAL) {
      finish()
      return
    }
    if (step === 4) {
      if (!market) {
        radioRefs.current[0]?.focus()
        return
      }
      go(5)
      return
    }
    go(step + 1)
  }, [step, market, go, finish])

  // Enter advances from anywhere except a control that handles Enter itself
  // (a button click, a radio, a field) — there it would fire twice.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter' || e.repeat) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('button, a, input, select, textarea, [role="radio"]')) return
      e.preventDefault()
      next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next])

  // A fresh step starts at the top, and the heading takes focus so a screen
  // reader reads the new idea before the controls.
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false
      return
    }
    window.scrollTo(0, 0)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
    const frame = window.requestAnimationFrame(() =>
      headingRef.current?.focus({ preventScroll: true }),
    )
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  function onMarketKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    const k = e.key
    if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'ArrowRight' && k !== 'ArrowLeft') return
    e.preventDefault()
    const forward =
      k === 'ArrowDown' || (k === 'ArrowRight' && dir === 'ltr') || (k === 'ArrowLeft' && dir === 'rtl')
    const current = market ? MARKETS.indexOf(market) : -1
    const index =
      current === -1
        ? forward
          ? 0
          : MARKETS.length - 1
        : (current + (forward ? 1 : -1) + MARKETS.length) % MARKETS.length
    setMarket(MARKETS[index])
    radioRefs.current[index]?.focus()
  }

  const offset = slide * (dir === 'rtl' ? -14 : 14)

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <style href="onb-motion" precedence="default">
        {MOTION_CSS}
      </style>

      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors duration-200"
            style={{ background: i < step ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </div>

      <div className="flex h-11 items-center">
        {step > 1 && step < TOTAL && (
          <button
            type="button"
            onClick={() => go(step - 1)}
            aria-label={s('back')}
            className={`tap -ms-2 rounded-full text-muted active:bg-fg/10 ${RING}`}
          >
            <span style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}>
              <Chevron />
            </span>
          </button>
        )}
        <span className="flex-1" />
        <p className="num ps-2 text-[11px] text-muted">{s('stepOf').replace('{n}', String(step))}</p>
        {step <= 3 && (
          <button
            type="button"
            onClick={() => go(4)}
            className={`tap -me-2 rounded-full px-2 text-[12px] font-medium text-muted active:bg-fg/10 ${RING}`}
          >
            {s('skip')}
          </button>
        )}
      </div>

      <main ref={bodyRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div aria-live="polite" aria-atomic="false" className="flex flex-1 flex-col">
          <div
            key={step}
            className="onb-step my-auto py-5"
            style={{ '--onb-x': `${offset}px` } as CSSProperties}
          >
            <h1
              id="onb-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="t-title rounded-sm text-[26px] leading-[1.2] font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg max-[380px]:text-[24px]"
            >
              {s(TITLES[step - 1])}
            </h1>
            <p className="mt-3 max-w-[42ch] text-[13px] leading-[1.6] text-muted">{s(BODIES[step - 1])}</p>

            <div className="mt-7">
              {step === 1 && <ValueCard s={s} />}
              {step === 2 && <EvidenceCard s={s} />}
              {step === 3 && <ShariaCard s={s} />}

              {step === 4 && (
                <>
                  <div
                    role="radiogroup"
                    aria-labelledby="onb-step-heading"
                    onKeyDown={onMarketKey}
                    className="flex flex-col gap-2.5"
                  >
                    {MARKETS.map((m, i) => {
                      const selected = market === m
                      const copy = MARKET_COPY[m]
                      return (
                        <button
                          key={m}
                          ref={(el) => {
                            radioRefs.current[i] = el
                          }}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          tabIndex={market ? (selected ? 0 : -1) : i === 0 ? 0 : -1}
                          onClick={() => setMarket(m)}
                          className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-colors active:bg-fg/5 ${RING} ${
                            selected ? 'border-fg bg-fg/10' : 'border-line'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`num grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${
                              selected ? 'border-fg/40 text-fg' : 'border-line text-muted'
                            }`}
                          >
                            {copy.code}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] leading-tight font-medium">
                              {s(copy.name)}
                            </span>
                            <span className="mt-1 block truncate text-[11px] leading-none text-muted">
                              {s(copy.sub)}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border ${
                              selected ? 'border-fg' : 'border-line'
                            }`}
                          >
                            {selected && <span className="h-[10px] w-[10px] rounded-full bg-accent" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {!market && (
                    <p id="onb-market-hint" className="mt-3 px-1 text-[12px] text-muted">
                      {s('marketHint')}
                    </p>
                  )}
                </>
              )}

              {step === 5 && market && (
                <div className="panel px-4 py-4">
                  <p
                    className="t-kicker text-muted"
                    style={{ letterSpacing: lang === 'ar' ? 0 : undefined }}
                  >
                    {s('doneFollowing')}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/15 text-[11px] font-semibold text-fg"
                    >
                      {MARKET_COPY[market].code}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] leading-tight font-medium">
                        {s(MARKET_COPY[market].name)}
                      </p>
                      <p className="mt-1 truncate text-[11px] leading-none text-muted">
                        {s(MARKET_COPY[market].sub)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-4 flex flex-col gap-2.5">
        {step < TOTAL ? (
          <button
            type="button"
            onClick={next}
            disabled={step === 4 && !market}
            aria-describedby={step === 4 && !market ? 'onb-market-hint' : undefined}
            className={`flex min-h-12 w-full items-center justify-center rounded-full bg-solid px-5 text-[15px] font-semibold text-bg transition-opacity active:opacity-80 disabled:opacity-40 ${RING}`}
          >
            {s('continue')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={finish}
              className={`flex min-h-12 w-full items-center justify-center rounded-full bg-solid px-5 text-[15px] font-semibold text-bg transition-opacity active:opacity-80 ${RING}`}
            >
              {s('doneOpen')}
            </button>
            <button
              type="button"
              onClick={finish}
              className={`flex min-h-12 w-full items-center justify-center rounded-full border border-line px-5 text-[15px] font-medium text-fg transition-colors active:bg-fg/10 ${RING}`}
            >
              {s('doneBrowse')}
            </button>
          </>
        )}
      </footer>
    </div>
  )
}
