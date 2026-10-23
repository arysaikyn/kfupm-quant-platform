import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  style?: CSSProperties
  className?: string
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A real modal: Escape closes it, focus moves in and is trapped, the page
 * behind cannot scroll, and focus returns to the control that opened it.
 * The old sheet was a div with role="dialog" and none of those behaviours.
 */
export function Sheet({ open, onClose, title, children, style, className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.getClientRects().length > 0,
      )
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      restoreRef.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="scrim-enter fixed inset-0 z-40 bg-bg/55"
        onClick={() => closeRef.current()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet-enter glass fixed z-40 rounded-2xl border border-line ${className ?? ''}`}
        style={style}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}
