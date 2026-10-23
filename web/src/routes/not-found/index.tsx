import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { useI18n } from '../../i18n'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <Screen title={t('common.notFoundTitle')}>
      <EmptyState
        text={t('common.notFoundBody')}
        action={
          <Link
            to="/"
            className="flex min-h-11 items-center rounded-full border border-line px-4 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {t('common.goHome')}
          </Link>
        }
      />
    </Screen>
  )
}
