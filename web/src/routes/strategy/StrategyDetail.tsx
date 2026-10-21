import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { equity, strategies } from '../../data/mock'
import { fmtClock } from './format'
import { EquityChart } from './EquityChart'
import { detailStrings, listStrings, TAG_KEY } from './strings'
import type { DetailStrings } from './strings'

type Rule = { key: keyof DetailStrings; field: string }

/** Four read-only conditions; the technical field stays in code notation. */
const RULES: Rule[] = [
  { key: 'rule1', field: 'pe_ttm < 15' },
  { key: 'rule2', field: 'debt_to_assets < 0.30' },
  { key: 'rule3', field: 'sector not_in [banks, insurance]' },
  { key: 'rule4', field: 'sharia_screen = pass' },
]

const STEPS = ['stepFetch', 'stepFilter', 'stepCompute', 'stepDone'] as const

/** No turnover field in the mock contract; a fixed figure keeps the row honest. */
const TURNOVER = 0.78

function Metric({
  value,
  name,
  hint,
  tone,
}: {
  value: string
  name: string
  hint: string
  tone?: string
}) {
  return (
    <div className="min-w-0">
      <div dir="ltr" className={`num text-[17px] leading-tight font-semibold ${tone ?? ''}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-tight">{name}</div>
      <div className="mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
        {hint}
      </div>
    </div>
  )
}

export default function StrategyDetail() {
  const { id } = useParams()
  const { lang } = useI18n()
  const s = useStrings(detailStrings)
  const tagLabel = useStrings(listStrings)
  const navigate = useNavigate()

  const [run, setRun] = useState<{ step: number; running: boolean; at: string | null }>({
    step: -1,
    running: false,
    at: null,
  })
  const timers = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const st = strategies.find((x) => x.id === id)

  const rerun = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setRun({ step: 0, running: true, at: null })
    const marks = [650, 1300, 1950, 2500]
    marks.forEach((ms, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (i < marks.length - 1) {
            setRun((r) => ({ ...r, step: i + 1 }))
          } else {
            setRun({ step: 3, running: false, at: fmtClock(new Date(), lang) })
          }
        }, ms),
      )
    })
  }

  const back = (
    <button
      type="button"
      onClick={() => navigate('/strategy')}
      aria-label={s('back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ border: '1px solid var(--color-line)' }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rtl:rotate-180"
        aria-hidden="true"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )

  if (!st) {
    return (
      <Screen title={s('notFound')} leading={back}>
        <ErrorState message={s('notFoundHint')} onRetry={() => navigate('/strategy')} />
      </Screen>
    )
  }

  const total = equity.withCost[equity.withCost.length - 1] - 1
  let peak = equity.withCost[0]
  let mdd = 0
  for (const v of equity.withCost) {
    if (v > peak) peak = v
    if (v / peak - 1 < mdd) mdd = v / peak - 1
  }

  return (
    <Screen title={st.name[lang]} leading={back}>
      <div className="space-y-4 pt-1">
        <div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {st.description[lang]}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {st.tags.map((tag) => {
              const key = TAG_KEY[tag]
              return (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[11px] leading-none"
                  style={{ border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}
                >
                  {key ? tagLabel(key) : tag}
                </span>
              )
            })}
          </div>
        </div>

        <section
          className="rounded-2xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
        >
          <h2 className="text-[13px] font-medium">{s('rulesTitle')}</h2>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('rulesHint')}
          </p>
          <ul className="mt-2">
            {RULES.map((rule, i) => (
              <li
                key={rule.key}
                className="flex items-start gap-3 py-2.5"
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--color-line)',
                }}
              >
                <span
                  className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] leading-snug">{s(rule.key)}</span>
                  <span
                    className="mt-0.5 block font-mono text-[11px] leading-snug break-all"
                    style={{ color: 'var(--color-muted)' }}
                    dir="ltr"
                  >
                    {rule.field}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
        >
          <h2 className="text-[13px] font-medium">{s('chartTitle')}</h2>
          <div className="mt-2" dir="ltr">
            <EquityChart lang={lang} />
          </div>
          <div
            className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]"
            style={{ color: 'var(--color-muted)' }}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-[2px] w-4 rounded-full"
                style={{ background: 'var(--color-accent)' }}
              />
              {s('legendWithCost')}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-[2px] w-4 rounded-full"
                style={{ background: 'var(--color-accent)', opacity: 0.3 }}
              />
              {s('legendWithoutCost')}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-4"
                style={{ borderTop: '1px dashed var(--color-muted)' }}
              />
              {s('legendBench')}
            </span>
          </div>
          <p className="mt-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {s('axisNote')}
          </p>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
        >
          <div className="grid grid-cols-3 gap-3">
            <Metric
              value={fmtPct(total, lang, 1)}
              name={s('mTotal')}
              hint={s('mTotalHint')}
              tone={total > 0 ? 'text-up' : total < 0 ? 'text-down' : 'text-muted'}
            />
            <Metric
              value={fmtPct(mdd, lang, 1)}
              name={s('mDrawdown')}
              hint={s('mDrawdownHint')}
              tone={mdd < 0 ? 'text-down' : 'text-muted'}
            />
            <Metric
              value={`${fmtNum(TURNOVER * 100, lang, 0)}%`}
              name={s('mTurnover')}
              hint={s('mTurnoverHint')}
            />
          </div>
        </section>

        <section
          className="rounded-2xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
        >
          <button
            type="button"
            onClick={rerun}
            disabled={run.running}
            aria-busy={run.running}
            className="text-bg min-h-12 w-full rounded-xl px-4 text-[15px] font-medium disabled:opacity-60"
            style={{ background: 'var(--color-accent)' }}
          >
            {run.running ? s('runningNote') : s('rerun')}
          </button>

          {run.step >= 0 && (
            <div className="mt-3">
              <div
                className="flex items-center justify-between gap-3 text-[11px]"
                style={{ color: 'var(--color-muted)' }}
                aria-live="polite"
              >
                <span>{s(STEPS[run.step])}</span>
                <span dir="ltr" className="num">
                  {run.step + 1} / 4
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--color-line)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((run.step + 1) / 4) * 100}%`,
                    background: 'var(--color-accent)',
                  }}
                />
              </div>
              {run.at && (
                <p className="mt-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
                  {s('updatedNote')} · <span className="num">{run.at}</span>
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </Screen>
  )
}
