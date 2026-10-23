import type { ReactNode } from 'react'

type Props = {
  title?: string
  /** Rendered at the logical start — the correct home for a back control in RTL. */
  leading?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Set false for full-bleed screens (charts, maps). */
  padded?: boolean
}

export function Screen({ title, leading, action, children, padded = true }: Props) {
  return (
    <main className="screen-pad mx-auto min-h-full w-full max-w-[520px] lg:max-w-[760px]">
      {(title || action || leading) && (
        // One optical line: the 44px controls and the title share a vertical
        // centre. items-end put the title's baseline on the button's bottom
        // edge, so the text looked like it was sliding off the circle.
        <header className="flex min-h-11 items-center justify-between gap-3 px-4 pt-6 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            <div className="min-w-0">
              {title && (
                <h1 className="t-title truncate text-[26px] leading-[1.2] font-semibold">{title}</h1>
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
