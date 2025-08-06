'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
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
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 커스텀 에러 핸들러 실행
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry, LogRocket 등의 서비스로 에러 전송
      this.reportError(error, errorInfo)
    }
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // 에러 리포팅 로직
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    }

    // 로컬 스토리지에 에러 로그 저장
    try {
      const existingErrors = localStorage.getItem('errorLogs')
      const errors = existingErrors ? JSON.parse(existingErrors) : []
      errors.push(errorData)
      // 최대 10개의 에러만 보관
      if (errors.length > 10) {
        errors.shift()
      }
      localStorage.setItem('errorLogs', JSON.stringify(errors))
    } catch (e) {
      console.error('Failed to save error log:', e)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // 페이지 새로고침
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
          <div className="max-w-md w-full bg-black/50 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-red-500/20">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              문제가 발생했습니다
            </h2>
            
            <p className="text-gray-300 text-center mb-6">
              예기치 않은 오류가 발생했습니다. 
              불편을 드려 죄송합니다.
            </p>

            {/* 개발 환경에서만 에러 세부사항 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.message}
                </p>
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-300">
                    스택 트레이스 보기
                  </summary>
                  <pre className="mt-2 overflow-auto max-h-40 text-xs">
                    {this.state.error.stack}
                  </pre>
                </details>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              페이지 새로고침
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              문제가 계속되면 관리자에게 문의해주세요
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook 버전의 Error Boundary 래퍼
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}