import { useState } from 'react'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { quotes } from '../../data/mock'
import { strings } from './strings'
import { toneOf } from './chat'

export function ArtifactCard({ title }: { title: string }) {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const [watched, setWatched] = useState(false)
  const [saved, setSaved] = useState(false)
  const rows = quotes.slice(0, 5)

  return (
    <div className="panel mt-3 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-medium">{title}</p>
        <span className="shrink-0 text-[11px] text-muted">{s('artifactCount')}</span>
      </div>

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

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWatched((v) => !v)}
          aria-pressed={watched}
          className="min-h-11 flex-1 basis-[46%] rounded-xl border border-line px-2 py-2 text-[11.5px] leading-snug"
          style={{ color: watched ? 'var(--color-accent)' : 'var(--color-fg)' }}
        >
          {watched ? s('addedWatch') : s('addWatch')}
        </button>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          className="min-h-11 flex-1 basis-[46%] rounded-xl border border-line px-2 py-2 text-[11.5px] leading-snug"
          style={{ color: saved ? 'var(--color-accent)' : 'var(--color-fg)' }}
        >
          {saved ? s('savedStrategy') : s('saveStrategy')}
        </button>
      </div>
    </div>
  )
}
