import type { RunPreview } from '../../api/ai'
import type { Lang } from '../../i18n'
import { METRIC_ORDER, metricDisplay } from './metrics'
import type { MetricKey } from './metrics'

export type NumeralKind = 'percent' | 'decimal' | 'integer'
export type NumeralSkipReason =
  | 'code'
  | 'url'
  | 'link'
  | 'marker'
  | 'date'
  | 'version'
  | 'ticker'
  | 'year'

export type NumeralToken = {
  /** The exact display string, e.g. `+12.30%` or `1,200`. */
  text: string
  value: number
  kind: NumeralKind
  start: number
  end: number
}

export type NumeralSkip = { text: string; reason: NumeralSkipReason }

export type NumeralNumber = NumeralToken & {
  /** Run metrics whose formatted value equals this number, in card order. */
  metricKeys: MetricKey[]
}

export type NumeralProvenance = {
  numbers: NumeralNumber[]
  total: number
  traced: number
  skipped: NumeralSkip[]
}

/**
 * Everything a reader could mistake for a metric is a candidate. Ranges are
 * blanked rather than deleted, so start/end offsets stay valid for rendering.
 */
const FENCED = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm
const INLINE_CODE = /(`+)([^`\n]*?)\1/g
const MD_LINK = /\[[^\]\n]*\]\([^)\n]*\)/g
const LIST_MARKER = /^ {0,3}\d{1,3}[.)][ \t]/gm
const FOOTNOTE = /\[\^[^\]\n]*\]/g
const URL = /(?:https?:\/\/|www\.)[^\s<>()[\]{}"'`]+/gi
const HTML = /<\/?[a-z][^>\n]*>/gi
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g
const YEAR_RANGE = /\b(?:19|20)\d{2}[-–/]\d{1,4}\b/g
const SLASH_DATE = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
const CLOCK = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g
const VERSION = /\b\d+(?:\.\d+){2,}\b/g

/** Sign, currency, number, percent, multiple. No lookbehind: older Safari. */
const TOKEN =
  /(^|[^\p{L}\p{N}_])([+\-−])?[ \u00a0\u202f]?(?:(SAR|USD|AED|EUR|GBP|﷼|€|£|¥|\$)[ \u00a0\u202f]?)?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)([ \u00a0\u202f]?%)?(?:[ \u00a0\u202f]?(x|×))?/giu

const BIDI = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
const DASHES = /[\u2212\u2010-\u2015\u2043]/g
const SPACES = /[\u00a0\u2009\u202f]/g

function mask(
  text: string,
  pattern: RegExp,
  reason: NumeralSkipReason,
  skipped: NumeralSkip[],
): string {
  return text.replace(pattern, (match) => {
    const trimmed = match.trim()
    if (trimmed) skipped.push({ text: trimmed.slice(0, 60), reason })
    return ' '.repeat(match.length)
  })
}

function maskOpenFence(text: string, skipped: NumeralSkip[]): string {
  const open = /^ {0,3}(?:`{3,}|~{3,})/m.exec(text)
  if (!open) return text
  skipped.push({ text: text.slice(open.index).trim().slice(0, 60), reason: 'code' })
  return text.slice(0, open.index) + ' '.repeat(text.length - open.index)
}

/** Blank Markdown structure that is never part of a claim: code, links, dates. */
function maskStructure(markdown: string, skipped: NumeralSkip[]): string {
  let text = mask(markdown, FENCED, 'code', skipped)
  text = maskOpenFence(text, skipped)
  text = mask(text, INLINE_CODE, 'code', skipped)
  text = mask(text, MD_LINK, 'link', skipped)
  text = mask(text, FOOTNOTE, 'marker', skipped)
  text = mask(text, LIST_MARKER, 'marker', skipped)
  text = mask(text, URL, 'url', skipped)
  text = mask(text, HTML, 'link', skipped)
  text = mask(text, ISO_DATE, 'date', skipped)
  text = mask(text, YEAR_RANGE, 'date', skipped)
  text = mask(text, SLASH_DATE, 'date', skipped)
  text = mask(text, CLOCK, 'date', skipped)
  text = mask(text, VERSION, 'version', skipped)
  return text
}

/**
 * Pull every numeric display out of a run of text. Years, four-digit Tadawul
 * tickers and version strings are reported as skips, never as numbers.
 */
export function scanNumbers(
  text: string,
  skipped: NumeralSkip[] = [],
): { tokens: NumeralToken[]; skipped: NumeralSkip[] } {
  const tokens: NumeralToken[] = []
  TOKEN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TOKEN.exec(text)) !== null) {
    const lead = match[1] ?? ''
    const body = match[0].slice(lead.length)
    const start = match.index + lead.length
    const end = start + body.length
    const display = body.trim()
    if (!display) continue

    const next = text[end] ?? ''
    // A trailing letter is a unit or ticker run (`12kg`, `2222SR`).
    if (next && /[\p{L}\p{N}_]/u.test(next)) continue
    // A trailing `.SR` is a ticker suffix; a trailing `.5` is another dotted segment.
    if (next === '.' && /[\p{L}\p{N}]/u.test(text[end + 1] ?? '')) {
      const suffix = text[end + 1] ?? ''
      skipped.push({ text: display, reason: /\p{Lu}/u.test(suffix) ? 'ticker' : 'version' })
      continue
    }

    const digits = match[4]
    const percent = (match[5] ?? '').includes('%')
    const multiple = Boolean(match[6])
    const kind: NumeralKind = percent ? 'percent' : digits.includes('.') || multiple ? 'decimal' : 'integer'
    const numeric = Number(digits.replace(/,/g, ''))
    if (!Number.isFinite(numeric)) continue
    const negative = match[2] === '-' || match[2] === '−'
    const value = negative ? -numeric : numeric

    if (kind === 'integer') {
      const bare = digits.length === 4 && !digits.includes(',')
      if (bare && value >= 1900 && value <= 2099) {
        skipped.push({ text: display, reason: 'year' })
        continue
      }
      // A bare four-digit integer is a Saudi ticker, not a measured value.
      if (bare) {
        skipped.push({ text: display, reason: 'ticker' })
        continue
      }
    }

    tokens.push({ text: display, value, kind, start, end })
  }
  return { tokens, skipped }
}

/** Numbers from a Markdown answer, with structural noise removed. */
export function extractNumerals(markdown: string): {
  tokens: NumeralToken[]
  skipped: NumeralSkip[]
} {
  const skipped: NumeralSkip[] = []
  return scanNumbers(maskStructure(markdown, skipped), skipped)
}

/**
 * Comparison form: display strings differ only by locale punctuation, bidi
 * marks and spacing. Everything else (sign included) must match.
 */
export function normalizeNumeral(text: string): string {
  return text
    .replace(BIDI, '')
    .replace(/[\u066b]/g, '.')
    .replace(/[\u066c]/g, ',')
    .replace(DASHES, '-')
    .replace(SPACES, ' ')
    .replace(/\s+/g, '')
}

/** Formatted metric values keyed in comparison form; signless aliases included. */
export function metricRegistry(
  metrics: Record<string, number> | null | undefined,
  lang: Lang,
): Map<string, MetricKey[]> {
  const registry = new Map<string, MetricKey[]>()
  if (!metrics) return registry
  const add = (key: string, metric: MetricKey) => {
    const keys = registry.get(key)
    if (keys) {
      if (!keys.includes(metric)) keys.push(metric)
    } else {
      registry.set(key, [metric])
    }
  }
  for (const metric of METRIC_ORDER) {
    const value = metrics[metric]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const normalized = normalizeNumeral(metricDisplay(metric, value, lang))
    add(normalized, metric)
    // A model writing "12.30%" for a +12.30% run is still the same number.
    if (normalized.startsWith('+')) add(normalized.slice(1), metric)
  }
  return registry
}

/**
 * Bind an answer's numbers to the run card. Anything that does not match is
 * kept in `numbers` (so the UI can mark it) and leaves `traced` behind.
 */
export function numeralProvenance(
  markdown: string,
  run: RunPreview | null | undefined,
  lang: Lang,
): NumeralProvenance {
  const { tokens, skipped } = extractNumerals(markdown)
  const registry = metricRegistry(run?.metrics, lang)
  const numbers = tokens.map((token) => ({
    ...token,
    metricKeys: registry.get(normalizeNumeral(token.text)) ?? [],
  }))
  return {
    numbers,
    total: numbers.length,
    traced: numbers.filter((number) => number.metricKeys.length > 0).length,
    skipped,
  }
}
