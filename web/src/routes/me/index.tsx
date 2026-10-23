import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { useI18n, useStrings } from '../../i18n'
import { useTheme } from '../../theme'
import type { Theme } from '../../theme'
import type { Lang } from '../../i18n'
import { resetOnboarding } from '../../store/prefs'
import { strings } from './strings'

type StringKey = keyof (typeof strings)['en']

const LANGUAGES: { id: Lang; native: StringKey; english: StringKey }[] = [
  { id: 'zh', native: 'langZh', english: 'langZhEnglish' },
  { id: 'en', native: 'langEn', english: 'langEnEnglish' },
  { id: 'ar', native: 'langAr', english: 'langArEnglish' },
]

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() ?? '')
    .join('')
}

export default function MePage() {
  const { lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const s = useStrings(strings)
  // Demo account state only — no real auth in this build.
  const [signedIn, setSignedIn] = useState(true)

  const name = s('name')

  // Clearing the flag unmounts the tab shell on the next render; the explicit
  // navigate keeps the URL honest even if the guard lands a beat later.
  const replayOnboarding = () => {
    resetOnboarding()
    navigate('/welcome')
  }

  return (
    <Screen
      title={s('title')}
    >
      <section className="pt-2">
        {signedIn ? (
          <div className="panel row min-h-[88px] gap-4">
            <div
              aria-hidden="true"
              className="num grid h-16 w-16 shrink-0 place-items-center rounded-full bg-bg text-[20px] font-semibold"
            >
              {initialsOf(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[18px] leading-tight font-semibold">{name}</p>
              <p className="mt-1.5 truncate text-[12px] text-muted">{s('email')}</p>
            </div>
          </div>
        ) : (
          <div className="panel flex flex-col items-center gap-5 px-4 py-6">
            <div
              aria-hidden="true"
              className="grid h-20 w-20 place-items-center rounded-full bg-bg text-muted"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <circle cx="12" cy="9" r="3.4" />
                <path d="M5.5 19.2c1.1-3.4 3.6-5 6.5-5s5.4 1.6 6.5 5" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setSignedIn(true)}
              className="h-12 w-full rounded-full bg-solid text-[15px] font-semibold text-white active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              {s('signIn')}
            </button>
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="me-appearance">
        <h2 id="me-appearance" className="t-section mb-2 ">
          {s('appearance')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-appearance"
          className="panel"
        >
          {(['light', 'dark'] as Theme[]).map((mode) => {
            const active = theme === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(mode)}
                className="row w-full text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5"
              >
                <span className="text-muted">
                  {mode === 'light' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-[15px]">{s(mode === 'light' ? 'light' : 'dark')}</span>
                {active && (
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-fg"
                  >
                    <path d="M5 12.5l4.6 4.6L19 7.6" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="me-more">
        <h2 id="me-more" className="t-section mb-2 ">
          {s('moreTitle')}
        </h2>
        <div className="panel overflow-hidden">
          {[
            { to: '/learn', label: s('glossary') },
            { to: '/settings', label: s('moreSettings') },
          ].map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="row transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5"
            >
              <span className="flex-1 text-[14px]">{row.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)] shrink-0 text-muted">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
          <button
            type="button"
            onClick={replayOnboarding}
            className="row w-full text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5"
          >
            <span className="flex-1 text-[14px]">{s('replayOnboarding')}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-muted"
              aria-hidden="true"
            >
              <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
              <path d="M3.5 4.5V10h5.5" />
            </svg>
          </button>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="me-language">
        <h2 id="me-language" className="t-section mb-2 ">
          {s('language')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-language"
          className="panel overflow-hidden"
        >
          {LANGUAGES.map((row) => {
            const active = lang === row.id
            return (
              <button
                key={row.id}
                type="button"
                aria-pressed={active}
                onClick={() => setLang(row.id)}
                className="row w-full text-start transition-opacity active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-tight">{s(row.native)}</span>
                  {/* The English row would print "English" over "English". */}
                  {s(row.english) !== s(row.native) && (
                    <span className="mt-1 block truncate text-[12px] leading-tight text-muted">
                      {s(row.english)}
                    </span>
                  )}
                </span>
                {active && (
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-fg"
                  >
                    <path d="M5 12.5l4.6 4.6L19 7.6" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </section>

    </Screen>
  )
}
