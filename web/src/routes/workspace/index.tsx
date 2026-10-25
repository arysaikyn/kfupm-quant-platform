import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { EmptyState } from '../../components/states'
import { Screen } from '../../components/Screen'
import { fmtDate } from '../../i18n/format'
import { fmtNum, fmtPct, useI18n, useStrings } from '../../i18n'
import { aiApi } from '../../api/ai'
import type {
  AlphaSummary,
  LlmSettings,
  PaperAccount,
  PortfolioSnapshot,
  RunListItem,
  ScheduledRun,
} from '../../api/ai'
import { setIntake } from '../ai/intake'
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

function Loading({ s }: { s: S }) {
  return <p className="mt-6 text-[12px] text-muted">{s('loading')}</p>
}

function Failure({ s, message, retry }: { s: S; message: string; retry: () => void }) {
  return (
    <div role="alert" className="panel mt-4 border-danger/40 p-3">
      <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
        {message}
      </p>
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

function RunsPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<RunListItem[]>(() => aiApi.runs(), 'runs')
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
  if (!data || data.length === 0) return <EmptyState text={s('empty')} />
  return (
    <ul className="mt-4">
      {data.slice(0, 40).map((run) => (
        <Row key={run.run_id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="num truncate text-[13px] font-medium">{run.run_id}</p>
              <p className="mt-1 truncate text-[11px] text-muted">
                {run.prompt || run.codes?.join(' · ') || s('none')}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="text-[11px] text-muted">{run.status}</p>
              <p className="num mt-1 text-[12px]">{fmtDate(run.created_at, lang)}</p>
            </div>
          </div>
          {(run.total_return != null || run.sharpe != null) && (
            <div className="mt-2 flex gap-4 text-[11px]">
              {run.total_return != null && (
                <span>
                  {s('totalReturn')}{' '}
                  <b className="num">{fmtPct(run.total_return, lang, 1)}</b>
                </span>
              )}
              {run.sharpe != null && (
                <span>
                  {s('sharpe')} <b className="num">{fmtNum(run.sharpe, lang, 2)}</b>
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setIntake(s('runPrompt').replace('{id}', run.run_id), [])
              navigate('/ai')
            }}
            className="mt-2 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('askAi')}
          </button>
        </Row>
      ))}
    </ul>
  )
}

function PaperPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<PaperAccount[]>(
    () => aiApi.paperAccounts(),
    'paper',
  )
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
  if (!data || data.length === 0) return <EmptyState text={s('empty')} />
  return (
    <ul className="mt-4">
      {data.map((account) => (
        <Row key={account.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{account.label}</p>
              <p className="mt-1 text-[11px] text-muted">
                {account.market} · {account.currency} · {account.last_date || account.start_on}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="num text-[13px]">{fmtNum(account.account_state.cash, lang, 2)}</p>
              <p className="mt-1 text-[11px] text-muted">
                {s('positions')} {fmtNum(account.account_state.positions.length, lang, 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIntake(s('paperPrompt').replace('{id}', account.label), [])
              navigate('/ai')
            }}
            className="mt-2 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('askAi')}
          </button>
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
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
  const snapshot = data?.snapshot
  if (!snapshot) {
    return (
      <div className="mt-4">
        <EmptyState text={s('empty')} />
        <button
          type="button"
          onClick={() => {
            setIntake(s('portfolioPrompt'), [])
            navigate('/ai')
          }}
          className="mx-auto mt-2 flex min-h-11 items-center rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('askAi')}
        </button>
      </div>
    )
  }
  return (
    <div className="mt-4">
      <div className="panel grid grid-cols-2 gap-3 p-4">
        <div>
          <p className="text-[11px] text-muted">{s('totalUsd')}</p>
          <p className="num mt-1 text-[20px] font-semibold">{fmtNum(snapshot.totals.usd, lang, 2)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">{s('totalCny')}</p>
          <p className="num mt-1 text-[20px] font-semibold">{fmtNum(snapshot.totals.cny, lang, 2)}</p>
        </div>
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
      <button
        type="button"
        onClick={() => {
          setIntake(s('portfolioPrompt'), [])
          navigate('/ai')
        }}
        className="mt-3 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {s('askAi')}
      </button>
    </div>
  )
}

function AlphasPanel({ s }: { s: S }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote(() => aiApi.alphas(60), 'alphas')
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
  if (!data || data.alphas.length === 0) return <EmptyState text={s('empty')} />
  return (
    <ul className="mt-4">
      {data.alphas.map((alpha: AlphaSummary) => (
        <Row key={alpha.id}>
          <p className="num truncate text-[13px] font-medium">{alpha.id}</p>
          <p className="mt-1 text-[11px] text-muted">
            {alpha.zoo} · {alpha.universe.join(' / ')}
          </p>
          <button
            type="button"
            onClick={() => {
              setIntake(s('alphaPrompt').replace('{id}', alpha.id), [])
              navigate('/ai')
            }}
            className="mt-2 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('askAi')}
          </button>
        </Row>
      ))}
    </ul>
  )
}

function ScheduledPanel({ s, lang }: { s: S; lang: 'zh' | 'en' | 'ar' }) {
  const navigate = useNavigate()
  const { data, error, loading, retry } = useRemote<ScheduledRun[]>(
    () => aiApi.scheduled(),
    'scheduled',
  )
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
  if (!data || data.length === 0) return <EmptyState text={s('empty')} />
  return (
    <ul className="mt-4">
      {data.map((job) => (
        <Row key={job.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{job.title || job.prompt}</p>
              <p className="mt-1 truncate text-[11px] text-muted">{job.schedule}</p>
            </div>
            <div className="shrink-0 text-end">
              <p className="text-[11px] text-muted">{job.status}</p>
              <p className="num mt-1 text-[11px]">
                {job.next_run_at ? fmtDate(job.next_run_at, lang) : s('none')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIntake(s('scheduledPrompt').replace('{id}', job.title || job.id), [])
              navigate('/ai')
            }}
            className="mt-2 min-h-11 rounded-full border border-line px-3 text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('askAi')}
          </button>
        </Row>
      ))}
    </ul>
  )
}

function ModelPanel({ s }: { s: S }) {
  const { data, error, loading, retry } = useRemote<LlmSettings>(() => aiApi.llm(), 'model')
  if (loading) return <Loading s={s} />
  if (error) return <Failure s={s} message={s('error')} retry={retry} />
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
        <div key={label} className="flex items-start justify-between gap-4 border-b border-line py-3">
          <dt className="text-[11px] text-muted">{label}</dt>
          <dd className="num min-w-0 break-all text-end text-[12px]">{value}</dd>
        </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] leading-snug text-muted">{s('modelSavedNote')}</p>
    </>
  )
}

function Tools({ s, navigate }: { s: S; navigate: (path: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{ filename: string; file_path: string } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function upload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const result = await aiApi.upload(file)
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
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
        >
          {uploading ? s('loading') : s('upload')}
        </button>
        <button
          type="button"
          onClick={() => prefill(s('deepResearchPrompt'))}
          className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('deepResearch')}
        </button>
        <button
          type="button"
          onClick={() => prefill(s('swarmPrompt'))}
          className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('swarm')}
        </button>
        <button
          type="button"
          onClick={() => prefill(s('optionsPrompt'))}
          className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('options')}
        </button>
        <button
          type="button"
          onClick={() => prefill(s('correlationPrompt'))}
          className="min-h-11 rounded-full border border-line px-3 text-[12px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {s('correlation')}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted">{s('uploadHint')}</p>
      {uploadError && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--color-danger)' }}>
          {uploadError}
        </p>
      )}
      {uploaded && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-muted">
            {s('uploaded')}: <span className="num break-all">{uploaded.filename}</span>
          </span>
          <button
            type="button"
            onClick={() =>
              prefill(
                `Analyze the attached file.\nFilename: ${uploaded.filename}\nPath: ${uploaded.file_path}`,
              )
            }
            className="min-h-11 rounded-full border border-line px-3 text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {s('askAi')}
          </button>
        </div>
      )}
    </section>
  )
}

export default function WorkspacePage() {
  const { lang } = useI18n()
  const s = useStrings(strings)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('runs')

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/ai" />}>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{s('subtitle')}</p>

      <div
        role="tablist"
        aria-label={s('title')}
        className="fade-end mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
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

      <div role="tabpanel" aria-label={s(TABS.find((item) => item.id === tab)?.key ?? 'runs')}>
        {tab === 'runs' && <RunsPanel s={s} lang={lang} />}
        {tab === 'paper' && <PaperPanel s={s} lang={lang} />}
        {tab === 'portfolio' && <PortfolioPanel s={s} lang={lang} />}
        {tab === 'alphas' && <AlphasPanel s={s} />}
        {tab === 'scheduled' && <ScheduledPanel s={s} lang={lang} />}
        {tab === 'model' && <ModelPanel s={s} />}
      </div>

      <Link
        to="/ai"
        className="mt-8 flex min-h-12 items-center justify-center rounded-full border border-line px-4 text-[13px] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {s('back')}
      </Link>

      <Tools s={s} navigate={navigate} />
    </Screen>
  )
}
