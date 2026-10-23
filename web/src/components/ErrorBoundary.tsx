import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Called with the caught error and a reset function. */
  fallback: (error: Error, reset: () => void) => ReactNode
}

type State = { error: Error | null }

/**
 * Without this, one thrown error unmounts the root and the user gets a blank
 * page with no way back. A retry re-renders the subtree; a reload is the
 * honest last resort.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('render failed', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return this.props.fallback(this.state.error, this.reset)
  }
}
