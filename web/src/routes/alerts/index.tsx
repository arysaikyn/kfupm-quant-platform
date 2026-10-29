import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol, quotes } from '../../data/mock'
import { addAlert, removeAlert, rowsFor, updateAlert, useAlerts } from '../../store/alerts'
import type { AlertDir, AlertRow } from '../../store/alerts'
import { strings } from './strings'

type Dir = AlertDir
/** An armed delete disarms itself, so a stray second tap much later cannot fire. */
const CONFIRM_MS = 3000

/** 12px arrow: the text glyphs sit on different baselines in each locale. */
function DirIcon({ dir }: { dir: Dir }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'above' ? (
        <path d="M6 9.5v-7M6 2.5 2.8 5.7M6 2.5l3.2 3.2" />
      ) : (
        <path d="M6 2.5v7M6 9.5 2.8 6.3M6 9.5l3.2-3.2" />
      )}
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="m6.5 7 .8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 19.5H8L18.5 9a2.1 2.1 0 0 0-3-3L5 16.5v3z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

export default function AlertsPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)

  const alerts = useAlerts()
  const [params] = useSearchParams()
  const requested = params.get('symbol')
  const initialSymbol = requested && quoteBySymbol[requested] ? requested : quotes[0].symbol
  const [symbol, setSymbol] = useState(initialSymbol)
  const [dir, setDir] = useState<Dir>('above')
  const [threshold, setThreshold] = useState(() => String(quoteBySymbol[initialSymbol]?.price ?? quotes[0].price))
  const [error, setError] = useState<'invalid' | Dir | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const panelRef = useRef<HTMLElement>(null)

  const quote = quoteBySymbol[symbol] ?? quotes[0]

  const rows = useMemo(() => rowsFor(alerts), [alerts])

  const triggered = rows.filter((r) => r.triggered)
  const waiting = rows.filter((r) => !r.triggered)
  const sections = [
    { key: 'fired' as const, rows: triggered },
    { key: 'waiting' as const, rows: waiting },
  ].filter((g) => g.rows.length > 0)

  // Arabic joins break under the kicker's tracking; drop it there.
  const kicker = { letterSpacing: lang === 'ar' ? 0 : undefined }

  useEffect(() => {
    if (!confirmId) return
    const timer = setTimeout(() => setConfirmId(null), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [confirmId])

  function pickSymbol(next: string) {
    setSymbol(next)
    const q = quoteBySymbol[next]
    if (q) setThreshold(String(q.price))
    setError(null)
  }

  function startEdit(row: AlertRow) {
    setEditingId(row.id)
    setSymbol(row.symbol)
    setDir(row.dir)
    setThreshold(String(row.threshold))
    setError(null)
    setConfirmId(null)
    // The form sits above the list, so pull it into view and land the caret in
    // the one field that is allowed to change.
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      document.getElementById('alert-threshold')?.focus({ preventScroll: true })
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setThreshold(String(quote.price))
    setError(null)
  }

  // First tap arms, second tap deletes; arming another row moves the arm.
  function tapDelete(row: AlertRow) {
    if (confirmId !== row.id) {
      setConfirmId(row.id)
      return
    }
    removeAlert(row.id)
    if (editingId === row.id) setEditingId(null)
    setConfirmId(null)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = Number(threshold)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('invalid')
      return
    }
    // Prices are quoted in cents, so validate the value we will actually show.
    const value = Math.round(parsed * 100) / 100
    if (value <= 0) {
      setError('invalid')
      return
    }
    // A new alert must still be actionable, so it cannot start already met.
    // An edit is allowed to stay on the met side: the price may simply have
    // moved past a level the user is adjusting, and the row shows that.
    if (!editingId && (dir === 'above' ? value <= quote.price : value >= quote.price)) {
      setError(dir)
      return
    }
    if (editingId) updateAlert(editingId, { dir, threshold: value })
    else addAlert({ symbol, dir, threshold: value })
    setEditingId(null)
    setThreshold(String(quote.price))
    setError(null)
  }

  const errorText =
    error === 'invalid'
      ? s('errPrice')
      : error === 'above'
        ? s('errAbove')
        : error === 'below'
          ? s('errBelow')
          : ''

  return (
    <Screen
      title={s('title')}
      leading={<BackButton fallback="/" />}
    >
      <section ref={panelRef} className="panel mt-4 scroll-mt-4 p-4">
        <h2 className="t-section" style={kicker}>
          {s(editingId ? 'editTitle' : 'formTitle')}
        </h2>
        {editingId && <p className="mt-1 text-[11px] leading-snug text-muted">{s('editHint')}</p>}

        <form className="mt-3 space-y-3" onSubmit={submit} noValidate>
          <div>
            <label htmlFor="alert-symbol" className="text-[11px] leading-none text-muted">
              {s('symbol')}
            </label>
            <div className="relative mt-1.5">
              <select
                id="alert-symbol"
                value={symbol}
                disabled={editingId !== null}
                onChange={(e) => pickSymbol(e.target.value)}
                className="min-h-11 w-full appearance-none rounded-[10px] border border-line bg-bg ps-2.5 pe-9 text-[13px] text-fg disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {quotes.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol} · {q.name[lang]}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-muted)' }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div>
            <span id="alert-dir-label" className="text-[11px] leading-none text-muted">
              {s('direction')}
            </span>
            <div
              role="group"
              aria-labelledby="alert-dir-label"
              className="mt-1.5 grid grid-cols-2 gap-1 rounded-[12px] border border-line p-1"
            >
              {(['above', 'below'] as const).map((k) => {
                const active = dir === k
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setDir(k)
                      setError(null)
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[9px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-fg"
                    style={{
                      background: active ? 'var(--color-fg)' : 'transparent',
                      color: active ? 'var(--color-bg)' : 'var(--color-muted)',
                    }}
                  >
                    <DirIcon dir={k} />
                    {s(k)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="alert-threshold"
                className="text-[11px] leading-none text-muted"
              >
                {s('threshold')}
              </label>
              <span className="num text-[11px] text-muted">
                {s('current')} {fmtNum(quote.price, lang, 2)} {quote.currency}
              </span>
            </div>
            <div className="relative mt-1.5">
              <input
                id="alert-threshold"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                dir="ltr"
                value={threshold}
                aria-invalid={error !== null}
                aria-describedby={error ? 'alert-error' : undefined}
                onChange={(e) => {
                  setThreshold(e.target.value)
                  if (error) setError(null)
                }}
                className={`num min-h-11 w-full rounded-[10px] border bg-bg ps-3 pe-14 text-[14px] text-fg [appearance:textfield] focus-visible:outline-2 focus-visible:outline-fg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                  error ? 'border-fg' : 'border-line'
                }`}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-muted"
              >
                {quote.currency}
              </span>
            </div>
          </div>

          {error && (
            <p id="alert-error" role="alert" className="text-[12px] leading-snug" style={{ color: 'var(--color-danger)' }}>
              {errorText}
            </p>
          )}

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="min-h-11 shrink-0 rounded-full border border-line px-4 text-[13px] text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {s('cancel')}
              </button>
            )}
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-full bg-solid text-[13px] font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s(editingId ? 'save' : 'create')}
            </button>
          </div>
        </form>
      </section>

      {rows.length === 0 ? (
        <section className="mt-6">
          <EmptyState text={s('empty')} />
        </section>
      ) : (
        <>
          {sections.map((group) => (
            <section key={group.key} className="mt-8">
              <h2 className="t-section flex items-baseline justify-between gap-3 pb-3">
                {s(group.key === 'fired' ? 'triggered' : 'waiting')}
                <span className="num text-[12px] font-normal text-muted">
                  {group.rows.length}
                </span>
              </h2>
              <ul className="border-t border-line">
                {group.rows.map((r) => (
                  <li
                    key={r.id}
                    className={`row items-start py-3 ${editingId === r.id ? 'bg-fg/5' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="num text-[14px] font-semibold">{r.symbol}</span>
                        <span className="truncate text-[12px] text-muted">
                          {r.quote.name[lang]}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[12px] text-muted">{s(r.dir)}</div>
                    </div>

                    {/* Two prices, two lines, labelled: an unlabelled pair of
                        numbers a row apart is a guessing game. */}
                    <div className="shrink-0 text-end">
                      <span className="num block text-[14px] leading-none">
                        {fmtNum(r.threshold, lang, 2)}
                      </span>
                      <span className="mt-1.5 block text-[11px] leading-none text-muted">
                        {s('current')}{' '}
                        <span className="num" style={{ color: 'var(--color-fg)' }}>
                          {fmtNum(r.quote.price, lang, 2)}
                        </span>
                      </span>
                    </div>

                    {/* While a delete is armed the row narrows to one decision,
                        so the edit target does not sit under the same thumb. */}
                    {confirmId !== r.id && (
                      <button
                        type="button"
                        onClick={() => (editingId === r.id ? cancelEdit() : startEdit(r))}
                        aria-pressed={editingId === r.id}
                        aria-label={`${s('edit')} ${r.symbol}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                        style={{
                          color: editingId === r.id ? 'var(--color-fg)' : 'var(--color-muted)',
                        }}
                      >
                        <PencilIcon />
                      </button>
                    )}

                    {confirmId === r.id ? (
                      <button
                        type="button"
                        onClick={() => tapDelete(r)}
                        aria-label={`${s('confirmDelete')} ${r.symbol}`}
                        className="flex min-h-11 shrink-0 items-center rounded-full px-3 text-[11px] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        {s('confirmDelete')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => tapDelete(r)}
                        aria-label={`${s('delete')} ${r.symbol}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </Screen>
  )
}
