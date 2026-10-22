import type { ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  /** Rendered at the logical start — the correct home for a back control in RTL. */
  leading?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Set false for full-bleed screens (charts, maps). */
  padded?: boolean
}

export function Screen({ title, subtitle, leading, action, children, padded = true }: Props) {
  return (
    <main className="screen-pad mx-auto min-h-full w-full max-w-[520px]">
      {(title || action || leading) && (
        <header
          className="sticky top-0 z-30 flex items-end justify-between gap-3 px-4 pt-5 pb-3"
          style={{
            background: 'color-mix(in srgb, var(--color-bg) 96%, transparent)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex min-w-0 items-end gap-2">
            {leading}
            <div className="min-w-0">
              {title && (
                <h1 className="t-title truncate py-[1px] text-[24px] leading-[1.3] font-semibold">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--color-muted)' }}>
                  {subtitle}
                </p>
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
