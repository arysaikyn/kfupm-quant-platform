import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Without this, one thrown error unmounts the root and the user gets a blank
 * page with no way back. A reload is the honest recovery for a UI this thin.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        role="alert"
        className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p className="text-[15px]">Something broke on this screen.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full px-5 py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          style={{ background: 'var(--color-accent-fill)', color: 'var(--color-bg)' }}
        >
          Reload
        </button>
      </div>
    )
  }
}
