import { useState } from 'react'
import { Screen } from '../../components/Screen'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { useTheme } from '../../theme'
import type { Theme } from '../../theme'
import type { Lang } from '../../i18n'
import { removeJournal, useUser } from '../../store/user'
import { strings } from './strings'

const APP_VERSION = '0.1.0'

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

/** Arabic keeps Western digits, matching fmtNum in src/i18n. */
const REL_LOCALES: Record<Lang, string> = {
  zh: 'zh',
  en: 'en',
  ar: 'ar-SA-u-nu-latn',
}

/** "3 minutes ago" / "قبل 3 دقائق" — Intl owns the wording, never hand-built. */
function relTime(at: number, now: number, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(REL_LOCALES[lang], { numeric: 'auto' })
  const minutes = Math.max(0, Math.round((now - at) / 60_000))
  if (minutes < 1) return rtf.format(0, 'minute')
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

export default function MePage() {
  const { lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const { journal } = useUser()
  const s = useStrings(strings)
  // Demo account state only — no real auth in this build.
  const [signedIn, setSignedIn] = useState(true)

  const name = s('name')
  // Store keeps entries newest first; notional is unsigned (qty × price).
  const [now] = useState(() => Date.now())
  const notional = journal.reduce((sum, e) => sum + e.qty * e.price, 0)

  return (
    <Screen title={s('title')}>
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

      <section className="mt-8" aria-labelledby="me-journal">
        <h2 id="me-journal" className="px-1 pb-2 text-[12px] font-medium text-muted">
          {s('journalTitle')}
        </h2>

        <div className="panel grid grid-cols-2 overflow-hidden">
          <div className="min-w-0 px-4 py-3">
            <p className="text-[11px] leading-tight text-muted">{s('journalTotal')}</p>
            <p className="num mt-1 text-[16px] leading-tight font-semibold">
              {fmtNum(journal.length, lang, 0)}
            </p>
          </div>
          <div
            className="min-w-0 px-4 py-3"
            style={{ borderInlineStart: '1px solid var(--color-line)' }}
          >
            <p className="text-[11px] leading-tight text-muted">{s('journalNotional')}</p>
            <p className="num mt-1 text-[16px] leading-tight font-semibold">
              {fmtNum(notional, lang, 2)}
            </p>
          </div>
        </div>

        {journal.length === 0 ? (
          <p className="panel mt-2 px-4 py-3.5 text-[12.5px] leading-snug text-muted">
            {s('journalEmpty')}
          </p>
        ) : (
          <ul className="panel mt-2 divide-y divide-line overflow-hidden">
            {journal.map((e) => {
              const isBuy = e.side === 'buy'
              const tone = isBuy ? 'var(--color-up)' : 'var(--color-down)'
              return (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] leading-tight font-semibold">
                        {e.symbol}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] leading-tight font-semibold"
                        style={{
                          color: tone,
                          background: `color-mix(in srgb, ${tone} 14%, transparent)`,
                        }}
                      >
                        {s(isBuy ? 'sideBuy' : 'sideSell')}
                      </span>
                    </div>
                    <p className="num mt-1 text-[12px] leading-tight text-muted">
                      {fmtNum(e.qty, lang, Number.isInteger(e.qty) ? 0 : 2)} ×{' '}
                      {fmtNum(e.price, lang, 2)} · {relTime(e.at, now, lang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeJournal(e.id)}
                    aria-label={`${s('journalDelete')} ${e.symbol}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-fg active:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <svg
                      aria-hidden="true"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16M9.5 7V5.6A1.6 1.6 0 0111.1 4h1.8a1.6 1.6 0 011.6 1.6V7M6.6 7l.8 12.1a1.6 1.6 0 001.6 1.5h6a1.6 1.6 0 001.6-1.5L17.4 7M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className="mt-10 pb-2 text-center text-[11px] text-muted">
        <span>{s('version')}</span> <span className="num">{APP_VERSION}</span>
      </footer>
    </Screen>
  )
}
