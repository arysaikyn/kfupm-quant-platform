import { fmtNum, useI18n } from '../i18n'
import type { Lang } from '../i18n'
import { familySummary } from '../lib/gridcheck'
import type { FamilySummary, GridReason, GridReport } from '../lib/gridcheck'

/**
 * The gate that keeps a rule set from turning into a grid bot.
 *
 * A price-only screen with no exit rule earns the size of the move, not its
 * direction — which is what a grid earns. This panel says which case you are in
 * and what it measured, and every number comes from `lib/gridcheck`.
 */

type Copy = {
  title: string
  lead: string
  verdict: Record<GridReport['verdict'], string>
  inputLabel: string
  inputFamily: Record<Exclude<FamilySummary, 'none'>, string>
  exposureLabel: string
  exposureHint: string
  exposureMissing: string
  persistenceLabel: string
  persistenceHint: string
  stop: Record<'adds' | 'insurance' | 'hurts', string>
  fix: string
  finding: Record<GridReason, string>
}

const COPY: Record<Lang, Copy> = {
  zh: {
    title: '网格检查',
    lead: '每条规则读的是截面，还是这只股票自己的走势？只读走势、又没说怎么离场，最后赚的是波动的钱——网格机器人也这么赚。',
    verdict: { crossSection: '截面驱动', thin: '需要补强', gridlike: '网格化' },
    inputLabel: '输入',
    inputFamily: {
      price: '只有价格块（Alpha101、GTJA-191 那一类）',
      mixed: '价格块 + 基本面',
      fundamental: '基本面块，按年报口径，252 个交易日衰减',
    },
    exposureLabel: '路径暴露',
    exposureHint: '归因里靠「涨跌幅度」而不是「方向」的比例',
    exposureMissing: '没有净值曲线，这一项不算',
    persistenceLabel: '持续性 γ₁',
    persistenceHint: '收益的自相关；负值表示均值回归',
    stop: {
      adds: '这个持有期上，止损能加回期望收益',
      insurance: '止损只降波动，不创造收益',
      hurts: '均值回归，止损会先被扫出去',
    },
    fix: '想通过这一关：至少一条基本面或教法规则，加一条按排名离场的规则；离场交给排名，不交给价格。',
    finding: {
      noExitPolicy: '没有写离场规则：收益由离场决定，不由选股决定',
      priceOnly: '全部规则只读价格块',
      shortDecay: '信号一周内就过期，收益来自换手',
      volHarvest: '收益主要来自波动幅度，不是方向',
      stopHurts: '这个持有期是均值回归，止损先被打掉',
      highTurnover: '年换手超过 100%，成本会吃掉价差',
      concentrated: '单一持仓超过 10%',
    },
  },
  en: {
    title: 'Grid check',
    lead: 'Does each rule read the cross-section, or this stock’s own path? A path-only screen with no exit rule earns the size of the move, not its direction — which is what a grid bot earns.',
    verdict: { crossSection: 'Cross-sectional', thin: 'Needs work', gridlike: 'Grid-like' },
    inputLabel: 'Inputs',
    inputFamily: {
      price: 'Price block only (the Alpha101 / GTJA-191 family)',
      mixed: 'Price block plus fundamentals',
      fundamental: 'Fundamentals, annual data, 252 sessions of decay',
    },
    exposureLabel: 'Path exposure',
    exposureHint: 'Share of the return that needs the size of a move, not its direction',
    exposureMissing: 'No equity curve, so this one is not scored',
    persistenceLabel: 'Persistence γ₁',
    persistenceHint: 'Autocorrelation of returns; negative means mean reversion',
    stop: {
      adds: 'At this holding period a stop adds expected return',
      insurance: 'A stop only cuts variance here; it creates nothing',
      hurts: 'Mean reversion: a stop gets swept before the reversal',
    },
    fix: 'To pass: at least one fundamental or Sharia rule, and an exit by rank instead of by price.',
    finding: {
      noExitPolicy: 'No exit rule stated, so the exit decides the return, not the selection',
      priceOnly: 'Every rule reads the price block',
      shortDecay: 'The signal is stale within a week, so the return is churn',
      volHarvest: 'The return comes from the size of moves, not their direction',
      stopHurts: 'Mean reversion at this holding period: a stop is swept first',
      highTurnover: 'Over 100% annual turnover: costs eat the spread',
      concentrated: 'One position is above 10%',
    },
  },
  ar: {
    title: 'فحص الشبكة',
    lead: 'هل تقرأ كل قاعدة المقطع العرضي أم مسار السهم نفسه؟ قاعدة تقرأ المسار وحده بلا قاعدة خروج تكسب من حجم الحركة لا من اتجاهها، وهذا بالضبط ما تكسبه روبوتات الشبكة.',
    verdict: { crossSection: 'مقطعي', thin: 'يحتاج دعماً', gridlike: 'شبكي' },
    inputLabel: 'المدخلات',
    inputFamily: {
      price: 'كتلة السعر فقط (عائلة Alpha101 وGTJA-191)',
      mixed: 'كتلة السعر مع الأساسيات',
      fundamental: 'الأساسيات، بيانات سنوية، اضمحلال 252 جلسة',
    },
    exposureLabel: 'التعرض للمسار',
    exposureHint: 'نسبة العائد التي تحتاج حجم الحركة لا اتجاهها',
    exposureMissing: 'لا يوجد منحنى قيمة، فالبند غير محسوب',
    persistenceLabel: 'الاستمرارية γ₁',
    persistenceHint: 'الارتباط الذاتي للعوائد؛ القيمة السالبة تعني ارتداداً للمتوسط',
    stop: {
      adds: 'عند هذه المدة يضيف وقف الخسارة عائداً متوقعاً',
      insurance: 'وقف الخسارة يقلل التذبذب فقط هنا ولا يخلق شيئاً',
      hurts: 'ارتداد للمتوسط: يُمسح الوقف قبل الانعكاس',
    },
    fix: 'لاجتياز الفحص: قاعدة أساسية أو شرعية واحدة على الأقل، وخروج بالترتيب لا بالسعر.',
    finding: {
      noExitPolicy: 'لا توجد قاعدة خروج، فالعائد يحدده الخروج لا الاختيار',
      priceOnly: 'كل القواعد تقرأ كتلة السعر',
      shortDecay: 'الإشارة تنتهي خلال أسبوع، فالعائد من الدوران',
      volHarvest: 'العائد من حجم الحركات لا من اتجاهها',
      stopHurts: 'ارتداد للمتوسط عند هذه المدة: يُمسح الوقف أولاً',
      highTurnover: 'الدوران السنوي يتجاوز 100% فتأكل التكلفة الفارق',
      concentrated: 'مركز واحد يتجاوز 10%',
    },
  },
}

const VERDICT_STYLE: Record<
  GridReport['verdict'],
  { color: string; background: string; border?: string }
> = {
  crossSection: {
    color: 'var(--color-accent)',
    background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
  },
  thin: { color: 'var(--color-fg)', background: 'var(--color-surface)' },
  // Colour carries the severity, so the label stays at full contrast on the tint.
  gridlike: {
    color: 'var(--color-fg)',
    background: 'color-mix(in srgb, var(--color-down) 14%, transparent)',
    border: '1px solid color-mix(in srgb, var(--color-down) 55%, transparent)',
  },
}

export function GridCheck({ report, compact = false }: { report: GridReport; compact?: boolean }) {
  const { lang } = useI18n()
  const t = COPY[lang]
  const style = VERDICT_STYLE[report.verdict]
  const block = familySummary(report.families)

  return (
    <section className="border-t border-line pt-5" aria-labelledby="grid-check">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="grid-check" className="t-section">
          {t.title}
        </h2>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] leading-none font-medium"
          style={style}
        >
          {t.verdict[report.verdict]}
        </span>
      </div>

      {!compact && (
        <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {t.lead}
        </p>
      )}

      {report.findings.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {report.findings.map((finding) => (
            <li key={finding.id} className="flex min-h-11 items-center gap-3 py-2">
              <span
                aria-hidden="true"
                className="num shrink-0 text-[11px]"
                style={{ color: 'var(--color-muted)' }}
              >
                +{fmtNum(finding.points, lang, 0)}
              </span>
              <span className="text-[13px] leading-snug">{t.finding[finding.id]}</span>
            </li>
          ))}
        </ul>
      )}

      {block !== 'none' && (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="shrink-0 text-[13px] leading-tight">{t.inputLabel}</span>
          <span className="text-end text-[12px] leading-snug" style={{ color: 'var(--color-muted)' }}>
            {t.inputFamily[block]}
          </span>
        </div>
      )}

      {report.exposure ? (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] leading-tight">{t.exposureLabel}</div>
            <div className="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
              {t.exposureHint}
            </div>
          </div>
          <span dir="ltr" className="num shrink-0 text-[15px] leading-none font-semibold">
            {fmtNum(report.exposure.volShare * 100, lang, 0, '%')}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
          {t.exposureMissing}
        </p>
      )}

      {report.persistence && (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] leading-tight">{t.persistenceLabel}</div>
            <div className="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
              {t.stop[report.persistence.stop]}
            </div>
          </div>
          <span dir="ltr" className="num shrink-0 text-[15px] leading-none font-semibold">
            {fmtNum(report.persistence.gamma1, lang, 2)}
          </span>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {t.fix}
      </p>
    </section>
  )
}
