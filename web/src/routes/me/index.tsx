import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { useI18n, useStrings } from '../../i18n'
import { useTheme } from '../../theme'
import type { Theme } from '../../theme'
import type { Lang } from '../../i18n'
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
  const s = useStrings(strings)
  // Demo account state only — no real auth in this build.
  const [signedIn, setSignedIn] = useState(true)

  const name = s('name')

  return (
    <Screen
      title={s('title')}
    >
      <section className="pt-2">
        {signedIn ? (
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="num grid h-16 w-16 shrink-0 place-items-center rounded-full border border-line bg-surface text-[20px] font-semibold"
            >
              {initialsOf(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[18px] leading-tight font-semibold">{name}</p>
              <p className="mt-1.5 truncate text-[12.5px] text-muted">{s('email')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-3">
            <div
              aria-hidden="true"
              className="grid h-20 w-20 place-items-center rounded-full border border-line bg-surface text-muted"
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
              className="min-h-[48px] w-full rounded-[14px] bg-accent text-[15px] font-semibold text-[#0b0c0e] active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              {s('signIn')}
            </button>
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="me-appearance">
        <h2 id="me-appearance" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('appearance')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-appearance"
          className="flex gap-1 rounded-full border border-line bg-surface p-1"
        >
          {(['light', 'dark'] as Theme[]).map((mode) => {
            const active = theme === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(mode)}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors"
                style={
                  active
                    ? { background: 'var(--color-accent)', color: '#fff' }
                    : { color: 'var(--color-muted)' }
                }
              >
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
                {s(mode === 'light' ? 'light' : 'dark')}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="me-more">
        <h2 id="me-more" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('moreTitle')}
        </h2>
        <div className="panel divide-y divide-line overflow-hidden">
          {[
            { to: '/learn', label: s('glossary') },
            { to: '/watchlists', label: s('moreWatchlists') },
            { to: '/settings', label: s('moreSettings') },
          ].map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="flex min-h-[52px] items-center justify-between gap-3 px-4"
            >
              <span className="text-[14px]">{row.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)]" style={{ color: 'var(--color-muted)' }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="me-language">
        <h2 id="me-language" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('language')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-language"
          className="panel divide-y divide-line overflow-hidden"
        >
          {LANGUAGES.map((row) => {
            const active = lang === row.id
            return (
              <button
                key={row.id}
                type="button"
                aria-pressed={active}
                onClick={() => setLang(row.id)}
                className="flex min-h-[60px] w-full items-center gap-3 px-4 text-start transition-colors hover:bg-white/5 active:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-tight">{s(row.native)}</span>
                  <span className="mt-1 block truncate text-[12px] leading-tight text-muted">
                    {s(row.english)}
                  </span>
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
                    className="shrink-0 text-accent"
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
