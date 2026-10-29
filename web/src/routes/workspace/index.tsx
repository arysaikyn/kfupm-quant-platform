import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { EmptyState, Skeleton } from '../../components/states'
import { Screen } from '../../components/Screen'
import { fmtClock, fmtDate, fmtDateTime } from '../../i18n/format'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useAiMode } from '../../store/aiMode'
import { RebalancePreview } from './RebalancePreview'
import {
  accountLedger,
  diffLedgers,
  freezePaperAccount,
  removePaperSnapshot,
  rewindPreview,
  snapshotLedger,
  usePaperSnapshots,
} from '../../store/paper'
import type { PaperPosition } from '../../lib/positions'
import type { PaperDiff, PaperSnapshot } from '../../store/paper'
import { aiApi } from '../../api/ai'
import type {
  AlphaSummary,
  LlmSettings,
  PaperAccount,
  PortfolioSnapshot,
  RunListItem,
  ScheduledRun,
} from '../../api/ai'
import { setIntake } from '../../store/aiIntake'
import { buildRouteSheet, readRouteInput } from './routeSheet'
import type { RouteSheet, RouteSkipReason, RouteStop, RouteStopKind } from './routeSheet'
import { strings } from './strings'
import type { WorkspaceStrings } from './strings'

type S = (key: keyof WorkspaceStrings) => string
type Tab = 'runs' | 'paper' | 'portfolio' | 'alphas' | 'scheduled' | 'model'

const TABS: { id: Tab; key: keyof WorkspaceStrings }[] = [
  { id: 'runs', key: 'runs' },
  { id: 'paper', key: 'paper' },
  { id: 'portfolio', key: 'portfolio' },
  { id: 'alphas', key: 'alphas' },
  { id: 'scheduled', key: 'scheduled' },
  { id: 'model', key: 'model' },
]

function useRemote<T>(loader: () => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let cancelled = false
    // External state: every panel reads the upstream server.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    setError(null)
    loaderRef
      .current()
      .then((value) => {
        if (!cancelled) setData(value)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'request failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key, tick])

  return { data, error, loading, retry: () => setTick((n) => n + 1) }
}

function Loading() {
  return (
    <div className="mt-4">
      <Skeleton rows={3} />
    </div>
  )
}

function Failure({ s, message, retry }: { s: S; message: string; retry: () => void }) {
  return (
    <div role="alert" className="panel mt-4 border-danger/40 p-3">
      <p className="text-[12px] font-medium" style={{ color: 'var(--color-danger)' }}>
        {s('error')}
      </p>
      {message && message !== s('error') && (
        <p className="mt-1 break-words text-[11px] leading-snug text-muted">{message}</p>
      )}
      <button
        type="button"
        onClick={retry}
        className="mt-2 min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {s('retry')}
      </button>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <li className="border-t border-line py-3 first:border-t-0">{children}</li>
}

function AskAction({ s, onClick }: { s: S; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted transition-colors hover:border-fg/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      {s('askAi')}
    </button>
  )
}

function AskEmpty({
  s,
  text,
  prompt,
  navigate,
}: {
  s: S
  text: string
  prompt: string
  navigate: (path: string) => void
}) {
  return (
    <EmptyState
      text={text}
      action={
        <button
          type="button"
          onClick={() => {
            setIntake(prompt, [])
            navigate('/ai')
          }}
          className="flex min-h-11 items-center rounded-full bg-solid px-4 text-[12px] font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
        >
          {s('askAi')}
        </button>
      }
    />
  )
}

const STATUS_KEYS: Record<string, keyof WorkspaceStrings> = {
  success: 'statusSuccess',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  failed: 'statusFailed',
  active: 'statusActive',
  paused: 'statusPaused',
}

function statusText(s: S, status: string) {
  const key = STATUS_KEYS[status.toLowerCase()]
  return key ? s(key) : status
}

function StatusBadge({ s, status }: { s: S; status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] leading-none ${status.toLowerCase() === 'failed' ? 'text-danger' : 'text-muted'}`}>
      {statusText(s, status)}
    </span>
  )
}

function RunsPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<RunListItem[]>(() => aiApi.runs(), 'runs')
  if (loading) return <Loading />
  if (error) return <Failure s={s} message={error} retry={retry} />
  if (!data || data.length === 0) {
    return (
      <AskEmpty
        s={s}
        text={s('emptyRuns')}
        prompt={s('startBacktest')}
        navigate={navigate}
      />
    )
  }
  return (
    <ul className="mt-4">
      {data.slice(0, 40).map((run) => (
        <Row key={run.run_id}>
          <p className="line-clamp-2 text-[13px] leading-snug font-medium">
            {run.prompt || run.codes?.join(' · ') || s('none')}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            <span className="t-sym max-w-full truncate">{run.run_id}</span>
            <span aria-hidden>·</span>
            <span className="num">{fmtDate(run.created_at, lang)}</span>
            <StatusBadge s={s} status={run.status} />
          </div>
          {(run.total_return != null || run.sharpe != null) && (
            <div className="mt-2 flex gap-4 text-[11px]">
              {run.total_return != null && (
                <span>
                  {s('totalReturn')}{' '}
                  <b
                    className={`num ${
                      run.total_return > 0
                        ? 'text-up'
                        : run.total_return < 0
                          ? 'text-down'
                          : ''
                    }`}
                  >
                    {fmtPct(run.total_return, lang, 1)}
                  </b>
                </span>
              )}
              {run.sharpe != null && (
                <span>
                  {s('sharpe')} <b className="num">{fmtNum(run.sharpe, lang, 2)}</b>
                </span>
              )}
            </div>
          )}
          <AskAction
            s={s}
            onClick={() => {
              setIntake(s('runPrompt').replace('{id}', run.run_id), [])
              navigate('/ai')
            }}
          />
        </Row>
      ))}
    </ul>
  )
}

function PositionSymbols({ positions, empty }: { positions: PaperPosition[]; empty: string }) {
  if (positions.length === 0) return <span className="num text-muted">{empty}</span>
  return <span className="num">{positions.map((position) => position.symbol).join(' · ')}</span>
}

function SnapshotDiff({ diff, currency, s, lang }: { diff: PaperDiff; currency: string; s: S; lang: 'zh' | 'en' | 'ar' }) {
  const changed =
    diff.added.length > 0 ||
    diff.dropped.length > 0 ||
    diff.cashDelta !== 0 ||
    diff.positionCountDelta !== 0
  if (!changed) {
    return <p className="text-muted">{s('snapshotNoChange')}</p>
  }
  return (
    <>
      <p>
        <span className="text-muted">{s('snapshotAdded')}: </span>
        <PositionSymbols positions={diff.added} empty={s('none')} />
      </p>
      <p className="mt-1">
        <span className="text-muted">{s('snapshotDropped')}: </span>
        <PositionSymbols positions={diff.dropped} empty={s('none')} />
      </p>
      <p className="mt-1">
        <span className="text-muted">{s('snapshotCashDelta')}: </span>
        <span className="num">
          {diff.cashDelta > 0 ? '+' : ''}
          {fmtNum(diff.cashDelta, lang, 2)} {currency}
        </span>
      </p>
    </>
  )
}

function SnapshotItem({
  snapshot,
  account,
  s,
  lang,
}: {
  snapshot: PaperSnapshot
  account: PaperAccount
  s: S
  lang: 'zh' | 'en' | 'ar'
}) {
  const [open, setOpen] = useState<'diff' | 'rewind' | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const current = accountLedger(account)
  const compare = diffLedgers(snapshotLedger(snapshot), current)
  const rewind = rewindPreview(snapshot, current)

  return (
    <li className="border-t border-line py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[12px] font-medium">{snapshot.label}</p>
            <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[9px] leading-none text-muted">
              {s('snapshotDemo')}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted">
            {s('snapshotFrozen')} <span className="num">{fmtDate(snapshot.createdAt, lang)}</span>
            {' · '}
            {s('cash')} <span className="num">{fmtNum(snapshot.cash, lang, 2)}</span> {snapshot.currency}
            {' · '}
            {s('positions')} <span className="num">{snapshot.positionCount}</span>
          </p>
        </div>
        {confirmRemove ? (
          <button
            type="button"
            onClick={() => {
              removePaperSnapshot(snapshot.id)
              setConfirmRemove(false)
            }}
            className="flex min-h-11 shrink-0 items-center rounded-full px-2 text-[10px] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
            style={{ color: 'var(--color-danger)' }}
          >
            {s('snapshotConfirmRemove')}
          </button>
        ) : (
          <button
            type="button"
            aria-label={`${s('snapshotRemove')}: ${snapshot.label}`}
            onClick={() => setConfirmRemove(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={open === 'diff'}
          onClick={() => setOpen(open === 'diff' ? null : 'diff')}
          className="min-h-11 rounded-full border border-line px-3 text-[11px] text-muted transition-colors hover:border-fg/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('snapshotCompare')}
        </button>
        <button
          type="button"
          aria-expanded={open === 'rewind'}
          onClick={() => setOpen(open === 'rewind' ? null : 'rewind')}
          className="min-h-11 rounded-full border border-line px-3 text-[11px] text-muted transition-colors hover:border-fg/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('snapshotRewind')}
        </button>
      </div>

      {open === 'diff' && (
        <div className="mt-2 rounded-lg bg-fg/5 p-2.5 text-[11px] leading-relaxed">
          <SnapshotDiff diff={compare} currency={snapshot.currency} s={s} lang={lang} />
        </div>
      )}

      {open === 'rewind' && (
        <div className="mt-2 rounded-lg bg-fg/5 p-2.5 text-[11px] leading-relaxed">
          <p>
            <span className="text-muted">{s('snapshotRestore')}: </span>
            <PositionSymbols positions={rewind.added} empty={s('none')} />
          </p>
          <p className="mt-1">
            <span className="text-muted">{s('snapshotDrop')}: </span>
            <PositionSymbols positions={rewind.dropped} empty={s('none')} />
          </p>
          <p className="mt-1">
            <span className="text-muted">{s('snapshotCashDelta')}: </span>
            <span className="num">
              {rewind.cashDelta > 0 ? '+' : ''}
              {fmtNum(rewind.cashDelta, lang, 2)} {snapshot.currency}
            </span>
          </p>
          <p className="mt-1.5 text-[10px] leading-snug text-muted">{s('snapshotRewindNote')}</p>
        </div>
      )}
    </li>
  )
}

function AccountSnapshots({ account, s, lang }: { account: PaperAccount; s: S; lang: 'zh' | 'en' | 'ar' }) {
  const snapshots = usePaperSnapshots()
  const mine = snapshots.filter((snapshot) => snapshot.accountId === account.id)
  const [freeze, setFreeze] = useState(false)
  const [name, setName] = useState('')
  const inputId = `cp-name-${account.id}`
  const formId = `cp-form-${account.id}`

  return (
    <section className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="t-kicker text-muted">
          {s('snapshots')} <span className="num">{mine.length}</span>
        </p>
        <button
          type="button"
          aria-expanded={freeze}
          aria-controls={freeze ? formId : undefined}
          onClick={() => setFreeze((value) => !value)}
          className="min-h-11 rounded-full border border-line px-3 text-[11px] text-muted transition-colors hover:border-fg/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('snapshotFreeze')}
        </button>
      </div>

      {freeze && (
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault()
            if (freezePaperAccount(account, name)) {
              setName('')
              setFreeze(false)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setFreeze(false)
              setName('')
            }
          }}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            {s('snapshotName')}
          </label>
          <input
            id={inputId}
            autoFocus
            value={name}
            maxLength={40}
            placeholder={s('snapshotNamePlaceholder')}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-lg bg-fg/5 px-2.5 text-[13px] text-fg focus-visible:outline-2 focus-visible:outline-fg"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="min-h-11 shrink-0 rounded-full bg-solid px-3 text-[12px] font-medium text-bg disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('snapshotSave')}
          </button>
          <button
            type="button"
            onClick={() => {
              setFreeze(false)
              setName('')
            }}
            className="min-h-11 shrink-0 rounded-full px-2 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('snapshotCancel')}
          </button>
        </form>
      )}

      {mine.length === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-muted">{s('snapshotEmpty')}</p>
      ) : (
        <ul className="mt-1">
          {mine.map((snapshot) => (
            <SnapshotItem
              key={snapshot.id}
              snapshot={snapshot}
              account={account}
              s={s}
              lang={lang}
            />
          ))}
        </ul>
      )}

      <p className="mt-2 text-[10px] leading-snug text-muted">{s('snapshotLocal')}</p>
    </section>
  )
}

function PaperPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<PaperAccount[]>(
    () => aiApi.paperAccounts(),
    'paper',
  )
  if (loading) return <Loading />
  if (error) return <Failure s={s} message={error} retry={retry} />
  if (!data || data.length === 0) {
    return (
      <AskEmpty s={s} text={s('emptyPaper')} prompt={s('startPaper')} navigate={navigate} />
    )
  }
  return (
    <ul className="mt-4">
      {data.map((account) => (
        <Row key={account.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{account.label}</p>
              <p className="mt-1 text-[11px] text-muted">
                {s('market')} {account.market.toUpperCase()} · {account.currency} ·{' '}
                <span className="num">{fmtDate(account.last_date || account.start_on, lang)}</span>
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="num text-[13px]">
                {fmtNum(account.account_state.cash, lang, 2)}{' '}
                <span className="text-[10px] text-muted">{account.currency}</span>
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {s('positions')} {fmtNum(account.account_state.positions.length, lang, 0)}
              </p>
            </div>
          </div>
          <AskAction
            s={s}
            onClick={() => {
              setIntake(s('paperPrompt').replace('{id}', account.label), [])
              navigate('/ai')
            }}
          />
          <AccountSnapshots account={account} s={s} lang={lang} />
          <RebalancePreview account={account} s={s} />
        </Row>
      ))}
    </ul>
  )
}

function PortfolioPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<{ status: string; snapshot: PortfolioSnapshot | null }>(
    () => aiApi.portfolio(),
    'portfolio',
  )
  if (loading) return <Loading />
  if (error) return <Failure s={s} message={error} retry={retry} />
  const snapshot = data?.snapshot
  if (!snapshot) {
    return (
      <AskEmpty
        s={s}
        text={s('emptyPortfolio')}
        prompt={s('portfolioPrompt')}
        navigate={navigate}
      />
    )
  }
  const display = (snapshot.display_currency ?? 'usd').toUpperCase()
  const primary = display === 'CNY' ? snapshot.totals.cny : snapshot.totals.usd
  const secondary =
    display === 'CNY'
      ? `${s('totalUsd')} ${fmtNum(snapshot.totals.usd, lang, 2)}`
      : `${s('totalCny')} ${fmtNum(snapshot.totals.cny, lang, 2)}`
  return (
    <div className="mt-4">
      <div className="panel p-4">
        <p className="text-[11px] text-muted">
          {s('total')} · {display}
        </p>
        <p className="num mt-1 text-[26px] leading-none font-semibold">
          {fmtNum(primary, lang, 2)}
        </p>
        <p className="num mt-2 text-[11px] text-muted">{secondary}</p>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        {snapshot.complete ? s('complete') : s('incomplete')} · {s('positions')}{' '}
        {fmtNum(snapshot.positions.length, lang, 0)} · {fmtDate(snapshot.created_at, lang)}
      </p>
      {snapshot.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] text-muted">
          {snapshot.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <AskAction
        s={s}
        onClick={() => {
          setIntake(s('portfolioPrompt'), [])
          navigate('/ai')
        }}
      />
    </div>
  )
}

function AlphasPanel({ s }: { s: S }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote(() => aiApi.alphas(60), 'alphas')
  if (loading) return <Loading />
  if (error) return <Failure s={s} message={error} retry={retry} />
  if (!data || data.alphas.length === 0) {
    return (
      <AskEmpty s={s} text={s('emptyAlphas')} prompt={s('startAlpha')} navigate={navigate} />
    )
  }
  return (
    <ul className="mt-4">
      {data.alphas.map((alpha: AlphaSummary) => {
        const title = alpha.nickname || alpha.theme.join(' · ') || alpha.id
        return (
          <Row key={alpha.id}>
            <p className="text-[13px] font-medium">{title}</p>
            <p className="t-sym mt-1 text-muted">{alpha.id}</p>
            <AskAction
              s={s}
              onClick={() => {
                setIntake(s('alphaPrompt').replace('{id}', alpha.id), [])
                navigate('/ai')
              }}
            />
          </Row>
        )
      })}
    </ul>
  )
}

const ROUTE_KIND_KEYS: Record<RouteStopKind, keyof WorkspaceStrings> = {
  screen: 'routeKindScreen',
  watchlist: 'routeKindWatchlist',
  strategy: 'routeKindStrategy',
  news: 'routeKindNews',
}

const ROUTE_SKIP_KEYS: Record<RouteSkipReason, keyof WorkspaceStrings> = {
  noScreens: 'routeSkipNoScreens',
  noWatchlists: 'routeSkipNoWatchlists',
  noStrategies: 'routeSkipNoStrategies',
  noNews: 'routeSkipNoNews',
}

function RouteRow({
  stop,
  readyIndex,
  walked,
  activeCount,
  s,
  lang,
}: {
  stop: RouteStop
  readyIndex: number | null
  walked: number | null
  activeCount: number
  s: S
  lang: 'zh' | 'en' | 'ar'
}) {
  const state =
    readyIndex === null
      ? 'skipped'
      : walked === null
        ? 'waiting'
        : readyIndex < walked
          ? 'done'
          : readyIndex === walked && walked < activeCount
            ? 'now'
            : 'done'
  const kindLabel = s(ROUTE_KIND_KEYS[stop.kind])
  const name = stop.name ?? kindLabel
  const detail =
    stop.status === 'skipped' && stop.skipReason
      ? s(ROUTE_SKIP_KEYS[stop.skipReason])
      : stop.kind === 'watchlist'
        ? s('routeSymbolsCount').replace('{n}', String(stop.count))
        : stop.kind === 'news'
          ? s('routeStoriesCount').replace('{n}', String(stop.count))
          : s('routeRulesCount').replace('{n}', String(stop.count))
  const stateLabel =
    state === 'now'
      ? s('routeNow')
      : state === 'done'
        ? s('routeDoneStop')
        : state === 'skipped'
          ? s('routeSkipped')
          : s('routeWaiting')

  return (
    <li className="flex items-start gap-2.5 border-t border-line py-2.5 first:border-t-0">
      <span className="num mt-0.5 w-4 shrink-0 text-[10px] text-muted" aria-hidden="true">
        {readyIndex === null ? '·' : readyIndex + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-[12px] font-medium">{name}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] leading-none ${
              state === 'now'
                ? 'bg-solid text-bg'
                : state === 'skipped'
                  ? 'text-muted opacity-60'
                  : 'text-muted'
            }`}
          >
            {stateLabel}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-muted">
          {name === kindLabel ? '' : `${kindLabel} · `}
          {detail}
        </p>
      </div>
      <span className="num mt-0.5 shrink-0 text-[10px] text-muted">
        {stop.nextStart === null ? s('none') : fmtClock(stop.nextStart, lang)}
      </span>
    </li>
  )
}

function RouteSheetPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const input = useMemo(() => readRouteInput(lang), [lang])
  const [now] = useState(() => Date.now())
  const sheet: RouteSheet = useMemo(() => buildRouteSheet(input, now), [input, now])
  const [walked, setWalked] = useState<number | null>(null)
  const reduced = useReducedMotion()
  const running = walked !== null && walked < sheet.activeCount
  const finished = walked !== null && walked >= sheet.activeCount

  useEffect(() => {
    if (walked === null || walked >= sheet.activeCount) return
    const timer = setTimeout(() => setWalked((value) => (value === null ? null : value + 1)), 650)
    return () => clearTimeout(timer)
  }, [walked, sheet.activeCount])

  let readyIndex = 0
  const rows = sheet.stops.map((stop) => {
    const index = stop.status === 'ready' ? readyIndex++ : null
    return { stop, readyIndex: index }
  })

  return (
    <section className="panel mt-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="t-section">{s('routeTitle')}</h3>
          <p className="mt-1 text-[11px] leading-snug text-muted">{s('routeHint')}</p>
        </div>
        <span className="num shrink-0 text-[11px] text-muted">
          {sheet.activeCount}/{sheet.stops.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>
          {s('routeNextStart')}{' '}
          <b className="num font-medium text-fg">{fmtDateTime(sheet.nextStart, lang)}</b>
        </span>
        {sheet.finishAt !== null && (
          <span>
            {s('routeFinishes')} <span className="num">{fmtClock(sheet.finishAt, lang)}</span>
          </span>
        )}
        <span className="num">
          {sheet.activeCount} {s('routeStops')}
        </span>
        {sheet.skippedCount > 0 && (
          <span className="num">
            {sheet.skippedCount} {s('routeSkipped')}
          </span>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          disabled={sheet.activeCount === 0 || running}
          onClick={() => setWalked(reduced ? sheet.activeCount : 0)}
          className="min-h-11 rounded-full bg-solid px-4 text-[12px] font-medium text-bg disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
        >
          {walked === null ? s('routeRun') : running ? s('routeWalking') : s('routeRunAgain')}
        </button>
      </div>

      <p
        role="status"
        className={finished ? 'mt-2 text-[11px] leading-snug text-muted' : 'sr-only'}
      >
        {running ? s('routeWalking') : finished ? s('routeDone') : ''}
      </p>

      <ol className="mt-2 border-t border-line">
        {rows.map(({ stop, readyIndex: index }) => (
          <RouteRow
            key={stop.id}
            stop={stop}
            readyIndex={index}
            walked={walked}
            activeCount={sheet.activeCount}
            s={s}
            lang={lang}
          />
        ))}
      </ol>

      <p className="mt-2 text-[10px] leading-snug text-muted">{s('routeDemoNote')}</p>
    </section>
  )
}

function ScheduledPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<ScheduledRun[]>(
    () => aiApi.scheduled(),
    'scheduled',
  )
  return (
    <>
      <RouteSheetPanel s={s} lang={lang} />
      <h3 className="t-section mt-8">{s('scheduledRuns')}</h3>
      {loading ? (
        <Loading />
      ) : error ? (
        <Failure s={s} message={error} retry={retry} />
      ) : !data || data.length === 0 ? (
        <AskEmpty s={s} text={s('emptyScheduled')} prompt={s('startSchedule')} navigate={navigate} />
      ) : (
        <ul className="mt-2">
          {data.map((job) => (
            <Row key={job.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{job.title || job.prompt}</p>
                  <p className="num mt-1 truncate text-[11px] text-muted">{job.schedule}</p>
                </div>
                <div className="shrink-0 text-end">
                  <StatusBadge s={s} status={job.status} />
                  <p className="num mt-1 text-[11px]">
                    {job.next_run_at ? fmtDate(job.next_run_at, lang) : s('none')}
                  </p>
                </div>
              </div>
              <AskAction
                s={s}
                onClick={() => {
                  setIntake(s('scheduledPrompt').replace('{id}', job.title || job.id), [])
                  navigate('/ai')
                }}
              />
            </Row>
          ))}
        </ul>
      )}
    </>
  )
}

function ModelPanel({ s }: { s: S }) {
  const { data, error, loading, retry } = useRemote<LlmSettings>(() => aiApi.llm(), 'model')
  if (loading) return <Loading />
  if (error) return <Failure s={s} message={error} retry={retry} />
  if (!data) return <EmptyState text={s('empty')} />
  const rows = [
    [s('provider'), data.provider],
    [s('modelName'), data.model_name],
    [s('baseUrl'), data.base_url],
    [s('auth'), data.api_key_configured ? s('yes') : s('no')],
  ]
  return (
    <>
      <dl className="mt-4 border-t border-line">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-line py-3"
          >
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="num min-w-0 break-all text-end text-[12px]">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] leading-snug text-muted">{s('modelSavedNote')}</p>
      <Link
        to="/ai/provider"
        className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[12px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {s('providerSettings')}
      </Link>
    </>
  )
}

function Tools({ s, navigate }: { s: S; navigate: (path: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState<{ filename: string; file_path: string } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function upload(next: File) {
    setUploading(true)
    setFile(next)
    setUploadError(null)
    try {
      const result = await aiApi.upload(next)
      setUploaded({ filename: result.filename, file_path: result.file_path })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : s('error'))
    } finally {
      setUploading(false)
    }
  }

  function prefill(prompt: string) {
    setIntake(prompt, [])
    navigate('/ai')
  }

  return (
    <section className="mt-10 border-t border-line pt-5">
      <h2 className="t-section">{s('tools')}</h2>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          const next = event.dataTransfer.files?.[0]
          if (next) void upload(next)
        }}
        className={`mt-3 rounded-[16px] border border-dashed p-3 transition-colors ${
          dragOver ? 'border-fg/40 bg-fg/5' : 'border-line'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0]
            if (next) void upload(next)
            event.target.value = ''
          }}
        />
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-11 items-center text-start text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
            >
              {uploading ? s('uploading') : s('upload')}
            </button>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              {uploading && file ? file.name : s('uploadDrag')}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted">{s('uploadHint')}</p>
      </div>
      {uploadError && (
        <p role="alert" className="mt-2 text-[11px]" style={{ color: 'var(--color-danger)' }}>
          {uploadError}
        </p>
      )}
      {uploaded && !uploading && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="min-w-0 text-muted">
            {s('uploaded')}: <span className="num break-all">{uploaded.filename}</span>
          </span>
          <button
            type="button"
            onClick={() =>
              prefill(
                s('filePrompt')
                  .replace('{name}', uploaded.filename)
                  .replace('{path}', uploaded.file_path),
              )
            }
            className="min-h-11 rounded-full bg-solid px-3 font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg active:opacity-80"
          >
            {s('askAi')}
          </button>
          <button
            type="button"
            aria-label={s('removeFile')}
            onClick={() => {
              setUploaded(null)
              setFile(null)
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['deepResearch', 'deepResearchPrompt'],
          ['swarm', 'swarmPrompt'],
          ['options', 'optionsPrompt'],
          ['correlation', 'correlationPrompt'],
        ].map(([label, prompt]) => (
          <button
            key={label}
            type="button"
            onClick={() => prefill(s(prompt as keyof WorkspaceStrings))}
            className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-fg/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s(label as keyof WorkspaceStrings)}
          </button>
        ))}
      </div>
    </section>
  )
}

export default function WorkspacePage() {
  const { lang, dir } = useI18n()
  const s = useStrings(strings)
  const navigate = useNavigate()
  const mode = useAiMode()
  const [tab, setTab] = useState<Tab>('runs')

  // Keep the selected chip in view; six labels do not fit a phone's content box.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-ws-tab="${tab}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [tab])

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/ai" />}>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{s('subtitle')}</p>

      {mode === 'demo' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] border border-line bg-surface px-3 py-2 text-[11px] leading-snug text-muted">
          <span>{s('demoNotice')}</span>
          <Link to="/ai/provider" className="text-fg underline decoration-line underline-offset-4">
            {s('providerSettings')}
          </Link>
        </div>
      )}

      <div
        role="tablist"
        aria-label={s('title')}
        className="fade-end mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
          event.preventDefault()
          const current = TABS.findIndex((item) => item.id === tab)
          const physical = event.key === 'ArrowRight' ? 1 : -1
          const step = dir === 'rtl' ? -physical : physical
          const next = TABS[(current + step + TABS.length) % TABS.length]
          setTab(next.id)
          requestAnimationFrame(() => {
            document.querySelector<HTMLElement>(`[data-ws-tab="${next.id}"]`)?.focus()
          })
        }}
      >
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="ws-panel"
              data-ws-tab={item.id}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(item.id)}
              className="min-h-11 min-w-11 shrink-0 rounded-full px-3 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              style={
                active
                  ? { background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }
                  : { color: 'var(--color-muted)' }
              }
            >
              {s(item.key)}
            </button>
          )
        })}
      </div>

      <div
        id="ws-panel"
        role="tabpanel"
        aria-label={s(TABS.find((item) => item.id === tab)?.key ?? 'runs')}
      >
        {tab === 'runs' && <RunsPanel s={s} lang={lang} />}
        {tab === 'paper' && <PaperPanel s={s} lang={lang} />}
        {tab === 'portfolio' && <PortfolioPanel s={s} lang={lang} />}
        {tab === 'alphas' && <AlphasPanel s={s} />}
        {tab === 'scheduled' && <ScheduledPanel s={s} lang={lang} />}
        {tab === 'model' && <ModelPanel s={s} />}
      </div>

      <Tools s={s} navigate={navigate} />
    </Screen>
  )
}
