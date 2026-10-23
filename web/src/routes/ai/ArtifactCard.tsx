import { Link } from 'react-router-dom'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { countNames } from '../../i18n/format'
import { quotes } from '../../data/mock'
import { toggleWatch, useUser } from '../../store/user'
import type { Artifact } from './chat'
import { toneOf } from './chat'
import { strings } from './strings'

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const { watchlist } = useUser()
  const rows = artifact.symbols.flatMap((symbol) => {
    const quote = quotes.find((q) => q.symbol === symbol)
    return quote ? [quote] : []
  })
  const allWatched = rows.length > 0 && rows.every((q) => watchlist.includes(q.symbol))

  const addAll = () => {
    for (const row of rows) {
      if (!watchlist.includes(row.symbol)) toggleWatch(row.symbol)
    }
  }

  return (
    <div className="panel mt-3 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-medium">{artifact.title}</p>
        <span className="shrink-0 text-[11px] text-muted">
          {countNames(lang, rows.length)}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{artifact.rule}</p>

      {rows.length === 0 ? (
        <p className="mt-3 text-[12px] text-muted">{s('artifactEmpty')}</p>
      ) : (
        <div className="mt-1.5">
          {rows.map((q, i) => (
            <div
              key={q.symbol}
              className={`flex items-center gap-2 py-2 ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <span className="min-w-0 flex-1 truncate text-[13px]">{q.name[lang]}</span>
              <span className="shrink-0 text-[11px] text-muted">{q.symbol}</span>
              <span className="num w-16 shrink-0 text-end text-[12px]">
                {fmtNum(q.price, lang, 2)}
              </span>
              <span className={`num w-14 shrink-0 text-end text-[12px] ${toneOf(q.change)}`}>
                {fmtPct(q.change, lang)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addAll}
          disabled={allWatched || rows.length === 0}
          aria-pressed={allWatched}
          className="min-h-11 flex-1 basis-[46%] rounded-xl border border-line px-2 py-2 text-[11px] leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
          style={{ color: allWatched ? 'var(--color-muted)' : 'var(--color-fg)' }}
        >
          {allWatched ? s('addedWatch') : s('addWatch')}
        </button>
        <Link
          to={`/screener?preset=${artifact.preset}`}
          className="flex min-h-11 flex-1 basis-[46%] items-center justify-center rounded-xl border border-line px-2 py-2 text-center text-[11px] leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('editRules')}
        </Link>
      </div>
    </div>
  )
}
