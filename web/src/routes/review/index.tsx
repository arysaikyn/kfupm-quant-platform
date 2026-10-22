import { useLayoutEffect, useRef, useState } from 'react'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { quotes, sectors } from '../../data/mock'
import type { Quote, Sector } from '../../data/mock'
import { useUser } from '../../store/user'
import { strings } from './strings'

/** Plot height in px; the h-[188px] class on the plot must match. */
const PLOT_H = 188

/** First paint, before the ResizeObserver reports: the 360px-phone width. */
const PLOT_W_FALLBACK = 264

type Anchor = 'start' | 'end' | 'above' | 'below'

type Point = { sector: Sector; x: number; y: number }

type Box = { x1: number; y1: number; x2: number; y2: number }

const LABEL_GAP = 7
const LABEL_H = 11

const LABEL_TRANSFORM: Record<Anchor, string> = {
  start: 'translate(7px, -50%)',
  end: 'translate(calc(-100% - 7px), -50%)',
  above: 'translate(-50%, calc(-100% - 7px))',
  below: 'translate(-50%, 7px)',
}

const toneOf = (change: number) =>
  change > 0 ? 'var(--color-up)' : change < 0 ? 'var(--color-down)' : 'var(--color-muted)'

/**
 * The up–down pair wrapped in one LTR isolate. Without the outer isolate bidi
 * lays the numbers out right-to-left and "3–2" paints as "2–3".
 */
function scorePair(first: number, second: number, lang: Lang) {
  return `\u2066${fmtNum(first, lang, 0)}–${fmtNum(second, lang, 0)}\u2069`
}

/** Replace every `{key}` once; templates hold each placeholder a single time. */
function fill(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.replace(`{${key}}`, value),
    template,
  )
}

/** Rough advance width for the 9px label face; collision maths only needs ±3px. */
function estimateWidth(text: string, lang: Lang, size: number) {
  let units = 0
  for (const ch of text) {
    if (ch === ' ') units += 0.3
    else if (lang === 'ar') units += 0.52
    else units += /[A-Z0-9%]/.test(ch) ? 0.62 : 0.55
  }
  return Math.max(14, units * size + 2)
}

function overlaps(a: Box, b: Box) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1
}

type Dot = { id: string; x: number; y: number }

/** A label slot is usable only inside the frame and clear of labels and dots. */
function isPlaceable(
  box: Box,
  frame: { width: number; height: number },
  taken: Box[],
  dots: Dot[],
  ownId: string,
) {
  if (box.x1 < 0 || box.x2 > frame.width || box.y1 < 0 || box.y2 > frame.height) {
    return false
  }
  if (taken.some((other) => overlaps(box, other))) return false
  return dots.every(
    (dot) =>
      dot.id === ownId ||
      !overlaps(box, {
        x1: dot.x - 7,
        y1: dot.y - 7,
        x2: dot.x + 7,
        y2: dot.y + 7,
      }),
  )
}

/**
 * Greedy label placement, heaviest sectors first. A label tries the side that
 * faces into the plot, then the other side, then above and below; it only takes
 * a slot that stays inside the frame and clear of every other dot and label.
 */
function placeLabels(points: Point[], width: number, height: number, lang: Lang) {
  const dots = points.map((p) => ({
    id: p.sector.id,
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
  }))
  const taken: Box[] = []
  const out: Record<string, Anchor> = {}
  const frame = { width, height }
  const order = [...points].sort(
    (a, b) =>
      b.sector.weight - a.sector.weight ||
      Math.abs(b.sector.change) - Math.abs(a.sector.change),
  )

  for (const p of order) {
    const px = (p.x / 100) * width
    const py = (p.y / 100) * height
    const tw = estimateWidth(p.sector.name[lang], lang, 9)
    const boxes: Record<Anchor, Box> = {
      start: {
        x1: px + LABEL_GAP,
        x2: px + LABEL_GAP + tw,
        y1: py - LABEL_H / 2,
        y2: py + LABEL_H / 2,
      },
      end: {
        x1: px - LABEL_GAP - tw,
        x2: px - LABEL_GAP,
        y1: py - LABEL_H / 2,
        y2: py + LABEL_H / 2,
      },
      above: {
        x1: px - tw / 2,
        x2: px + tw / 2,
        y1: py - LABEL_GAP - LABEL_H,
        y2: py - LABEL_GAP,
      },
      below: {
        x1: px - tw / 2,
        x2: px + tw / 2,
        y1: py + LABEL_GAP,
        y2: py + LABEL_GAP + LABEL_H,
      },
    }
    const preferred: Anchor[] =
      px > width * 0.62
        ? ['end', 'start', 'above', 'below']
        : ['start', 'end', 'above', 'below']

    const chosen =
      preferred.find((anchor) =>
        isPlaceable(boxes[anchor], frame, taken, dots, p.sector.id),
      ) ?? preferred[0]
    out[p.sector.id] = chosen
    taken.push(boxes[chosen])
  }

  return out
}

/** Dot map: x is today's change, y is index weight. Both domains come from the data. */
function RotationChart({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const [width, setWidth] = useState(PLOT_W_FALLBACK)
  const plotRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const el = plotRef.current
    if (!el) return
    const sync = () => setWidth(el.clientWidth)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Symmetric x domain with a little breathing room, snapped to 0.5pp.
  const maxAbs = sectors.reduce((max, sec) => Math.max(max, Math.abs(sec.change)), 0)
  const span = Math.max(0.02, Math.ceil((maxAbs + 0.003) / 0.005) * 0.005)
  // Weight domain starts at zero and lands on a multiple of 8 so ticks stay whole.
  const top = Math.max(
    8,
    Math.ceil(sectors.reduce((max, sec) => Math.max(max, sec.weight), 0) / 8) * 8,
  )
  const meanWeight = sectors.length
    ? sectors.reduce((sum, sec) => sum + sec.weight, 0) / sectors.length
    : top / 2

  const points: Point[] = sectors.map((sec) => ({
    sector: sec,
    x: ((sec.change + span) / (2 * span)) * 100,
    y: (1 - sec.weight / top) * 100,
  }))
  const labels = placeLabels(points, width, PLOT_H, lang)

  const xSteps = Math.max(2, Math.floor(span / 0.01))
  const xTicks = Array.from({ length: xSteps * 2 + 1 }, (_, i) => (i - xSteps) * 0.01)
  const yTicks = [1, 2, 3, 4].map((i) => (top / 4) * i)
  const picked = points.find((p) => p.sector.id === selected) ?? null

  return (
    <>
      <div dir="ltr" className="relative mt-3">
        <div className="relative ms-7 me-1">
          <div ref={plotRef} className="relative h-[188px]">
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              {/* Losing half, winning half, then the two quadrant seams. */}
              <div
                className="absolute inset-y-0 left-0 w-1/2"
                style={{ background: 'color-mix(in srgb, var(--color-down) 6%, transparent)' }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/2"
                style={{ background: 'color-mix(in srgb, var(--color-up) 6%, transparent)' }}
              />
              <div
                className="absolute inset-y-0 left-1/2 w-px"
                style={{ background: 'var(--color-line)' }}
              />
              <div
                className="absolute inset-x-0 h-0"
                style={{
                  top: `${(1 - meanWeight / top) * 100}%`,
                  borderTop: '1px dashed var(--color-line)',
                }}
              />
              <div
                className="absolute inset-0 rounded-lg border-l border-b"
                style={{ borderColor: 'var(--color-line)' }}
              />
            </div>

            {points.map((p) => (
              <span
                key={`label-${p.sector.id}`}
                aria-hidden="true"
                className="pointer-events-none absolute z-[5] whitespace-nowrap text-[9px] leading-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: LABEL_TRANSFORM[labels[p.sector.id]],
                  color:
                    selected === p.sector.id ? 'var(--color-fg)' : 'var(--color-muted)',
                  fontWeight: selected === p.sector.id ? 600 : 400,
                }}
              >
                {p.sector.name[lang]}
              </span>
            ))}

            {points.map((p) => {
              const isSelected = selected === p.sector.id
              const tone = toneOf(p.sector.change)
              return (
                <button
                  key={p.sector.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${p.sector.name[lang]} · ${fmtPct(p.sector.change, lang)} · ${s(
                    'weightLabel',
                  )} ${fmtNum(p.sector.weight, lang, 0, '%')}`}
                  onClick={() => onSelect(isSelected ? null : p.sector.id)}
                  className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: isSelected ? 12 : 9,
                      height: isSelected ? 12 : 9,
                      background: tone,
                      boxShadow: isSelected ? '0 0 0 2px var(--color-accent)' : undefined,
                    }}
                  />
                </button>
              )
            })}
          </div>

          <div className="relative mt-1.5 h-3">
            {xTicks.map((v) => (
              <span
                key={v}
                aria-hidden="true"
                className="num absolute top-0 -translate-x-1/2 text-[9px] leading-none"
                style={{
                  left: `${((v + span) / (2 * span)) * 100}%`,
                  color: 'var(--color-muted)',
                }}
              >
                {fmtPct(v, lang, 0)}
              </span>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute left-0 top-0 h-[188px] w-7">
          {yTicks.map((v) => (
            <span
              key={v}
              aria-hidden="true"
              className="num absolute right-1 -translate-y-1/2 text-[9px] leading-none"
              style={{ top: `${(1 - v / top) * 100}%`, color: 'var(--color-muted)' }}
            >
              {fmtNum(v, lang, 0, '%')}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mt-2 flex min-h-11 items-center justify-between gap-3 border-t pt-2"
        style={{ borderColor: 'var(--color-line)' }}
        aria-live="polite"
      >
        {picked ? (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: toneOf(picked.sector.change) }}
              />
              <span className="truncate text-[13px] font-medium">
                {picked.sector.name[lang]}
              </span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span
                className="num text-[13px] font-semibold"
                style={{ color: toneOf(picked.sector.change) }}
              >
                {fmtPct(picked.sector.change, lang)}
              </span>
              <span className="num text-[11px]" style={{ color: 'var(--color-muted)' }}>
                {s('weightLabel')} {fmtNum(picked.sector.weight, lang, 0, '%')}
              </span>
            </span>
          </>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('tapHint')}
          </span>
        )}
      </div>
    </>
  )
}

export default function ReviewPage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const [today] = useState(() => new Date())
  const { watchlist } = useUser()
  const [selected, setSelected] = useState<string | null>(null)

  // Breadth and extremes are recomputed from quotes on every render.
  const up = quotes.filter((q) => q.change > 0)
  const down = quotes.filter((q) => q.change < 0)
  const flat = quotes.filter((q) => q.change === 0)
  const ranked = [...quotes].sort((a, b) => b.change - a.change)
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]

  // Weighted tape: sector move × index weight, normalised by total weight.
  const totalWeight = sectors.reduce((sum, sec) => sum + sec.weight, 0)
  const weighted =
    totalWeight > 0
      ? sectors.reduce((sum, sec) => sum + sec.weight * sec.change, 0) / totalWeight
      : 0

  const byChange = [...sectors].sort((a, b) => b.change - a.change)
  const [leader, runner] = byChange

  const score =
    up.length >= down.length
      ? scorePair(up.length, down.length, lang)
      : scorePair(down.length, up.length, lang)
  const verdict = fill(
    up.length > down.length
      ? s('verdictUp')
      : down.length > up.length
        ? s('verdictDown')
        : s('verdictFlat'),
    { score, pct: fmtPct(weighted, lang) },
  )

  const watched = watchlist
    .map((symbol) => quotes.find((q) => q.symbol === symbol))
    .filter((q): q is Quote => Boolean(q))

  const takeaways: { id: string; tone: string; text: string }[] = []
  if (leader && runner) {
    takeaways.push({
      id: 'lead',
      tone: toneOf(leader.change),
      text: fill(s('takeLead'), {
        leader: leader.name[lang],
        follower: runner.name[lang],
        gap: fmtNum((leader.change - runner.change) * 100, lang, 1),
      }),
    })
  }
  if (quotes.length > 0) {
    const text =
      down.length > 0
        ? fill(s('takeBreadthDown'), {
            down: fmtNum(down.length, lang, 0),
            total: fmtNum(quotes.length, lang, 0),
          })
        : up.length > 0
          ? fill(s('takeBreadthAllUp'), { total: fmtNum(quotes.length, lang, 0) })
          : fill(s('takeBreadthAllFlat'), { total: fmtNum(quotes.length, lang, 0) })
    takeaways.push({
      id: 'breadth',
      tone: down.length > 0 ? 'var(--color-down)' : 'var(--color-up)',
      text,
    })
  }
  if (sectors.length > 0) {
    takeaways.push({
      id: 'weighted',
      tone: toneOf(weighted),
      text: fill(s('takeWeighted'), { pct: fmtPct(weighted, lang) }),
    })
  }

  const kicker = {
    color: 'var(--color-muted)',
    // Letter-spacing tears the joins in Arabic script.
    letterSpacing: lang === 'ar' ? 0 : undefined,
  }

  const dateLabel = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(today)

  return (
    <Screen title={s('title')} subtitle={dateLabel}>
      {/* 1 · scorecard */}
      <section className="panel mt-2 p-4" aria-label={s('breadthLabel')}>
        <p className="t-kicker" style={kicker}>
          {s('breadthLabel')}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span
            className="num t-display text-[38px] leading-none font-bold"
            style={{ color: 'var(--color-up)' }}
          >
            {fmtNum(up.length, lang, 0)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('namesUp')}
          </span>
          <span
            className="mx-1 text-[11px]"
            style={{ color: 'var(--color-muted)', opacity: 0.5 }}
          >
            ·
          </span>
          <span
            className="num t-display text-[38px] leading-none font-bold"
            style={{ color: 'var(--color-down)' }}
          >
            {fmtNum(down.length, lang, 0)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('namesDown')}
          </span>
          <span
            className="mx-1 text-[11px]"
            style={{ color: 'var(--color-muted)', opacity: 0.5 }}
          >
            ·
          </span>
          <span
            className="num t-display text-[38px] leading-none font-bold"
            style={{ color: 'var(--color-muted)' }}
          >
            {fmtNum(flat.length, lang, 0)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {s('namesFlat')}
          </span>
        </div>

        <div
          className="mt-3 flex h-1.5 gap-[3px] overflow-hidden rounded-full"
          aria-hidden="true"
        >
          {up.length > 0 && (
            <span
              style={{ flexGrow: up.length, background: 'var(--color-up)' }}
            />
          )}
          {flat.length > 0 && (
            <span
              style={{
                flexGrow: flat.length,
                background: 'color-mix(in srgb, var(--color-muted) 60%, transparent)',
              }}
            />
          )}
          {down.length > 0 && (
            <span
              style={{ flexGrow: down.length, background: 'var(--color-down)' }}
            />
          )}
        </div>

        {(best || worst) && (
          <div className="mt-3 space-y-1.5">
            {best && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="t-kicker w-9 shrink-0" style={kicker}>
                  {s('bestLabel')}
                </span>
                <span className="min-w-0 flex-1 truncate">{best.name[lang]}</span>
                <span
                  className="num shrink-0 font-semibold"
                  style={{ color: toneOf(best.change) }}
                >
                  {fmtPct(best.change, lang)}
                </span>
              </div>
            )}
            {worst && worst !== best && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="t-kicker w-9 shrink-0" style={kicker}>
                  {s('worstLabel')}
                </span>
                <span className="min-w-0 flex-1 truncate">{worst.name[lang]}</span>
                <span
                  className="num shrink-0 font-semibold"
                  style={{ color: toneOf(worst.change) }}
                >
                  {fmtPct(worst.change, lang)}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className="mt-3 flex gap-2.5 border-t pt-2.5"
          style={{ borderColor: 'var(--color-line)' }}
        >
          <span
            className="mt-[7px] h-3 w-[2px] shrink-0 rounded-full"
            style={{ background: 'var(--color-accent)' }}
            aria-hidden="true"
          />
          <p className="text-[12px] leading-[1.55]" style={{ color: 'var(--color-muted)' }}>
            {verdict}
          </p>
        </div>
      </section>

      {/* 2 · sector rotation */}
      <section className="panel mt-3 p-4" aria-label={s('rotationLabel')}>
        <p className="t-kicker" style={kicker}>
          {s('rotationLabel')}
        </p>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {s('axisX')} · {s('axisY')}
        </p>
        <RotationChart selected={selected} onSelect={setSelected} />
      </section>

      {/* 3 · watchlist */}
      <section className="panel mt-3 p-4" aria-label={s('watchLabel')}>
        <p className="t-kicker" style={kicker}>
          {s('watchLabel')}
        </p>
        {watched.length === 0 ? (
          <EmptyState text={s('watchEmpty')} />
        ) : (
          <div className="mt-1">
            {watched.map((q, i) => {
              const tone = toneOf(q.change)
              return (
                <div
                  key={q.symbol}
                  className="flex min-h-11 items-center gap-3"
                  style={
                    i > 0
                      ? { borderTop: '1px solid var(--color-line)' }
                      : undefined
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] leading-tight">{q.name[lang]}</p>
                    <p
                      className="num mt-0.5 text-[10px] leading-none"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {q.symbol}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="num text-[13px] leading-tight font-semibold">
                      <span dir="ltr">
                        {fmtNum(q.price, lang, 2)}{' '}
                        <span
                          className="text-[9px] font-normal"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {q.currency}
                        </span>
                      </span>
                    </p>
                    <p
                      className="num mt-0.5 text-[11px] leading-none"
                      style={{ color: tone }}
                    >
                      {fmtPct(q.change, lang)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 4 · takeaways */}
      <section className="mt-6" aria-label={s('takeLabel')}>
        <p className="t-kicker" style={kicker}>
          {s('takeLabel')}
        </p>
        <ul className="mt-2.5 space-y-2.5">
          {takeaways.map((t) => (
            <li
              key={t.id}
              className="flex gap-2.5 text-[12px] leading-[1.55]"
              style={{ color: 'var(--color-muted)' }}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: t.tone }}
                aria-hidden="true"
              />
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </Screen>
  )
}
