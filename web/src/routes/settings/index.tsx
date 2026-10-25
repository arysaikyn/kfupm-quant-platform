import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { useI18n, useStrings } from '../../i18n'
import { strings } from './strings'

const APP_VERSION = '0.2.0'

/**
 * The reset removes app data, not the reader's language or colour scheme:
 * losing those would make a settings reset feel like a different app.
 */
const RESET_KEYS = [
  'app.user',
  'app.ai.session',
  'app.ai.intake',
  'alerts.v1',
  'screener.screens',
  'watchlists.v1',
  'search.recent',
  'news.saved.v1',
]

const SESSION_KEYS = ['app.ai.intake']

function isResetKey(key: string): boolean {
  return RESET_KEYS.includes(key)
}

/** Collect first, remove second: mutating during key(i) iteration skips entries. */
function clearLocalData(): boolean {
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && isResetKey(key)) doomed.push(key)
    }
    doomed.forEach((key) => localStorage.removeItem(key))
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key))
    return true
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const { dir } = useI18n()
  const s = useStrings(strings)
  const [armed, setArmed] = useState(false)
  const [resetFailed, setResetFailed] = useState(false)

  // The confirm state must not stay armed forever if the second tap never comes.
  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 6000)
    return () => window.clearTimeout(timer)
  }, [armed])

  const reset = () => {
    if (!armed) {
      setResetFailed(false)
      setArmed(true)
      return
    }
    if (!clearLocalData()) {
      setArmed(false)
      setResetFailed(true)
      return
    }
    window.location.reload()
  }

  const danger = 'var(--color-danger)'
  const dangerContrast = 'var(--color-bg)'
  const dangerBg = 'color-mix(in srgb, var(--color-danger) 10%, transparent)'

  const back = <BackButton fallback="/me" />

  return (
    <Screen title={s('title')} leading={back}>
      <section className="mt-4" aria-labelledby="settings-about">
        <h2 id="settings-about" className="t-section pb-2">
          {s('aboutTitle')}
        </h2>
        <div className="border-t border-line">
          <div className="row justify-between">
            <span className="text-[12px] text-muted">{s('appLabel')}</span>
            <span className="truncate text-[14px] leading-tight font-medium">{s('appName')}</span>
          </div>
          <div className="row justify-between">
            <span className="text-[12px] text-muted">{s('versionLabel')}</span>
            <span className="num text-[12px] leading-tight">{APP_VERSION}</span>
          </div>
          <Link
            to="/learn"
            className="row transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] leading-tight font-medium">
                {s('learn')}
              </span>
              <span className="mt-1 block truncate text-[11px] leading-tight text-muted">
                {s('learnHint')}
              </span>
            </span>
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
              className="shrink-0 text-muted"
              style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="settings-sources">
        <h2 id="settings-sources" className="t-section pb-2">
          {s('sourcesTitle')}
        </h2>
        <p className="pb-2 text-[11px] leading-snug text-muted">{s('sourcesHint')}</p>
        <ul className="border-t border-line">
          {(
            [
              ['tadawul', 'tadawulMarket'],
              ['sse', 'sseMarket'],
              ['hkex', 'hkexMarket'],
              ['reuters', 'reutersMarket'],
            ] as const
          ).map(([name, market]) => (
            <li key={name} className="row py-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: 'var(--color-muted)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] leading-tight font-medium">{s(name)}</p>
                <p className="mt-1 truncate text-[11px] leading-tight text-muted">{s(market)}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-fg/10 px-2 py-0.5 text-[11px] leading-tight font-semibold text-muted">
                {s('chipDemo')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 pb-10" aria-labelledby="settings-reset">
        <h2 id="settings-reset" className="t-section pb-2">
          {s('resetTitle')}
        </h2>
        <div className="border-t border-line pt-3">
          <p id="settings-reset-copy" className="text-[12px] leading-relaxed text-muted">
            {s('resetHint')}
          </p>
          <button
            type="button"
            onClick={reset}
            aria-describedby="settings-reset-copy"
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-line px-4 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            style={
              armed
                ? { background: danger, color: dangerContrast }
                : { background: dangerBg, color: danger }
            }
          >
            {s(armed ? 'resetConfirm' : 'resetButton')}
          </button>
          {armed && (
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="mt-1 flex min-h-11 w-full items-center justify-center rounded-full text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
            >
              {s('resetCancel')}
            </button>
          )}
          <p
            aria-live="polite"
            className="mt-1 min-h-[1.2em] text-center text-[11px] leading-snug"
            style={{ color: resetFailed ? danger : 'var(--color-muted)' }}
          >
            {resetFailed ? s('resetError') : armed ? s('resetArmedHint') : ''}
          </p>
        </div>
      </section>
    </Screen>
  )
}
