import type { Lang } from '../../i18n'
import { news, strategies } from '../../data/mock'
import { loadScreens } from '../screener/rules'

/**
 * The weekly route is a fixed, ordered demo walk over things this build
 * already has locally: saved screens, watchlists, strategy reruns, then news.
 * It never creates a backend job; the sheet is assembled from existing data.
 */

export type RouteStopKind = 'screen' | 'watchlist' | 'strategy' | 'news'

export type RouteSkipReason =
  | 'noScreens'
  | 'noWatchlists'
  | 'noStrategies'
  | 'noNews'

export type RouteStop = {
  id: string
  kind: RouteStopKind
  /** Stored name for saved data; null on a skipped placeholder stop. */
  name: string | null
  /** Rule count, symbol count or story count, depending on the kind. */
  count: number
  status: 'ready' | 'skipped'
  skipReason: RouteSkipReason | null
  /** Epoch ms of this stop's slot; null when the stop is skipped. */
  nextStart: number | null
}

export type RouteSheet = {
  stops: RouteStop[]
  /** The route's first slot, even when its first stop is skipped. */
  nextStart: number
  /** Null when every stop is skipped. */
  finishAt: number | null
  activeCount: number
  skippedCount: number
}

export type RouteInput = {
  screens: { id: string; name: string; ruleCount: number }[]
  watchlists: { id: string; name: string; symbolCount: number }[]
  strategies: { id: string; name: string; ruleCount: number }[]
  newsCount: number
}

const SLOT_MS = 15 * 60_000
const MAX_SCREENS = 3
const MAX_WATCHLISTS = 3
const MAX_STRATEGIES = 3
const WATCHLIST_KEY = 'watchlists.v1'

/** The next Monday 09:00 local time, strictly in the future. */
export function nextRouteStart(now: number): number {
  const start = new Date(now)
  start.setHours(9, 0, 0, 0)
  let days = (1 - start.getDay() + 7) % 7
  if (days === 0 && start.getTime() <= now) days = 7
  start.setDate(start.getDate() + days)
  return start.getTime()
}

function skipped(
  id: string,
  kind: RouteStopKind,
  skipReason: RouteSkipReason,
): RouteStop {
  return {
    id,
    kind,
    name: null,
    count: 0,
    status: 'skipped',
    skipReason,
    nextStart: null,
  }
}

export function buildRouteSheet(input: RouteInput, now: number): RouteSheet {
  const nextStart = nextRouteStart(now)
  const stops: RouteStop[] = []

  const screens = input.screens.slice(0, MAX_SCREENS)
  if (screens.length === 0) {
    stops.push(skipped('screen-none', 'screen', 'noScreens'))
  } else {
    screens.forEach((screen, index) => {
      stops.push({
        id: `screen-${index}-${screen.id}`,
        kind: 'screen',
        name: screen.name,
        count: screen.ruleCount,
        status: 'ready',
        skipReason: null,
        nextStart: null,
      })
    })
  }

  const watchlists = input.watchlists
    .filter((group) => group.symbolCount > 0)
    .slice(0, MAX_WATCHLISTS)
  if (watchlists.length === 0) {
    stops.push(skipped('watchlist-none', 'watchlist', 'noWatchlists'))
  } else {
    watchlists.forEach((group, index) => {
      stops.push({
        id: `watchlist-${index}-${group.id}`,
        kind: 'watchlist',
        name: group.name,
        count: group.symbolCount,
        status: 'ready',
        skipReason: null,
        nextStart: null,
      })
    })
  }

  const reruns = input.strategies.slice(0, MAX_STRATEGIES)
  if (reruns.length === 0) {
    stops.push(skipped('strategy-none', 'strategy', 'noStrategies'))
  } else {
    reruns.forEach((strategy, index) => {
      stops.push({
        id: `strategy-${index}-${strategy.id}`,
        kind: 'strategy',
        name: strategy.name,
        count: strategy.ruleCount,
        status: 'ready',
        skipReason: null,
        nextStart: null,
      })
    })
  }

  if (input.newsCount > 0) {
    stops.push({
      id: 'news',
      kind: 'news',
      name: null,
      count: input.newsCount,
      status: 'ready',
      skipReason: null,
      nextStart: null,
    })
  } else {
    stops.push(skipped('news-none', 'news', 'noNews'))
  }

  // Ready stops take consecutive slots; a skipped stop never consumes one.
  let slot = 0
  for (const stop of stops) {
    if (stop.status !== 'ready') continue
    stop.nextStart = nextStart + slot * SLOT_MS
    slot += 1
  }

  return {
    stops,
    nextStart,
    finishAt: slot > 0 ? nextStart + slot * SLOT_MS : null,
    activeCount: slot,
    skippedCount: stops.length - slot,
  }
}

/** Defensive read: the route only needs a name and a count, never a full group. */
export function parseStoredWatchlists(
  raw: string | null,
): { id: string; name: string; symbolCount: number }[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const record = entry as Record<string, unknown>
      if (typeof record.id !== 'string' || !record.id) return []
      if (typeof record.name !== 'string' || !record.name.trim()) return []
      const symbols = Array.isArray(record.symbols)
        ? [...new Set(record.symbols.filter((value): value is string => typeof value === 'string'))]
        : []
      return [{ id: record.id, name: record.name.trim(), symbolCount: symbols.length }]
    })
  } catch {
    return []
  }
}

export function readRouteInput(lang: Lang): RouteInput {
  let storedWatchlists = ''
  try {
    storedWatchlists = localStorage.getItem(WATCHLIST_KEY) ?? ''
  } catch {
    // Private browsing: the route falls back to the skipped watchlist stop.
  }
  return {
    screens: loadScreens().map((screen) => ({
      id: screen.id,
      name: screen.name,
      ruleCount: screen.rules.length,
    })),
    watchlists: parseStoredWatchlists(storedWatchlists),
    strategies: strategies.map((strategy) => ({
      id: strategy.id,
      name: strategy.name[lang],
      ruleCount: strategy.rules.length,
    })),
    newsCount: news.length,
  }
}
