import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from 'src/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error)
      console.error('Error info:', errorInfo)
    }

    // Send to error tracking service in production
    // To enable: set VITE_SENTRY_DSN environment variable and install @sentry/react.
    // Dynamic import is wrapped in vite-ignore so the bundler doesn't fail when
    // the package is absent from devDependencies.
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      const sentryModuleName = '@sentry/react'
      import(/* @vite-ignore */ sentryModuleName)
        .then((Sentry: { captureException: (e: unknown, ctx?: unknown) => void }) => {
          Sentry.captureException(error, {
            extra: { componentStack: errorInfo.componentStack },
          })
        })
        .catch(() => {
          /* Sentry not installed, silently ignore */
        })
    }

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Reload the page to reset state
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='flex justify-center items-center min-h-screen p-5 bg-gray-50 dark:bg-gray-900'>
          <div className='text-center max-w-md'>
            {/* Error Icon */}
            <div className='mb-6'>
              <svg className='w-24 h-24 mx-auto text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
              </svg>
            </div>

            {/* Title */}
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
              Something went wrong
            </h1>
            <h2 className='text-xl text-gray-600 dark:text-gray-400 mb-4'>
              დაფიქსირდა შეცდომა
            </h2>

            {/* Description */}
            <p className='text-gray-500 dark:text-gray-400 mb-8'>
              An unexpected error occurred. Please reload the page.
              <br />
              სამწუხაროდ, დაფიქსირდა მოულოდნელი შეცდომა. გთხოვთ, განაახლოთ გვერდი.
            </p>

            {/* Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                type='primary'
                onClick={this.handleReset}
                className='bg-black hover:bg-gray-800 border-black'
              >
                Reload Page / გვერდის განახლება
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
              >
                Go Home / მთავარ გვერდზე
              </Button>
            </div>

            {/* Dev Error Details */}
            {import.meta.env.DEV && this.state.error && (
              <div className='mt-8 text-left p-4 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                <p className='font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300'>
                  Error Details (Dev Only):
                </p>
                <p className='font-mono text-xs text-red-600 dark:text-red-400 mb-2'>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className='font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component to use hooks
const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  )
}

export default ErrorBoundary
