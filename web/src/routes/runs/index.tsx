import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { EmptyState } from '../../components/states'
import { Screen } from '../../components/Screen'
import { fmtNum, useI18n, useStrings } from '../../i18n'
import { relTime } from '../../i18n/format'
import type { Lang } from '../../i18n'
import { clearThread, loadThread } from '../ai/thread'
import type { Msg, SourceRef } from '../ai/chat'
import { strings } from './strings'
import type { RunsStrings } from './strings'

type S = (k: keyof RunsStrings) => string

type Run = {
  key: string
  question: string
  answer: string
  sources: SourceRef[]
  artifact: string
  at: number
}

/** Pair the stored conversation into question/answer rows. */
function readRuns(): Run[] {
  const thread = loadThread()
  if (!thread) return []

  const runs: Run[] = []
  let asked: Extract<Msg, { role: 'user' }> | null = null

  for (const msg of thread.msgs) {
    if (msg.role === 'user') {
      if (asked) runs.push({ key: `q-${asked.id}`, question: asked.text, answer: '', sources: [], artifact: '', at: asked.at })
      asked = msg
      continue
    }
    if (msg.role === 'error') continue
    runs.push({
      key: `a-${msg.id}`,
      question: asked?.text ?? '',
      answer: msg.paras
        .map((tokens) => tokens.join(''))
        .join('\n\n')
        .slice(0, 900),
      sources: msg.sources,
      artifact: msg.artifact?.title ?? '',
      at: msg.at,
    })
    asked = null
  }

  if (asked) {
    runs.push({ key: `q-${asked.id}`, question: asked.text, answer: '', sources: [], artifact: '', at: asked.at })
  }
  return runs.reverse()
}

function RunCard({
  run,
  index,
  lang,
  now,
  open,
  onToggle,
  s,
}: {
  run: Run
  index: number
  lang: Lang
  now: number
  open: boolean
  onToggle: () => void
  s: S
}) {
  const panelId = `run-sources-${run.key}`

  return (
    <article>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="block min-h-11 w-full px-3 py-3.5 text-start transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg active:bg-fg/5"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="num text-[11px] text-muted">
            {s('runLabel').replace('{n}', fmtNum(runsNumber(index), lang, 0))}
          </span>
          <time className="num shrink-0 text-[11px] text-muted" dateTime={new Date(run.at).toISOString()}>
            {relTime(Math.max(1, (now - run.at) / 60_000), lang)}
          </time>
        </span>

        <span dir="auto" className="mt-2 line-clamp-2 text-[14px] leading-snug font-medium break-words">
          {run.question || s('untitled')}
        </span>

        <span dir="auto" className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed break-words text-muted">
          {run.answer || s('pending')}
        </span>

        <span className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/5 px-2.5 py-1 text-[11px] text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
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

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
            className="ms-auto shrink-0 text-muted transition-transform motion-reduce:transition-none"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="sr-only">{open ? s('collapse') : s('expand')}</span>
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-3 pt-3 pb-4">
          <p className="text-[11px] font-semibold text-muted">{s('sourcesTitle')}</p>
          {run.sources.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted">{s('noSources')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {run.sources.map((src, i) => (
                <li key={`${src.label}-${i}`} className="flex items-start gap-2 text-[12px] leading-relaxed">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {src.href ? (
                    <Link
                      to={src.href}
                      className="min-w-0 break-words underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                    >
                      {src.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 break-words">{src.label}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}

function runsNumber(index: number): number {
  return index + 1
}

export default function RunsPage() {
  const { lang } = useI18n()
  const s = useStrings<RunsStrings>(strings)
  const [runs, setRuns] = useState<Run[]>(readRuns)
  const [clearArmed, setClearArmed] = useState(false)
  const [now] = useState(() => Date.now())
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const totalSources = runs.reduce((acc, run) => acc + run.sources.length, 0)

  const toggle = (key: string) =>
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/ai" />}>
      <div className="pt-4">
        <p className="text-[14px] leading-relaxed text-muted">{s('lead')}</p>

        {runs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              text={s('pending')}
              action={
                <Link
                  to="/ai"
                  className="flex min-h-11 items-center rounded-full border border-line px-4 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  {s('askCta')}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="t-display num text-[40px] leading-none">
                {fmtNum(runs.length, lang, 0)}
              </span>
              <span className="text-[12px] text-muted">{s('runsLabel')}</span>
              <span aria-hidden="true" className="mx-1 text-line">·</span>
              <span className="num text-[12px] text-fg">{fmtNum(totalSources, lang, 0)}</span>
              <span className="text-[12px] text-muted">{s('sourcesLabel')}</span>
            </div>

            <div className="mt-5 divide-y divide-line border-t border-line">
              {runs.map((run, i) => (
                <RunCard
                  key={run.key}
                  run={run}
                  index={i}
                  lang={lang}
                  now={now}
                  open={openKeys.includes(run.key)}
                  onToggle={() => toggle(run.key)}
                  s={s}
                />
              ))}
            </div>
          </>
        )}

        {runs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!clearArmed) {
                setClearArmed(true)
                window.setTimeout(() => setClearArmed(false), 4000)
                return
              }
              clearThread()
              setRuns([])
              setClearArmed(false)
            }}
            className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full text-[12px] text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {clearArmed ? s('confirmClear') : s('clear')}
          </button>
        )}

        <Link
          to="/ai"
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-solid px-5 text-[15px] font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M4 12h10M4 17h13" />
          </svg>
          {s('askCta')}
        </Link>
      </div>
    </Screen>
  )
}
