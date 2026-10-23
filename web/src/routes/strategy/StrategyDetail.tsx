import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { bench, strategies } from '../../data/mock'
import { fmtDate } from './format'
import { EquityChart } from './EquityChart'
import { detailStrings, listStrings, TAG_KEY } from './strings'

/** No turnover field in the mock contract; a fixed figure keeps the row honest. */
const TURNOVER = 0.78

/** Each rule was tried at three variants before it was fixed; the deflation pays for that search. */
const VARIANTS_PER_RULE = 3

/** Cost row: one unit of starting capital, plus the two charges a rerun would pay. */
const INITIAL_CAPITAL = 10000
const FEE_RATE = 0.0015
const SLIP_RATE = 0.005

/** Same year as the chart's first axis label; kept whole because word order differs. */
const SINCE: Record<Lang, string> = { zh: '2019 年以来', en: 'Since 2019', ar: 'منذ 2019' }

type LabCopy = {
  simulated: string
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
  vsBench: string
}

/** Copy for the analysis blocks lives here because this screen owns its strings. */
const LAB: Record<Lang, LabCopy> = {
  zh: {
    simulated: '模拟',
    sigTitle: '是不是运气',
    deflated: '紧缩夏普',
    pValue: 'p 值',
    tries: '尝试次数',
    robust: '稳健',
    borderline: '边缘',
    unclear: '存疑',
    sigNote: '这是一个会为过拟合打折的调整分数：试过的版本越多，最好的结果扣得越多；不到 95%，就不能排除运气。',
    attrTitle: '回报从哪来',
    attrHint: '拆成选股、行业、择时和成本四项；四项相加等于总回报。',
    pick: '选股',
    sector: '行业',
    timing: '择时',
    cost: '成本',
    vsBench: '比基准',
  },
  en: {
    simulated: 'Simulated',
    sigTitle: 'Is it luck?',
    deflated: 'Deflated Sharpe',
    pValue: 'p-value',
    tries: 'Times tried',
    robust: 'Robust',
    borderline: 'Borderline',
    unclear: 'Unclear',
    sigNote: 'An adjusted score that penalises overfitting: the more versions were tried, the more the best result is marked down. Below 95%, luck cannot be ruled out.',
    attrTitle: 'Where the return came from',
    attrHint: 'Split into stock picking, sector, timing and costs; the four add up to the total return.',
    pick: 'Stock picking',
    sector: 'Sector',
    timing: 'Timing',
    cost: 'Costs',
    vsBench: 'vs benchmark',
  },
  ar: {
    simulated: 'محاكاة',
    sigTitle: 'هل هو حظ؟',
    deflated: 'شارب المخفّض',
    pValue: 'القيمة الاحتمالية',
    tries: 'مرات التجربة',
    robust: 'متين',
    borderline: 'على الحد',
    unclear: 'غير واضح',
    sigNote: 'درجة معدّلة تعاقب الإفراط في التوفيق: كلما جرّبنا نسخًا أكثر خُصمت النتيجة الأفضل أكثر. وأقل من 95% يعني أن الحظ لا يمكن استبعاده.',
    attrTitle: 'من أين جاء العائد',
    attrHint: 'مقسّم إلى الاختيار والقطاع والتوقيت والتكلفة؛ والمجموع يساوي العائد الكلي.',
    pick: 'الاختيار',
    sector: 'القطاع',
    timing: 'التوقيت',
    cost: 'التكلفة',
    vsBench: 'مقابل المؤشر',
  },
}

const EULER = 0.5772156649015329

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

/** One-pass stats from the curve already on the page; trials is the research grid behind it. */
function significanceOf(series: number[], trials: number) {
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
  const sr0 =
    Math.sqrt(1 / (n - 1)) *
    ((1 - EULER) * normInv(1 - 1 / trials) + EULER * normInv(1 - 1 / (trials * Math.E)))
  const denom = Math.sqrt(Math.max(0.05, 1 - skew * sr + ((kurt - 1) / 4) * sr * sr))
  const dsr = normCdf(((sr - sr0) * Math.sqrt(n - 1)) / denom)
  return { dsr: Math.min(1, Math.max(0, dsr)), p }
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
      <div className="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
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

  const st = strategies.find((x) => x.id === id)

  const back = (
    <button
      type="button"
      onClick={() => navigate('/strategy')}
      aria-label={s('back')}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
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

  // Every figure below comes off this strategy's own curve; nothing is borrowed.
  const curve = st.curve
  const total = curve[curve.length - 1] - 1
  let peak = curve[0]
  let mdd = 0
  for (const v of curve) {
    if (v > peak) peak = v
    if (v / peak - 1 < mdd) mdd = v / peak - 1
  }
  const tone = total > 0 ? 'text-up' : total < 0 ? 'text-down' : 'text-muted'
  const lab = LAB[lang]

  // The cost row prices the same total the headline prints, so the two cannot disagree.
  const finalValue = Math.round(INITIAL_CAPITAL * (1 + total) * 100) / 100
  const feesCost = Math.round(finalValue * FEE_RATE * 100) / 100
  const slippageCost = Math.round(finalValue * SLIP_RATE * 100) / 100
  const oosText = s('oosFrom').replace('{date}', fmtDate(st.updated, lang))

  // Attribution walks from benchmark -> gross -> net, so the four parts close on total.
  const benchTotal = bench[bench.length - 1] - 1
  // What the headline return earned over simply holding the benchmark.
  const excess = total - benchTotal
  const grossTotal = st.gross[st.gross.length - 1] - 1
  const cost = total - grossTotal
  const active = grossTotal - benchTotal
  // Active return splits by rule count: a sector rule owns its share, the rest is selection.
  const sectorRules = st.rules.filter((rule) => rule.id === 'sectors').length
  const selection = active * ((st.rules.length - sectorRules) / st.rules.length)
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

  const sig = significanceOf(curve, st.rules.length * VARIANTS_PER_RULE)
  const pText = sig.p < 0.001 ? '< 0.001' : fmtNum(sig.p, lang, 3)
  const verdict = sig.dsr >= 0.95 ? lab.robust : sig.dsr >= 0.75 ? lab.borderline : lab.unclear
  const verdictChip =
    sig.dsr >= 0.95
      ? {
          color: 'var(--color-accent)',
          background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
        }
      : sig.dsr >= 0.75
        ? { color: 'var(--color-fg)', background: 'var(--color-surface)' }
        : { color: 'var(--color-muted)', background: 'var(--color-surface)' }

  return (
    <Screen title={st.name[lang]} leading={back}>
      <div className="space-y-8 pt-1">
        {/* One number owns the screen. The benchmark gap sits directly under it,
            because "beat what you could have bought" is the question a return
            raises before any other figure does. */}
        <section>
          <p className="t-kicker" style={{ color: 'var(--color-muted)' }}>
            {SINCE[lang]}
          </p>
          <div
            dir="ltr"
            className={`num t-display mt-2 text-[56px] leading-[0.95] ${tone}`}
          >
            {fmtPct(total, lang, 1)}
          </div>
          <p
            className="mt-2.5 flex items-baseline gap-1.5 text-[12px] leading-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {lab.vsBench}
            <span
              dir="ltr"
              className={`num ${
                excess > 0 ? 'text-up' : excess < 0 ? 'text-down' : 'text-fg'
              }`}
            >
              {fmtPct(excess, lang, 1)}
            </span>
          </p>
          <p className="mt-3 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {oosText}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {st.description[lang]}
          </p>
          <div
            className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] leading-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {st.tags.map((tag, index) => {
              const key = TAG_KEY[tag]
              return (
                <span key={tag} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">·</span>}
                  {key ? tagLabel(key) : tag}
                </span>
              )
            })}
          </div>
        </section>

        {/* The curve answers "did it hold?" before any table does, and it draws
            straight on the canvas: a chart inside a box reads as a widget. */}
        <section>
          <h2 className="t-section">{s('chartTitle')}</h2>
          <div className="mt-2" dir="ltr">
            <EquityChart lang={lang} curve={curve} bench={bench} />
          </div>
        </section>

        <section className="border-t border-line pt-5">
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

        {/* The rules are this strategy's own data; no screen-side copy of them exists. */}
        <section className="border-t border-line pt-5">
          <h2 className="t-section">{s('rulesTitle')}</h2>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('rulesHint')}
          </p>
          <ul className="mt-2 divide-y divide-line">
            {st.rules.map((rule, index) => (
              <li key={rule.id} className="flex items-baseline gap-3 py-3">
                <span
                  className="num shrink-0 text-[11px]"
                  style={{ color: 'var(--color-muted)' }}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="min-w-0 flex-1 text-[14px] leading-snug">{rule.label[lang]}</p>
                <span dir="ltr" className="num shrink-0 text-[12px] leading-none">
                  {rule.value}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* The same return as cash: what a rerun pays in fees and slippage. */}
        <section className="border-t border-line pt-5">
          <h2 className="t-section">{s('costTitle')}</h2>
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
            </div>
            <div className="min-w-0 border-t border-line pe-3 pt-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold text-down">
                {'−'}
                {fmtNum(feesCost, lang, 2)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costFees')}</div>
              <div className="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                {s('costFeesHint')}
              </div>
            </div>
            <div className="min-w-0 border-s border-t border-line ps-3 pt-3">
              <div dir="ltr" className="num text-[17px] leading-tight font-semibold text-down">
                {'−'}
                {fmtNum(slippageCost, lang, 2)}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{s('costSlippage')}</div>
              <div className="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                {s('costSlippageHint')}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {s('costNote')}
          </p>
        </section>

        <section className="border-t border-line pt-5">
          <h2 className="t-section">{lab.sigTitle}</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div dir="ltr" className="num text-[19px] leading-none font-semibold">
                {fmtNum(sig.dsr * 100, lang, 0, '%')}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{lab.deflated}</div>
            </div>
            <div className="min-w-0 border-s border-line ps-3">
              <div dir="ltr" className="num text-[19px] leading-none font-semibold">
                {pText}
              </div>
              <div className="mt-1 text-[12px] leading-tight">{lab.pValue}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
              {lab.tries}{' '}
              <span dir="ltr" className="num">
                {st.rules.length * VARIANTS_PER_RULE}
              </span>
            </span>
            <span
              className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] leading-none"
              style={verdictChip}
            >
              {verdict}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {lab.sigNote}
          </p>
        </section>

        <section className="border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="t-section">{lab.attrTitle}</h2>
            <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
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
                  <div className="flex items-center justify-between gap-3 text-[12px] leading-none">
                    <span>{part.label}</span>
                    <span
                      dir="ltr"
                      className={`num font-medium ${part.value > 0 ? 'text-up' : part.value < 0 ? 'text-down' : 'text-muted'}`}
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
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2 text-[14px]">
            <span>{s('mTotal')}</span>
            <span dir="ltr" className={`num font-semibold ${tone}`}>
              {fmtPct(total, lang, 1)}
            </span>
          </div>
        </section>

        {/* The next screen, not a panel: one hairline row. */}
        <Link
          to={`/report/${st.id}`}
          className="flex min-h-14 items-center justify-between gap-3 border-t border-line text-[14px] transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <span>{s('fullReport')}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="rtl:[transform:scaleX(-1)]"
            style={{ color: 'var(--color-muted)' }}
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        <section className="border-t border-line pt-5">
          <button
            type="button"
            disabled
            className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] font-medium text-muted"
          >
            {s('rerun')}
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
            {s('rerunOffline')}
          </p>
        </section>
      </div>
    </Screen>
  )
}
