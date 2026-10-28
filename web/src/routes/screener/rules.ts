import { fundamentalsFor } from '../../data/fundamentals'
import type { Quote } from '../../data/mock'
import type { FactorFamily } from '../../lib/gridcheck'

/**
 * Price, volume and the three fundamentals the tape actually carries. The split
 * matters: a screen built only on the first three reads the measured-dead factor
 * block, which is why `lib/gridcheck` exists.
 */
export type Field = 'pe' | 'debt' | 'yield' | 'change' | 'price' | 'turnover'

export const FIELD_FAMILY: Record<Field, FactorFamily> = {
  pe: 'fundamental',
  debt: 'fundamental',
  yield: 'fundamental',
  change: 'momentum',
  price: 'price',
  turnover: 'volume',
}
export type Op = 'lt' | 'gt'

export type Rule = {
  id: string
  field: Field
  op: Op
  /** Kept as text so a half-typed value never collapses to 0 mid-keystroke. */
  value: string
}

export type SavedScreen = {
  id: string
  name: string
  rules: Rule[]
}

export type PresetId = 'value' | 'momentum' | 'calm'

export const MAX_RULES = 5

const STORAGE_KEY = 'screener.screens'

const FIELDS: readonly Field[] = ['pe', 'debt', 'yield', 'change', 'price', 'turnover']
const OPS: readonly Op[] = ['lt', 'gt']

export const PRESET_IDS: readonly PresetId[] = ['value', 'momentum', 'calm']

/**
 * Value reads the two fundamentals the Sharia screen also needs, so the default
 * preset cannot be a price-only screen; turnover below ~21% of the window's
 * starting level is the quiet half of this sample.
 */
const PRESETS: Record<PresetId, readonly Omit<Rule, 'id'>[]> = {
  value: [
    { field: 'pe', op: 'lt', value: '30' },
    { field: 'debt', op: 'lt', value: '45' },
  ],
  momentum: [{ field: 'change', op: 'gt', value: '1' }],
  calm: [{ field: 'turnover', op: 'lt', value: '21' }],
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Turnover proxy. The mock carries no volume, so the sparkline stands in: the
 * total absolute travel across its window, as a percentage of the first point.
 * The window length sets the sample, so a longer spark carries more travel.
 */
export function turnover(q: Quote): number {
  const spark = q.spark
  if (spark.length < 2) return 0
  const first = Math.abs(spark[0])
  if (first === 0) return 0
  let travel = 0
  for (let i = 1; i < spark.length; i += 1) travel += Math.abs(spark[i] - spark[i - 1])
  return (travel / first) * 100
}

/** The number a rule compares against, in the unit shown in the input. */
export function metric(q: Quote, field: Field): number {
  switch (field) {
    case 'pe':
      return fundamentalsFor(q.symbol, q.price).pe
    case 'debt':
      return fundamentalsFor(q.symbol, q.price).debtRatio * 100
    case 'yield':
      return fundamentalsFor(q.symbol, q.price).dividendYield * 100
    case 'change':
      return q.change * 100
    case 'price':
      return q.price
    case 'turnover':
      return turnover(q)
  }
}

/** Null when the field is blank or not a number yet — the rule is then inactive. */
export function ruleValue(rule: Rule): number | null {
  const raw = rule.value.trim().replace(',', '.')
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function applyRules(list: readonly Quote[], rules: readonly Rule[]): Quote[] {
  const active = rules.flatMap((rule) => {
    const value = ruleValue(rule)
    return value === null ? [] : [{ rule, value }]
  })
  if (active.length === 0) return [...list]
  return list.filter((q) =>
    active.every(({ rule, value }) => {
      const current = metric(q, rule.field)
      return rule.op === 'lt' ? current < value : current > value
    }),
  )
}

export function newRule(): Rule {
  return { id: createId('r'), field: 'change', op: 'gt', value: '' }
}

/** A first row makes the builder legible before anything is typed. */
export function defaultRules(): Rule[] {
  return [{ id: createId('r'), field: 'price', op: 'gt', value: '0' }]
}

export function cloneRules(rules: readonly Rule[]): Rule[] {
  return rules.map((rule) => ({ ...rule, id: createId('r') }))
}

export function presetRules(id: PresetId): Rule[] {
  return PRESETS[id].map((rule) => ({ ...rule, id: createId('r') }))
}

function isField(v: unknown): v is Field {
  return typeof v === 'string' && (FIELDS as readonly string[]).includes(v)
}

function isOp(v: unknown): v is Op {
  return typeof v === 'string' && (OPS as readonly string[]).includes(v)
}

export function sanitizeRules(input: unknown[]): Rule[] {
  const out: Rule[] = []
  for (const entry of input) {
    if (out.length >= MAX_RULES) break
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    if (!isField(record.field) || !isOp(record.op)) continue
    const value =
      typeof record.value === 'string'
        ? record.value
        : typeof record.value === 'number' && Number.isFinite(record.value)
          ? String(record.value)
          : ''
    if (value.trim() === '') continue
    if (!Number.isFinite(Number(value.replace(',', '.')))) continue
    out.push({ id: createId('r'), field: record.field, op: record.op, value })
  }
  return out
}

/** Never throws: a corrupt or blocked store reads as "no saved screens". */
export function loadScreens(): SavedScreen[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: SavedScreen[] = []
    const ids = new Set<string>()
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name.trim().slice(0, 40) : ''
      if (!name) continue
      const rules = Array.isArray(record.rules) ? sanitizeRules(record.rules) : []
      let id =
        typeof record.id === 'string' && record.id.trim() ? record.id.trim() : createId('s')
      if (ids.has(id)) id = createId('s')
      ids.add(id)
      out.push({ id, name, rules })
    }
    return out
  } catch {
    return []
  }
}

export function storeScreens(screens: readonly SavedScreen[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(screens))
  } catch {
    // Private browsing: the in-memory list still works until reload.
  }
}
