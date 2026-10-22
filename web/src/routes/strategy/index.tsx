import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LongPressLink } from '../../components/LongPressLink'
import { Screen } from '../../components/Screen'
import { EmptyState } from '../../components/states'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import type { Lang } from '../../i18n'
import { equity, quotes, strategies } from '../../data/mock'
import { addJournal, removeJournal, useUser } from '../../store/user'
import { fmtDate } from './format'
import { listStrings, TAG_KEY } from './strings'

type Sort = 'recent' | 'return'

/** Fixed product order; only tags that actually occur in the mock are offered. */
const TAG_ORDER = ['value', 'sharia', 'momentum', 'income'] as const

/** New words for the filter row live with it, so the shared dictionary stays untouched. */
const ALL: Record<Lang, string> = { zh: '全部', en: 'All', ar: 'الكل' }
const FILTER_LABEL: Record<Lang, string> = {
  zh: '按标签筛选',
  en: 'Filter by tag',
  ar: 'تصفية حسب الوسم',
}

/** Paper-book words live with the card, same as the filter row. */
const BOOK: Record<Lang, string> = { zh: '模拟账本', en: 'Paper book', ar: 'دفتر المحاكاة' }
const BOOK_RETURN: Record<Lang, string> = {
  zh: '累计收益',
  en: 'Total return',
  ar: 'العائد الإجمالي',
}
const BOOK_POSITIONS: Record<Lang, string> = { zh: '持仓', en: 'Positions', ar: 'المراكز' }
const BOOK_CASH: Record<Lang, string> = { zh: '现金', en: 'Cash', ar: 'النقد' }
const BOOK_EMPTY: Record<Lang, string> = {
  zh: '还没有模拟仓位',
  en: 'No paper positions yet',
  ar: 'لا توجد مراكز ورقية بعد',
}
const BOOK_LOG: Record<Lang, string> = { zh: '记录一笔', en: 'Log a trade', ar: 'تسجيل صفقة' }
const BOOK_CLOSE: Record<Lang, string> = { zh: '收起', en: 'Close', ar: 'إغلاق' }
const BOOK_FORM: Record<Lang, string> = {
  zh: '记录模拟交易',
  en: 'Log a paper trade',
  ar: 'تسجيل صفقة ورقية',
}
const BOOK_SYMBOL: Record<Lang, string> = { zh: '标的', en: 'Symbol', ar: 'الرمز' }
const BOOK_SIDE: Record<Lang, string> = { zh: '方向', en: 'Side', ar: 'الاتجاه' }
const BOOK_QTY: Record<Lang, string> = { zh: '数量', en: 'Qty', ar: 'الكمية' }
const BOOK_PRICE: Record<Lang, string> = { zh: '价格', en: 'Price', ar: 'السعر' }
const BOOK_SAVE: Record<Lang, string> = { zh: '保存', en: 'Save', ar: 'حفظ' }
const BOOK_DELETE: Record<Lang, string> = { zh: '删除', en: 'Delete', ar: 'حذف' }
const BOOK_RECENT: Record<Lang, string> = {
  zh: '最近记录',
  en: 'Recent entries',
  ar: 'أحدث الإدخالات',
}
const BOOK_BUY: Record<Lang, string> = { zh: '买入', en: 'Buy', ar: 'شراء' }
const BOOK_SELL: Record<Lang, string> = { zh: '卖出', en: 'Sell', ar: 'بيع' }
const BOOK_ERR_QTY: Record<Lang, string> = {
  zh: '数量必须大于 0',
  en: 'Quantity must be greater than 0',
  ar: 'يجب أن تكون الكمية أكبر من 0',
}
const BOOK_ERR_PRICE: Record<Lang, string> = {
  zh: '价格必须大于 0',
  en: 'Price must be greater than 0',
  ar: 'يجب أن يكون السعر أكبر من 0',
}

/** Paper account starts flat; every journal entry moves cash from here. */
const START_CASH = 100_000

const QUOTE_BY: Record<string, (typeof quotes)[number] | undefined> = Object.fromEntries(
  quotes.map((q) => [q.symbol, q] as const),
)

const SW = 120
const SH = 56
const SP = 4

/**
 * One window of the shared curve per strategy, keyed by id so that sorting and
 * filtering never change a card's shape. Each window is rescaled so its last
 * point is exactly the strategy's last return — the number printed above it.
 */
const SPARKS: Record<string, number[]> = {}
strategies.forEach((st, i) => {
  const slice = equity.withCost.slice((i * 17) % 31)
  const scale = (1 + st.lastReturn) / slice[slice.length - 1]
  SPARKS[st.id] = slice.map((v) => v * scale)
})

function Sparkline({ id, series, up }: { id: string; series: number[]; up: boolean }) {
  const lo = Math.min(...series)
  const hi = Math.max(...series)
  const span = hi - lo || 1
  const pts = series
    .map((v, i) => {
      const x = SP + (i / Math.max(series.length - 1, 1)) * (SW - SP * 2)
      const y = SP + (1 - (v - lo) / span) * (SH - SP * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const tone = up ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      preserveAspectRatio="none"
      className="h-14 w-full"
      style={{ direction: 'ltr' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: tone, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: tone, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polygon points={`${SP},${SH} ${pts} ${SW - SP},${SH}`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function StrategyPage() {
  const { lang } = useI18n()
  const s = useStrings(listStrings)
  const [sort, setSort] = useState<Sort>('recent')
  /** null is the "All" chip. */
  const [tag, setTag] = useState<string | null>(null)

  const { journal } = useUser()

  /** Collapsed by default; one entry form at a time. */
  const [formOpen, setFormOpen] = useState(false)
  const [symbol, setSymbol] = useState(quotes[0]?.symbol ?? '')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState(String(quotes[0]?.price ?? ''))
  const [error, setError] = useState<'qty' | 'price' | null>(null)

  /**
   * Mark-to-market paper book: start flat, every trade moves cash, and open
   * quantity is valued at the current mock quote. Reacts to the shared store.
   */
  const book = useMemo(() => {
    let cash = START_CASH
    const net: Record<string, number> = {}
    for (const e of journal) {
      if (!Number.isFinite(e.qty) || !Number.isFinite(e.price)) continue
      const notional = e.price * e.qty
      cash += e.side === 'buy' ? -notional : notional
      const delta = e.side === 'buy' ? e.qty : -e.qty
      net[e.symbol] = (net[e.symbol] ?? 0) + delta
    }
    let open = 0
    let value = 0
    for (const [sym, pos] of Object.entries(net)) {
      if (pos === 0) continue
      open += 1
      const mark = QUOTE_BY[sym]?.price ?? journal.find((e) => e.symbol === sym)?.price ?? 0
      value += pos * mark
    }
    const total = cash + value - START_CASH
    return { cash, open, total, totalPct: total / START_CASH }
  }, [journal])

  const tone =
    book.total > 0 ? 'text-up' : book.total < 0 ? 'text-down' : 'text-muted'

  function toggleForm() {
    const next = !formOpen
    if (next) {
      const q = QUOTE_BY[symbol]
      if (q) setPrice(String(q.price))
      setError(null)
    }
    setFormOpen(next)
  }

  function pickSymbol(next: string) {
    setSymbol(next)
    const q = QUOTE_BY[next]
    if (q) setPrice(String(q.price))
  }

  function submitTrade(e: FormEvent) {
    e.preventDefault()
    const q = Number(qty)
    const p = Number(price)
    if (!Number.isFinite(q) || q <= 0) {
      setError('qty')
      return
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError('price')
      return
    }
    addJournal({ symbol, side, qty: q, price: p })
    setQty('')
    setError(null)
    setFormOpen(false)
  }

  const tags = useMemo(
    () => TAG_ORDER.filter((t) => strategies.some((st) => st.tags.includes(t))),
    [],
  )

  const rows = useMemo(
    () =>
      [...strategies]
        .filter((st) => tag === null || st.tags.includes(tag))
        .sort((a, b) =>
          sort === 'recent'
            ? b.updated.localeCompare(a.updated)
            : b.lastReturn - a.lastReturn,
        ),
    [sort, tag],
  )

  return (
    <Screen
      title={s('title')}
      action={
        <Link to="/leaderboard" className="flex min-h-[44px] items-center rounded-full px-3.5 text-[12px]" style={{ border: '1px solid var(--color-line)' }}>
          {s('leaderboard')}
        </Link>
      }
    >
      <section aria-labelledby="paper-book-title" className="panel mt-2 mb-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="paper-book-title" className="t-kicker">
              {BOOK[lang]}
            </h2>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span dir="ltr" className={`num text-[22px] leading-none font-semibold ${tone}`}>
                {fmtNum(book.total, lang)}
              </span>
              <span dir="ltr" className={`num text-[13px] leading-none ${tone}`}>
                {fmtPct(book.totalPct, lang, 1)}
              </span>
            </div>
            <div
              className="mt-1.5 text-[11px] leading-none"
              style={{ color: 'var(--color-muted)' }}
            >
              {BOOK_RETURN[lang]}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleForm}
            aria-expanded={formOpen}
            aria-controls="paper-book-form"
            className="min-h-11 shrink-0 rounded-full px-3 text-[13px] font-medium"
            style={{ border: '1px solid var(--color-line)' }}
          >
            {formOpen ? BOOK_CLOSE[lang] : BOOK_LOG[lang]}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            className="min-w-0 rounded-xl px-3 py-2"
            style={{ border: '1px solid var(--color-line)' }}
          >
            <div className="text-[11px] leading-none" style={{ color: 'var(--color-muted)' }}>
              {BOOK_POSITIONS[lang]}
            </div>
            <div dir="ltr" className="num mt-1.5 text-[15px] leading-none font-medium">
              {fmtNum(book.open, lang, 0)}
            </div>
          </div>
          <div
            className="min-w-0 rounded-xl px-3 py-2"
            style={{ border: '1px solid var(--color-line)' }}
          >
            <div className="text-[11px] leading-none" style={{ color: 'var(--color-muted)' }}>
              {BOOK_CASH[lang]}
            </div>
            <div dir="ltr" className="num mt-1.5 truncate text-[15px] leading-none font-medium">
              {fmtNum(book.cash, lang)}
            </div>
          </div>
        </div>

        {formOpen && (
          <form
            id="paper-book-form"
            onSubmit={submitTrade}
            noValidate
            aria-label={BOOK_FORM[lang]}
            className="mt-3 space-y-3 rounded-xl p-3"
            style={{ border: '1px solid var(--color-line)' }}
          >
            <div>
              <label
                htmlFor="paper-book-symbol"
                className="text-[11px] leading-none"
                style={{ color: 'var(--color-muted)' }}
              >
                {BOOK_SYMBOL[lang]}
              </label>
              <select
                id="paper-book-symbol"
                value={symbol}
                onChange={(e) => pickSymbol(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg px-2 text-[13px]"
                style={{
                  border: '1px solid var(--color-line)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-fg)',
                }}
              >
                {quotes.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol} · {q.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div role="group" aria-label={BOOK_SIDE[lang]} className="grid grid-cols-2 gap-2">
              {(['buy', 'sell'] as const).map((k) => {
                const active = side === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSide(k)}
                    aria-pressed={active}
                    className={`min-h-11 rounded-lg text-[13px] ${
                      active ? 'font-medium' : ''
                    } ${k === 'buy' ? 'text-up' : 'text-down'}`}
                    style={{
                      border: `1px solid ${active ? 'currentColor' : 'var(--color-line)'}`,
                      background: active ? 'var(--color-bg)' : 'transparent',
                    }}
                  >
                    {k === 'buy' ? BOOK_BUY[lang] : BOOK_SELL[lang]}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <label
                  htmlFor="paper-book-qty"
                  className="text-[11px] leading-none"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {BOOK_QTY[lang]}
                </label>
                <input
                  id="paper-book-qty"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={qty}
                  aria-invalid={error === 'qty'}
                  aria-describedby={error ? 'paper-book-error' : undefined}
                  onChange={(e) => {
                    setQty(e.target.value)
                    if (error === 'qty') setError(null)
                  }}
                  className="num mt-1.5 min-h-11 w-full rounded-lg px-2 text-[13px]"
                  style={{
                    border: `1px solid ${
                      error === 'qty' ? 'var(--color-accent)' : 'var(--color-line)'
                    }`,
                    background: 'var(--color-bg)',
                    color: 'var(--color-fg)',
                  }}
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="paper-book-price"
                  className="text-[11px] leading-none"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {BOOK_PRICE[lang]}
                </label>
                <input
                  id="paper-book-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={price}
                  aria-invalid={error === 'price'}
                  aria-describedby={error ? 'paper-book-error' : undefined}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    if (error === 'price') setError(null)
                  }}
                  className="num mt-1.5 min-h-11 w-full rounded-lg px-2 text-[13px]"
                  style={{
                    border: `1px solid ${
                      error === 'price' ? 'var(--color-accent)' : 'var(--color-line)'
                    }`,
                    background: 'var(--color-bg)',
                    color: 'var(--color-fg)',
                  }}
                />
              </div>
            </div>

            {error && (
              <p
                id="paper-book-error"
                role="alert"
                className="text-[12px] leading-snug"
                style={{ color: 'var(--color-accent)' }}
              >
                {error === 'qty' ? BOOK_ERR_QTY[lang] : BOOK_ERR_PRICE[lang]}
              </p>
            )}

            <button
              type="submit"
              className="min-h-11 w-full rounded-full text-[13px] font-medium"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {BOOK_SAVE[lang]}
            </button>
          </form>
        )}

        {journal.length === 0 ? (
          <p className="mt-3 text-[13px] leading-snug" style={{ color: 'var(--color-muted)' }}>
            {BOOK_EMPTY[lang]}
          </p>
        ) : (
          <div className="mt-3">
            <div className="text-[11px] leading-none" style={{ color: 'var(--color-muted)' }}>
              {BOOK_RECENT[lang]}
            </div>
            <ul className="mt-1 space-y-1">
              {journal.slice(0, 3).map((e) => {
                const quote = QUOTE_BY[e.symbol]
                return (
                  <li key={e.id} className="flex min-h-11 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span dir="ltr" className="num truncate text-[13px] font-medium">
                          {e.symbol}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                            e.side === 'buy' ? 'text-up' : 'text-down'
                          }`}
                          style={{ border: '1px solid var(--color-line)' }}
                        >
                          {e.side === 'buy' ? BOOK_BUY[lang] : BOOK_SELL[lang]}
                        </span>
                      </div>
                      <div
                        className="mt-0.5 truncate text-[11px] leading-none"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        <span dir="ltr" className="num">
                          {fmtNum(e.qty, lang, Number.isInteger(e.qty) ? 0 : 2)} ×{' '}
                          {fmtNum(e.price, lang)} {quote?.currency}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeJournal(e.id)}
                      aria-label={`${BOOK_DELETE[lang]} ${e.symbol}`}
                      className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      {tags.length > 0 && (
        <div
          role="group"
          aria-label={FILTER_LABEL[lang]}
          className="-mx-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-0.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
        >
          {[null, ...tags].map((t) => {
            const active = tag === t
            return (
              <button
                key={t ?? 'all'}
                type="button"
                onClick={() => setTag(t)}
                aria-pressed={active}
                className={`min-h-11 shrink-0 rounded-full px-3 text-[13px] whitespace-nowrap transition-colors ${
                  active ? 'font-medium text-fg' : 'text-muted'
                }`}
                style={{
                  border: '1px solid var(--color-line)',
                  background: active ? 'var(--color-surface)' : 'transparent',
                }}
              >
                {t ? s(TAG_KEY[t]) : ALL[lang]}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <div
          role="group"
          aria-label={s('sortLabel')}
          className="flex rounded-full p-1"
          style={{ border: '1px solid var(--color-line)' }}
        >
          {(['recent', 'return'] as const).map((k) => {
            const active = sort === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                aria-pressed={active}
                className={`min-h-11 rounded-full px-3.5 text-[13px] transition-colors ${
                  active ? 'font-medium text-fg' : 'text-muted'
                }`}
                style={active ? { background: 'var(--color-surface)' } : undefined}
              >
                {s(k === 'recent' ? 'sortRecent' : 'sortReturn')}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            text={s('empty')}
            action={
              <Link
                to="/ai"
                className="flex min-h-11 items-center rounded-full px-4 text-[13px]"
                style={{ border: '1px solid var(--color-line)' }}
              >
                {s('emptyCta')}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((st) => {
              const ret = st.lastReturn
              const up = ret >= 0
              const tone = ret > 0 ? 'text-up' : ret < 0 ? 'text-down' : 'text-muted'
              return (
                <li key={st.id}>
                  <LongPressLink
                    to={`/strategy/${st.id}`}
                    prompt={`${st.name[lang]} — ${st.description[lang]}`}
                    className="panel block p-4 active:opacity-80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[16px] leading-snug font-semibold">
                          {st.name[lang]}
                        </h2>
                        <p
                          className="mt-1 line-clamp-2 text-[13px] leading-snug"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {st.description[lang]}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <div
                          dir="ltr"
                          className={`num text-[22px] leading-none font-semibold ${tone}`}
                        >
                          {fmtPct(ret, lang, 1)}
                        </div>
                        <div
                          className="mt-1.5 text-[11px] leading-none"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {s('lastReturn')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Sparkline id={`spark-${st.id}`} series={SPARKS[st.id]} up={up} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {st.tags.map((t) => {
                        const key = TAG_KEY[t]
                        return (
                          <span
                            key={t}
                            className="rounded-full px-2.5 py-1 text-[11px] leading-none"
                            style={{
                              border: '1px solid var(--color-line)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {key ? s(key) : t}
                          </span>
                        )
                      })}
                    </div>

                    <div
                      className="mt-2.5 flex items-center justify-between gap-3 text-[11px]"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <span>
                        <span className="num">{fmtNum(st.rules, lang, 0)}</span> {s('rulesUnit')}
                      </span>
                      <span className="truncate">
                        {s('updated')} {fmtDate(st.updated, lang)}
                      </span>
                    </div>
                  </LongPressLink>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Screen>
  )
}
