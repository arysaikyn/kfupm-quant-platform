import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { GridCheck } from '../../components/GridCheck'
import { Screen } from '../../components/Screen'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { fill } from '../../i18n/format'
import { isDataStale } from '../../lib/freshness'
import { gridCheck } from '../../lib/gridcheck'
import { quotes } from '../../data/mock'
import {
  FIELD_FAMILY,
  MAX_RULES,
  PRESET_IDS,
  applyRules,
  cloneRules,
  createId,
  defaultRules,
  metric,
  newRule,
  presetRules,
  ruleValue,
  sanitizeRules,
} from '../../lib/screener'
import type { Field, Op, PresetId, Rule } from '../../lib/screener'
import { loadScreens, storeScreens } from '../../store/screens'
import type { SavedScreen } from '../../store/screens'
import { counterfactual, funnel, relaxations, shariaBuckets } from './audit'
import type { Relaxation } from './audit'
import { StaleNotice, ShariaAudit, ZeroAutopsy } from './AuditPanels'
import { Counterfactual, Pipeline } from './Pipeline'
import { FIELD_KEY, FIELD_ORDER, FIELD_STEP, FIELD_UNIT, OP_SYMBOL, ruleText } from './format'
import { screenerStrings } from './strings'
import type { ScreenerStrings } from './strings'

const PRESET_KEY: Record<PresetId, keyof ScreenerStrings> = {
  value: 'presetValue',
  momentum: 'presetMomentum',
  calm: 'presetCalm',
}

const OP_OPTIONS: readonly { value: Op; key: 'opLt' | 'opGt' }[] = [
  { value: 'lt', key: 'opLt' },
  { value: 'gt', key: 'opGt' },
]

type SortKey = 'change' | 'price' | 'name'
type SortDir = 'desc' | 'asc'

const SORT_COLUMNS: readonly {
  key: SortKey
  label: 'nameHeader' | 'priceHeader' | 'changeHeader'
}[] = [
  { key: 'name', label: 'nameHeader' },
  { key: 'price', label: 'priceHeader' },
  { key: 'change', label: 'changeHeader' },
]

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
  const [params] = useSearchParams()
  const [rules, setRules] = useState<Rule[]>(() => {
    const shared = params.get('rules')
    if (shared) {
      try {
        const parsed: unknown = JSON.parse(shared)
        if (Array.isArray(parsed)) {
          const safe = sanitizeRules(parsed)
          if (safe.length > 0) return safe
        }
      } catch {
        // A broken share link falls back to the default rule.
      }
    }
    const preset = params.get('preset')
    return preset && (PRESET_IDS as readonly string[]).includes(preset)
      ? presetRules(preset as PresetId)
      : defaultRules()
  })
  const [shareCopied, setShareCopied] = useState(false)
  const [name, setName] = useState('')
  const [screens, setScreens] = useState<SavedScreen[]>(loadScreens)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'change', dir: 'desc' })
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})

  // A handoff from the AI carries the preset in the URL. Apply it when the
  // route is reached with a different preset, without touching manual edits.
  useEffect(() => {
    // The URL is external state; applying a new preset must reset the editor.
    const preset = params.get('preset')
    if (!preset || !(PRESET_IDS as readonly string[]).includes(preset)) return
    // oxlint-disable-next-line react/set-state-in-effect
    setRules(presetRules(preset as PresetId))
  }, [params])

  useEffect(() => {
    if (status === '') return
    const timer = window.setTimeout(() => setStatus(''), 1800)
    return () => window.clearTimeout(timer)
  }, [status])

  /** Rules that actually filter — a blank value is not part of the screen yet. */
  const activeRules = useMemo(
    () =>
      rules.flatMap((rule) => {
        const value = ruleValue(rule)
        return value === null ? [] : [{ rule, value }]
      }),
    [rules],
  )

  const [now] = useState(() => Date.now())
  const stale = isDataStale(now)
  const snapshotVisible = !stale || snapshotOpen

  const buckets = useMemo(() => shariaBuckets(quotes), [])
  const ruleMatches = useMemo(() => applyRules(buckets.compliant, rules), [buckets, rules])

  const results = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...ruleMatches].sort((a, b) => {
      if (sort.key === 'name') return a.name[lang].localeCompare(b.name[lang]) * dir
      const delta = sort.key === 'price' ? a.price - b.price : a.change - b.change
      return delta === 0 ? a.symbol.localeCompare(b.symbol) : delta * dir
    })
  }, [ruleMatches, sort, lang])

  const stages = useMemo(() => funnel(buckets.compliant, rules), [buckets, rules])
  const candidates = useMemo(
    () => (results.length === 0 ? relaxations(buckets.compliant, rules) : []),
    [buckets, rules, results.length],
  )
  const whatIf = useMemo(() => counterfactual(buckets, rules), [buckets, rules])
  // A screen selects at one instant, so it never states an exit; the check says
  // what that costs, and what the rules actually read.
  const grid = useMemo(
    () =>
      gridCheck({
        families: rules
          .filter((rule) => ruleValue(rule) !== null)
          .map((rule) => FIELD_FAMILY[rule.field]),
        rankExit: false,
      }),
    [rules],
  )

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

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' },
    )
  }

  /** Chip body: bring the rule row into view and put the caret on its field. */
  function focusRule(id: string) {
    const row = rowRefs.current[id]
    if (!row) return
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    row.querySelector('select')?.focus()
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

  function duplicateScreen(id: string) {
    const source = screens.find((screen) => screen.id === id)
    if (!source) return
    const copy: SavedScreen = {
      id: createId('s'),
      name: `${source.name} · copy`.slice(0, 40),
      rules: cloneRules(source.rules),
    }
    const next = [copy, ...screens]
    setScreens(next)
    storeScreens(next)
    setActiveId(copy.id)
    setRules(cloneRules(copy.rules))
    setName(copy.name)
    setStatus(s('saved'))
  }

  useEffect(() => {
    if (!confirmDelete) return
    const timer = window.setTimeout(() => setConfirmDelete(null), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmDelete])

  function deleteScreen(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    const next = screens.filter((screen) => screen.id !== id)
    setConfirmDelete(null)
    setScreens(next)
    storeScreens(next)
    if (activeId === id) setActiveId(null)
  }

  function relaxRules() {
    setRules([])
    setActiveId(null)
  }

  function applyRelaxation(candidate: Relaxation) {
    setActiveId(null)
    setRules(candidate.rules)
  }

  const showsTurnoverHint = rules.some((rule) => rule.field === 'turnover')

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/search" />}>
      <div className="mt-4">
        <p className="t-kicker" style={kicker}>
          {s('presetsLabel')}
        </p>
        <div
          role="group"
          aria-label={s('presetsLabel')}
          className="mt-2 grid grid-cols-3 gap-2"
        >
          {PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => applyPreset(id)}
              className="flex min-h-11 items-center justify-center rounded-full bg-surface px-2 py-2 text-[13px] leading-tight font-medium text-fg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
            >
              {s(PRESET_KEY[id])}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-8" aria-labelledby="screener-rules">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="screener-rules" className="t-section">
            {s('rulesTitle')}
          </h2>
          <span className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {rules.length}/{MAX_RULES}
          </span>
        </div>

        <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {s('rulesHelper')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const data = rules
                .filter((rule) => ruleValue(rule) !== null)
                .map(({ field, op, value }) => ({ field, op, value }))
              const url = `${window.location.origin}${window.location.pathname}?rules=${encodeURIComponent(JSON.stringify(data))}`
              try {
                await navigator.clipboard.writeText(url)
                setShareCopied(true)
                window.setTimeout(() => setShareCopied(false), 1600)
              } catch {
                // Clipboard permission is optional.
              }
            }}
            className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('shareLink')}
          </button>
          <span role="status" aria-live="polite" className="text-[11px] text-muted">
            {shareCopied ? s('linkCopied') : ''}
          </span>
        </div>

        {activeRules.length > 0 && (
          <ul
            aria-label={s('filterChipsLabel')}
            className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5"
          >
            {activeRules.map(({ rule, value }) => {
              const text = ruleText(rule, value, s(FIELD_KEY[rule.field]), lang)
              return (
                <li
                  key={rule.id}
                  className="flex shrink-0 items-center rounded-full bg-surface"
                >
                  <button
                    type="button"
                    onClick={() => focusRule(rule.id)}
                    className="flex h-11 items-center whitespace-nowrap rounded-s-full ps-3.5 pe-2 text-[11px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    style={{ color: 'var(--color-fg)' }}
                  >
                    {text}
                  </button>
                  <button
                    type="button"
                    aria-label={fill(s('removeFilterAria'), { name: text })}
                    onClick={() => removeRule(rule.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-e-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <IconX size={12} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <ul className="mt-3 divide-y divide-line border-t border-line">
          {rules.length === 0 && (
            <li className="py-3 text-[12px]" style={{ color: 'var(--color-muted)' }}>
              {s('noRules')}
            </li>
          )}
          {rules.map((rule, index) => {
            const unit = FIELD_UNIT[rule.field]
            return (
              <li
                key={rule.id}
                ref={(node) => {
                  rowRefs.current[rule.id] = node
                }}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
              >
                <div className="relative min-w-0 flex-1">
                  <select
                    value={rule.field}
                    aria-label={`${s('fieldLabel')} ${index + 1}`}
                    onChange={(event) =>
                      updateRule(rule.id, { field: event.target.value as Field })
                    }
                    className="h-11 min-h-11 w-full appearance-none rounded-lg bg-fg/5 ps-3 pe-9 text-[14px] text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
                  >
                    {FIELD_ORDER.map((field) => (
                      <option key={field} value={field}>
                        {s(FIELD_KEY[field])}
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
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-semibold transition-colors active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
                          style={
                            selected
                              ? {
                                  background:
                                    'color-mix(in srgb, var(--color-accent) 16%, transparent)',
                                  color: 'var(--color-accent)',
                                }
                              : { color: 'var(--color-muted)' }
                          }
                        >
                          <span aria-hidden="true">{OP_SYMBOL[option.value]}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="relative min-w-0 flex-1 sm:w-[104px] sm:flex-none">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={rule.value}
                      aria-label={`${s('valueLabel')} ${index + 1}`}
                      onChange={(event) => updateRule(rule.id, { value: event.target.value })}
                      step={FIELD_STEP[rule.field]}
                      min={rule.field === 'change' ? undefined : 0}
                      className="num h-11 min-h-11 w-full min-w-0 rounded-lg bg-fg/5 ps-3 text-[15px] text-fg transition-colors [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      style={{ paddingInlineEnd: unit ? 24 : 10 }}
                    />
                    {unit && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px]"
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <IconX />
                  </button>
                </div>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={addRule}
              disabled={rules.length >= MAX_RULES}
              className="flex min-h-11 w-full items-center gap-1.5 py-1 text-[13px] font-medium transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg disabled:opacity-40"
            >
              {rules.length < MAX_RULES && <IconPlus />}
              {rules.length >= MAX_RULES ? s('ruleLimit') : s('addRule')}
            </button>
          </li>
        </ul>

        {showsTurnoverHint && (
          <p className="mt-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('turnoverHint')}
          </p>
        )}

        <div className="mt-5">
          <GridCheck report={grid} compact />
        </div>
      </section>

      {stale && (
        <StaleNotice
          s={s}
          lang={lang}
          now={now}
          snapshotOpen={snapshotOpen}
          onToggle={() => setSnapshotOpen((open) => !open)}
        />
      )}

      {snapshotVisible && (
        <>
          {stale && (
            <p
              role="note"
              className="mt-3 text-[11px] leading-snug"
              style={{ color: 'var(--color-muted)' }}
            >
              {s('snapshotNotice')}
            </p>
          )}

          <Pipeline
            s={s}
            lang={lang}
            stages={[
              { key: 'pipelineSharia', kept: buckets.compliant.length, from: buckets.total },
              {
                key: 'pipelineRules',
                kept: ruleMatches.length,
                from: buckets.compliant.length,
              },
              { key: 'pipelineRank', kept: results.length, from: ruleMatches.length },
            ]}
          />

          <section className="mt-8" aria-label={s('resultsTitle')}>
            <div className="flex items-center justify-between gap-3">
              <p
                aria-live="polite"
                aria-atomic="true"
                className="text-[15px] leading-snug"
                style={{ color: 'var(--color-fg)' }}
              >
                {fill(s('resultsCount'), {
                  n: fmtNum(results.length, lang, 0),
                  total: fmtNum(quotes.length, lang, 0),
                })}
              </p>
              {!stale && (
                <span
                  className="shrink-0 text-[11px] leading-none"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {s('liveHint')}
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <ZeroAutopsy
                s={s}
                lang={lang}
                buckets={buckets}
                stages={stages}
                candidates={candidates}
                onApply={applyRelaxation}
                onClear={relaxRules}
              />
            ) : (
              <div className="mt-5 border-t border-line">
            <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_78px_66px] items-center gap-x-2">
              {SORT_COLUMNS.map((column) => {
                const active = sort.key === column.key
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    aria-pressed={active}
                    className={`flex min-h-11 items-center gap-1 text-[11px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg ${
                      column.key === 'name' ? 'justify-start text-start' : 'justify-end text-end'
                    }`}
                    style={kicker}
                  >
                    {s(column.label)}
                    <span
                      aria-hidden="true"
                      className="text-[8px] leading-none"
                      style={{ opacity: active ? 1 : 0 }}
                    >
                      {sort.dir === 'desc' ? '▼' : '▲'}
                    </span>
                  </button>
                )
              })}
            </div>
            <ul className="divide-y divide-line">
              {results.map((quote) => {
                const up = quote.change >= 0
                // Every row cleared every active rule, so the reasons are just
                // those rules rewritten with the quote's own value.
                const reasons = activeRules.map(({ rule, value }) =>
                  ruleText(rule, value, s(FIELD_KEY[rule.field]), lang, metric(quote, rule.field)),
                )
                const kept = reasons.slice(0, 2)
                const extra = reasons.length - kept.length
                const reason =
                  extra > 0 ? `${kept.join(' · ')} +${fmtNum(extra, lang, 0)}` : kept.join(' · ')
                return (
                  <li key={quote.symbol}>
                    <Link
                      to={`/m/${quote.symbol}`}
                      className="block min-h-[56px] py-2 transition-colors hover:bg-fg/5 active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    >
                      <span className="grid grid-cols-[minmax(0,1fr)_78px_66px] items-center gap-x-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[14px]">{quote.name[lang]}</span>
                          <span
                            className="num mt-0.5 block text-[11px] leading-[1.4]"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {quote.symbol}
                          </span>
                        </span>
                        <span className="num text-end text-[12px] whitespace-nowrap">
                          {fmtNum(quote.price, lang, 2)}
                        </span>
                        <span
                          className={`num text-end text-[15px] font-semibold whitespace-nowrap ${
                            up ? 'text-up' : 'text-down'
                          }`}
                        >
                          {fmtPct(quote.change, lang)}
                        </span>
                      </span>
                      {reason !== '' && (
                        <span
                          className="num mt-1 block truncate text-[11px] leading-[1.4]"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {reason}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
          </section>

          <ShariaAudit s={s} lang={lang} buckets={buckets} />
          <Counterfactual s={s} lang={lang} entries={whatIf} />
        </>
      )}

      <section className="mt-8" aria-labelledby="screener-saved">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="screener-saved" className="t-section">
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
            className="h-11 min-w-0 flex-1 rounded-xl px-3 text-[14px] transition-colors placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
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
            style={{ background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }}
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
                    aria-label={fill(s('loadAria'), { name: screen.name })}
                    className="flex h-11 min-w-0 items-center gap-1.5 rounded-s-full ps-3.5 pe-2 text-[12px] transition-colors active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                  >
                    <span className="max-w-[180px] truncate">{screen.name}</span>
                    <span
                      className="num shrink-0 text-[11px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {screen.rules.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateScreen(screen.id)}
                    aria-label={fill(s('duplicateAria'), { name: screen.name })}
                    className="flex h-11 w-11 shrink-0 items-center justify-center transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="8" y="8" width="12" height="12" rx="2" />
                      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteScreen(screen.id)}
                    aria-label={
                      confirmDelete === screen.id
                        ? s('confirmDelete')
                        : fill(s('deleteAria'), { name: screen.name })
                    }
                    className={`flex h-11 shrink-0 items-center justify-center rounded-e-full transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg ${
                      confirmDelete === screen.id ? 'min-w-0 px-2' : 'w-11'
                    }`}
                    style={{
                      color:
                        confirmDelete === screen.id
                          ? 'var(--color-danger)'
                          : 'var(--color-muted)',
                    }}
                  >
                    {confirmDelete === screen.id ? (
                      <span className="whitespace-nowrap text-[11px]">{s('confirmDelete')}</span>
                    ) : (
                      <IconX size={14} />
                    )}
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
