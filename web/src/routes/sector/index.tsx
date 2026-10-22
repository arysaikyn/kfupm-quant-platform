import type { CSSProperties, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quotes, sectors } from '../../data/mock'
import type { Quote, Sector } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import { strings } from './strings'

/** Stable score for a string; used only for ordering, never for a figure. */
const hashSymbol = (value: string) =>
  [...value].reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) % 100003, 7)

/** The mock universe has five quotes and no sector field. A sector-salted hash
    gives each sector its own stable 4–6 name sample from that same universe
    (capped at five today); no hand-written membership map is added to mock.ts. */
function constituentsFor(sectorId: string): Quote[] {
  const count = 4 + (hashSymbol(sectorId) % 3)
  return [...quotes]
    .map((quote) => ({ quote, score: hashSymbol(`${sectorId}:${quote.symbol}`) }))
    .sort((a, b) => a.score - b.score || a.quote.symbol.localeCompare(b.quote.symbol))
    .slice(0, Math.min(count, quotes.length))
    .map((entry) => entry.quote)
}

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

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.62 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z" />
    </svg>
  )
}

/** Local 20-bar strip: texture at 44px, where a sparkline would turn to mush. */
function Bars({ data, up }: { data: number[]; up: boolean }) {
  const slice = data.slice(-20)
  const min = Math.min(...slice)
  const span = Math.max(...slice) - min || 1
  const tone = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <span
      aria-hidden="true"
      className="flex h-4 w-11 shrink-0 items-end gap-px"
      style={{ direction: 'ltr' }}
    >
      {slice.map((value, index) => {
        const norm = (value - min) / span
        return (
          <span
            key={index}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${32 + norm * 60}%`,
              background: tone,
              opacity: 0.22 + norm * 0.32,
            }}
          />
        )
      })}
    </span>
  )
}

function SectionTitle({
  title,
  hint,
  trailing,
}: {
  title: string
  hint?: string
  trailing?: ReactNode
}) {
  return (
    <div className="mt-6 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {hint && (
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {hint}
          </p>
        )}
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ border: '1px solid var(--color-line)', color: 'var(--color-fg)' }}
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
            className="flex min-h-11 items-center rounded-full px-4 text-[13px]"
            style={{ border: '1px solid var(--color-line)' }}
          >
            {s('marketsLink')}
          </Link>
        </div>
      </Screen>
    )
  }

  const ranked: Sector[] = [...sectors].sort(
    (a, b) => b.change - a.change || b.weight - a.weight,
  )
  const rank = ranked.findIndex((item) => item.id === sector.id) + 1
  const maxAbs = Math.max(...sectors.map((item) => Math.abs(item.change)), 0.0001)
  const members = constituentsFor(sector.id)
  const tone = toneOf(sector.change)
  const rankText = s('rankValue')
    .replaceAll('{n}', String(rank))
    .replaceAll('{total}', String(sectors.length))

  // .t-kicker sets 10px unlayered, so the size is inline; Arabic joins tear
  // under tracking and have to opt out.
  const kicker = {
    color: 'var(--color-muted)',
    fontSize: 11,
    letterSpacing: lang === 'ar' ? 0 : undefined,
  }

  return (
    <Screen title={s('title')} leading={back}>
      <section className="panel mt-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-kicker" style={kicker}>
              {s('sectorLabel')}
            </p>
            <h2 className="t-title mt-1 truncate text-[26px] leading-tight font-semibold">
              {sector.name[lang]}
            </h2>
          </div>
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]"
            style={{ border: '1px solid var(--color-line)' }}
          >
            <span className="num font-semibold">
              {fmtNum(sector.weight, lang, 0, '%')}
            </span>
            <span style={{ color: 'var(--color-muted)' }}>{s('weight')}</span>
          </span>
        </div>

        <p className="t-kicker mt-4" style={kicker}>
          {s('today')}
        </p>
        <p
          className="num t-display mt-0.5 text-[36px] leading-none font-bold"
          style={{ color: tone }}
        >
          {fmtPct(sector.change, lang)}
        </p>
        <p className="mt-3 text-[13px] leading-snug">{s(verdictKey(sector.change))}</p>
      </section>

      <SectionTitle title={s('constituentsTitle')} hint={s('constituentsHint')} />
      <div className="panel mt-2 overflow-hidden">
        {members.map((quote) => {
          const watched = watchlist.includes(quote.symbol)
          return (
            <div
              key={quote.symbol}
              className="relative border-b border-line last:border-b-0"
            >
              <Link
                to={`/m/${quote.symbol}`}
                className="flex min-h-[58px] items-center gap-1.5 py-2 ps-3 pe-12 transition-colors active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {quote.name[lang]}
                  </span>
                  <span
                    className="num mt-0.5 block truncate text-[10.5px]"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {quote.symbol} · {quote.currency}
                  </span>
                </span>
                <Bars data={quote.spark} up={quote.change >= 0} />
                <span className="num w-[58px] shrink-0 text-end text-[12px]">
                  {fmtNum(quote.price, lang, 2)}
                </span>
                <span
                  className="num w-[52px] shrink-0 text-end text-[11.5px] font-medium"
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
                className="absolute top-1/2 end-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                style={{ color: watched ? 'var(--color-accent)' : 'var(--color-muted)' }}
              >
                <StarIcon filled={watched} />
              </button>
            </div>
          )
        })}
      </div>

      <SectionTitle
        title={s('comparisonTitle')}
        hint={s('comparisonHint')}
        trailing={
          <span dir="ltr" className="num shrink-0 text-[15px] font-semibold">
            {rankText}
          </span>
        }
      />
      <div className="panel mt-2 p-3">
        <div role="list" aria-label={s('chartLabel')} className="space-y-0.5">
          {ranked.map((item) => {
            const current = item.id === sector.id
            const width = Math.max((Math.abs(item.change) / maxAbs) * 50, 1)
            const barStyle: CSSProperties =
              item.change >= 0
                ? {
                    insetBlockStart: 0,
                    insetBlockEnd: 0,
                    insetInlineStart: '50%',
                    width: `${width}%`,
                    background: toneOf(item.change),
                  }
                : {
                    insetBlockStart: 0,
                    insetBlockEnd: 0,
                    insetInlineEnd: '50%',
                    width: `${width}%`,
                    background: toneOf(item.change),
                  }

            return (
              <div
                key={item.id}
                role="listitem"
                aria-current={current ? 'true' : undefined}
                className="grid grid-cols-[68px_minmax(0,1fr)_52px] items-center gap-2 rounded-lg px-1.5 py-1"
                style={{
                  background: current
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : undefined,
                }}
              >
                <span
                  className={`truncate text-[11px] ${current ? 'font-semibold' : ''}`}
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
                  <span className="absolute rounded-full" style={barStyle} />
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
                  className="num text-end text-[11px]"
                  style={{
                    color: toneOf(item.change),
                    opacity: current ? 1 : 0.72,
                  }}
                >
                  {fmtPct(item.change, lang)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-2" aria-label={s('linksLabel')}>
        <Link
          to="/"
          className="panel flex min-h-12 items-center justify-center px-2 text-center text-[12.5px] font-medium"
        >
          {s('marketsLink')}
        </Link>
        <Link
          to="/screener"
          className="panel flex min-h-12 items-center justify-center px-2 text-center text-[12.5px] font-medium"
          style={{
            color: 'var(--color-accent)',
            borderColor: 'color-mix(in srgb, var(--color-accent) 35%, transparent)',
          }}
        >
          {s('screenerLink')}
        </Link>
      </nav>
    </Screen>
  )
}
