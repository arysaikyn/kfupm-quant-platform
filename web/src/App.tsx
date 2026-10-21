import { Navigate, Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import MarketPage from './routes/market'
import SymbolPage from './routes/market/SymbolPage'
import NewsPage from './routes/news'
import NewsDetail from './routes/news/NewsDetail'
import AiPage from './routes/ai'
import StrategyPage from './routes/strategy'
import StrategyDetail from './routes/strategy/StrategyDetail'
import MePage from './routes/me'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MarketPage />} />
        <Route path="/m/:symbol" element={<SymbolPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
        <Route path="/strategy/:id" element={<StrategyDetail />} />
        <Route path="/me" element={<MePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 22%, transparent)' }}
      />
      <TabBar />
    </>
  )
}
