'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: (error: Error, resetError: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스에 에러 전송
    console.error('Error caught by boundary:', error, errorInfo)

    // 개발 환경에서만 상세 정보 표시
    if (process.env.NODE_ENV === 'development') {
      this.setState({ errorInfo })
    }

    // 프로덕션 환경에서는 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // 예: Sentry, LogRocket 등으로 에러 전송
      // logErrorToService(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                앗! 문제가 발생했습니다
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    오류 상세 정보
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.error.stack && (
                      <>
                        {'\n\n'}
                        <strong>Stack Trace:</strong>
                        {'\n'}
                        {this.state.error.stack}
                      </>
                    )}
                    {this.state.errorInfo && (
                      <>
                        {'\n\n'}
                        <strong>Component Stack:</strong>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.resetError}
                  variant="default"
                >
                  다시 시도
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                >
                  홈으로 이동
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 특정 영역용 에러 바운더리 컴포넌트
export function SectionErrorBoundary({
  children,
  sectionName = '이 섹션',
  onError
}: {
  children: ReactNode
  sectionName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-red-600 dark:text-red-400">
                {sectionName}을 불러오는 중 문제가 발생했습니다.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-sm text-red-500 dark:text-red-500 mt-1">
                  {error.message}
                </p>
              )}
            </div>
            <Button
              onClick={resetError}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
