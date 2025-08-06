/**
 * 리팩토링 안전 가드
 * 새로운 구현에서 에러 발생 시 기존 구현으로 폴백
 */

import React from 'react'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface SafeGuardOptions {
  flagKey: string
  fallbackFunction: Function
  onError?: (error: Error) => void
  enableLogging?: boolean
}

/**
 * 리팩토링된 함수를 안전하게 실행하는 래퍼
 */
export function createSafeGuard<T extends (...args: any[]) => any>(
  newImplementation: T,
  options: SafeGuardOptions
): T {
  return ((...args: Parameters<T>) => {
    // Feature Flag 확인
    if (!isFeatureEnabled(options.flagKey)) {
      return options.fallbackFunction(...args)
    }

    try {
      // 새로운 구현 실행
      const result = newImplementation(...args)
      
      // Promise인 경우 에러 처리
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          handleError(error, options, args)
          return options.fallbackFunction(...args)
        })
      }
      
      return result
    } catch (error) {
      // 동기 에러 처리
      handleError(error as Error, options, args)
      return options.fallbackFunction(...args)
    }
  }) as T
}

/**
 * React 컴포넌트를 안전하게 렌더링하는 래퍼
 */
export function createComponentSafeGuard<P extends Record<string, any>>(
  NewComponent: React.ComponentType<P>,
  OldComponent: React.ComponentType<P>,
  flagKey: string
): React.ComponentType<P> {
  return (props: P) => {
    if (!isFeatureEnabled(flagKey)) {
      return <OldComponent {...props} />
    }

    // Error Boundary로 감싸서 반환
    return (
      <RefactoringErrorBoundary
        fallback={<OldComponent {...props} />}
        flagKey={flagKey}
      >
        <NewComponent {...props} />
      </RefactoringErrorBoundary>
    )
  }
}

/**
 * 리팩토링 전용 Error Boundary
 */
interface RefactoringErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
  flagKey: string
}

interface RefactoringErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class RefactoringErrorBoundary extends React.Component<
  RefactoringErrorBoundaryProps,
  RefactoringErrorBoundaryState
> {
  constructor(props: RefactoringErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Refactoring Error] Flag: ${this.props.flagKey}`, {
      error,
      errorInfo,
      timestamp: new Date().toISOString()
    })

    // 에러 추적 서비스로 전송 (예: Sentry)
    if (typeof window !== 'undefined' && window.trackError) {
      window.trackError({
        type: 'refactoring-error',
        flagKey: this.props.flagKey,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  render() {
    if (this.state.hasError) {
      console.warn(`[Refactoring] Falling back to old implementation for flag: ${this.props.flagKey}`)
      return this.props.fallback
    }

    return this.props.children
  }
}

/**
 * 에러 처리 헬퍼
 */
function handleError(
  error: Error,
  options: SafeGuardOptions,
  args: any[]
): void {
  if (options.enableLogging || process.env.NODE_ENV === 'development') {
    console.error(`[SafeGuard Error] Flag: ${options.flagKey}`, {
      error,
      args,
      timestamp: new Date().toISOString()
    })
  }

  if (options.onError) {
    options.onError(error)
  }

  // 에러 추적
  if (typeof window !== 'undefined' && window.trackError) {
    window.trackError({
      type: 'safeguard-error',
      flagKey: options.flagKey,
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 성능 모니터링 래퍼
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          logPerformance(name, startTime)
        })
      }
      
      logPerformance(name, startTime)
      return result
    } catch (error) {
      logPerformance(name, startTime, error as Error)
      throw error
    }
  }) as T
}

function logPerformance(name: string, startTime: number, error?: Error): void {
  const duration = performance.now() - startTime
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms ${error ? '(failed)' : ''}`)
  }

  // 성능 메트릭 수집
  if (typeof window !== 'undefined' && window.trackMetric) {
    window.trackMetric({
      name,
      duration,
      success: !error,
      timestamp: new Date().toISOString()
    })
  }
}

// 전역 타입 선언
declare global {
  interface Window {
    trackError?: (error: any) => void
    trackMetric?: (metric: any) => void
  }
}