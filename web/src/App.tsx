import { ViewTransition } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import MarketPage from './routes/market'
import SymbolPage from './routes/market/SymbolPage'
import NewsPage from './routes/news'
import NewsDetail from './routes/news/NewsDetail'
import AiPage from './routes/ai'
import StrategyPage from './routes/strategy'
import StrategyDetail from './routes/strategy/StrategyDetail'
import MePage from './routes/me'

/**
 * One persistent boundary: the shell never remounts, only its children swap.
 * A keyed remount would reset scroll and screen state on every tab tap.
 */
function Shell() {
  return (
    <>
      <ViewTransition>
        <Outlet />
      </ViewTransition>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
