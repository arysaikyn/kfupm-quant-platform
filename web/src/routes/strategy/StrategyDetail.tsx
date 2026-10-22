import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity, strategies } from '../../data/mock'
import { fmtClock } from './format'
import { EquityChart } from './EquityChart'
import { detailStrings, listStrings, TAG_KEY } from './strings'
import type { DetailStrings } from './strings'

type Rule = { key: keyof DetailStrings; field: string; ok: boolean }

/** Four read-only conditions; the technical field stays in code notation. */
const RULES: Rule[] = [
  { key: 'rule1', field: 'pe_ttm < 15', ok: true },
  { key: 'rule2', field: 'debt_to_assets < 0.30', ok: true },
  { key: 'rule3', field: 'sector not_in [banks, insurance]', ok: true },
  { key: 'rule4', field: 'sharia_screen = pass', ok: true },
]

const STEPS = ['stepFetch', 'stepFilter', 'stepCompute', 'stepDone'] as const

/** No turnover field in the mock contract; a fixed figure keeps the row honest. */
const TURNOVER = 0.78

/** Same year as the chart's first axis label; kept whole because word order differs. */
const SINCE: Record<Lang, string> = { zh: '2019 年以来', en: 'Since 2019', ar: 'منذ 2019' }
const PASS: Record<Lang, string> = { zh: '通过', en: 'Pass', ar: 'مطابق' }
const FAIL: Record<Lang, string> = { zh: '未过', en: 'Fail', ar: 'غير مطابق' }

function Metric({
  value,
  name,
  hint,
  tone,
  divided,
}: {
  value: string
  name: string
  hint: string
  tone?: string
  divided?: boolean
}) {
  return (
    <div
      className="min-w-0"
      style={divided ? { borderInlineStart: '1px solid var(--color-line)', paddingInlineStart: 12 } : undefined}
    >
      <div dir="ltr" className={`num text-[17px] leading-tight font-semibold ${tone ?? ''}`}>
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-tight">{name}</div>
      <div className="mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
        {hint}
      </div>
    </div>
  )
}

function RuleChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[10px] leading-none"
      style={{
        color: ok ? 'var(--color-accent)' : 'var(--color-muted)',
        border: `1px solid ${ok ? 'transparent' : 'var(--color-line)'}`,
        background: ok ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
      }}
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ok ? <path d="M4 12.5l5 5L20 6.5" /> : <path d="M6 6l12 12M18 6L6 18" />}
      </svg>
      {label}
    </span>
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
  const tone = total > 0 ? 'text-up' : total < 0 ? 'text-down' : 'text-muted'

  return (
    <Screen title={st.name[lang]} leading={back}>
      <div className="space-y-4 pt-1">
        {/* The verdict first: one big number, the worst fall beside it, then what it is. */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="t-kicker" style={{ color: 'var(--color-muted)' }}>
                {SINCE[lang]}
              </p>
              <div
                dir="ltr"
                className={`num t-display mt-1.5 text-[40px] leading-none font-semibold ${tone}`}
              >
                {fmtPct(total, lang, 1)}
              </div>
            </div>
            <div className="shrink-0 pb-0.5 text-end">
              <div
                dir="ltr"
                className="num text-[15px] leading-none font-medium"
                style={{ color: 'var(--color-muted)' }}
              >
                {fmtPct(mdd, lang, 1)}
              </div>
              <div className="mt-1.5 text-[11px] leading-none" style={{ color: 'var(--color-muted)' }}>
                {s('mDrawdown')}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
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
        </section>

        <section className="panel p-4">
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
              <span className="inline-block w-4" style={{ borderTop: '1px dashed var(--color-muted)' }} />
              {s('legendBench')}
            </span>
          </div>
          <p className="mt-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {s('axisNote')}
          </p>
        </section>

        {/* Rules: plain language first, the field it maps to underneath, verdict trailing. */}
        <section className="panel p-4">
          <h2 className="text-[13px] font-medium">{s('rulesTitle')}</h2>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('rulesHint')}
          </p>
          <ul className="mt-2">
            {RULES.map((rule, i) => (
              <li
                key={rule.key}
                className="flex items-start gap-3 py-3"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-line)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug">{s(rule.key)}</p>
                  <p
                    className="mt-1 font-mono text-[11px] leading-none break-all"
                    style={{ color: 'var(--color-muted)' }}
                    dir="ltr"
                  >
                    {rule.field}
                  </p>
                </div>
                <RuleChip ok={rule.ok} label={rule.ok ? PASS[lang] : FAIL[lang]} />
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <div className="grid grid-cols-[1fr_1fr_1.25fr] gap-3">
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
              divided
            />
            <Metric
              value={fmtNum(TURNOVER * 100, lang, 0, '%')}
              name={s('mTurnover')}
              hint={s('mTurnoverHint')}
              divided
            />
          </div>
        </section>

        <section className="panel p-4">
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
