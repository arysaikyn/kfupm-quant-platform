import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { relTime } from '../news/format'
import { strings } from './strings'
import type { RunsStrings } from './strings'

type S = (k: keyof RunsStrings) => string
type Key = keyof RunsStrings

const STORAGE_KEY = 'app.ai.thread'
const MAX_MSGS = 80
const MAX_TEXT = 700
/** Sequence ids are turned into wall-clock minutes with this spacing. */
const ID_GAP_MIN = 7
/** Runs without a usable id are spaced by this many minutes, newest first. */
const INDEX_GAP_MIN = 32
/** Anything above this reads as epoch milliseconds, not a sequence number. */
const EPOCH_MS = 1_000_000_000_000
const MAX_ID_SPAN = 500

type Run = {
  key: string
  question: string
  answer: string
  sources: string[]
  artifact: string
  minutesAgo: number
  /** Absolute time used by the <time> element. */
  at: number
}

type Rec = Record<string, unknown>

function rec(v: unknown): Rec | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : null
}

function text(v: unknown, limit = MAX_TEXT): string {
  return typeof v === 'string' ? v.trim().slice(0, limit) : ''
}

function seqId(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
}

/**
 * One number per run, derived from its message id: a monotonic sequence is
 * spaced by a fixed gap, real timestamps are used as-is, and id-less or
 * duplicate ids fall back to the run's position in the list.
 */
function minutesFor(
  id: number | null,
  index: number,
  newest: number | null,
  monotonic: boolean,
  now: number,
): number {
  if (id !== null && id >= EPOCH_MS) return Math.max(0, (now - id) / 60_000)
  if (monotonic && id !== null && newest !== null && newest >= id && newest - id <= MAX_ID_SPAN) {
    return (newest - id) * ID_GAP_MIN
  }
  return index * INDEX_GAP_MIN + 4
}

/**
 * Reads the AI thread from sessionStorage. Anything malformed — bad JSON, a
 * non-array `msgs`, junk entries — yields null rather than a crash.
 */
function readRuns(now: number): Run[] | null {
  let msgs: unknown[] = []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const thread = rec(JSON.parse(raw))
    if (!thread || !Array.isArray(thread.msgs)) return null
    msgs = thread.msgs.slice(-MAX_MSGS)
  } catch {
    return null
  }

  let newest: number | null = null
  let prev = -1
  let monotonic = true
  for (const m of msgs) {
    const id = seqId(rec(m)?.id)
    if (id === null) continue
    if (id <= prev) monotonic = false
    prev = id
    if (newest === null || id > newest) newest = id
  }

  type Draft = {
    key: string
    question: string
    answer: string
    sources: string[]
    artifact: string
    id: number | null
  }
  const drafts: Draft[] = []
  let asked: { text: string; id: number | null } | null = null
  let askedAt = 0

  msgs.forEach((raw, i) => {
    const m = rec(raw)
    if (!m) return
    const role = m.role
    const id = seqId(m.id)

    if (role === 'user') {
      // A second question with no answer between means the first went unanswered.
      if (asked) {
        drafts.push({
          key: `q-${askedAt}`,
          question: asked.text,
          answer: '',
          sources: [],
          artifact: '',
          id: asked.id,
        })
      }
      asked = { text: text(m.text), id }
      askedAt = i
      return
    }

    if (role !== 'assistant') return

    const paras = Array.isArray(m.paras) ? m.paras : []
    // Paragraphs arrive pre-tokenised from the thread; accept plain strings too.
    const first =
      paras
        .map((p) =>
          typeof p === 'string'
            ? p
            : Array.isArray(p)
              ? p.filter((t): t is string => typeof t === 'string').join('')
              : '',
        )
        .find((p) => p.trim().length > 0) ?? ''
    const sources = Array.isArray(m.sources)
      ? m.sources
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 40)
      : []
    drafts.push({
      key: `a-${i}`,
      question: asked ? asked.text : '',
      answer: first.trim().slice(0, MAX_TEXT),
      sources,
      artifact: text(m.artifactTitle, 80),
      id: id ?? asked?.id ?? null,
    })
    asked = null
  })

  // TS narrows the outer variable to null after the callback's last assignment,
  // so re-assert the declared shape here.
  const pending = asked as { text: string; id: number | null } | null
  if (pending) {
    drafts.push({
      key: `q-${askedAt}`,
      question: pending.text,
      answer: '',
      sources: [],
      artifact: '',
      id: pending.id,
    })
  }

  // Newest first, which is how a history reads.
  return drafts.reverse().map((d, i) => {
    const minutesAgo = minutesFor(d.id, i, newest, monotonic, now)
    return {
      key: d.key,
      question: d.question,
      answer: d.answer,
      sources: d.sources,
      artifact: d.artifact,
      minutesAgo,
      at: now - minutesAgo * 60_000,
    }
  })
}

const SEEDS: { q: Key; a: Key; src: Key[]; min: number }[] = [
  { q: 'seed1q', a: 'seed1a', src: ['srcQuote', 'srcFilings', 'srcNews'], min: 12 },
  { q: 'seed2q', a: 'seed2a', src: ['srcDividend', 'srcPeers'], min: 190 },
  { q: 'seed3q', a: 'seed3a', src: ['srcSector', 'srcQuote', 'srcScreener'], min: 1490 },
]

/** Three example runs so the screen is never empty on a fresh session. */
function seedRuns(s: S, now: number): Run[] {
  return SEEDS.map((seed, i) => ({
    key: `seed-${i}`,
    question: s(seed.q),
    answer: s(seed.a),
    sources: seed.src.map((k) => s(k)),
    artifact: '',
    minutesAgo: seed.min,
    at: now - seed.min * 60_000,
  }))
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ms-auto shrink-0 text-muted transition-transform"
      style={{ transform: open ? 'rotate(180deg)' : undefined }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function RunCard({
  run,
  index,
  open,
  onToggle,
  s,
  lang,
}: {
  run: Run
  index: number
  open: boolean
  onToggle: () => void
  s: S
  lang: Lang
}) {
  const panelId = `run-sources-${run.key}`

  return (
    <article>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="block min-h-11 w-full p-4 text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:bg-fg/5"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="num text-[11px] text-muted">
            {s('runLabel').replace('{n}', fmtNum(index + 1, lang, 0))}
          </span>
          <time
            className="num shrink-0 text-[11px] text-muted"
            dateTime={new Date(run.at).toISOString()}
          >
            {relTime(run.minutesAgo, lang)}
          </time>
        </span>

        <span
          dir="auto"
          className="mt-2 line-clamp-2 text-[14px] leading-snug font-medium break-words"
        >
          {run.question || s('untitled')}
        </span>

        <span
          dir="auto"
          className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed break-words text-muted"
        >
          {run.answer || s('pending')}
        </span>

        <span className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/5 px-2.5 py-1 text-[11px] text-muted">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M10 14a4 4 0 005.7 0l2.3-2.3a4 4 0 10-5.7-5.7L11 7.3" />
              <path d="M14 10a4 4 0 00-5.7 0L6 12.3a4 4 0 105.7 5.7l1.3-1.3" />
            </svg>
            <span className="num">{fmtNum(run.sources.length, lang, 0)}</span>
            <span>{s('sourcesShort')}</span>
          </span>

          {run.artifact && (
            <span className="max-w-[55%] truncate rounded-full bg-fg/5 px-2.5 py-1 text-[11px] text-muted">
              {run.artifact}
            </span>
          )}

          <Chevron open={open} />
          <span className="sr-only">{open ? s('collapse') : s('expand')}</span>
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-4 pt-3 pb-4">
          <p className="text-[11px] font-semibold text-muted">{s('sourcesTitle')}</p>
          {run.sources.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted">{s('noSources')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {run.sources.map((src, i) => (
                <li
                  key={`${src}-${i}`}
                  dir="auto"
                  className="flex items-start gap-2 text-[12.5px] leading-relaxed"
                >
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <span className="min-w-0 break-words">{src}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}

export default function RunsPage() {
  const { lang } = useI18n()
  const s = useStrings<RunsStrings>(strings)

  const [snapshot] = useState(() => {
    const now = Date.now()
    return { now, stored: readRuns(now) }
  })
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const stored = snapshot.stored
  const runs = stored && stored.length > 0 ? stored : seedRuns(s, snapshot.now)
  const sample = !stored || stored.length === 0
  const totalSources = runs.reduce((acc, run) => acc + run.sources.length, 0)

  const toggle = (key: string) =>
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  return (
    <Screen
      title={s('title')}
      action={
        <Link
          to="/ai"
          aria-label={s('newQuestion')}
          title={s('newQuestion')}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      }
    >
      <div className="space-y-3 pt-4">
        <p className="text-[13px] leading-relaxed text-muted">{s('lead')}</p>

        <section className="panel flex items-stretch p-4">
          <div className="min-w-0 flex-1">
            <p className="num text-[26px] leading-none font-semibold">
              {fmtNum(runs.length, lang, 0)}
            </p>
            <p className="mt-2 text-[11px] text-muted">{s('runsLabel')}</p>
          </div>
          <div className="min-w-0 flex-1 border-s border-line ps-4">
            <p className="num text-[26px] leading-none font-semibold">
              {fmtNum(totalSources, lang, 0)}
            </p>
            <p className="mt-2 text-[11px] text-muted">{s('sourcesLabel')}</p>
          </div>
        </section>

        {sample && <p className="text-[11px] leading-relaxed text-muted">{s('sampleNote')}</p>}

        <div className="panel divide-y divide-line overflow-hidden">
          {runs.map((run, i) => (
            <RunCard
              key={run.key}
              run={run}
              index={i}
              open={openKeys.includes(run.key)}
              onToggle={() => toggle(run.key)}
              s={s}
              lang={lang}
            />
          ))}
        </div>

        <Link
          to="/ai"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h10M4 17h13" />
          </svg>
          {s('askCta')}
        </Link>
      </div>
    </Screen>
  )
}
