import { useI18n } from '../i18n'

/** Full-screen failure state. Kept functional so it can read the language. */
export function FatalError({
  onRetry,
  onHome,
  compact = false,
}: {
  onRetry: () => void
  onHome?: () => void
  compact?: boolean
}) {
  const { t } = useI18n()
  return (
    <div
      role="alert"
      className={`mx-auto flex w-full max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center ${
        compact ? 'py-16' : 'min-h-screen'
      }`}
    >
      <p className="text-[18px] font-semibold">{t('common.boundaryTitle')}</p>
      <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted">{t('common.boundaryBody')}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-full px-5 text-[14px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          style={{ background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }}
        >
          {t('common.retry')}
        </button>
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="min-h-11 rounded-full border border-line px-5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {t('common.goHome')}
          </button>
        )}
      </div>
    </div>
  )
}
