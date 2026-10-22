import { Suspense, lazy, useEffect, useRef } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { RouteFallback } from './components/RouteFallback'

// Every screen is its own chunk; the shell and the tab bar stay in the entry.
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
const RiskPage = lazy(() => import('./routes/risk'))
const SettingsPage = lazy(() => import('./routes/settings'))

/**
 * One persistent boundary: the shell never remounts, only its children swap.
 * A keyed remount would reset scroll and screen state on every tab tap.
 */
function Shell() {
  const { pathname } = useLocation()
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

  // Reset the scroll position on navigation; a fresh screen should start at
  // the top, and a preserved offset reads as a jump.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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

  return (
    <>
      <div ref={screenRef}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
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

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
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
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
