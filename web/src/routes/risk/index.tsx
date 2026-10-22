import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes } from '../../data/mock'
import type { Quote } from '../../data/mock'
import { useUser } from '../../store/user'
import { strings } from './strings'

/** One hue per symbol; the order is stable because positions sort by size. */
const SEGMENT_COLORS = ['#a855f7', '#22d3e6', '#f59e0b', '#60a5fa', '#e879f9', '#94a3b8', '#f472b6']
const colorAt = (i: number) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]

/** Amber mixed with the foreground so the warning works in both themes. */
const WARN = 'color-mix(in srgb, #f59e0b 62%, var(--color-fg))'

const QUOTE_BY: Record<string, Quote | undefined> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q] as const),
)

type Position = {
  symbol: string
  name: string
  currency: string
  /** Signed net quantity: negative is a short. */
  qty: number
  price: number
  /** Absolute mark-to-market value, so a short is exposure too. */
  value: number
  weight: number
  vol: number
}

type CurrencyRow = {
  currency: string
  value: number
  positions: number
  weight: number
}

/** One LTR isolate keeps a ticker or currency code in place inside Arabic. */
function ltr(text: string) {
  return `\u2066${text}\u2069`
}

/** Replace each `{key}` once; the templates hold every placeholder a single time. */
function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (whole: string, key: string) => vars[key] ?? whole)
}

function shareOf(weight: number, lang: Lang) {
  return fmtNum(weight * 100, lang, 1, '%')
}

function money(value: number, lang: Lang, currency: string) {
  const digits = value >= 1000 ? 0 : value >= 10 ? 1 : 2
  return fmtNum(value, lang, digits, ` ${currency}`)
}

/**
 * Standard deviation of the last 20 daily log returns in a quote's spark.
 * 21 points give exactly 20 returns; a flat series has zero volatility.
 */
function dailyVol(series: number[]) {
  const tail = series.slice(Math.max(0, series.length - 21))
  const rets: number[] = []
  for (let i = 1; i < tail.length; i += 1) {
    const prev = tail[i - 1]
    const next = tail[i]
    if (prev > 0 && next > 0) rets.push(Math.log(next / prev))
  }
  if (rets.length < 2) return 0
  const mean = rets.reduce((sum, r) => sum + r, 0) / rets.length
  const variance = rets.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(variance)
}

export default function RiskPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { journal } = useUser()

  /** Trades net per symbol, then marked against the live quote. */
  const positions = useMemo<Position[]>(() => {
    const net = new Map<string, number>()
    for (const entry of journal) {
      if (!Number.isFinite(entry.qty) || !Number.isFinite(entry.price)) continue
      if (!QUOTE_BY[entry.symbol]) continue
      const signed = entry.side === 'buy' ? entry.qty : -entry.qty
      net.set(entry.symbol, (net.get(entry.symbol) ?? 0) + signed)
    }

    const rows: Omit<Position, 'weight'>[] = []
    for (const [symbol, qty] of net) {
      if (Math.abs(qty) < 1e-9) continue
      const quote = QUOTE_BY[symbol]
      if (!quote) continue
      rows.push({
        symbol,
        name: quote.name[lang],
        currency: quote.currency,
        qty,
        price: quote.price,
        value: Math.abs(qty) * quote.price,
        vol: dailyVol(quote.spark),
      })
    }

    const total = rows.reduce((sum, row) => sum + row.value, 0)
    if (total <= 0) return []
    return rows
      .map((row) => ({ ...row, weight: row.value / total }))
      .sort((a, b) => b.value - a.value)
  }, [journal, lang])

  const bookValue = positions.reduce((sum, p) => sum + p.value, 0)

  /** Split by the quote currency, biggest first so the bar leads with weight. */
  const currencyRows = useMemo<CurrencyRow[]>(() => {
    const map = new Map<string, { value: number; positions: number }>()
    for (const p of positions) {
      const row = map.get(p.currency) ?? { value: 0, positions: 0 }
      row.value += p.value
      row.positions += 1
      map.set(p.currency, row)
    }
    const total = positions.reduce((sum, p) => sum + p.value, 0)
    if (total <= 0) return []
    return [...map.entries()]
      .map(([currency, row]) => ({
        currency,
        value: row.value,
        positions: row.positions,
        weight: row.value / total,
      }))
      .sort((a, b) => b.value - a.value)
  }, [positions])

  const kicker = { letterSpacing: lang === 'ar' ? 0 : undefined }
  const headStyle = { ...kicker, color: 'var(--color-muted)' }

  if (positions.length === 0) {
    return (
      <Screen title={s('title')}>
        <EmptyState
          text={journal.length === 0 ? s('empty') : s('flat')}
          action={
            <Link
              to="/strategy"
              className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px]"
              style={{ border: '1px solid var(--color-line)' }}
            >
              {s('emptyCta')}
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 rtl:[transform:scaleX(-1)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          }
        />
      </Screen>
    )
  }

  const top = positions[0]
  const maxWeight = top.weight
  const weightedVol = positions.reduce((sum, p) => sum + p.weight * p.vol, 0)
  const var95 = 1.65 * weightedVol * bookValue

  const concentrationLabel = `${s('concentration')}: ${positions
    .map((p) => `${ltr(p.symbol)} ${shareOf(p.weight, lang)}`)
    .join(', ')}`

  const currencyLabel = `${s('currency')}: ${currencyRows
    .map((c) => `${ltr(c.currency)} ${shareOf(c.weight, lang)}`)
    .join(', ')}`

  /** Two observations the numbers imply but do not state outright. */
  const notes: string[] = []
  const leadCurrency = [...currencyRows].sort(
    (a, b) => b.positions - a.positions || b.value - a.value,
  )[0]

  if (leadCurrency) {
    if (currencyRows.length === 1) {
      notes.push(
        positions.length === 1
          ? fill(s('noteCurrencyOne'), { currency: ltr(leadCurrency.currency) })
          : fill(s('noteCurrencyAll'), {
              n: fmtNum(positions.length, lang, 0),
              currency: ltr(leadCurrency.currency),
            }),
      )
    } else if (leadCurrency.positions >= 2) {
      notes.push(
        fill(s('noteCurrencyMany'), {
          n: fmtNum(leadCurrency.positions, lang, 0),
          currency: ltr(leadCurrency.currency),
          pct: shareOf(leadCurrency.weight, lang),
        }),
      )
    } else {
      notes.push(s('noteCurrencySplit'))
    }
  }

  if (positions.length === 1) {
    notes.push(fill(s('noteSingle'), { symbol: ltr(top.symbol) }))
  } else if (maxWeight > 0.4) {
    notes.push(fill(s('noteDominant'), { symbol: ltr(top.symbol), pct: shareOf(maxWeight, lang) }))
  } else {
    notes.push(fill(s('noteBalanced'), { symbol: ltr(top.symbol), pct: shareOf(maxWeight, lang) }))
  }

  return (
    <Screen title={s('title')}>
      <section aria-labelledby="risk-concentration" className="panel mt-4 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="risk-concentration"
            className="t-kicker min-w-0 truncate"
            style={headStyle}
          >
            {s('concentration')}
          </h2>
          <p className="shrink-0 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {s('bookValue')}{' '}
            <span className="num text-[11px]" style={{ color: 'var(--color-fg)' }}>
              {fmtNum(
                bookValue,
                lang,
                bookValue >= 1000 ? 0 : bookValue >= 10 ? 1 : 2,
              )}
            </span>
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="t-kicker" style={headStyle}>
              {s('largest')}
            </p>
            <p className="mt-1.5 flex min-w-0 items-baseline gap-2">
              <span dir="ltr" className="num shrink-0 text-[15px] font-semibold">
                {top.symbol}
              </span>
              <span className="truncate text-[12px]" style={{ color: 'var(--color-muted)' }}>
                {top.name}
              </span>
            </p>
          </div>
          <p className="t-display num shrink-0 text-[34px] leading-none font-semibold">
            {shareOf(top.weight, lang)}
          </p>
        </div>

        {top.weight > 0.4 && (
          <span
            className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] leading-none"
            style={{
              color: WARN,
              background: 'color-mix(in srgb, #f59e0b 14%, transparent)',
              border: '1px solid color-mix(in srgb, #f59e0b 36%, transparent)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4 3.5 19h17L12 4Z" />
              <path d="M12 9.5v4M12 16.5v.01" />
            </svg>
            {s('aboveLimit')}
          </span>
        )}

        <div
          role="img"
          aria-label={concentrationLabel}
          className="mt-4 flex h-3 w-full gap-px overflow-hidden rounded-full"
          style={{ background: 'var(--color-line)' }}
        >
          {positions.map((p, i) => (
            <div
              key={p.symbol}
              style={{
                flexGrow: Math.max(p.weight, 0.001),
                flexBasis: 0,
                minWidth: 4,
                background: colorAt(i),
              }}
            />
          ))}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {positions.map((p, i) => (
            <li key={p.symbol} className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: colorAt(i) }}
              />
              <span dir="ltr" className="num text-[11px] font-medium">
                {p.symbol}
              </span>
              <span className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
                {shareOf(p.weight, lang)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="risk-exposure" className="panel mt-3 p-4">
        <h2 id="risk-exposure" className="t-kicker" style={headStyle}>
          {s('exposure')}
        </h2>

        <ul className="mt-2 divide-y divide-line">
          {positions.map((p, i) => (
            <li key={p.symbol} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span dir="ltr" className="num shrink-0 text-[13px] font-medium">
                    {p.symbol}
                  </span>
                  <span className="truncate text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    {p.name}
                  </span>
                  {p.qty < 0 && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] leading-none"
                      style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}
                    >
                      {s('short')}
                    </span>
                  )}
                </div>
                <span className="num shrink-0 text-[12px] font-medium">
                  {money(p.value, lang, p.currency)}
                </span>
              </div>

              <div
                className="mt-2 flex h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--color-line)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(p.weight * 100, 2)}%`,
                    background: colorAt(i),
                  }}
                />
              </div>

              <div
                className="mt-1.5 flex items-baseline justify-between gap-2 text-[10.5px]"
                style={{ color: 'var(--color-muted)' }}
              >
                <span className="num min-w-0 truncate" dir="ltr">
                  {fmtNum(Math.abs(p.qty), lang, Number.isInteger(p.qty) ? 0 : 2)} ×{' '}
                  {fmtNum(p.price, lang, 2)} {ltr(p.currency)}
                </span>
                <span className="num shrink-0" style={{ color: 'var(--color-fg)' }}>
                  {shareOf(p.weight, lang)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[10.5px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {s('weightNote')}
        </p>
      </section>

      <section aria-labelledby="risk-currency" className="panel mt-3 p-4">
        <h2 id="risk-currency" className="t-kicker" style={headStyle}>
          {s('currency')}
        </h2>

        <div
          role="img"
          aria-label={currencyLabel}
          className="mt-3 flex h-2.5 w-full gap-px overflow-hidden rounded-full"
          style={{ background: 'var(--color-line)' }}
        >
          {currencyRows.map((c, i) => (
            <div
              key={c.currency}
              style={{
                flexGrow: Math.max(c.weight, 0.001),
                flexBasis: 0,
                minWidth: 4,
                background: colorAt(i),
              }}
            />
          ))}
        </div>

        <ul className="mt-3 space-y-2.5">
          {currencyRows.map((c, i) => (
            <li key={c.currency} className="flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colorAt(i) }}
                />
                <span dir="ltr" className="num text-[12px] font-medium">
                  {c.currency}
                </span>
                <span className="num text-[10.5px]" style={{ color: 'var(--color-muted)' }}>
                  {shareOf(c.weight, lang)}
                </span>
              </div>
              <span className="num shrink-0 text-[11.5px]">
                {money(c.value, lang, c.currency)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[10.5px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {s('currencyNote')}
        </p>
      </section>

      <section aria-labelledby="risk-metrics" className="panel mt-3 p-4">
        <h2 id="risk-metrics" className="t-kicker" style={headStyle}>
          {s('metrics')}
        </h2>

        <ul className="mt-2 divide-y divide-line">
          <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug font-medium">{s('varLabel')}</p>
              <p
                className="mt-1 text-[10.5px] leading-snug"
                style={{ color: 'var(--color-muted)' }}
              >
                {s('varCaption')}
              </p>
            </div>
            <p
              className="num shrink-0 text-[17px] leading-tight font-semibold"
              style={{ color: 'var(--color-accent)' }}
            >
              {fmtNum(var95, lang, var95 >= 100 ? 0 : 2)}
            </p>
          </li>

          <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug font-medium">{s('maxLabel')}</p>
              <p
                className="mt-1 text-[10.5px] leading-snug"
                style={{ color: 'var(--color-muted)' }}
              >
                {s('maxCaption')}
              </p>
            </div>
            <p
              className="num shrink-0 text-[17px] leading-tight font-semibold"
              style={{ color: maxWeight > 0.4 ? WARN : 'var(--color-fg)' }}
            >
              {shareOf(maxWeight, lang)}
            </p>
          </li>

          <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug font-medium">{s('countLabel')}</p>
              <p
                className="mt-1 text-[10.5px] leading-snug"
                style={{ color: 'var(--color-muted)' }}
              >
                {s('countCaption')}
              </p>
            </div>
            <p className="num shrink-0 text-[17px] leading-tight font-semibold">
              {fmtNum(positions.length, lang, 0)}
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="risk-notes" className="panel mt-3 mb-2 p-4">
        <h2 id="risk-notes" className="t-kicker" style={headStyle}>
          {s('notes')}
        </h2>

        <ol className="mt-2 divide-y divide-line">
          {notes.map((note, i) => (
            <li key={note} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span
                aria-hidden="true"
                className="num shrink-0 pt-0.5 text-[10px] leading-relaxed"
                style={{ color: 'var(--color-accent)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[12.5px] leading-relaxed">{note}</p>
            </li>
          ))}
        </ol>
      </section>
    </Screen>
  )
}
