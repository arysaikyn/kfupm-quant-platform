import { useI18n } from '../i18n'

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="shimmer rounded-2xl"
          style={{ height: 64, background: 'var(--color-surface)' }}
        />
      ))}
    </div>
  )
}

export function EmptyState({ text, action }: { text?: string; action?: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'var(--color-surface)' }}
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" opacity=".4" />
          <path d="M8.5 12h7" opacity=".7" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        {text ?? t('common.empty')}
      </p>
      {action}
    </div>
  )
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        {message ?? ''}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          style={{ border: '1px solid var(--color-line)' }}
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
