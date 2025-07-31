/**
 * 성능 모니터링 유틸리티
 * 페이지 로드 시간, 컴포넌트 렌더링 시간, 메모리 사용량 등을 추적
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'navigation' | 'paint' | 'measure' | 'custom'
  unit?: string
}

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  /**
   * Performance Observer 초기화
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return

    try {
      // Navigation timing 관찰
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: Date.now(),
            type: 'navigation',
            unit: 'ms'
          })
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // Paint timing 관찰
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.startTime,
            timestamp: Date.now(),
            type: 'paint',
            unit: 'ms'
          })
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)

      // Measure timing 관찰
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: Date.now(),
            type: 'measure',
            unit: 'ms'
          })
        }
      })
      measureObserver.observe({ entryTypes: ['measure'] })
      this.observers.push(measureObserver)

    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // 100개를 초과하면 오래된 메트릭 제거
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * 커스텀 메트릭 기록
   */
  recordCustomMetric(name: string, value: number, unit = 'ms') {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'custom',
      unit
    })
  }

  /**
   * 시간 측정 시작
   */
  startMeasure(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`)
    }
  }

  /**
   * 시간 측정 종료
   */
  endMeasure(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error)
      }
    }
  }

  /**
   * 메모리 사용량 측정
   */
  getMemoryUsage(): MemoryInfo | null {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      }
    }
    return null
  }

  /**
   * Core Web Vitals 측정
   */
  getCoreWebVitals() {
    return new Promise<Record<string, number>>((resolve) => {
      const vitals: Record<string, number> = {}

      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        vitals.lcp = lastEntry.startTime
        lcpObserver.disconnect()
        
        if (Object.keys(vitals).length === 3) {
          resolve(vitals)
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstEntry = entries[0] as { startTime: number }
        vitals.fid = firstEntry.processingStart - firstEntry.startTime
        fidObserver.disconnect()
        
        if (Object.keys(vitals).length === 3) {
          resolve(vitals)
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as { value: number }).value
          }
        }
        vitals.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // 5초 후 CLS 값 반환
      setTimeout(() => {
        clsObserver.disconnect()
        vitals.cls = clsValue
        
        if (Object.keys(vitals).length >= 1) {
          resolve(vitals)
        }
      }, 5000)
    })
  }

  /**
   * 성능 리포트 생성
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      metrics: this.metrics,
      memory: this.getMemoryUsage(),
      navigation: this.getNavigationTiming(),
      paint: this.getPaintTiming()
    }

    return report
  }

  /**
   * Navigation timing 정보
   */
  private getNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance) return null

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!nav) return null

    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      loadComplete: nav.loadEventEnd - nav.loadEventStart,
      domainLookup: nav.domainLookupEnd - nav.domainLookupStart,
      connect: nav.connectEnd - nav.connectStart,
      request: nav.responseStart - nav.requestStart,
      response: nav.responseEnd - nav.responseStart,
      domProcessing: nav.domComplete - nav.responseEnd
    }
  }

  /**
   * Paint timing 정보
   */
  private getPaintTiming() {
    if (typeof window === 'undefined') return null

    const paintEntries = performance.getEntriesByType('paint')
    const timing: Record<string, number> = {}

    paintEntries.forEach(entry => {
      timing[entry.name] = entry.startTime
    })

    return timing
  }

  /**
   * 모든 observer 정리
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor()

// React Hook
export function usePerformanceMonitor() {
  const startMeasure = (name: string) => performanceMonitor.startMeasure(name)
  const endMeasure = (name: string) => performanceMonitor.endMeasure(name)
  const recordMetric = (name: string, value: number, unit?: string) => 
    performanceMonitor.recordCustomMetric(name, value, unit)

  return {
    startMeasure,
    endMeasure,
    recordMetric,
    getReport: () => performanceMonitor.generateReport(),
    getCoreWebVitals: () => performanceMonitor.getCoreWebVitals(),
    getMemoryUsage: () => performanceMonitor.getMemoryUsage()
  }
}