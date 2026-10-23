import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import type { GlobalKey } from '../i18n'

type Item = { to: string; key: GlobalKey; icon: ReactElement }

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const marketIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 17l4-6 4 4 4-7 4 5" />
    <path d="M4 20h16" opacity=".35" />
  </svg>
)

const newsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <path d="M8 9h8M8 12.5h8M8 16h5" />
  </svg>
)

const aiIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" opacity=".7" />
  </svg>
)

const strategyIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 4l7 3.5v5c0 4-3 6.6-7 7.5-4-.9-7-3.5-7-7.5v-5z" />
    <path d="M9.2 12.2l2 2 3.6-4" />
  </svg>
)

const meIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="8.5" r="3.4" />
    <path d="M5 20c1.4-3.3 4-5 7-5s5.6 1.7 7 5" />
  </svg>
)

const items: Item[] = [
  { to: '/', key: 'tab.market', icon: marketIcon },
  { to: '/news', key: 'tab.news', icon: newsIcon },
  { to: '/ai', key: 'tab.ai', icon: aiIcon },
  { to: '/strategy', key: 'tab.strategy', icon: strategyIcon },
  { to: '/me', key: 'tab.me', icon: meIcon },
]

/**
 * A tab you are already on does not need a link: it only scrolls its screen to
 * the top. Pushing the same path would grow history and make the user's first
 * back press appear to do nothing.
 */
function ItemSurface({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: ReactNode
}) {
  // Five items cover every screen, so the bar carries its own state set.
  const className =
    'flex h-full w-full flex-col items-center justify-center gap-1 rounded-[14px] transition-[color,opacity] duration-150 hover:text-fg active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg'

  if (active) {
    return (
      <button
        type="button"
        aria-current="page"
        onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        className={className}
        style={{ color: 'var(--color-fg)' }}
      >
        {children}
      </button>
    )
  }

  return (
    <Link to={to} className={className} style={{ color: 'var(--color-muted)' }}>
      {children}
    </Link>
  )
}

export function TabBar() {
  const { t, dir } = useI18n()
  const { pathname } = useLocation()

  // A screen reached from a tab keeps that tab lit: /learn is part of 我的,
  // /screener part of 行情, and so on. Without this the bar fell back to the
  // first tab on every sub-route.
  const TAB_OWNER: Record<string, string> = {
    '/search': '/',
    '/m': '/',
    '/screener': '/',
    '/review': '/news',
    '/alerts': '/',
    '/compare': '/',
    '/sector': '/',
    '/calendar': '/news',
    '/runs': '/ai',
    '/report': '/strategy',
    '/learn': '/me',
    '/watchlists': '/',
    '/settings': '/me',
  }
  // Explicit entries first, then the tab whose own path prefixes this one.
  // Without the second step /strategy/:id had no entry and the bar fell back to
  // Markets, so opening a saved strategy moved the highlight to the wrong tab.
  const owner =
    Object.entries(TAB_OWNER).find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ??
    items
      .filter(
        (it) =>
          it.to !== '/' && (pathname === it.to || pathname.startsWith(`${it.to}/`)),
      )
      .sort((a, b) => b.to.length - a.to.length)[0]?.to ??
    pathname
  const activeIndex = items.findIndex((it) =>
    it.to === '/' ? owner === '/' : owner === it.to,
  )
  const index = Math.max(activeIndex, 0)

  const barStyle = {
    insetInline: 12,
    maxWidth: 496,
    marginInline: 'auto',
    bottom: 'calc(12px + env(safe-area-inset-bottom))',
    height: 'var(--tabbar-h)',
    borderRadius: 'var(--radius-bar)',
    background: 'var(--bar-bg)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid var(--color-line)',
    boxShadow: 'var(--shadow-float)',
    '--i': index,
    '--dir': dir === 'rtl' ? -1 : 1,
  } as CSSProperties

  return (
    <nav aria-label="Primary" className="tabbar fixed z-50 glass" style={barStyle}>
      {/* Clip layer: the pill may overshoot, the bar's shape decides where it ends. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: 'inherit' }}
      >
        <div
          className="absolute inset-y-[7px] start-0 w-1/5 transition-transform duration-300"
          style={{
            transform: `translate3d(calc(var(--i) * 100% * var(--dir)), 0, 0)`,
            transitionTimingFunction: 'cubic-bezier(.32,1.12,.55,1)',
          }}
        >
          <div
            className="mx-[7px] h-full rounded-[14px]"
            style={{
              // Selection is a neutral wash: the active label and icon already carry it,
              // and a tinted plate was the loudest colour mass in light mode.
              background: 'color-mix(in srgb, var(--color-fg) 8%, transparent)',
            }}
          />
        </div>
      </div>

      <ul className="relative grid h-full grid-cols-5">
        {items.map((it, i) => {
          const active = i === activeIndex

          return (
            <li key={it.to} className="relative">
              <ItemSurface to={it.to} active={active}>
                {it.key === 'tab.ai' ? (
                  <span className="relative flex h-[22px] w-full items-center justify-center">
                    <span
                      data-ai-orb
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        // Transform, not width/height/top: the pill sits on a
                        // blurred bar, and geometry there re-measures the row.
                        width: 44,
                        height: 44,
                        top: -25,
                        transform: `translateY(${active ? 0 : 3}px) scale(${active ? 1 : 0.909})`,
                        // The lift is the affordance, not a colour block: a
                        // filled violet disc was the loudest thing on every
                        // screen, competing with the data behind it.
                        background: active ? 'var(--color-fg)' : 'var(--color-surface)',
                        color: active ? 'var(--color-bg)' : 'var(--color-muted)',
                        border: '2px solid var(--color-bg)',
                        boxShadow: active
                          ? '0 0 0 1px color-mix(in srgb, var(--color-fg) 30%, transparent)'
                          : '0 0 0 1px var(--color-line)',
                        transition:
                          'transform 220ms cubic-bezier(.32,1.12,.55,1), background-color 180ms ease, color 180ms ease',
                      }}
                    >
                      {it.icon}
                    </span>
                  </span>
                ) : (
                  it.icon
                )}
                <span className="max-w-full truncate px-1 pb-[1px] text-[10px] leading-[1.6]">
                  {t(it.key)}
                </span>
              </ItemSurface>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
