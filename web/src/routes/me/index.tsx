import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { useI18n, useStrings } from '../../i18n'
import { useTheme } from '../../theme'
import type { ThemePref } from '../../theme'
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
  const { lang, setLang, t } = useI18n()
  const { pref, setTheme } = useTheme()
  const navigate = useNavigate()
  const s = useStrings(strings)
  // Demo identity only — there is no auth in this build.
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
      <section className="pt-3">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="num grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface text-[15px] font-semibold text-muted"
          >
            {initialsOf(name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="t-title truncate text-[22px] leading-tight font-semibold">{name}</p>
              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] leading-none text-muted">
                {t('common.demo')}
              </span>
            </div>
            <p className="mt-1 truncate text-[12px] leading-tight text-muted">{s('email')}</p>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="me-appearance">
        <h2 id="me-appearance" className="t-section pb-2">
          {s('appearance')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-appearance"
          className="border-t border-line"
        >
          {(['system', 'light', 'dark'] as ThemePref[]).map((mode) => {
            const active = pref === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(mode)}
                className="row w-full text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/5"
              >
                <span className="text-muted">
                  {mode === 'system' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="12" rx="2" />
                      <path d="M8 20h8M12 16v4" />
                    </svg>
                  ) : mode === 'light' ? (
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
                <span className="flex-1 text-[14px]">{s(mode)}</span>
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

      <section className="mt-8" aria-labelledby="me-more">
        <h2 id="me-more" className="t-section pb-2">
          {s('moreTitle')}
        </h2>
        <div className="border-t border-line">
          {[
            { to: '/alerts', label: s('moreAlerts') },
            { to: '/calendar', label: s('moreCalendar') },
            { to: '/review', label: s('moreReview') },
            { to: '/learn', label: s('glossary') },
            { to: '/ai/provider', label: s('moreProvider') },
            { to: '/settings', label: s('moreSettings') },
          ].map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="row transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/5"
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
            className="row w-full text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/5"
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

      <section className="mt-8" aria-labelledby="me-language">
        <h2 id="me-language" className="t-section pb-2">
          {s('language')}
        </h2>
        <div
          role="group"
          aria-labelledby="me-language"
          className="border-t border-line"
        >
          {LANGUAGES.map((row) => {
            const active = lang === row.id
            return (
              <button
                key={row.id}
                type="button"
                aria-pressed={active}
                onClick={() => setLang(row.id)}
                className="row w-full text-start transition-opacity active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] leading-tight">{s(row.native)}</span>
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
