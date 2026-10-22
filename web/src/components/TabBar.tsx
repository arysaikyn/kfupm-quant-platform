import type { CSSProperties, ReactElement } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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

export function TabBar() {
  const { t, dir } = useI18n()
  const { pathname } = useLocation()

  const activeIndex = items.findIndex((it) =>
    it.to === '/' ? pathname === '/' || pathname.startsWith('/m/') : pathname.startsWith(it.to),
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
    <nav aria-label="Primary" className="fixed z-50 glass" style={barStyle}>
      <div
        aria-hidden
        className="absolute inset-y-1.5 start-0 w-1/5 transition-transform duration-[420ms]"
        style={{
          transform: `translate3d(calc(var(--i) * 100% * var(--dir)), 0, 0)`,
          transitionTimingFunction: 'cubic-bezier(.34,1.32,.64,1)',
          opacity: index === 2 ? 0 : 1,
        }}
      >
        <div
          className="h-full rounded-[16px]"
          style={{
            background: 'rgba(168,85,247,.18)',
            boxShadow: 'inset 0 0 0 1px rgba(168,85,247,.26)',
          }}
        />
      </div>

      <ul className="relative grid h-full grid-cols-5">
        {items.map((it, i) => {
          const active = i === activeIndex

          return (
            <li key={it.to} className="relative">
              <NavLink
                to={it.to}
                end={it.to === '/'}
                aria-current={active ? 'page' : undefined}
                className="flex h-full flex-col items-center justify-center gap-1"
                style={{ color: active ? 'var(--color-fg)' : 'var(--color-muted)' }}
              >
                {it.key === 'tab.ai' ? (
                  <span className="relative flex h-[22px] w-full items-center justify-center">
                    <span
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        width: 40,
                        height: 40,
                        top: -22,
                        background: 'var(--color-accent)',
                        color: '#fff',
                        boxShadow: '0 0 26px rgba(168,85,247,.55)',
                        border: '2px solid var(--color-bg)',
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
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
