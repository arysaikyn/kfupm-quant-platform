/* oxlint-disable react/only-export-components -- provider + hooks ship together by design */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePref = Theme | 'system'

const STORAGE_KEY = 'app.theme'

function readPref(): ThemePref | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function detectPref(): ThemePref {
  // index.html resolved the stored preference before paint.
  const applied = document.documentElement.dataset.themePref
  if (applied === 'light' || applied === 'dark' || applied === 'system') return applied
  return readPref() ?? 'system'
}

type Ctx = { theme: Theme; pref: ThemePref; setTheme: (t: ThemePref) => void }

const ThemeContext = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePref>(detectPref)
  const [system, setSystem] = useState<Theme>(systemTheme)

  // A system preference can change while the app is open (sunset, display
  // profile). Only follow it while the user chose "system".
  useEffect(() => {
    if (pref !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystem(media.matches ? 'light' : 'dark')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [pref])

  const theme: Theme = pref === 'system' ? system : pref

  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = theme
    el.dataset.themePref = pref
    // The browser chrome follows the app theme, not the OS: a stale strip
    // above the page is the first thing a user sees.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#fdfdfe' : '#0a0a0c')
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // Private browsing: keep the in-memory choice, skip persistence.
    }
  }, [theme, pref])

  const setTheme = useCallback((next: ThemePref) => setPref(next), [])
  const value = useMemo(() => ({ theme, pref, setTheme }), [theme, pref, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme outside provider')
  return ctx
}
