import { useMemo, useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { quotes } from '../../data/mock'
import type { L10n } from '../../data/mock'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { useUser } from '../../store/user'
import { strings } from './strings'

type EventKind = 'earnings' | 'dividend' | 'macro'

type CalEvent = {
  id: string
  kind: EventKind
  /** 0 is today, 6 is the seventh day. */
  day: number
  /** Minutes past local midnight. */
  minutes: number
  symbol: string
  name?: L10n
}

/** A 32-bit mix of the symbol: the same stock always lands on the same day
    and time, on every reload and in every locale. */
function hashSymbol(symbol: string): number {
  let h = 0
  for (let i = 0; i < symbol.length; i++) {
    let k = Math.imul(symbol.charCodeAt(i), 0xcc9e2d51)
    k = (k << 15) | (k >>> 17)
    k = Math.imul(k, 0x1b873593)
    h ^= k
    h = (h << 13) | (h >>> 19)
    h = (Math.imul(h, 5) + 0xe6546b64) | 0
  }
  h ^= symbol.length
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** Announcements land after the Tadawul close. */
const EARNINGS_TIMES = [15 * 60 + 30, 16 * 60, 16 * 60 + 30, 17 * 60] as const

/** Fixed anchors: a dividend five days out, the index review today. */
const DIVIDEND_DAY = 5
const MACRO_DAY = 0

const events: CalEvent[] = (() => {
  const rows = quotes.map<CalEvent>((quote) => {
    const hash = hashSymbol(quote.symbol)
    return {
      id: `earnings-${quote.symbol}`,
      kind: 'earnings',
      day: hash % 7,
      minutes: EARNINGS_TIMES[(hash >>> 8) % EARNINGS_TIMES.length],
      symbol: quote.symbol,
      name: quote.name,
    }
  })

  // The mock's first name is the dividend payer; the date offset is fixed.
  const payer = quotes[0]
  if (payer) {
    rows.push({
      id: `dividend-${payer.symbol}`,
      kind: 'dividend',
      day: DIVIDEND_DAY,
      minutes: 9 * 60,
      symbol: payer.symbol,
      name: payer.name,
    })
  }

  rows.push({
    id: 'macro-tasi',
    kind: 'macro',
    day: MACRO_DAY,
    minutes: 15 * 60,
    symbol: 'TASI',
  })

  return rows
})()

function makeFormatters(lang: Lang) {
  const locale = lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : lang
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', calendar: 'gregory' }),
    date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', calendar: 'gregory' }),
    time: new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      calendar: 'gregory',
    }),
  }
}

export default function Calendar() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()
  const fmt = useMemo(() => makeFormatters(lang), [lang])

  // Midnight today, fixed at mount so renders stay pure.
  const [start] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  const grouped = days.map((date, day) => ({
    date,
    iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    events: events
      .filter((e) => e.day === day)
      .sort((a, b) => a.minutes - b.minutes || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  }))

  const total = events.length
  const watched = events.filter(
    (e) => e.kind !== 'macro' && watchlist.includes(e.symbol),
  ).length
  const range = s('range')
    .replace('{start}', fmt.date.format(days[0]))
    .replace('{end}', fmt.date.format(days[6]))

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/news" />}>
      <section aria-labelledby="week-summary" className="mt-4">
        <h2 id="week-summary" className="text-[11px] font-medium text-muted">
          {s('weekLabel')}
        </h2>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="t-display num text-[40px] leading-none">
            {fmtNum(total, lang, 0)}
          </span>
          <span className="text-[12px] text-muted">
            {total === 1 ? s('eventOne') : s('eventMany')}
          </span>
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[12px] text-muted">
          <span className="num">{range}</span>
          <span aria-hidden="true">·</span>
          <span>
            <span className="num text-fg">{fmtNum(watched, lang, 0)}</span>{' '}
            {s('watchLabel')}
          </span>
        </p>
      </section>

      {grouped.map((group, day) => (
        <section key={day} aria-labelledby={`calendar-day-${day}`} className="mt-8">
          <div className="mb-2 flex items-center gap-2">
            <h2 id={`calendar-day-${day}`} className="t-section text-fg">
              {fmt.weekday.format(group.date)}
            </h2>
            <time dateTime={group.iso} className="num text-[12px] text-muted">
              {fmt.date.format(group.date)}
            </time>
            {day === 0 && (
              <span className="rounded-lg bg-fg/10 px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-fg">
                {s('today')}
              </span>
            )}
          </div>

          {group.events.length === 0 ? (
            <p className="text-[12px] text-muted">{s('noEvents')}</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {group.events.map((event) => {
                const touched =
                  event.kind !== 'macro' && watchlist.includes(event.symbol)
                const chip =
                  event.kind === 'earnings'
                    ? s('kindEarnings')
                    : event.kind === 'dividend'
                      ? s('kindDividend')
                      : s('kindMacro')
                const name = event.name ? event.name[lang] : s('macroName')
                const hours = Math.floor(event.minutes / 60)
                const mins = event.minutes % 60
                const hhmm = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
                const at = new Date(group.date)
                at.setHours(hours, mins, 0, 0)

                return (
                  <li
                    key={event.id}
                    className="grid min-h-14 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2.5"
                  >
                    <time
                      dir="ltr"
                      dateTime={`${group.iso}T${hhmm}`}
                      className="num text-[12px] text-muted"
                    >
                      {fmt.time.format(at)}
                    </time>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          dir="ltr"
                          className="num truncate text-[14px] leading-[1.4] font-medium text-fg"
                        >
                          {event.symbol}
                        </span>
                        {touched && (
                          <>
                            <span
                              aria-hidden="true"
                              className="h-[5px] w-[5px] shrink-0 rounded-full bg-muted"
                            />
                            <span className="sr-only">{s('watchMark')}</span>
                          </>
                        )}
                      </div>
                      <p className="truncate text-[12px] leading-[1.4] text-muted">{name}</p>
                    </div>

                    <span className="shrink-0 rounded-lg bg-fg/10 px-2 py-0.5 text-[10px] leading-[1.6] whitespace-nowrap text-muted">
                      {chip}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </Screen>
  )
}
