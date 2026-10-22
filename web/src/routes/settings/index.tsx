import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { quotes } from '../../data/mock'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { useTheme } from '../../theme'
import { strings } from './strings'

const APP_VERSION = '0.1.0'
const DENSITY_KEY = 'settings.density'
const ALERTS_KEY = 'settings.alerts'

/**
 * The reset removes app data, not the reader's language or colour scheme:
 * losing those would make a settings reset feel like a different app.
 */
const RESET_KEYS = [
  'app.user',
  'app.ai.thread',
  'alerts.v1',
  'screener.screens',
  'watchlists.v1',
  'search.recent',
  'strategies.copied',
]

const PREVIEW = quotes.slice(0, 3)

type Density = 'comfortable' | 'compact'
type StringKey = keyof (typeof strings)['en']

const SOURCES: { name: StringKey; market: StringKey }[] = [
  { name: 'tadawul', market: 'tadawulMarket' },
  { name: 'sse', market: 'sseMarket' },
  { name: 'hkex', market: 'hkexMarket' },
  { name: 'reuters', market: 'reutersMarket' },
]

function readDensity(): Density {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

function readAlerts(): boolean {
  try {
    return localStorage.getItem(ALERTS_KEY) === 'true'
  } catch {
    return false
  }
}

function isResetKey(key: string): boolean {
  if (RESET_KEYS.includes(key)) return true
  if (key.startsWith('settings.')) return true
  return key.startsWith('strategy.') && key.endsWith('.rules')
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
    return true
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const { lang, dir } = useI18n()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const s = useStrings(strings)

  const [density, setDensity] = useState<Density>(readDensity)
  const [alerts, setAlerts] = useState<boolean>(readAlerts)
  const [armed, setArmed] = useState(false)
  const [resetFailed, setResetFailed] = useState(false)

  // The confirm state must not stay armed forever if the second tap never comes.
  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 6000)
    return () => window.clearTimeout(timer)
  }, [armed])

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/me')
  }

  const changeDensity = (next: Density) => {
    setDensity(next)
    try {
      localStorage.setItem(DENSITY_KEY, next)
    } catch {
      // Private browsing: the in-memory choice still applies.
    }
  }

  const toggleAlerts = () => {
    const next = !alerts
    setAlerts(next)
    try {
      localStorage.setItem(ALERTS_KEY, String(next))
    } catch {
      // Private browsing: the switch still moves, it just will not persist.
    }
  }

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

  const danger = theme === 'light' ? '#b42318' : '#ff7a88'
  const dangerContrast = theme === 'light' ? '#ffffff' : '#1b070b'
  const dangerBg = theme === 'light' ? 'rgba(180, 35, 24, 0.06)' : 'rgba(255, 122, 136, 0.10)'
  const dangerBorder = theme === 'light' ? 'rgba(180, 35, 24, 0.28)' : 'rgba(255, 122, 136, 0.30)'

  const back = (
    <button
      type="button"
      onClick={goBack}
      aria-label={s('back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{ border: '1px solid var(--color-line)', color: 'var(--color-fg)' }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
  )

  const rowPad = density === 'compact' ? 'py-1.5' : 'py-3'

  return (
    <Screen title={s('title')} leading={back}>
      <section className="mt-5" aria-labelledby="settings-reading">
        <h2 id="settings-reading" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('readingTitle')}
        </h2>

        <p id="settings-density-label" className="px-1 pb-2 text-[11.5px] leading-snug text-muted">
          {s('densityLabel')}
        </p>
        <div
          role="group"
          aria-labelledby="settings-density-label"
          className="flex gap-1 rounded-full border border-line bg-surface p-1"
        >
          {(['comfortable', 'compact'] as Density[]).map((mode) => {
            const active = density === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => changeDensity(mode)}
                className="min-h-[44px] flex-1 rounded-full px-3 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                style={
                  active
                    ? { background: 'var(--color-accent)', color: '#fff' }
                    : { color: 'var(--color-muted)' }
                }
              >
                {s(mode === 'comfortable' ? 'comfortable' : 'compact')}
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-[11.5px] leading-snug text-muted">{s('densityHint')}</p>

        <div className="panel mt-3 overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h3 className="t-kicker text-muted">{s('previewTitle')}</h3>
            <p className="mt-1 text-[11px] leading-snug text-muted">{s('previewHint')}</p>
          </div>
          <ul className="divide-y divide-line">
            {PREVIEW.map((q) => (
              <li key={q.symbol} className={`flex items-center gap-3 px-4 ${rowPad}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] leading-tight font-medium">{q.name[lang]}</p>
                  <p className="num mt-1 text-[11px] leading-tight text-muted">
                    <bdi dir="ltr">
                      {q.symbol} · {q.currency}
                    </bdi>
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="num text-[14px] leading-tight font-semibold">
                    {fmtNum(q.price, lang, 2)}
                  </p>
                  <p
                    className={`num mt-1 text-[11.5px] leading-tight ${
                      q.change >= 0 ? 'text-up' : 'text-down'
                    }`}
                  >
                    {fmtPct(q.change, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="settings-sources">
        <h2 id="settings-sources" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('sourcesTitle')}
        </h2>
        <p className="px-1 pb-2 text-[11.5px] leading-snug text-muted">{s('sourcesHint')}</p>
        <ul className="panel divide-y divide-line overflow-hidden">
          {SOURCES.map((source) => (
            <li key={source.name} className="flex min-h-[58px] items-center gap-3 px-4 py-2.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: 'var(--color-muted)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] leading-tight font-medium">
                  {s(source.name)}
                </p>
                <p className="mt-1 truncate text-[11.5px] leading-tight text-muted">
                  {s(source.market)}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-tight font-semibold tracking-[0.06em]"
                style={{
                  color: 'var(--color-muted)',
                  background: 'color-mix(in srgb, var(--color-fg) 7%, transparent)',
                  border: '1px solid var(--color-line)',
                }}
              >
                {s('chipDemo')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7" aria-labelledby="settings-notifications">
        <h2 id="settings-notifications" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('notificationsTitle')}
        </h2>
        <div className="panel overflow-hidden">
          <div className="flex min-h-[56px] items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1 truncate text-[14.5px] leading-tight font-medium">
              {s('alertsLabel')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={alerts}
              aria-label={s('alertsLabel')}
              onClick={toggleAlerts}
              className="-me-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span
                aria-hidden="true"
                className="relative block h-[30px] w-[52px] rounded-full"
                style={{
                  background: alerts
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-fg) 18%, transparent)',
                  transition: 'background-color 180ms var(--ease-soft)',
                }}
              >
                <span
                  className="absolute top-[3px] block h-6 w-6 rounded-full bg-white"
                  style={{
                    insetInlineStart: alerts ? 'calc(100% - 27px)' : '3px',
                    transition: 'inset-inline-start 180ms var(--ease-soft)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
                  }}
                />
              </span>
            </button>
          </div>
          <p className="border-t border-line px-4 py-2.5 text-[11.5px] leading-snug text-muted">
            {s('alertsHint')}
          </p>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="settings-about">
        <h2 id="settings-about" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('aboutTitle')}
        </h2>
        <div className="panel divide-y divide-line overflow-hidden">
          <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
            <span className="text-[12.5px] text-muted">{s('appLabel')}</span>
            <span className="truncate text-[14px] leading-tight font-medium">{s('appName')}</span>
          </div>
          <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
            <span className="text-[12.5px] text-muted">{s('versionLabel')}</span>
            <span className="num text-[13px] leading-tight">{APP_VERSION}</span>
          </div>
          <Link
            to="/learn"
            className="flex min-h-[56px] items-center gap-3 px-4 transition-colors hover:bg-white/5 active:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] leading-tight font-medium">
                {s('learn')}
              </span>
              <span className="mt-1 block truncate text-[11.5px] leading-tight text-muted">
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

      <section className="mt-7" aria-labelledby="settings-reset">
        <h2 id="settings-reset" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('resetTitle')}
        </h2>
        <div className="panel px-4 py-4">
          <p id="settings-reset-copy" className="text-[12px] leading-relaxed text-muted">
            {s('resetHint')}
          </p>
          <button
            type="button"
            onClick={reset}
            aria-describedby="settings-reset-copy"
            className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            style={
              armed
                ? { background: danger, color: dangerContrast }
                : { background: dangerBg, color: danger, border: `1px solid ${dangerBorder}` }
            }
          >
            {s(armed ? 'resetConfirm' : 'resetButton')}
          </button>
          {armed && (
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-full text-[12.5px] text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              {s('resetCancel')}
            </button>
          )}
          <p
            aria-live="polite"
            className="mt-1 min-h-[1.2em] text-center text-[11.5px] leading-snug"
            style={{ color: resetFailed ? danger : 'var(--color-muted)' }}
          >
            {resetFailed ? s('resetError') : armed ? s('resetArmedHint') : ''}
          </p>
        </div>
      </section>
    </Screen>
  )
}
