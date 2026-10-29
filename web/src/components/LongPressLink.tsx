import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLongPress } from '../hooks/useLongPress'
import { setIntake } from '../store/aiIntake'
import type { CtxRef } from '../lib/chips'

type Props = {
  to: string
  /** Question the AI tab sends on arrival. */
  prompt: string
  /** The object the press came from; the AI tab shows it as context. */
  chips?: CtxRef[]
  className?: string
  children: ReactNode
}

/**
 * A row that navigates on tap and hands the row to the AI on hold.
 * The question is queued, then the AI tab drains and sends it on mount.
 */
export function LongPressLink({ to, prompt, chips, className, children }: Props) {
  const navigate = useNavigate()
  const handlers = useLongPress(() => {
    setIntake(prompt, chips)
    navigate('/ai')
  })

  return (
    <Link to={to} className={className} {...handlers}>
      {children}
    </Link>
  )
}
