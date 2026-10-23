import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Screen } from '../../components/Screen'
import { ErrorState } from '../../components/states'
import { bench, equityYears, strategies } from '../../data/mock'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { countRules, fill, fmtDate, fmtDateTime } from '../../i18n/format'
import { setIntake } from '../ai/intake'
import { strings } from './strings'
import type { ReportStrings } from './strings'

const SECTION_IDS = ['conclusion', 'basis', 'risk', 'wrong', 'next'] as const
type SectionId = (typeof SECTION_IDS)[number]

const NAV_KEYS: Record<SectionId, keyof ReportStrings> = {
  conclusion: 'navConclusion',
  basis: 'navBasis',
  risk: 'navRisk',
  wrong: 'navWrong',
  next: 'navNext',
}

const TAG_KEYS: Partial<Record<string, keyof ReportStrings>> = {
  value: 'tagValue',
  sharia: 'tagSharia',
  income: 'tagIncome',
  momentum: 'tagMomentum',
}

function BackIcon() {
  return (
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
  )
}

function ArrowIcon() {
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
      className="shrink-0 text-muted rtl:rotate-180"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      to="/strategy"
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:bg-fg/5 active:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      <BackIcon />
    </Link>
  )
}

export default function ReportPage() {
  const { id } = useParams()
  const { lang, t } = useI18n()
  const s = useStrings(strings)

  // The receipt time is fixed at mount; it never chases the clock.
  const [generatedAt] = useState(() => new Date())
  const [copied, setCopied] = useState(false)
  const [active, setActive] = useState<SectionId>('conclusion')
  const chipRefs = useRef<Partial<Record<SectionId, HTMLAnchorElement | null>>>({})
  const mounted = useRef(false)

  // Keep the highlighted chip inside the strip as the reader scrolls; skip the
  // first run so entering the page never scrolls it by itself.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    chipRefs.current[active]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  useEffect(() => {
    const sync = () => {
      const doc = document.documentElement
      if (
        doc.scrollHeight > window.innerHeight + 8 &&
        window.innerHeight + window.scrollY >= doc.scrollHeight - 8
      ) {
        setActive('next')
        return
      }
      let current: SectionId = 'conclusion'
      for (const sectionId of SECTION_IDS) {
        const node = document.getElementById(sectionId)
        if (node && node.getBoundingClientRect().top <= 140) current = sectionId
      }
      setActive(current)
    }

    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [id])

  const st = strategies.find((x) => x.id === id)

  if (!st) {
    return (
      <Screen title={s('notFound')} leading={<BackLink label={s('back')} />}>
        <ErrorState message={s('notFoundHint')} />
        <div className="flex justify-center pb-8">
          <Link
            to="/strategy"
            className="flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-[13px] font-medium transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('notFoundAction')}
          </Link>
        </div>
      </Screen>
    )
  }

  // Every strategy ships its own curve, so the prose and the table share one end value.
  const withEnd = st.curve[st.curve.length - 1]
  const grossEnd = st.gross[st.gross.length - 1]
  const benchEnd = bench[bench.length - 1]
  const total = withEnd - 1
  const excess = withEnd - benchEnd
  const costDrag = (grossEnd - withEnd) * 100
  const span = `${equityYears.first}-${equityYears.last}`

  const conclusion = fill(s('conclusionWithEquity'), {
    name: st.name[lang],
    span,
    pct: fmtPct(total, lang),
  })

  const evidence: { label: string; value: string; note: string; tone?: string }[] = [
    {
      label: s('basisRulesLabel'),
      value: `${fmtNum(st.rules.length, lang, 0)} ${countRules(lang, st.rules.length)}`,
      note: s('basisRulesNote'),
    },
    {
      label: s('basisReturnLabel'),
      value: fmtPct(total, lang),
      note: fill(s('basisReturnNote'), { span }),
      tone: total > 0 ? 'text-up' : total < 0 ? 'text-down' : 'text-muted',
    },
    {
      label: s('basisExcessLabel'),
      value: fmtPct(excess, lang),
      note: fill(s('basisExcessNote'), { span }),
      tone: excess > 0 ? 'text-up' : excess < 0 ? 'text-down' : 'text-muted',
    },
  ]

  const risks = [
    {
      title: s('riskCostTitle'),
      value: `${fmtNum(costDrag, lang, 2)} ${s('ppUnit')}`,
      body: fill(s('riskCostBody'), {
        pp: fmtNum(costDrag, lang, 2),
      }),
    },
    {
      title: s('riskSingleTitle'),
      value: fmtPct(total, lang),
      body: fill(s('riskSingleBody'), { pct: fmtPct(total, lang) }),
    },
  ]

  return (
    <main className="screen-pad mx-auto min-h-full w-full max-w-[920px] px-4">
      <header className="pt-5">
        <div className="flex items-center justify-between gap-3">
          <BackLink label={s('back')} />
        </div>

        <div className="mt-8">
          <p className="text-[11px] leading-none text-muted">
            <span dir="ltr">{st.id}</span>
          </p>
          <h1 className="t-title mt-2 text-[18px] leading-snug font-semibold">
            {st.name[lang]}
          </h1>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-muted">
            {st.description[lang]}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
            <span>
              {s('metaUpdated')} {fmtDate(st.updated, lang)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {fmtNum(st.rules.length, lang, 0)} {countRules(lang, st.rules.length)}
            </span>
          </div>
          {st.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
              {st.tags.map((tag, index) => {
                const key = TAG_KEYS[tag]
                if (!key) return null
                return (
                  <li key={tag} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    {s(key)}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            } catch {
              // Clipboard permission is optional.
            }
          }}
          className="flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {copied ? t('common.copied') : s('share')}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('print')}
        </button>
      </div>

      {/* Mobile: the report is long enough that the contents list cannot be a
          sidebar; the same five anchors ride along at the top instead. */}
      <nav
        aria-label={s('navLabel')}
        className="sticky top-0 z-10 -mx-4 mt-7 flex gap-1.5 overflow-x-auto border-b border-line bg-bg px-4 py-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
      >
        {SECTION_IDS.map((sectionId) => {
          const on = active === sectionId
          return (
            <a
              key={sectionId}
              ref={(node) => {
                chipRefs.current[sectionId] = node
              }}
              href={`#${sectionId}`}
              onClick={() => setActive(sectionId)}
              aria-current={on ? 'location' : undefined}
              className={`flex h-11 min-h-11 shrink-0 items-center rounded-full border px-3 text-[12px] leading-none whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg ${
                on ? 'border-fg font-medium text-fg' : 'border-line text-muted'
              }`}
            >
              {s(NAV_KEYS[sectionId])}
            </a>
          )
        })}
      </nav>

      <div className="mt-4 sm:mt-9 sm:grid sm:grid-cols-[168px_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden sm:block">
          <nav aria-label={s('navLabel')} className="sticky top-6">
            <ul className="mt-2">
              {SECTION_IDS.map((sectionId, index) => {
                const on = active === sectionId
                return (
                  <li key={sectionId}>
                    <a
                      href={`#${sectionId}`}
                      onClick={() => setActive(sectionId)}
                      aria-current={on ? 'location' : undefined}
                      className={`flex min-h-11 items-center gap-2.5 border-s-2 ps-3 text-[12px] leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg ${
                        on
                          ? 'border-fg font-medium text-fg'
                          : 'border-transparent text-muted hover:text-fg'
                      }`}
                    >
                      <span className={`num text-[11px] ${on ? 'text-fg font-semibold' : 'text-muted'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{s(NAV_KEYS[sectionId])}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 max-w-[68ch]">
          <div className="panel overflow-hidden">
            <section id="conclusion" className="scroll-mt-20 p-5 sm:scroll-mt-6">
              <h2 className="t-section">{s('conclusionLabel')}</h2>
              <p className="mt-4 max-w-[52ch] text-[22px] leading-[1.4] font-semibold tracking-[-0.01em]">
                {conclusion}
              </p>
            </section>

            <section
              id="basis"
              className="scroll-mt-20 border-t border-line p-5 sm:scroll-mt-6"
            >
              <h2 className="t-section">{s('basisLabel')}</h2>
              <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-muted">
                {s('basisIntro')}
              </p>
              <ol className="mt-3 divide-y divide-line">
                {evidence.map((row, index) => (
                  <li key={row.label} className="py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex min-w-0 items-baseline gap-2.5">
                        <span className="num shrink-0 text-[11px] text-muted">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className="min-w-0 text-[14px] leading-snug font-medium">{row.label}</p>
                      </div>
                      <span
                        className={`num shrink-0 text-[15px] leading-snug font-semibold ${
                          row.tone ?? 'text-fg'
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                    <p className="mt-1.5 ps-6 text-[14px] leading-relaxed text-muted">
                      {row.note}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="risk" className="scroll-mt-20 border-t border-line p-5 sm:scroll-mt-6">
              <h2 className="t-section">{s('riskLabel')}</h2>
              <ul className="mt-3 divide-y divide-line">
                {risks.map((row) => (
                  <li key={row.title} className="py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-[14px] font-medium">{row.title}</p>
                      <span className="num shrink-0 text-[15px] font-semibold text-fg">
                        {row.value}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{row.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section id="wrong" className="scroll-mt-20 border-t border-line p-5 sm:scroll-mt-6">
              <h2 className="t-section">{s('wrongLabel')}</h2>
              <p className="mt-4 max-w-[62ch] border-s border-line ps-4 text-[14px] leading-[1.75]">
                {s('wrongWithEquity')}
              </p>
            </section>

            <section id="next" className="scroll-mt-20 border-t border-line p-5 sm:scroll-mt-6">
              <h2 className="t-section">{s('nextLabel')}</h2>
              <div className="mt-2 divide-y divide-line">
                <Link
                  to={`/strategy/${st.id}`}
                  className="-mx-2 flex min-h-14 items-center gap-3 rounded-[10px] px-2 py-4 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{s('nextStrategyTitle')}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                      {s('nextStrategyBody')}
                    </p>
                  </div>
                  <ArrowIcon />
                </Link>

                <Link
                  to="/ai"
                  onClick={() =>
                    setIntake(`${s('nextAiTitle')} — ${st.name[lang]}`, [
                      { kind: 'strategy', id: st.id },
                    ])
                  }
                  className="-mx-2 flex min-h-14 items-center gap-3 rounded-[10px] px-2 py-4 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{s('nextAiTitle')}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                      {s('nextAiBody')}
                    </p>
                  </div>
                  <ArrowIcon />
                </Link>
              </div>
            </section>
          </div>

          <footer className="mt-6">
            <p className="t-kicker text-muted">
              {fill(s('footerGenerated'), { time: fmtDateTime(generatedAt, lang) })}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{s('disclaimer')}</p>
          </footer>
        </article>
      </div>
    </main>
  )
}
