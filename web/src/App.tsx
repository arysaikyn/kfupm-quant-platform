import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { RouteFallback } from './components/RouteFallback'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FatalError } from './components/FatalError'
import { OfflineBanner } from './components/OfflineBanner'
import { usePrefs } from './store/prefs'
import { markRouteSeen } from './store/learn'
import { useI18n } from './i18n'
import { useOnline } from './lib/useOnline'
import { safeNext } from './lib/next'
import { SCREENS, TAB_PATHS, titleKeyOf } from './screens'

const NotFoundPage = lazy(() => import('./routes/not-found'))
const WelcomePage = lazy(() => import('./routes/onboarding'))

/**
 * Every screen is its own chunk. `src/screens` says which chunk, what the
 * title is, and which tab stays lit; this file only assembles them.
 */
const PAGES = SCREENS.map((screen) => ({ ...screen, Page: lazy(screen.load) }))

/** Chunks worth warming while the first screen is idle. */
const WARM = SCREENS.filter((screen) => screen.warm)

function isTypingTarget(target: EventTarget | null): boolean {
  return Boolean(
    (target as HTMLElement | null)?.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  )
}

/**
 * One persistent boundary: the shell never remounts, only its children swap.
 * A keyed remount would reset scroll and screen state on every tab tap.
 */
function Shell() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const online = useOnline()
  const [announcement, setAnnouncement] = useState('')
  const screenRef = useRef<HTMLDivElement>(null)

  // Warm the five tab chunks once the first screen is idle, so a tab tap
  // resolves from memory instead of waiting on a network round trip.
  useEffect(() => {
    const warm = () => {
      for (const screen of WARM) void screen.load()
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(warm)
    else setTimeout(warm, 1200)
  }, [])

  // PUSH starts at the top; POP leaves scroll restoration to the browser,
  // which waits for the lazy screen to lay out before restoring.
  useEffect(() => {
    if (navigationType === 'PUSH') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  // A short opacity ramp so tabs read as one surface changing, not two pages.
  // Opacity only: no transform, no snapshot, nothing that relayouts the bar.
  useEffect(() => {
    const el = screenRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const anim = el.animate([{ opacity: 0.35 }, { opacity: 1 }], {
      duration: 140,
      easing: 'cubic-bezier(0.241, 0.969, 0.635, 0.997)',
    })
    return () => anim.cancel()
  }, [pathname])

  // Glossary terms unlock only after the user has actually visited a screen.
  useEffect(() => {
    markRouteSeen(pathname)
  }, [pathname])

  // The title and the live region are the only way a screen reader learns that
  // the route changed: focus alone does not say where it went.
  useEffect(() => {
    const label = t(titleKeyOf(pathname))
    document.title = `${label} · Quant Desk`
    const raf = requestAnimationFrame(() => setAnnouncement(label))
    return () => cancelAnimationFrame(raf)
  }, [pathname, lang, t])

  // Keys 1–5 switch tabs; `/` opens search. Typing in a field wins.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (event.key === '/') {
        event.preventDefault()
        navigate('/search')
        return
      }
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < TAB_PATHS.length) {
        event.preventDefault()
        navigate(TAB_PATHS[index])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <>
      <a
        href="#screen"
        className="skip-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        onClick={() => requestAnimationFrame(() => document.getElementById('screen')?.focus())}
      >
        {t('common.skip')}
      </a>
      {!online && <OfflineBanner />}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div ref={screenRef}>
        <ErrorBoundary
          key={pathname}
          fallback={(_, reset) => (
            <FatalError onRetry={reset} onHome={() => navigate('/')} compact />
          )}
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 22%, transparent)' }}
      />
      <TabBar />
    </>
  )
}

/** First run: no shell, no tabs — onboarding owns the whole screen. */
function WelcomeGate() {
  const { onboarded } = usePrefs()
  const [params] = useSearchParams()

  if (onboarded) {
    return <Navigate to={safeNext(params.get('next'))} replace />
  }
  return (
    <Suspense fallback={<RouteFallback />}>
      <WelcomePage />
    </Suspense>
  )
}

/** Tabbed screens sit behind onboarding, so a typed URL cannot skip it. */
function AppShell() {
  const { onboarded } = usePrefs()
  const location = useLocation()
  if (!onboarded) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/welcome?next=${encodeURIComponent(next)}`} replace />
  }
  return <Shell />
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomeGate />} />
      <Route element={<AppShell />}>
        {PAGES.map((screen) => (
          <Route key={screen.pattern} path={screen.pattern} element={<screen.Page />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
