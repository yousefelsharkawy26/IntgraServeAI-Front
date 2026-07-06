import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--color-bg-base)] px-4 py-8 text-center">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] p-8 shadow-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            
            <h1 className="mt-6 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              An unexpected error occurred in the application view.
            </p>
            
            {this.state.error && (
              <div className="mt-4 overflow-x-auto rounded-lg bg-[var(--color-bg-base)] p-3 text-left">
                <pre className="font-mono text-xs text-red-500 overflow-x-auto max-w-full">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full rounded-lg bg-[var(--color-text-primary)] py-2 text-sm font-semibold text-[var(--color-bg-surface)] transition-all hover:opacity-90"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-lg border border-[var(--color-border-medium)] py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-base)]"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
