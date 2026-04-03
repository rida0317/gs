// src/components/ErrorBoundary.tsx - Global error boundary component
// 🔒 SECURITY: Error tracking with Sentry

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // 🔒 Send error to Sentry
    this.logErrorToSentry(error, errorInfo)
  }

  logErrorToSentry = (error: Error, errorInfo: ErrorInfo) => {
    // Send error to Sentry for monitoring
    Sentry.withScope((scope) => {
      scope.setTag('component', errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown')
      scope.setExtra('componentStack', errorInfo.componentStack)
      scope.setExtra('userAgent', navigator.userAgent)
      scope.setExtra('url', window.location.href)
      scope.setExtra('timestamp', new Date().toISOString())
      
      Sentry.captureException(error, {
        level: 'error',
      })
    })
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('🔍 Error captured by Sentry:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. Don't worry, your data is safe.
            </p>
            
            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={this.handleReload} className="btn btn-secondary">
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-outline"
              >
                Go to Dashboard
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary