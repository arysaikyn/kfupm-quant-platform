import { useState } from 'react'
import type { FormEvent } from 'react'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quoteBySymbol, quotes } from '../../data/mock'
import {
  addCall,
  brierScore,
  calibration,
  COIN_BRIER,
  probabilityOf,
  resolveCall,
  resolvedCalls,
  useCalls,
} from '../../store/confidence'
import type { CallDir, CalibrationKey, Confidence } from '../../store/confidence'
import { strings } from './strings'

const DIR_LABEL: Record<CallDir, 'confUp' | 'confDown' | 'confFlat'> = {
  up: 'confUp',
  down: 'confDown',
  flat: 'confFlat',
}

const BUCKET_LABEL: Record<
  CalibrationKey,
  'confBucketLow' | 'confBucketMid' | 'confBucketHigh'
> = {
  low: 'confBucketLow',
  mid: 'confBucketMid',
  high: 'confBucketHigh',
}

const LEVELS: readonly Confidence[] = [1, 2, 3, 4, 5]

/**
 * The confidence book: one section of the daily review, not a separate screen.
 * A call is a direction plus a stated probability; the score is a Brier score,
 * which is the only number here that judges anything. No money changes hands.
 */
export function ConfidenceBook() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const calls = useCalls()
  const [symbol, setSymbol] = useState(quotes[0].symbol)
  const [dir, setDir] = useState<CallDir>('up')
  const [confidence, setConfidence] = useState<Confidence>(3)
  const [logged, setLogged] = useState(false)

  const resolved = resolvedCalls(calls)
  const open = calls.filter((call) => call.windowEnd === null)
  const brier = brierScore(resolved)
  const buckets = calibration(resolved)
  // One value with its verdict, so the view cannot show a number without the
  // sentence that reads it.
  const score =
    brier === null
      ? null
      : {
          value: brier,
          verdict:
            brier < COIN_BRIER
              ? ('confBetter' as const)
              : brier > COIN_BRIER
                ? ('confWorse' as const)
                : ('confLevel' as const),
        }

  const kicker = {
    color: 'var(--color-muted)',
    // Letter-spacing tears the joins in Arabic script.
    letterSpacing: lang === 'ar' ? 0 : undefined,
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    addCall({ symbol, dir, confidence })
    setLogged(true)
  }

  return (
    <section className="panel mt-3 p-4" aria-label={s('confTitle')}>
      <p className="t-kicker" style={kicker}>
        {s('confTitle')}
      </p>
      <p className="mt-1 text-[11px] leading-[1.55]" style={{ color: 'var(--color-muted)' }}>
        {s('confIntro')}
      </p>

      {/* Score: one number against the coin, then the calibration bands. */}
      <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-line)' }}>
        <p className="t-kicker" style={kicker}>
          {s('confScore')}
        </p>
        {score === null ? (
          <p className="mt-1.5 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            {s('confEmptyScore')}
          </p>
        ) : (
          <>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="num t-display text-[30px] leading-none font-bold">
                {fmtNum(score.value, lang, 2)}
              </span>
              <span className="num text-[10px]" style={{ color: 'var(--color-muted)' }}>
                {s('confVsCoin')}
              </span>
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-fg">{s(score.verdict)}</p>
            <p className="num mt-0.5 text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {s('confSample').replace(
                '{n}',
                fmtNum(resolved.length, lang, 0),
              )}
            </p>
          </>
        )}

        {buckets.length > 0 && (
          <div className="mt-4">
            <p className="t-kicker" style={kicker}>
              {s('confCalibration')}
            </p>
            <div className="mt-2 space-y-2.5">
              {buckets.map((bucket) => (
                <div key={bucket.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {s(BUCKET_LABEL[bucket.key])}
                    </span>
                    <span
                      className="num text-[10px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {s('confCalls').replace('{n}', fmtNum(bucket.calls, lang, 0))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="relative h-1.5 flex-1 overflow-hidden rounded-full"
                      style={{
                        background: 'color-mix(in srgb, var(--color-fg) 12%, transparent)',
                      }}
                    >
                      <span
                        className="absolute inset-y-0 start-0 rounded-full"
                        style={{
                          width: `${bucket.observed * 100}%`,
                          background: 'var(--color-fg)',
                        }}
                      />
                    </span>
                    <span
                      className="num shrink-0 text-[10px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {s('confSaid')} {fmtNum(bucket.stated * 100, lang, 0, '%')} ·{' '}
                      {s('confHitRate')} {fmtNum(bucket.observed * 100, lang, 0, '%')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {s('confBarLegend')}
            </p>
          </div>
        )}
      </div>

      {/* The log form: symbol, direction, stated confidence. */}
      <form
        className="mt-4 border-t pt-3.5"
        style={{ borderColor: 'var(--color-line)' }}
        onSubmit={submit}
      >
        <p className="t-kicker" style={kicker}>
          {s('confFormTitle')}
        </p>

        <div className="mt-2">
          <label
            htmlFor="conf-symbol"
            className="text-[11px] leading-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {s('confSymbol')}
          </label>
          <div className="relative mt-1.5">
            <select
              id="conf-symbol"
              value={symbol}
              onChange={(event) => {
                setSymbol(event.target.value)
                setLogged(false)
              }}
              className="min-h-11 w-full appearance-none rounded-[10px] border border-line bg-bg ps-2.5 pe-9 text-[13px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {quotes.map((quote) => (
                <option key={quote.symbol} value={quote.symbol}>
                  {quote.symbol} · {quote.name[lang]}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted)' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className="mt-2.5">
          <span
            id="conf-dir"
            className="text-[11px] leading-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {s('confDir')}
          </span>
          <div
            role="group"
            aria-labelledby="conf-dir"
            className="mt-1.5 grid grid-cols-3 gap-1 rounded-[12px] border border-line p-1"
          >
            {(['up', 'down', 'flat'] as const).map((key) => {
              const active = dir === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDir(key)
                    setLogged(false)
                  }}
                  className="min-h-11 rounded-[9px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-fg"
                  style={{
                    background: active ? 'var(--color-fg)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-muted)',
                  }}
                >
                  {s(DIR_LABEL[key])}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-2.5">
          <span
            id="conf-level"
            className="text-[11px] leading-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {s('confConfidence')}
          </span>
          <div
            role="group"
            aria-labelledby="conf-level"
            className="mt-1.5 grid grid-cols-5 gap-1 rounded-[12px] border border-line p-1"
          >
            {LEVELS.map((level) => {
              const active = confidence === level
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${s('confConfidence')} ${level} · ${fmtNum(
                    probabilityOf(level) * 100,
                    lang,
                    0,
                    '%',
                  )}`}
                  onClick={() => {
                    setConfidence(level)
                    setLogged(false)
                  }}
                  className="num min-h-11 rounded-[9px] text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-fg"
                  style={{
                    background: active ? 'var(--color-fg)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-muted)',
                  }}
                >
                  {level}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {s('confScale')}
          </p>
        </div>

        <button
          type="submit"
          className="mt-3 min-h-11 w-full rounded-full bg-solid px-4 text-[13px] font-medium text-bg transition-opacity active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('confSubmit')}
        </button>
        <p
          className="mt-2 text-[10px] leading-[1.5]"
          style={{ color: 'var(--color-muted)' }}
        >
          {s('confSampleNote')}
        </p>
        <p
          role="status"
          className="mt-1 text-[11px]"
          style={{ color: 'var(--color-muted)' }}
        >
          {logged ? s('confLogged') : ''}
        </p>
      </form>

      {/* The book itself: open calls first, then what each settled call did. */}
      <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--color-line)' }}>
        <p className="t-kicker" style={kicker}>
          {s('confLog')}
        </p>

        {calls.length === 0 && (
          <p className="mt-1.5 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            {s('confEmptyScore')}
          </p>
        )}

        <ul>
          {open.map((call) => {
            const quote = quoteBySymbol[call.symbol]
            if (!quote) return null
            return (
              <li
                key={call.id}
                className="mt-1.5 rounded-[12px] border p-3"
                style={{ borderColor: 'var(--color-line)' }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px]">
                    {quote.name[lang]}{' '}
                    <span className="num text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      {call.symbol}
                    </span>
                  </p>
                  <span
                    className="shrink-0 rounded-lg bg-fg/10 px-1.5 py-0.5 text-[10px] leading-[1.6] whitespace-nowrap"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {s('confOpen')}
                  </span>
                </div>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {s('confSaid')} {s(DIR_LABEL[call.dir])} ·{' '}
                  <span className="num">{call.confidence}/5</span>
                </p>
                <button
                  type="button"
                  onClick={() => resolveCall(call.id)}
                  className="mt-2 min-h-11 w-full rounded-full border border-line text-[12px] text-fg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  {s('confResolve')}
                </button>
              </li>
            )
          })}
        </ul>

        {resolved.length > 0 && (
          <ul className="mt-1.5 divide-y divide-line border-t border-line">
            {resolved.map((row) => {
              const quote = quoteBySymbol[row.symbol]
              if (!quote) return null
              return (
                <li key={row.id} className="flex min-h-12 items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] leading-tight">
                      {quote.name[lang]}{' '}
                      <span
                        className="num text-[10px]"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {row.symbol}
                      </span>
                    </p>
                    <p
                      className="mt-0.5 text-[10px] leading-snug"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {s('confSaid')} {s(DIR_LABEL[row.dir])} ·{' '}
                      <span className="num">{row.confidence}/5</span>{' '}
                      <span
                        aria-hidden="true"
                        className="inline-block rtl:[transform:scaleX(-1)]"
                      >
                        →
                      </span>{' '}
                      {s('confActual')}{' '}
                      <span
                        style={{
                          color:
                            row.move > 0
                              ? 'var(--color-up)'
                              : row.move < 0
                                ? 'var(--color-down)'
                                : 'var(--color-muted)',
                        }}
                      >
                        {s(DIR_LABEL[row.actual])}{' '}
                        <span className="num">{fmtPct(row.move, lang)}</span>
                      </span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] leading-none ${
                      row.hit ? 'bg-fg/10 text-fg' : 'border border-line text-muted'
                    }`}
                  >
                    {row.hit ? s('confHitChip') : s('confMissChip')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
