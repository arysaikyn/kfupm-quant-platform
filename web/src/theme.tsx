import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'app.theme'

function readStoredTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function detectTheme(): Theme {
  // index.html already resolved this before paint; trust it first.
  const applied = document.documentElement.dataset.theme
  if (applied === 'light' || applied === 'dark') return applied
  const saved = readStoredTheme()
  if (saved) return saved
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

type Ctx = { theme: Theme; setTheme: (t: Theme) => void }

const ThemeContext = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(detectTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // The browser chrome follows the app theme, not the OS: a stale dark strip
    // above a light page is the first thing a user sees.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f6f4fb' : '#050309')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private browsing: keep the in-memory choice, skip persistence.
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme outside provider')
  return ctx
}
