import type { ComponentType } from 'react'
import type { GlobalKey } from './i18n'

/**
 * One row per screen. Before this table, adding a screen meant editing five
 * places that did not share a type: the lazy const, the `routeKey` if-chain, the
 * `<Route>` list, the tab-owner map in the tab bar, and the e2e route list. Two
 * of those failures were silent — a missing `routeKey` branch titled a working
 * screen "Not found", a missing tab-owner entry pinned the highlight to the
 * first tab — so the mistake only showed up on the rendered page.
 *
 * The table is the source of truth for: the lazily imported component, the
 * document title, the tab that stays lit, and the sample path the route matrix
 * visits. Data only: it imports no component eagerly, so a screen still ships as
 * its own chunk.
 */

export type TabPath = '/' | '/news' | '/ai' | '/strategy' | '/me'

export type Screen = {
  /** React Router pattern. A `:param` makes the screen a sub-page of its parent. */
  pattern: string
  /**
   * The title key. A sub-page can borrow its parent's title (the graveyard is
   * still "Strategy"), which is why this is not derived from the pattern.
   */
  title: GlobalKey
  /** The tab that stays lit while this screen is open. */
  tab: TabPath
  /** A concrete path a test can visit; params filled with demo values. */
  sample: string
  /** True for the five tabs, in bar order. */
  isTab?: boolean
  /** Warm this chunk once the app is idle. */
  warm?: boolean
  load: () => Promise<{ default: ComponentType }>
}

export const SCREENS: readonly Screen[] = [
  { pattern: '/', title: 'route.market', tab: '/', sample: '/', isTab: true, load: () => import('./routes/market') },
  { pattern: '/m/:symbol', title: 'route.symbol', tab: '/', sample: '/m/2222', load: () => import('./routes/market/SymbolPage') },
  { pattern: '/news', title: 'route.news', tab: '/news', sample: '/news', isTab: true, warm: true, load: () => import('./routes/news') },
  { pattern: '/news/:id', title: 'route.article', tab: '/news', sample: '/news/n1', load: () => import('./routes/news/NewsDetail') },
  { pattern: '/ai', title: 'route.ai', tab: '/ai', sample: '/ai', isTab: true, warm: true, load: () => import('./routes/ai') },
  { pattern: '/ai/provider', title: 'route.aiProvider', tab: '/ai', sample: '/ai/provider', load: () => import('./routes/ai/ProviderPage') },
  { pattern: '/strategy', title: 'route.strategy', tab: '/strategy', sample: '/strategy', isTab: true, warm: true, load: () => import('./routes/strategy') },
  { pattern: '/strategy/graveyard', title: 'route.strategy', tab: '/strategy', sample: '/strategy/graveyard', load: () => import('./routes/strategy/Graveyard') },
  { pattern: '/strategy/:id', title: 'route.strategyDetail', tab: '/strategy', sample: '/strategy/low-debt-value', load: () => import('./routes/strategy/StrategyDetail') },
  { pattern: '/me', title: 'route.me', tab: '/me', sample: '/me', isTab: true, warm: true, load: () => import('./routes/me') },
  { pattern: '/screener', title: 'route.screener', tab: '/', sample: '/screener', load: () => import('./routes/screener') },
  { pattern: '/alerts', title: 'route.alerts', tab: '/', sample: '/alerts', load: () => import('./routes/alerts') },
  { pattern: '/review', title: 'route.review', tab: '/news', sample: '/review', load: () => import('./routes/review') },
  { pattern: '/calendar', title: 'route.calendar', tab: '/news', sample: '/calendar', load: () => import('./routes/calendar') },
  { pattern: '/compare', title: 'route.compare', tab: '/', sample: '/compare', load: () => import('./routes/compare') },
  { pattern: '/runs', title: 'route.runs', tab: '/ai', sample: '/runs', load: () => import('./routes/runs') },
  { pattern: '/learn', title: 'route.learn', tab: '/me', sample: '/learn', load: () => import('./routes/learn') },
  { pattern: '/search', title: 'route.search', tab: '/', sample: '/search', warm: true, load: () => import('./routes/search') },
  { pattern: '/sector/:id', title: 'route.sector', tab: '/', sample: '/sector/energy', load: () => import('./routes/sector') },
  { pattern: '/report/:id', title: 'route.report', tab: '/strategy', sample: '/report/low-debt-value', load: () => import('./routes/report') },
  { pattern: '/watchlists', title: 'route.watchlists', tab: '/', sample: '/watchlists', load: () => import('./routes/watchlists') },
  { pattern: '/settings', title: 'route.settings', tab: '/me', sample: '/settings', load: () => import('./routes/settings') },
  { pattern: '/workspace', title: 'route.workspace', tab: '/ai', sample: '/workspace', load: () => import('./routes/workspace') },
]

/** The five tabs, in bar order. */
export const TABS: readonly Screen[] = SCREENS.filter((screen) => screen.isTab)

/** The keyboard shortcuts: key 1 to 5 opens these, in order. */
export const TAB_PATHS: readonly string[] = TABS.map((screen) => screen.pattern)

/** Every sample path, for the route matrix a test walks. */
export const SAMPLE_PATHS: readonly string[] = SCREENS.map((screen) => screen.sample)

/**
 * The screen a path belongs to: the longest literal match wins, and an exact
 * pattern outranks a prefix of the same length, so `/ai/provider` beats `/ai`
 * and `/news/:id` beats `/news`. An unknown path resolves to nothing, which is
 * the not-found screen the router also renders.
 */
function screenFor(pathname: string): Screen | undefined {
  let best: Screen | undefined
  let bestScore = -1
  for (const screen of SCREENS) {
    const param = screen.pattern.indexOf('/:')
    const prefix = param === -1 ? screen.pattern : screen.pattern.slice(0, param)
    const exact = param === -1
    if (exact ? pathname !== prefix : pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
      continue
    }
    const score = exact ? prefix.length + 1000 : prefix.length
    if (score > bestScore) {
      best = screen
      bestScore = score
    }
  }
  return best
}

/** The document title and the live announcement read this. */
export function titleKeyOf(pathname: string): GlobalKey {
  return screenFor(pathname)?.title ?? 'route.notFound'
}

/** The tab that stays lit while `pathname` is open. */
export function tabOf(pathname: string): TabPath {
  return screenFor(pathname)?.tab ?? '/'
}
