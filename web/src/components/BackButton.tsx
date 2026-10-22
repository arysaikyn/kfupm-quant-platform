import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'

type Props = {
  /** Landed on directly (a deep link or a reload) there is nothing to pop. */
  fallback: string
}

/**
 * Back control matching the headers that already had one. It pops the history
 * entry rather than pushing the parent route, so this and the browser's own
 * back button always agree — and returning keeps the previous scroll offset.
 */
export function BackButton({ fallback }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={t('common.back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rtl:rotate-180"
        aria-hidden="true"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
