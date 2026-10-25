import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

type Props = {
  title?: string
  /** Rendered at the logical start — the correct home for a back control in RTL. */
  leading?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Set false for full-bleed screens (charts, maps). */
  padded?: boolean
}

let lastFocusedPath: string | null = null

export function Screen({ title, leading, action, children, padded = true }: Props) {
  const { pathname } = useLocation()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the page name on every real route change. The first paint
  // also lands here, which gives a screen reader a starting point.
  useEffect(() => {
    if (lastFocusedPath === pathname) return
    lastFocusedPath = pathname
    // Title-less detail screens put their h1 inside the body. Focus the page
    // itself rather than leaving the cursor on the link that just unmounted.
    const target =
      headingRef.current ??
      document.getElementById('screen')?.querySelector<HTMLElement>('h1') ??
      null
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1
    target.focus({ preventScroll: true })
  }, [pathname])

  return (
    <main
      id="screen"
      tabIndex={-1}
      className="screen-pad mx-auto min-h-full w-full max-w-[520px] outline-none sm:max-w-[560px] md:max-w-[680px] lg:max-w-[760px]"
    >
      {(title || action || leading) && (
        // One optical line: the 44px controls and the title share a vertical
        // centre. items-end put the title's baseline on the button's bottom
        // edge, so the text looked like it was sliding off the circle.
        <header
          className="flex min-h-11 items-center justify-between gap-3 px-4 pb-3"
          style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            <div className="min-w-0">
              {title && (
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  title={title}
                  className="t-title line-clamp-2 text-[26px] leading-[1.2] font-semibold break-words"
                >
                  {title}
                </h1>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'px-4' : ''}>{children}</div>
    </main>
  )
}
