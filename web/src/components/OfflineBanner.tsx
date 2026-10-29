import { useI18n } from '../i18n'

/** A quiet strip, not a modal: offline is a fact, not an emergency. */
export function OfflineBanner() {
  const { t } = useI18n()
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex min-h-9 items-center justify-center border-b border-line bg-surface px-4 text-center text-2xs leading-snug text-muted"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {t('common.offline')}
    </div>
  )
}
