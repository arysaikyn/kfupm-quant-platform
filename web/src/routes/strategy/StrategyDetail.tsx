import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity, strategies } from '../../data/mock'
import { fmtClock, fmtDate } from './format'
import { EquityChart } from './EquityChart'
import { detailStrings, listStrings, TAG_KEY } from './strings'
import type { DetailStrings } from './strings'

type ThresholdKey = 'pe' | 'debt' | 'excluded'
type Thresholds = Record<ThresholdKey, number>
type Rule = {
  key: keyof DetailStrings
  ok: boolean
  /** Numeric threshold already present in the row; only these rows are tunable. */
  param?: ThresholdKey
  /** Code notation for a rule with no numeric threshold. */
  field?: string
}

/** Rule 3 lists its sectors literally; that list's length is its numeric threshold. */
const EXCLUDED_SECTORS = ['banks', 'insurance']
/** The numbers shown in the rule rows; the steppers start here. */
const DEFAULT_THRESHOLDS: Thresholds = { pe: 15, debt: 0.3, excluded: EXCLUDED_SECTORS.length }
const LIMITS: Record<ThresholdKey, { min: number; max: number; step: number }> = {
  pe: { min: 5, max: 30, step: 1 },
  debt: { min: 0.1, max: 0.6, step: 0.05 },
  excluded: { min: 0, max: EXCLUDED_SECTORS.length, step: 1 },
}

/** The rule set is fixed; every threshold is a number already in the original row. */
const RULES: Rule[] = [
  { key: 'rule1', ok: true, param: 'pe' },
  { key: 'rule2', ok: true, param: 'debt' },
  { key: 'rule3', ok: true, param: 'excluded' },
  { key: 'rule4', ok: true, field: 'sharia_screen = pass' },
]

const STEPS = ['stepFetch', 'stepFilter', 'stepCompute', 'stepDone'] as const

/** No turnover field in the mock contract; a fixed figure keeps the row honest. */
const TURNOVER = 0.78

/** Cost row: one unit of starting capital, plus the two charges a rerun would pay. */
const INITIAL_CAPITAL = 10000
const FEE_RATE = 0.0015
const SLIP_RATE = 0.005

/** Same year as the chart's first axis label; kept whole because word order differs. */
const SINCE: Record<Lang, string> = { zh: '2019 年以来', en: 'Since 2019', ar: 'منذ 2019' }
const PASS: Record<Lang, string> = { zh: '通过', en: 'Pass', ar: 'مطابق' }
const FAIL: Record<Lang, string> = { zh: '未过', en: 'Fail', ar: 'غير مطابق' }

type LabCopy = {
  rulesHint: string
  dirty: string
  fullReport: string
  save: string
  saveHint: string
  decrease: string
  increase: string
  fixed: string
  sweepTitle: string
  sweepHint: string
  simulated: string
  tighter: string
  current: string
  looser: string
  rowThreshold: string
  rowReturn: string
  rowDrawdown: string
  sigTitle: string
  deflated: string
  pValue: string
  tries: string
  robust: string
  borderline: string
  unclear: string
  sigNote: string
  attrTitle: string
  attrHint: string
  pick: string
  sector: string
  timing: string
  cost: string
}

/** Copy for the tuning blocks lives here because this screen owns its strings. */
const LAB: Record<Lang, LabCopy> = {
  zh: {
    rulesHint: '规则固定，按顺序执行；阈值可微调并保存。',
    dirty: '未保存的修改',
    fullReport: '查看完整研究报告',
    save: '保存阈值',
    saveHint: '只存在这台设备，刷新后沿用。',
    decrease: '降低阈值',
    increase: '提高阈值',
    fixed: '无数字阈值，保持固定',
    sweepTitle: '参数扫描',
    sweepHint: '按当前阈值推算；保存后刷新仍沿用。',
    simulated: '模拟',
    tighter: '收紧',
    current: '当前',
    looser: '放宽',
    rowThreshold: '阈值',
    rowReturn: '收益',
    rowDrawdown: '回撤',
    sigTitle: '显著性',
    deflated: '紧缩夏普',
    pValue: 'p 值',
    tries: '尝试次数',
    robust: '稳健',
    borderline: '边缘',
    unclear: '存疑',
    sigNote: '它按试过的参数个数给最好结果打折；不到 95%，就不能排除运气。',
    attrTitle: '收益归因',
    attrHint: '按规则权重与基准拆分，四项合计等于总回报。',
    pick: '选股',
    sector: '行业',
    timing: '择时',
    cost: '成本',
  },
  en: {
    rulesHint: 'Rules are fixed and applied in order; thresholds can be tuned and saved.',
    dirty: 'Unsaved changes',
    fullReport: 'Open the full report',
    save: 'Save thresholds',
    saveHint: 'Stored on this device only; restored after a reload.',
    decrease: 'Decrease threshold',
    increase: 'Increase threshold',
    fixed: 'No numeric threshold; fixed',
    sweepTitle: 'Parameter sweep',
    sweepHint: 'Recalculated from the current thresholds; save to keep them after a reload.',
    simulated: 'Simulated',
    tighter: 'Tighter',
    current: 'Current',
    looser: 'Looser',
    rowThreshold: 'Threshold',
    rowReturn: 'Return',
    rowDrawdown: 'Drawdown',
    sigTitle: 'Significance',
    deflated: 'Deflated Sharpe',
    pValue: 'p-value',
    tries: 'Tries',
    robust: 'Robust',
    borderline: 'Borderline',
    unclear: 'Unclear',
    sigNote: 'It discounts the best result for how many variants were tried; below 95%, luck cannot be ruled out.',
    attrTitle: 'Return attribution',
    attrHint: 'Split by rule weight and benchmark; the four parts add up to total return.',
    pick: 'Stock picking',
    sector: 'Sector',
    timing: 'Timing',
    cost: 'Costs',
  },
  ar: {
    rulesHint: 'القواعد ثابتة وتُطبَّق بالترتيب؛ ويمكن ضبط الحدود وحفظها.',
    dirty: 'تعديلات غير محفوظة',
    fullReport: 'افتح التقرير الكامل',
    save: 'حفظ الحدود',
    saveHint: 'تُحفظ على هذا الجهاز فقط وتعود بعد إعادة التحميل.',
    decrease: 'خفض الحد',
    increase: 'رفع الحد',
    fixed: 'لا حد رقمي؛ ثابت',
    sweepTitle: 'مسح المعاملات',
    sweepHint: 'تُحسب من الحدود الحالية؛ احفظها لتبقى بعد إعادة التحميل.',
    simulated: 'محاكاة',
    tighter: 'تشديد',
    current: 'الحالي',
    looser: 'تخفيف',
    rowThreshold: 'الحد',
    rowReturn: 'العائد',
    rowDrawdown: 'التراجع',
    sigTitle: 'الدلالة',
    deflated: 'شارب المخفّض',
    pValue: 'القيمة الاحتمالية',
    tries: 'المحاولات',
    robust: 'متين',
    borderline: 'على الحد',
    unclear: 'غير واضح',
    sigNote: 'يخصم النتيجة الأفضل بحسب عدد المحاولات؛ وأقل من 95% يعني أن الحظ لا يمكن استبعاده.',
    attrTitle: 'مصادر العائد',
    attrHint: 'توزيع حسب وزن القواعد ومعيار السوق؛ المجموع يساوي العائد الكلي.',
    pick: 'الاختيار',
    sector: 'القطاع',
    timing: 'التوقيت',
    cost: 'التكلفة',
  },
}

type RuleCopy = {
  pe: string
  debt: string
  sectors: string
  none: string
  join: string
}

/** Rule headings must follow the steppers, so the threshold is interpolated. */
const RULE_TEXT: Record<Lang, RuleCopy> = {
  zh: {
    pe: '市盈率低于 {n}',
    debt: '负债低于资产的 {p}%',
    sectors: '排除{s}',
    none: '不排除行业',
    join: '、',
  },
  en: {
    pe: 'Price under {n} times earnings',
    debt: 'Debt under {p}% of assets',
    sectors: 'Excludes {s}',
    none: 'No sectors excluded',
    join: ' and ',
  },
  ar: {
    pe: 'السعر أقل من {n} ضعف الأرباح',
    debt: 'الدين أقل من {p}% من الأصول',
    sectors: 'استبعاد {s}',
    none: 'دون استبعاد قطاعات',
    join: ' و',
  },
}

const SECTOR_NAMES: Record<Lang, Record<string, string>> = {
  zh: { banks: '银行', insurance: '保险' },
  en: { banks: 'banks', insurance: 'insurers' },
  ar: { banks: 'البنوك', insurance: 'شركات التأمين' },
}

function ruleHeading(rule: Rule, value: Thresholds, lang: Lang) {
  const copy = RULE_TEXT[lang]
  if (rule.param === 'pe') return copy.pe.replace('{n}', String(value.pe))
  if (rule.param === 'debt') return copy.debt.replace('{p}', String(Math.round(value.debt * 100)))
  if (rule.param === 'excluded') {
    const names = EXCLUDED_SECTORS.slice(0, value.excluded).map(
      (sector) => SECTOR_NAMES[lang][sector] ?? sector,
    )
    return names.length ? copy.sectors.replace('{s}', names.join(copy.join)) : copy.none
  }
  return null
}

const EULER = 0.5772156649015329
/** Three sweep scenarios: tighten, keep, loosen. */
const SWEEP = [0.8, 1, 1.2]

/** Standard normal CDF (Abramowitz & Stegun 26.2.17). */
function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const tail =
    0.3989422804014327 *
    Math.exp((-z * z) / 2) *
    t *
    (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z >= 0 ? 1 - tail : tail
}

/** Inverse standard normal (Acklam) for the deflation term. */
function normInv(p: number) {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const low = 0.02425
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p < low || p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(p < low ? p : 1 - p))
    const num = ((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]
    const den = (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1
    return p < low ? num / den : -(num / den)
  }
  const q = p - 0.5
  const r = q * q
  const num = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
  const den = (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  return num / den
}

/** One-pass stats from the curve already on the page. */
function significanceOf(series: number[]) {
  const rets = series.slice(1).map((v, i) => (series[i] ? v / series[i] - 1 : 0))
  const n = rets.length
  if (n < 8) return { dsr: 0, p: 1 }
  const mean = rets.reduce((sum, v) => sum + v, 0) / n
  const variance = rets.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
  const sd = Math.sqrt(variance)
  if (sd === 0) return { dsr: 0, p: 1 }
  const sr = mean / sd
  const p = Math.min(1, Math.max(0, 1 - normCdf(sr * Math.sqrt(n))))
  const skew = rets.reduce((sum, v) => sum + ((v - mean) / sd) ** 3, 0) / n
  const kurt = rets.reduce((sum, v) => sum + ((v - mean) / sd) ** 4, 0) / n
  // Deflated Sharpe: the expected best Sharpe after this many tries.
  const trials = RULES.length * SWEEP.length
  const sr0 =
    Math.sqrt(1 / (n - 1)) *
    ((1 - EULER) * normInv(1 - 1 / trials) + EULER * normInv(1 - 1 / (trials * Math.E)))
  const denom = Math.sqrt(Math.max(0.05, 1 - skew * sr + ((kurt - 1) / 4) * sr * sr))
  const dsr = normCdf(((sr - sr0) * Math.sqrt(n - 1)) / denom)
  return { dsr: Math.min(1, Math.max(0, dsr)), p }
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, amount))
}

function clampDebt(value: unknown) {
  const amount =
    typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_THRESHOLDS.debt
  return Math.round(Math.min(LIMITS.debt.max, Math.max(LIMITS.debt.min, amount)) * 100) / 100
}

function loadThresholds(id: string | undefined): Thresholds {
  if (!id) return DEFAULT_THRESHOLDS
  try {
    const raw = localStorage.getItem(`strategy.${id}.rules`)
    if (!raw) return DEFAULT_THRESHOLDS
    const parsed = JSON.parse(raw) as Partial<Thresholds>
    return {
      pe: clampInt(parsed.pe, LIMITS.pe.min, LIMITS.pe.max, DEFAULT_THRESHOLDS.pe),
      debt: clampDebt(parsed.debt),
      excluded: clampInt(
        parsed.excluded,
        LIMITS.excluded.min,
        LIMITS.excluded.max,
        DEFAULT_THRESHOLDS.excluded,
      ),
    }
  } catch {
    return DEFAULT_THRESHOLDS
  }
}

function stepThreshold(base: Thresholds, key: ThresholdKey, dir: number): Thresholds {
  const limit = LIMITS[key]
  if (key === 'debt') {
    return { ...base, debt: clampDebt(base.debt + dir * limit.step) }
  }
  if (key === 'pe') {
    return {
      ...base,
      pe: Math.min(limit.max, Math.max(limit.min, base.pe + dir * limit.step)),
    }
  }
  return {
    ...base,
    excluded: Math.min(limit.max, Math.max(limit.min, base.excluded + dir * limit.step)),
  }
}

function thresholdText(key: ThresholdKey, value: Thresholds) {
  if (key === 'pe') return String(value.pe)
  if (key === 'debt') return value.debt.toFixed(2)
  return String(value.excluded)
}

function fieldFor(rule: Rule, value: Thresholds) {
  switch (rule.param) {
    case 'pe':
      return `pe_ttm < ${value.pe}`
    case 'debt':
      return `debt_to_assets < ${value.debt.toFixed(2)}`
    case 'excluded':
      return `sector not_in [${EXCLUDED_SECTORS.slice(0, value.excluded).join(', ')}]`
    default:
      return rule.field ?? ''
  }
}

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
    <div className={divided ? 'min-w-0 border-s border-line ps-3' : 'min-w-0'}>
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
      className="mt-0.5 flex shrink-0 items-center gap-1 rounded-lg px-2 py-[3px] text-[10px] leading-none"
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
  const [savedRules, setSavedRules] = useState<Thresholds>(() => loadThresholds(id))
  const [draftRules, setDraftRules] = useState<Thresholds>(savedRules)
  const timers = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  // A different strategy owns a different saved set.
  useEffect(() => {
    const next = loadThresholds(id)
    setSavedRules(next)
    setDraftRules(next)
  }, [id])

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

  const rulesDirty =
    draftRules.pe !== savedRules.pe ||
    draftRules.debt !== savedRules.debt ||
    draftRules.excluded !== savedRules.excluded

  const changeRule = (key: ThresholdKey, direction: number) => {
    setDraftRules((prev) => stepThreshold(prev, key, direction))
  }

  const saveRules = () => {
    if (!id) return
    setSavedRules(draftRules)
    try {
      localStorage.setItem(`strategy.${id}.rules`, JSON.stringify(draftRules))
    } catch {
      // Private browsing: the in-memory copy still works.
    }
  }

  const back = (
    <button
      type="button"
      onClick={() => navigate('/strategy')}
      aria-label={s('back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
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
  const lab = LAB[lang]

  // The cost row re-prices the card's own last-year return, so it invents no figure.
  const finalValue = Math.round(INITIAL_CAPITAL * (1 + st.lastReturn) * 100) / 100
  const feesCost = Math.round(finalValue * FEE_RATE * 100) / 100
  const slippageCost = Math.round(finalValue * SLIP_RATE * 100) / 100
  const oosText = s('oosFrom').replace('{date}', fmtDate(st.updated, lang))

  // Attribution walks from benchmark -> gross -> net, so the four parts close on total.
  const benchTotal = equity.bench[equity.bench.length - 1] - 1
  const withoutTotal = equity.withoutCost[equity.withoutCost.length - 1] - 1
  const cost = total - withoutTotal
  const active = withoutTotal - benchTotal
  const activeRules = RULES.filter((rule) => rule.param !== undefined).length
  const pickRules = RULES.filter((rule) => rule.param === 'pe' || rule.param === 'debt').length
  // Active return splits by rule count; market exposure belongs to timing.
  const selection = active * (pickRules / activeRules)
  const sector = active - selection
  const timing = benchTotal

  // One display decimal, with the timing bar absorbing the rounding remainder.
  const rounded = [selection, sector, timing, cost].map((v) => Math.round(v * 1000) / 10)
  rounded[2] = Number(
    (
      rounded[2] +
      (Math.round(total * 1000) / 10 - rounded.reduce((sum, v) => sum + v, 0))
    ).toFixed(1),
  )
  const attribution = [
    { key: 'pick', label: lab.pick, value: selection, shown: rounded[0] },
    { key: 'sector', label: lab.sector, value: sector, shown: rounded[1] },
    { key: 'timing', label: lab.timing, value: timing, shown: rounded[2] },
    { key: 'cost', label: lab.cost, value: cost, shown: rounded[3] },
  ]
  const maxBar = Math.max(...attribution.map((part) => Math.abs(part.value)), 0.0001)

  // Draft drives the preview; saving only decides what survives a reload.
  // Looser = higher caps, fewer exclusions; looser rules lift return and deepen drawdown.
  const looseness =
    0.4 * ((draftRules.pe - DEFAULT_THRESHOLDS.pe) / DEFAULT_THRESHOLDS.pe) +
    0.4 * ((draftRules.debt - DEFAULT_THRESHOLDS.debt) / DEFAULT_THRESHOLDS.debt) +
    0.2 * ((DEFAULT_THRESHOLDS.excluded - draftRules.excluded) / DEFAULT_THRESHOLDS.excluded)
  const sweep = SWEEP.map((mult) => ({
    mult,
    pe: Math.min(
      LIMITS.pe.max,
      Math.max(LIMITS.pe.min, Math.round(draftRules.pe * mult)),
    ),
    debt: clampDebt(draftRules.debt * mult),
    ret: total + 0.18 * looseness + 0.04 * (mult - 1),
    dd: mdd - 0.04 * (mult - 1) - 0.12 * looseness,
  }))

  const sig = significanceOf(equity.withCost)
  const pText = sig.p < 0.001 ? '< 0.001' : fmtNum(sig.p, lang, 3)
  const verdict = sig.dsr >= 0.95 ? lab.robust : sig.dsr >= 0.75 ? lab.borderline : lab.unclear
  const verdictChip =
    sig.dsr >= 0.95
      ? {
          color: 'var(--color-accent)',
          border: '1px solid transparent',
          background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
        }
      : sig.dsr >= 0.75
        ? { color: 'var(--color-fg)', border: '1px solid var(--color-line)' }
        : { color: 'var(--color-muted)', border: '1px solid var(--color-line)' }

  return (
    <Screen title={st.name[lang]} leading={back}>
      <div className="space-y-6 pt-1">
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
          <p className="mt-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {oosText}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {st.description[lang]}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {st.tags.map((tag) => {
              const key = TAG_KEY[tag]
              return (
                <span
                  key={tag}
                  className="rounded-lg border border-line px-2.5 py-1 text-[11px] leading-none text-muted"
                >
                  {key ? tagLabel(key) : tag}
                </span>
              )
            })}
          </div>
        </section>

        {/* The return above in money: what a rerun pays in fees and slippage. */}
        <section className="panel p-4">
          <h2 className="text-[13px] font-medium">{s('costTitle')}</h2>
          <div className="mt-3 grid grid-cols-2">
            <div className="min-w-0 pe-3 pb-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold">
                {fmtNum(INITIAL_CAPITAL, lang, 0)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costStart')}</div>
            </div>
            <div className="min-w-0 border-s border-line ps-3 pb-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold">
                {fmtNum(finalValue, lang, 2)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costFinal')}</div>
              <div className="num mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                {fmtPct(st.lastReturn, lang, 1)}
              </div>
            </div>
            <div className="min-w-0 border-t border-line pe-3 pt-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold text-down">
                {'−'}
                {fmtNum(feesCost, lang, 2)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costFees')}</div>
              <div className="mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                {s('costFeesHint')}
              </div>
            </div>
            <div className="min-w-0 border-s border-t border-line ps-3 pt-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold text-down">
                {'−'}
                {fmtNum(slippageCost, lang, 2)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costSlippage')}</div>
              <div className="mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                {s('costSlippageHint')}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {s('costNote')}
          </p>
        </section>

        <Link
          to={`/report/${st.id}`}
          className="panel flex min-h-14 items-center justify-between gap-3 p-4 text-[13px]"
        >
          <span>{s('fullReport')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="rtl:[transform:scaleX(-1)]" style={{ color: 'var(--color-muted)' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
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

        {/* Rules stay fixed; only the numbers inside them are tunable. */}
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium">{s('rulesTitle')}</h2>
            {rulesDirty && (
              <span
                className="shrink-0 rounded-lg px-2 py-[3px] text-[10px] leading-none"
                style={{
                  color: 'var(--color-accent)',
                  background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                }}
                aria-live="polite"
              >
                {lab.dirty}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {lab.rulesHint}
          </p>
          <ul className="mt-2 divide-y divide-line">
            {RULES.map((rule) => {
              const param = rule.param
              const limit = param ? LIMITS[param] : null
              const current = param ? draftRules[param] : 0
              const heading = ruleHeading(rule, draftRules, lang) ?? s(rule.key)
              return (
                <li key={rule.key} className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{heading}</p>
                      <p
                        className="mt-1 font-mono text-[11px] leading-none break-all"
                        style={{ color: 'var(--color-muted)' }}
                        dir="ltr"
                      >
                        {fieldFor(rule, draftRules)}
                      </p>
                    </div>
                    <RuleChip ok={rule.ok} label={rule.ok ? PASS[lang] : FAIL[lang]} />
                  </div>
                  {param && limit ? (
                    <div
                      className="mt-1 inline-flex items-center rounded-full border border-line"
                      role="group"
                      aria-label={heading}
                    >
                      <button
                        type="button"
                        onClick={() => changeRule(param, -1)}
                        disabled={current <= limit.min}
                        aria-label={`${lab.decrease} · ${heading}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] leading-none transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:opacity-30"
                      >
                        −
                      </button>
                      <span
                        dir="ltr"
                        aria-live="polite"
                        className="num min-w-12 text-center text-[12px] leading-none"
                      >
                        {thresholdText(param, draftRules)}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeRule(param, 1)}
                        disabled={current >= limit.max}
                        aria-label={`${lab.increase} · ${heading}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] leading-none transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      {lab.fixed}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={saveRules}
            disabled={!rulesDirty}
            className="mt-1 min-h-11 w-full rounded-xl px-3 text-[12.5px] font-medium disabled:opacity-40"
            style={{
              background: rulesDirty ? 'var(--color-accent)' : 'transparent',
              color: rulesDirty ? 'var(--color-bg)' : 'var(--color-muted)',
              border: `1px solid ${rulesDirty ? 'transparent' : 'var(--color-line)'}`,
            }}
          >
            {lab.save}
          </button>
          <p className="mt-1.5 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {lab.saveHint}
          </p>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium">{lab.sweepTitle}</h2>
            <span
              className="shrink-0 rounded-lg border border-line px-2 py-[3px] text-[10px] leading-none text-muted"
            >
              {lab.simulated}
            </span>
          </div>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {lab.sweepHint}
          </p>
          <table className="mt-2 w-full table-fixed border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="w-[30%] pb-2 text-start font-normal">
                  <span className="sr-only">{lab.rowThreshold}</span>
                </th>
                {SWEEP.map((mult) => (
                  <th key={mult} scope="col" className="pb-2 text-center font-normal">
                    <span className="block">
                      {mult < 1 ? lab.tighter : mult > 1 ? lab.looser : lab.current}
                    </span>
                    <span className="block text-[10px] opacity-70" dir="ltr">
                      {mult === 1
                        ? '±0%'
                        : `${mult < 1 ? '−' : '+'}${Math.round(Math.abs(mult - 1) * 100)}%`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <th scope="row" className="py-2 text-start font-normal" style={{ color: 'var(--color-muted)' }}>
                  {lab.rowThreshold}
                </th>
                {sweep.map((col) => (
                  <td key={col.mult} className="py-2 text-center">
                    <span dir="ltr" className="num">
                      {fmtNum(col.pe, lang, 0)} · {fmtNum(col.debt * 100, lang, 0, '%')}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-2 text-start font-normal" style={{ color: 'var(--color-muted)' }}>
                  {lab.rowReturn}
                </th>
                {sweep.map((col) => (
                  <td key={col.mult} className="py-2 text-center">
                    <span
                      dir="ltr"
                      className={`num ${col.ret > 0 ? 'text-up' : col.ret < 0 ? 'text-down' : 'text-muted'}`}
                    >
                      {fmtPct(col.ret, lang, 1)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-2 text-start font-normal" style={{ color: 'var(--color-muted)' }}>
                  {lab.rowDrawdown}
                </th>
                {sweep.map((col) => (
                  <td key={col.mult} className="py-2 text-center">
                    <span dir="ltr" className={`num ${col.dd < 0 ? 'text-down' : 'text-muted'}`}>
                      {fmtPct(col.dd, lang, 1)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel p-4">
          <h2 className="text-[13px] font-medium">{lab.sigTitle}</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div dir="ltr" className="num text-[19px] leading-none font-semibold">
                {fmtNum(sig.dsr * 100, lang, 0, '%')}
              </div>
              <div className="mt-1 text-[11px] leading-tight">{lab.deflated}</div>
            </div>
            <div className="min-w-0 border-s border-line ps-3">
              <div dir="ltr" className="num text-[19px] leading-none font-semibold">
                {pText}
              </div>
              <div className="mt-1 text-[11px] leading-tight">{lab.pValue}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {lab.tries}{' '}
              <span dir="ltr" className="num">
                {RULES.length * SWEEP.length}
              </span>
            </span>
            <span
              className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] leading-none"
              style={verdictChip}
            >
              {verdict}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {lab.sigNote}
          </p>
        </section>

        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium">{lab.attrTitle}</h2>
            <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {lab.simulated}
            </span>
          </div>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {lab.attrHint}
          </p>
          <div className="mt-3 space-y-2.5">
            {attribution.map((part) => {
              const width =
                part.value === 0
                  ? 0
                  : Math.min(100, Math.max(2, (Math.abs(part.value) / maxBar) * 100))
              return (
                <div key={part.key}>
                  <div className="flex items-center justify-between gap-3 text-[11.5px] leading-none">
                    <span>{part.label}</span>
                    <span
                      dir="ltr"
                      className={`num ${part.value > 0 ? 'text-up' : part.value < 0 ? 'text-down' : 'text-muted'}`}
                    >
                      {fmtPct(part.shown / 100, lang, 1)}
                    </span>
                  </div>
                  <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="absolute inset-y-0"
                      style={{
                        insetInlineStart: 0,
                        width: `${width}%`,
                        background:
                          part.value < 0 ? 'var(--color-down)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2 text-[12px]">
            <span>{s('mTotal')}</span>
            <span dir="ltr" className={`num font-semibold ${tone}`}>
              {fmtPct(total, lang, 1)}
            </span>
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
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
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
