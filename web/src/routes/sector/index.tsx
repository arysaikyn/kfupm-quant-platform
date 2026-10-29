import type { CSSProperties, ReactNode } from 'react'
import { BarStrip } from '../../components/BarStrip'
import { StarIcon } from '../../components/StarIcon'
import { Link, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState, ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { sectors } from '../../data/mock'
import type { Sector } from '../../data/mock'
import { membersChange, membersOf } from '../../data/membership'
import { toggleWatch, useUser } from '../../store/user'
import { strings } from './strings'

type VerdictKey =
  | 'verdictStrong'
  | 'verdictUp'
  | 'verdictFlat'
  | 'verdictDown'
  | 'verdictWeak'

function verdictKey(change: number): VerdictKey {
  if (change >= 0.01) return 'verdictStrong'
  if (change > 0) return 'verdictUp'
  if (change === 0) return 'verdictFlat'
  if (change >= -0.01) return 'verdictDown'
  return 'verdictWeak'
}

function toneOf(change: number): string {
  if (change > 0) return 'var(--color-up)'
  if (change < 0) return 'var(--color-down)'
  return 'var(--color-muted)'
}


/** Local 20-bar strip: texture at 44px, where a sparkline would turn to mush. */

function SectionTitle({
  title,
  trailing,
}: {
  title: string
  trailing?: ReactNode
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-md font-semibold">{title}</h2>
      </div>
      {trailing}
    </div>
  )
}

export default function SectorPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t, lang, dir } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()

  const sector = sectors.find((item) => item.id === id)

  const back = (
    <Link
      to="/"
      aria-label={t('common.back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-fg"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </Link>
  )

  if (!sector) {
    return (
      <Screen title={s('notFound')} leading={back}>
        <ErrorState message={s('notFoundHint')} />
        <div className="flex justify-center">
          <Link
            to="/"
            className="flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
          >
            {s('marketsLink')}
          </Link>
        </div>
      </Screen>
    )
  }

  // Every move on this page is the market-cap-weighted mean of the sector's own
  // members, read from the shared membership table, so the headline, the rank
  // list and the markets map can never print two figures for one sector. A
  // sector the mock universe does not reach has no move at all and prints a
  // dash instead of a fabricated 0.00%.
  const members = membersOf(sector.id)
  const change = members.length > 0 ? membersChange(sector.id, '1d') : null

  const rows = sectors
    .map((item) => ({
      sector: item,
      change: membersOf(item.id).length > 0 ? membersChange(item.id, '1d') : null,
    }))
    .sort((a, b) => {
      if (a.change === null || b.change === null) {
        if (a.change === b.change) return b.sector.weight - a.sector.weight
        return a.change === null ? 1 : -1
      }
      return b.change - a.change || b.sector.weight - a.sector.weight
    })
  const measured = rows.filter(
    (row): row is { sector: Sector; change: number } => row.change !== null,
  )
  const rank = rows.findIndex((row) => row.sector.id === sector.id) + 1
  const maxAbs = Math.max(...measured.map((row) => Math.abs(row.change)), 0.0001)
  const tone = change === null ? 'var(--color-muted)' : toneOf(change)
  const rankText =
    change === null
      ? s('noMembers')
      : s('rankValue')
          .replaceAll('{n}', String(rank))
          .replaceAll('{total}', String(measured.length))

  // Arabic joins tear under tracking, so they opt out of the kicker spacing.
  const kicker = { letterSpacing: lang === 'ar' ? 0 : undefined }

  return (
    <Screen title={sector.name[lang]} leading={back}>
      {/* The move owns the screen: one number under the name, no card */}
      <div className="mt-1">
        <p className="text-xs leading-none text-muted" style={kicker}>
          {s('today')}
        </p>
        {change === null ? (
          <p className="mt-2 text-md font-medium" style={{ color: 'var(--color-muted)' }}>
            {s('noMembers')}
          </p>
        ) : (
          <p
            className="num t-display mt-1 text-4xl leading-[0.95]"
            style={{ color: tone }}
          >
            {fmtPct(change, lang)}
          </p>
        )}
        <p className="mt-3 text-md leading-snug">
          {change === null ? s('constituentsEmpty') : s(verdictKey(change))}
        </p>
        <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
          <span className="num" style={{ color: 'var(--color-fg)' }}>
            {fmtNum(sector.weight, lang, 0, '%')}
          </span>{' '}
          {s('weight')}
        </p>
      </div>

      <SectionTitle title={s('constituentsTitle')} />
      {members.length === 0 ? (
        <EmptyState text={s('constituentsEmpty')} />
      ) : (
        <ul className="mt-2">
          {members.map((quote) => {
            const watched = watchlist.includes(quote.symbol)
            return (
              <li key={quote.symbol} className="relative border-t border-line">
                <Link
                  to={`/m/${quote.symbol}`}
                  className="flex min-h-[56px] w-full items-center gap-1.5 py-2 pe-12 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/10"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-md font-medium">
                      {quote.name[lang]}
                    </span>
                    <span className="num mt-0.5 block truncate text-xs text-muted">
                      {quote.symbol} · {quote.currency}
                    </span>
                  </span>
                  <span className="flex max-[400px]:hidden">
                    <BarStrip dense data={quote.spark} up={quote.change >= 0} />
                  </span>
                  <span className="num w-[68px] shrink-0 text-end text-md">
                    {fmtNum(quote.price, lang, 2)}
                  </span>
                  <span
                    className="num w-[58px] shrink-0 text-end text-md font-medium"
                    style={{ color: toneOf(quote.change) }}
                  >
                    {fmtPct(quote.change, lang)}
                  </span>
                </Link>
                <button
                  type="button"
                  aria-pressed={watched}
                  aria-label={`${s(watched ? 'watchRemove' : 'watchAdd')} ${quote.name[lang]}`}
                  onClick={() => toggleWatch(quote.symbol)}
                  className={`absolute top-1/2 end-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg ${
                    watched ? 'text-fg' : 'text-muted'
                  }`}
                >
                  <StarIcon filled={watched} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <SectionTitle
        title={s('comparisonTitle')}
        trailing={
          <span dir="ltr" className="num shrink-0 text-xs" style={{ color: 'var(--color-muted)' }}>
            {rankText}
          </span>
        }
      />
      <div className="mt-2 border-t border-line pt-2">
        <div role="list" aria-label={s('chartLabel')} className="space-y-0.5">
          {rows.map((row) => {
            const item = row.sector
            const move = row.change
            const current = item.id === sector.id
            const width = move === null ? 0 : Math.max((Math.abs(move) / maxAbs) * 50, 1)
            const barStyle: CSSProperties =
              move === null
                ? {}
                : move >= 0
                  ? {
                      insetBlockStart: 0,
                      insetBlockEnd: 0,
                      insetInlineStart: '50%',
                      width: `${width}%`,
                      background: toneOf(move),
                    }
                  : {
                      insetBlockStart: 0,
                      insetBlockEnd: 0,
                      insetInlineEnd: '50%',
                      width: `${width}%`,
                      background: toneOf(move),
                    }

            return (
              <div
                key={item.id}
                role="listitem"
                aria-current={current ? 'true' : undefined}
                className="grid grid-cols-[76px_minmax(0,1fr)_52px] items-center gap-2 rounded-lg px-1 py-1.5"
                style={{
                  background: current
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : undefined,
                }}
              >
                <span
                  className={`truncate text-xs ${current ? 'font-semibold' : ''}`}
                  style={{
                    color: current ? 'var(--color-accent)' : 'var(--color-muted)',
                  }}
                >
                  {item.name[lang]}
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-2 rounded-full"
                  style={{ background: 'var(--color-line)', direction: 'ltr' }}
                >
                  {move !== null && (
                    <span className="absolute rounded-full" style={barStyle} />
                  )}
                  <span
                    className="absolute"
                    style={{
                      insetBlockStart: 0,
                      insetBlockEnd: 0,
                      insetInlineStart: '50%',
                      width: 1,
                      background: 'var(--color-fg)',
                      opacity: 0.16,
                    }}
                  />
                </span>
                <span
                  className="num text-end text-xs"
                  style={{
                    color: move === null ? 'var(--color-muted)' : toneOf(move),
                    opacity: current ? 1 : 0.72,
                  }}
                >
                  {move === null ? s('noMembers') : fmtPct(move, lang)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <nav
        className="mt-8 flex flex-wrap items-center gap-6 border-t border-line pt-2"
        aria-label={s('linksLabel')}
      >
        <Link
          to="/"
          className="flex min-h-11 items-center text-md font-medium transition-colors hover:text-muted"
        >
          {s('marketsLink')}
        </Link>
        <Link
          to="/screener"
          className="flex min-h-11 items-center text-md font-medium transition-colors hover:text-muted"
        >
          {s('screenerLink')}
        </Link>
      </nav>
    </Screen>
  )
}
