import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { EmptyState, Skeleton } from '../../components/states'
import { Screen } from '../../components/Screen'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { plural, relTime } from '../../i18n/format'
import { aiApi } from '../../api/ai'
import type { SessionItem } from '../../api/ai'
import { strings } from './strings'
import type { RunsStrings } from './strings'

export default function RunsPage() {
  const { lang } = useI18n()
  const s = useStrings<RunsStrings>(strings)
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    aiApi
      .listSessions()
      .then((items) => {
        if (!cancelled) setSessions(items)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : s('offline'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [s])

  async function remove(id: string) {
    if (confirmId !== id) {
      setConfirmId(id)
      window.setTimeout(() => setConfirmId((current) => (current === id ? null : current)), 4000)
      return
    }
    try {
      await aiApi.deleteSession(id)
      setSessions((prev) => prev.filter((session) => session.session_id !== id))
      setConfirmId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : s('offline'))
    }
  }

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/ai" />}>
      <div className="pt-4">
        <p className="text-[14px] leading-relaxed text-muted">{s('lead')}</p>

        {error && (
          <div role="alert" className="panel mt-4 border-danger/40 p-3">
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setLoading(true)
                aiApi
                  .listSessions()
                  .then(setSessions)
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : s('offline')),
                  )
                  .finally(() => setLoading(false))
              }}
              className="mt-2 min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s('retry')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6">
            <Skeleton rows={4} />
          </div>
        ) : sessions.length === 0 && !error ? (
          <EmptyState text={s('empty')} />
        ) : (
          <>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="t-display num text-[40px] leading-none">
                {fmtNum(sessions.length, lang, 0)}
              </span>
              <span className="text-[12px] text-muted">
                {plural(lang, sessions.length, {
                  other:
                    lang === 'zh' ? '个会话' : lang === 'ar' ? 'جلسة' : 'sessions',
                  one: lang === 'ar' ? 'جلسة' : 'session',
                  two: 'جلستان',
                  few: 'جلسات',
                  many: 'جلسة',
                })}
              </span>
            </div>

            <ul className="mt-4 border-t border-line">
              {sessions.map((session) => {
                const updated = Date.parse(session.updated_at)
                const minutes = Number.isFinite(updated)
                  ? Math.max(1, (now - updated) / 60_000)
                  : 1
                return (
                  <li key={session.session_id} className="flex items-stretch border-b border-line">
                    <button
                      type="button"
                      onClick={() => navigate(`/ai?session=${encodeURIComponent(session.session_id)}`)}
                      className="min-h-14 min-w-0 flex-1 py-3 pe-3 text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    >
                      <span className="block truncate text-[14px] font-medium">
                        {session.title || s('untitled')}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                        <time dateTime={session.updated_at}>
                          {relTime(minutes, lang)}
                        </time>
                        <span aria-hidden>·</span>
                        <span>
                          {session.status === 'active'
                            ? s('statusActive')
                            : session.status === 'idle'
                              ? s('statusIdle')
                              : session.status}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(session.session_id)}
                      className={`my-1 flex min-h-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                        confirmId === session.session_id
                          ? 'min-w-0 px-2'
                          : 'min-w-11 text-muted hover:text-fg'
                      }`}
                      aria-label={`${confirmId === session.session_id ? s('confirmDelete') : s('delete')} ${session.title || ''}`}
                      style={
                        confirmId === session.session_id
                          ? { color: 'var(--color-danger)' }
                          : undefined
                      }
                    >
                      {confirmId === session.session_id ? (
                        <span className="whitespace-nowrap text-[11px]">{s('confirmDelete')}</span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <Link
          to="/ai?new=1"
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-solid px-5 text-[15px] font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
        >
          {sessions.length === 0 ? s('askFirst') : s('newQuestion')}
        </Link>
      </div>
    </Screen>
  )
}
