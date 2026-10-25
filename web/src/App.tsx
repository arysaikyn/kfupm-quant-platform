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
import { useI18n } from './i18n'
import type { GlobalKey } from './i18n'
import { useOnline } from './lib/useOnline'
import { safeNext } from './lib/next'

// Every screen is its own chunk; the shell and the tab bar stay in the entry.
const WelcomePage = lazy(() => import('./routes/onboarding'))
const MarketPage = lazy(() => import('./routes/market'))
const SymbolPage = lazy(() => import('./routes/market/SymbolPage'))
const NewsPage = lazy(() => import('./routes/news'))
const NewsDetail = lazy(() => import('./routes/news/NewsDetail'))
const AiPage = lazy(() => import('./routes/ai'))
const StrategyPage = lazy(() => import('./routes/strategy'))
const StrategyDetail = lazy(() => import('./routes/strategy/StrategyDetail'))
const MePage = lazy(() => import('./routes/me'))
const ScreenerPage = lazy(() => import('./routes/screener'))
const AlertsPage = lazy(() => import('./routes/alerts'))
const ReviewPage = lazy(() => import('./routes/review'))
const CalendarPage = lazy(() => import('./routes/calendar'))
const ComparePage = lazy(() => import('./routes/compare'))
const RunsPage = lazy(() => import('./routes/runs'))
const LearnPage = lazy(() => import('./routes/learn'))
const SearchPage = lazy(() => import('./routes/search'))
const SectorPage = lazy(() => import('./routes/sector'))
const ReportPage = lazy(() => import('./routes/report'))
const WatchlistsPage = lazy(() => import('./routes/watchlists'))
const SettingsPage = lazy(() => import('./routes/settings'))
const WorkspacePage = lazy(() => import('./routes/workspace'))
const NotFoundPage = lazy(() => import('./routes/not-found'))

/** Every path names its screen; the map drives titles and the live announcer. */
function routeKey(pathname: string): GlobalKey {
  if (pathname === '/') return 'route.market'
  if (pathname.startsWith('/m/')) return 'route.symbol'
  if (pathname === '/news') return 'route.news'
  if (pathname.startsWith('/news/')) return 'route.article'
  if (pathname === '/ai') return 'route.ai'
  if (pathname === '/strategy') return 'route.strategy'
  if (pathname.startsWith('/strategy/')) return 'route.strategyDetail'
  if (pathname === '/me') return 'route.me'
  if (pathname === '/screener') return 'route.screener'
  if (pathname === '/alerts') return 'route.alerts'
  if (pathname === '/review') return 'route.review'
  if (pathname === '/calendar') return 'route.calendar'
  if (pathname === '/compare') return 'route.compare'
  if (pathname === '/runs') return 'route.runs'
  if (pathname === '/learn') return 'route.learn'
  if (pathname === '/search') return 'route.search'
  if (pathname.startsWith('/sector/')) return 'route.sector'
  if (pathname.startsWith('/report/')) return 'route.report'
  if (pathname === '/watchlists') return 'route.watchlists'
  if (pathname === '/settings') return 'route.settings'
  if (pathname === '/workspace') return 'route.workspace'
  return 'route.notFound'
}

const TAB_DESTINATIONS = ['/', '/news', '/ai', '/strategy', '/me'] as const

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
      void import('./routes/news')
      void import('./routes/ai')
      void import('./routes/strategy')
      void import('./routes/me')
      void import('./routes/search')
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

  // The title and the live region are the only way a screen reader learns that
  // the route changed: focus alone does not say where it went.
  useEffect(() => {
    const label = t(routeKey(pathname))
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
      if (Number.isInteger(index) && index >= 0 && index < TAB_DESTINATIONS.length) {
        event.preventDefault()
        navigate(TAB_DESTINATIONS[index])
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
        <Route path="/" element={<MarketPage />} />
        <Route path="/m/:symbol" element={<SymbolPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
        <Route path="/strategy/:id" element={<StrategyDetail />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/screener" element={<ScreenerPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/sector/:id" element={<SectorPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/watchlists" element={<WatchlistsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
