import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import App from './App'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FatalError } from './components/FatalError'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={(_, reset) => (
        <FatalError onRetry={reset} onHome={() => window.location.assign(import.meta.env.BASE_URL)} />
      )}
    >
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// A service worker is a production-only concern: in dev it would cache Vite's
// module graph and hide edits.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline shell is an enhancement; a failed registration must not break boot.
    })
  })
}
