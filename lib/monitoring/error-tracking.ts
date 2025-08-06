/**
 * 에러 추적 시스템
 * 리팩토링 중 발생하는 에러를 추적하고 보고
 */

interface ErrorReport {
  type: string
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  context?: Record<string, any>
}

interface ErrorTracker {
  track(error: ErrorReport): void
  flush(): Promise<void>
}

class LocalStorageErrorTracker implements ErrorTracker {
  private readonly storageKey = 'life-rpg-errors'
  private readonly maxErrors = 100
  private queue: ErrorReport[] = []
  private flushTimer: NodeJS.Timeout | null = null

  track(error: ErrorReport): void {
    this.queue.push(error)
    
    // 디바운스된 flush
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, 1000)
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    try {
      // 기존 에러 로드
      const existing = this.loadErrors()
      
      // 새 에러 추가
      const allErrors = [...existing, ...this.queue]
      
      // 최대 개수 제한
      const trimmedErrors = allErrors.slice(-this.maxErrors)
      
      // 저장
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedErrors))
      
      // 큐 비우기
      this.queue = []
      
      // 개발 환경에서 콘솔 출력
      if (process.env.NODE_ENV === 'development') {
        console.table(this.queue)
      }
    } catch (error) {
      console.error('Failed to save error reports:', error)
    }
  }

  private loadErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  getErrors(): ErrorReport[] {
    return this.loadErrors()
  }

  clearErrors(): void {
    localStorage.removeItem(this.storageKey)
    this.queue = []
  }
}

// 프로덕션에서는 실제 에러 추적 서비스 사용
class RemoteErrorTracker implements ErrorTracker {
  private readonly endpoint = process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT || ''
  private queue: ErrorReport[] = []
  private flushTimer: NodeJS.Timeout | null = null

  track(error: ErrorReport): void {
    this.queue.push(error)
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, 5000) // 5초마다 배치 전송
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.endpoint) return

    const errors = [...this.queue]
    this.queue = []

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors })
      })
    } catch (error) {
      console.error('Failed to send error reports:', error)
      // 실패한 에러는 다시 큐에 추가
      this.queue.unshift(...errors)
    }
  }
}

// 에러 추적 매니저
class ErrorTrackingManager {
  private trackers: ErrorTracker[] = []

  constructor() {
    // 로컬 스토리지 트래커는 항상 사용
    this.trackers.push(new LocalStorageErrorTracker())
    
    // 프로덕션에서는 원격 트래커도 사용
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
      this.trackers.push(new RemoteErrorTracker())
    }
  }

  track(error: Error | ErrorReport, context?: Record<string, any>): void {
    const report: ErrorReport = error instanceof Error ? {
      type: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      context
    } : error

    this.trackers.forEach(tracker => tracker.track(report))
  }

  async flush(): Promise<void> {
    await Promise.all(this.trackers.map(t => t.flush()))
  }

  getLocalErrors(): ErrorReport[] {
    const localTracker = this.trackers.find(t => t instanceof LocalStorageErrorTracker) as LocalStorageErrorTracker
    return localTracker ? localTracker.getErrors() : []
  }

  clearLocalErrors(): void {
    const localTracker = this.trackers.find(t => t instanceof LocalStorageErrorTracker) as LocalStorageErrorTracker
    if (localTracker) {
      localTracker.clearErrors()
    }
  }
}

// 싱글톤 인스턴스
export const errorTracking = new ErrorTrackingManager()

// 전역 에러 핸들러 설정
if (typeof window !== 'undefined') {
  // window.trackError 구현
  window.trackError = (error: any) => {
    errorTracking.track(error)
  }

  // 전역 에러 이벤트 리스너
  window.addEventListener('error', (event) => {
    errorTracking.track({
      type: 'window-error',
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.track({
      type: 'unhandled-rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  })

  // 페이지 언로드 시 에러 전송
  window.addEventListener('beforeunload', () => {
    errorTracking.flush()
  })
}