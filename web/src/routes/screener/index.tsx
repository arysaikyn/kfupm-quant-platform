import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quotes } from '../../data/mock'
import {
  MAX_RULES,
  PRESET_IDS,
  applyRules,
  cloneRules,
  createId,
  defaultRules,
  loadScreens,
  newRule,
  presetRules,
  ruleValue,
  storeScreens,
} from './rules'
import type { Field, Op, PresetId, Rule, SavedScreen } from './rules'
import { screenerStrings } from './strings'
import type { ScreenerStrings } from './strings'

const PRESET_KEY: Record<PresetId, keyof ScreenerStrings> = {
  value: 'presetValue',
  momentum: 'presetMomentum',
  calm: 'presetCalm',
}

const FIELD_OPTIONS: readonly { value: Field; key: keyof ScreenerStrings }[] = [
  { value: 'change', key: 'fieldChange' },
  { value: 'price', key: 'fieldPrice' },
  { value: 'turnover', key: 'fieldTurnover' },
]

const OP_OPTIONS: readonly { value: Op; key: 'opLt' | 'opGt' }[] = [
  { value: 'lt', key: 'opLt' },
  { value: 'gt', key: 'opGt' },
]

const FIELD_STEP: Record<Field, number> = { change: 0.1, price: 0.01, turnover: 0.5 }

const FIELD_UNIT: Record<Field, string | null> = { change: '%', price: null, turnover: '%' }

const fillName = (template: string, name: string) => template.replace('{name}', name)

function IconChevron() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2"
      style={{ color: 'var(--color-muted)' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export default function ScreenerPage() {
  const { lang } = useI18n()
  const s = useStrings(screenerStrings)
  const [rules, setRules] = useState<Rule[]>(defaultRules)
  const [name, setName] = useState('')
  const [screens, setScreens] = useState<SavedScreen[]>(loadScreens)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (status === '') return
    const timer = window.setTimeout(() => setStatus(''), 1800)
    return () => window.clearTimeout(timer)
  }, [status])

  const results = useMemo(() => applyRules(quotes, rules), [rules])

  const kicker = {
    color: 'var(--color-muted)',
    letterSpacing: lang === 'ar' ? 0 : undefined,
  }

  function updateRule(id: string, patch: Partial<Omit<Rule, 'id'>>) {
    setActiveId(null)
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)))
  }

  function addRule() {
    setActiveId(null)
    setRules((prev) => (prev.length >= MAX_RULES ? prev : [...prev, newRule()]))
  }

  function removeRule(id: string) {
    setActiveId(null)
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  function applyPreset(id: PresetId) {
    setRules(presetRules(id))
    setActiveId(null)
    setName('')
    setStatus('')
  }

  function openScreen(screen: SavedScreen) {
    setRules(cloneRules(screen.rules))
    setName(screen.name)
    setActiveId(screen.id)
    setStatus('')
  }

  function saveScreen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim().slice(0, 40)
    if (!trimmed) return
    const snapshot = cloneRules(rules.filter((rule) => ruleValue(rule) !== null))
    const existing = screens.find(
      (screen) => screen.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    )
    if (existing) {
      const next = screens.map((screen) =>
        screen.id === existing.id ? { ...screen, name: trimmed, rules: snapshot } : screen,
      )
      setScreens(next)
      storeScreens(next)
      setActiveId(existing.id)
    } else {
      const created: SavedScreen = { id: createId('s'), name: trimmed, rules: snapshot }
      const next = [created, ...screens]
      setScreens(next)
      storeScreens(next)
      setActiveId(created.id)
    }
    setName('')
    setStatus(s('saved'))
  }

  function deleteScreen(id: string) {
    const next = screens.filter((screen) => screen.id !== id)
    setScreens(next)
    storeScreens(next)
    if (activeId === id) setActiveId(null)
  }

  function relaxRules() {
    setRules([])
    setActiveId(null)
  }

  const showsTurnoverHint = rules.some((rule) => rule.field === 'turnover')

  return (
    <Screen
      title={s('title')}
      subtitle={s('subtitle')}
      action={
        <div className="text-end">
          <p className="t-kicker" style={kicker}>
            {s('resultsMatch')}
          </p>
          <p
            aria-live="polite"
            aria-atomic="true"
            className="num mt-0.5 text-[18px] leading-none font-semibold"
          >
            {results.length}
            <span className="text-[11px] font-normal" style={{ color: 'var(--color-muted)' }}>
              /{quotes.length}
            </span>
          </p>
        </div>
      }
    >
      <div className="mt-4">
        <p className="t-kicker" style={kicker}>
          {s('presetsLabel')}
        </p>
        <div
          role="group"
          aria-label={s('presetsLabel')}
          className="mt-1.5 grid grid-cols-3 gap-2"
        >
          {PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => applyPreset(id)}
              className="flex min-h-11 items-center justify-center rounded-full px-2 py-2 text-[12px] leading-tight font-medium transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              style={{
                border: '1px solid var(--color-line)',
                background: 'var(--color-surface)',
                color: 'var(--color-fg)',
              }}
            >
              {s(PRESET_KEY[id])}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6" aria-labelledby="screener-rules">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="screener-rules" className="t-title text-[17px] font-semibold">
            {s('rulesTitle')}
          </h2>
          <span className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {rules.length}/{MAX_RULES}
          </span>
        </div>

        <div className="panel mt-2 p-3">
          {rules.length === 0 ? (
            <p className="px-1 py-3 text-center text-[12px]" style={{ color: 'var(--color-muted)' }}>
              {s('noRules')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rules.map((rule, index) => {
                const unit = FIELD_UNIT[rule.field]
                return (
                  <li
                    key={rule.id}
                    className="rounded-xl p-2"
                    style={{
                      border: '1px solid var(--color-line)',
                      background: 'color-mix(in srgb, var(--color-fg) 3%, transparent)',
                    }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 flex-1">
                        <select
                          value={rule.field}
                          aria-label={`${s('fieldLabel')} ${index + 1}`}
                          onChange={(event) =>
                            updateRule(rule.id, { field: event.target.value as Field })
                          }
                          className="h-11 w-full appearance-none rounded-lg ps-3 pe-9 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                          style={{
                            border: '1px solid var(--color-line)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-fg)',
                          }}
                        >
                          {FIELD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {s(option.key)}
                            </option>
                          ))}
                        </select>
                        <IconChevron />
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          role="group"
                          aria-label={s('operatorLabel')}
                          className="flex shrink-0 gap-1"
                        >
                          {OP_OPTIONS.map((option) => {
                            const selected = rule.op === option.value
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={selected}
                                aria-label={s(option.key)}
                                onClick={() => updateRule(rule.id, { op: option.value })}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-semibold transition-colors active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                                style={
                                  selected
                                    ? {
                                        background: 'var(--color-fg)',
                                        color: 'var(--color-bg)',
                                      }
                                    : {
                                        border: '1px solid var(--color-line)',
                                        color: 'var(--color-muted)',
                                      }
                                }
                              >
                                <span aria-hidden="true">
                                  {option.value === 'lt' ? '<' : '>'}
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        <div
                          className="flex h-11 min-w-0 flex-1 items-center rounded-lg transition-colors focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent sm:w-[104px] sm:flex-none"
                          style={{
                            border: '1px solid var(--color-line)',
                            background: 'var(--color-bg)',
                          }}
                        >
                          <input
                            type="number"
                            inputMode="decimal"
                            value={rule.value}
                            aria-label={`${s('valueLabel')} ${index + 1}`}
                            onChange={(event) =>
                              updateRule(rule.id, { value: event.target.value })
                            }
                            step={FIELD_STEP[rule.field]}
                            min={rule.field === 'change' ? undefined : 0}
                            className="num h-full min-w-0 flex-1 bg-transparent ps-3 text-[15px] focus-visible:outline-none"
                            style={{ color: 'var(--color-fg)' }}
                          />
                          {unit && (
                            <span
                              aria-hidden="true"
                              className="shrink-0 pe-2.5 text-[11px]"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              {unit}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={s('removeRule')}
                          onClick={() => removeRule(rule.id)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                          style={{
                            border: '1px solid var(--color-line)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          <IconX />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={addRule}
            disabled={rules.length >= MAX_RULES}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-[12px] font-medium transition-colors active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-40"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-fg)' }}
          >
            {rules.length < MAX_RULES && <IconPlus />}
            {rules.length >= MAX_RULES ? s('ruleLimit') : s('addRule')}
          </button>

          {showsTurnoverHint && (
            <p className="mt-2 px-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
              {s('turnoverHint')}
            </p>
          )}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="screener-results">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="screener-results" className="t-title text-[17px] font-semibold">
            {s('resultsTitle')}
          </h2>
          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('liveHint')}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="panel mt-2">
            <EmptyState
              text={s('resultsEmpty')}
              action={
                <button
                  type="button"
                  onClick={relaxRules}
                  className="min-h-11 rounded-full px-4 text-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  style={{ border: '1px solid var(--color-line)' }}
                >
                  {s('relax')}
                </button>
              }
            />
          </div>
        ) : (
          <div className="panel mt-2 overflow-hidden">
            <div
              className="grid grid-cols-[minmax(0,1fr)_78px_66px] gap-x-2 border-b px-3.5 py-2"
              style={{ borderColor: 'var(--color-line)' }}
            >
              <span className="t-kicker" style={kicker}>
                {s('nameHeader')}
              </span>
              <span className="t-kicker text-end" style={kicker}>
                {s('priceHeader')}
              </span>
              <span className="t-kicker text-end" style={kicker}>
                {s('changeHeader')}
              </span>
            </div>
            <ul>
              {results.map((quote, index) => {
                const up = quote.change >= 0
                return (
                  <li
                    key={quote.symbol}
                    style={{
                      borderTop: index === 0 ? 'none' : '1px solid var(--color-line)',
                    }}
                  >
                    <Link
                      to={`/m/${quote.symbol}`}
                      aria-label={`${fillName(s('openAria'), quote.name[lang])} · ${fmtNum(
                        quote.price,
                        lang,
                        2,
                      )} · ${fmtPct(quote.change, lang)}`}
                      className="grid min-h-11 grid-cols-[minmax(0,1fr)_78px_66px] items-center gap-x-2 px-3.5 py-2.5 transition-colors active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px]">{quote.name[lang]}</span>
                        <span
                          className="num mt-0.5 block text-[10px] leading-[1.4]"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {quote.symbol}
                        </span>
                      </span>
                      <span className="num text-end text-[13px] whitespace-nowrap">
                        {fmtNum(quote.price, lang, 2)}
                      </span>
                      <span
                        className={`num text-end text-[13px] font-medium whitespace-nowrap ${
                          up ? 'text-up' : 'text-down'
                        }`}
                      >
                        {fmtPct(quote.change, lang)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="screener-saved">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="screener-saved" className="t-title text-[17px] font-semibold">
            {s('savedTitle')}
          </h2>
          <span className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {screens.length} {s('savedCount')}
          </span>
        </div>

        <form onSubmit={saveScreen} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="off"
            enterKeyHint="done"
            placeholder={s('savePlaceholder')}
            aria-label={s('savePlaceholder')}
            className="h-11 min-w-0 flex-1 rounded-xl px-3 text-[14px] transition-colors placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            style={{
              border: '1px solid var(--color-line)',
              background: 'var(--color-surface)',
              color: 'var(--color-fg)',
            }}
          />
          <button
            type="submit"
            disabled={name.trim() === ''}
            className="h-11 shrink-0 rounded-xl px-4 text-[13px] font-semibold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {s('save')}
          </button>
        </form>

        {status !== '' && (
          <p role="status" className="mt-2 text-[11px]" style={{ color: 'var(--color-accent)' }}>
            {status}
          </p>
        )}

        {screens.length === 0 ? (
          <p className="mt-3 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            {s('savedEmpty')}
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {screens.map((screen) => {
              const active = screen.id === activeId
              return (
                <li
                  key={screen.id}
                  className="flex max-w-full items-center rounded-full"
                  style={{
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-line)'}`,
                    background: active
                      ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
                      : 'var(--color-surface)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openScreen(screen)}
                    aria-label={fillName(s('loadAria'), screen.name)}
                    className="flex h-11 min-w-0 items-center gap-1.5 rounded-s-full ps-3.5 pe-2 text-[12px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span className="max-w-[180px] truncate">{screen.name}</span>
                    <span
                      className="num shrink-0 text-[10px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {screen.rules.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteScreen(screen.id)}
                    aria-label={fillName(s('deleteAria'), screen.name)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-e-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <IconX size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </Screen>
  )
}
