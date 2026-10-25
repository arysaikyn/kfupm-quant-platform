import { quotes } from '../../data/mock'
import type { Strategy } from '../../data/mock'

/**
 * A receipt proves a run was reproducible: it pins the rules, the as-of date,
 * the universe the screen read, and the cost assumptions. The token is the
 * receipt itself (base64url of the canonical payload), so a shared link carries
 * the whole claim instead of an opaque id the demo cannot look up.
 *
 * Only language-independent fields go in: rules are `{ id, value }`, never the
 * localised label, so the same receipt reproduces in zh, en and ar.
 */

export type ReceiptCosts = {
  /** Starting capital, in the account's own currency. */
  capital: number
  /** Fee in basis points of final value (15 = 0.15%). */
  feeBps: number
  /** Slippage in basis points of final value (50 = 0.5%). */
  slipBps: number
  /** Annual turnover, in whole percent (78 = 78%). */
  turnoverPct: number
}

export type ReceiptRule = { id: string; value: string }

export type Receipt = {
  v: 1
  id: string
  /** The date the saved run was measured on (`strategy.updated`). */
  asOf: string
  rules: ReceiptRule[]
  /** Sorted symbols: a set, not a sequence. */
  universe: string[]
  costs: ReceiptCosts
}

/** The demo tape's symbols, sorted once so every receipt spells the universe the same way. */
export const UNIVERSE: string[] = quotes.map((q) => q.symbol).sort()

export function receiptFor(strategy: Strategy, costs: ReceiptCosts): Receipt {
  return {
    v: 1,
    id: strategy.id,
    asOf: strategy.updated,
    rules: strategy.rules.map(({ id, value }) => ({ id, value })),
    universe: [...UNIVERSE],
    costs: { ...costs },
  }
}

/**
 * The exact text the hash is taken over. Fixed field order, no JSON key order
 * to trust, and `encodeURIComponent` on every free string so a value carrying
 * "," or "=" cannot forge a second field.
 */
function canonical(r: Receipt): string {
  return [
    `v${r.v}`,
    encodeURIComponent(r.id),
    encodeURIComponent(r.asOf),
    r.rules.map((x) => `${encodeURIComponent(x.id)}=${encodeURIComponent(x.value)}`).join(','),
    r.universe.map(encodeURIComponent).join(','),
    `${r.costs.capital},${r.costs.feeBps},${r.costs.slipBps},${r.costs.turnoverPct}`,
  ].join('|')
}

/** One 32-bit FNV-1a lane. A stability checksum, not a security hash. */
function lane(input: string, basis: number, prime: number): number {
  let h = basis >>> 0
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, prime) >>> 0
  }
  return h >>> 0
}

/** 16 hex characters from two independent 32-bit lanes; synchronous and stable. */
export function hashOf(receipt: Receipt): string {
  const text = canonical(receipt)
  const a = lane(text, 0x811c9dc5, 0x01000193)
  const b = lane(text, 0x9e3779b9, 0x85ebca6b)
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

const SEXTET: Record<string, number> = Object.fromEntries(
  [...ALPHABET].map((ch, i) => [ch, i]),
)

/** base64url without padding, written out so the token never depends on `btoa`. */
export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : undefined
    const c = i + 2 < bytes.length ? bytes[i + 2] : undefined
    out += ALPHABET[a >> 2]
    out += ALPHABET[((a & 0b11) << 4) | ((b ?? 0) >> 4)]
    if (b === undefined) break
    out += ALPHABET[((b & 0b1111) << 2) | ((c ?? 0) >> 6)]
    if (c === undefined) break
    out += ALPHABET[c & 0b111111]
  }
  return out
}

export function fromBase64Url(token: string): string | null {
  const bytes: number[] = []
  for (let i = 0; i < token.length; i += 4) {
    const group = token.slice(i, i + 4)
    if (group.length === 1) return null
    const sextets: number[] = []
    for (const ch of group) {
      const value = SEXTET[ch]
      if (value === undefined) return null
      sextets.push(value)
    }
    const [c0, c1, c2, c3] = sextets
    bytes.push((c0 << 2) | (c1 >> 4))
    if (c2 !== undefined) bytes.push(((c1 & 0b1111) << 4) | (c2 >> 2))
    if (c3 !== undefined) bytes.push(((c2 & 0b11) << 6) | c3)
  }
  try {
    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch {
    return null
  }
}

export function encodeReceipt(receipt: Receipt): string {
  return toBase64Url(JSON.stringify(receipt))
}

function isRule(value: unknown): value is ReceiptRule {
  if (typeof value !== 'object' || value === null) return false
  const rule = value as Record<string, unknown>
  return typeof rule.id === 'string' && typeof rule.value === 'string'
}

function isCosts(value: unknown): value is ReceiptCosts {
  if (typeof value !== 'object' || value === null) return false
  const costs = value as Record<string, unknown>
  return (['capital', 'feeBps', 'slipBps', 'turnoverPct'] as const).every(
    (key) => typeof costs[key] === 'number' && Number.isFinite(costs[key] as number),
  )
}

/** Null for anything that is not a well-formed receipt: a bad link never crashes a screen. */
export function decodeReceipt(token: string): Receipt | null {
  const text = fromBase64Url(token)
  if (!text) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const body = parsed as Record<string, unknown>
  if (body.v !== 1) return null
  if (typeof body.id !== 'string' || typeof body.asOf !== 'string') return null
  if (!Array.isArray(body.rules) || !body.rules.every(isRule)) return null
  if (!Array.isArray(body.universe) || !body.universe.every((s) => typeof s === 'string')) {
    return null
  }
  if (!isCosts(body.costs)) return null
  return {
    v: 1,
    id: body.id,
    asOf: body.asOf,
    rules: body.rules.map((rule) => ({ id: rule.id, value: rule.value })),
    universe: [...body.universe],
    costs: body.costs,
  }
}

export type ReceiptChange =
  | { field: 'asOf'; from: string; to: string }
  | {
      field: 'rules'
      ruleId: string
      kind: 'value' | 'added' | 'removed' | 'order'
      from?: string
      to?: string
    }
  | { field: 'universe'; kind: 'added' | 'removed'; symbol: string }
  | { field: 'costs'; key: keyof ReceiptCosts; from: number; to: number }

export type ReceiptVerdict = {
  /** True when every pinned field still matches the strategy on screen. */
  ok: boolean
  changes: ReceiptChange[]
  /** The receipt's own hash, shown next to the verdict. */
  hash: string
}

const COST_KEYS: (keyof ReceiptCosts)[] = ['capital', 'feeBps', 'slipBps', 'turnoverPct']

/** Field-by-field diff, so a mismatch names what moved instead of just failing. */
export function compareReceipt(expected: Receipt, current: Receipt): ReceiptVerdict {
  const changes: ReceiptChange[] = []
  if (expected.asOf !== current.asOf) {
    changes.push({ field: 'asOf', from: expected.asOf, to: current.asOf })
  }

  const expectedIds = expected.rules.map((rule) => rule.id)
  const currentIds = current.rules.map((rule) => rule.id)
  for (const id of currentIds) {
    if (!expectedIds.includes(id)) changes.push({ field: 'rules', ruleId: id, kind: 'added' })
  }
  for (const id of expectedIds) {
    if (!currentIds.includes(id)) changes.push({ field: 'rules', ruleId: id, kind: 'removed' })
  }
  // Order is compared over the rules both lists share: an added or removed
  // rule shifts positions without reordering anything, and must not read as one.
  const sharedExpected = expectedIds.filter((id) => currentIds.includes(id))
  const sharedCurrent = currentIds.filter((id) => expectedIds.includes(id))
  const movedAt = sharedExpected.findIndex((id, index) => id !== sharedCurrent[index])
  if (movedAt >= 0) {
    changes.push({ field: 'rules', ruleId: sharedCurrent[movedAt], kind: 'order' })
  }

  // Where the same rule id sits in both lists, its condition is what a rerun reads.
  for (const rule of current.rules) {
    const before = expected.rules.find((x) => x.id === rule.id)
    if (!before || before.value === rule.value) continue
    changes.push({ field: 'rules', ruleId: rule.id, kind: 'value', from: before.value, to: rule.value })
  }

  for (const symbol of current.universe) {
    if (!expected.universe.includes(symbol)) {
      changes.push({ field: 'universe', kind: 'added', symbol })
    }
  }
  for (const symbol of expected.universe) {
    if (!current.universe.includes(symbol)) {
      changes.push({ field: 'universe', kind: 'removed', symbol })
    }
  }

  for (const key of COST_KEYS) {
    if (expected.costs[key] !== current.costs[key]) {
      changes.push({ field: 'costs', key, from: expected.costs[key], to: current.costs[key] })
    }
  }

  return { ok: changes.length === 0, changes, hash: hashOf(current) }
}
