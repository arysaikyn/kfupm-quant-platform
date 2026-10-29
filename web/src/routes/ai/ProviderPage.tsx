import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton } from '../../components/BackButton'
import { Screen } from '../../components/Screen'
import { aiApi } from '../../api/ai'
import { saveProviderMeta, setAiMode } from '../../lib/aiMode'
import { useAiMode, useProviderMeta } from '../../store/aiMode'
import { useStrings } from '../../i18n'
import { strings } from './providerStrings'

export default function ProviderPage() {
  const mode = useAiMode()
  const meta = useProviderMeta()
  const s = useStrings(strings)
  const [baseUrl, setBaseUrl] = useState(meta.baseUrl)
  const [model, setModel] = useState(meta.model)
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaved(false)
    if (!/^https?:\/\//i.test(baseUrl.trim())) {
      setError(s('invalidUrl'))
      return
    }
    if (!model.trim()) {
      setError(s('requiredModel'))
      return
    }
    if (mode === 'demo' && !apiKey.trim()) {
      setError(s('requiredKey'))
      return
    }
    setBusy(true)
    try {
      await aiApi.configureProvider({
        baseUrl: baseUrl.trim().replace(/\/+$/, ''),
        model: model.trim(),
        apiKey: apiKey.trim() || undefined,
      })
      saveProviderMeta({ baseUrl: baseUrl.trim().replace(/\/+$/, ''), model: model.trim() })
      setAiMode('live')
      setApiKey('')
      setSaved(true)
    } catch {
      setError(s('error'))
    } finally {
      setBusy(false)
    }
  }

  function demo() {
    setAiMode('demo')
    setSaved(false)
    setError('')
  }

  return (
    <Screen title={s('title')} leading={<BackButton fallback="/ai" />}>
      <div className="pt-3">
        <p className="text-md leading-relaxed text-muted">{s('lead')}</p>
        <div className="mt-4 inline-flex min-h-9 items-center rounded-full border border-line px-3 text-2xs text-muted">
          {mode === 'demo' ? s('demoMode') : s('liveMode')}
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
          <label className="block">
            <span className="text-xs font-medium">{s('baseUrl')}</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              dir="ltr"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://api.example.com/v1"
              className="mt-1.5 min-h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            />
            <span className="mt-1 block text-2xs leading-snug text-muted">{s('baseHint')}</span>
          </label>

          <label className="block">
            <span className="text-xs font-medium">{s('model')}</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              dir="ltr"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="gpt-4o-mini"
              className="mt-1.5 min-h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            />
            <span className="mt-1 block text-2xs leading-snug text-muted">{s('modelHint')}</span>
          </label>

          <label className="block">
            <span className="text-xs font-medium">{s('apiKey')}</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              dir="ltr"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={mode === 'live' ? s('keepKey') : 'sk-…'}
              className="mt-1.5 min-h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            />
            <span className="mt-1 block text-2xs leading-snug text-muted">{s('keyHint')}</span>
          </label>

          {error && (
            <p role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-xs text-fg">
              {s('saved')}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-solid text-md font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
          >
            {busy ? s('saving') : s('save')}
          </button>

          {mode === 'live' && (
            <button
              type="button"
              onClick={demo}
              className="flex min-h-11 w-full items-center justify-center rounded-full border border-line text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {s('useDemo')}
            </button>
          )}
        </form>

        <p className="mt-6 border-t border-line pt-4 text-2xs leading-relaxed text-muted">
          {s('demoNote')}
        </p>
        <p className="mt-2 text-2xs leading-relaxed text-muted">{s('privacy')}</p>
      </div>
    </Screen>
  )
}
