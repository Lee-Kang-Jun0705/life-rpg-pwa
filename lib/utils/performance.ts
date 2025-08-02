'use client'

// 성능 메트릭 수집
export interface PerformanceMetrics {
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
}

// Web Vitals 측정
export function measureWebVitals(onReport: (metrics: PerformanceMetrics) => void) {
  if (typeof window === 'undefined') {
    return
  }

  const metrics: PerformanceMetrics = {}

  // LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as { startTime: number }
        if (lastEntry) {
          metrics.lcp = lastEntry.startTime
          onReport({ ...metrics })
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: { entryType: string; processingStart: number; startTime: number }) => {
          if (entry.entryType === 'first-input') {
            metrics.fid = entry.processingStart - entry.startTime
            onReport({ ...metrics })
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: { hadRecentInput?: boolean; value: number }) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            metrics.cls = clsValue
            onReport({ ...metrics })
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: { name: string; startTime: number }) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime
            onReport({ ...metrics })
          }
        })
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch (error) {
      console.warn('Performance measurement failed:', error)
    }
  }

  // Navigation Timing API를 사용한 TTFB
  if ('performance' in window && 'timing' in window.performance) {
    const navigationTiming = performance.timing
    metrics.ttfb = navigationTiming.responseStart - navigationTiming.navigationStart
    onReport({ ...metrics })
  }
}

// 메모리 사용량 측정
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null
  }

  const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  }
}

// 프레임 레이트 측정
export function measureFPS(duration = 1000) {
  return new Promise<number>((resolve) => {
    let frames = 0
    const startTime = performance.now()

    function countFrames() {
      frames++
      const currentTime = performance.now()

      if (currentTime - startTime < duration) {
        requestAnimationFrame(countFrames)
      } else {
        const fps = Math.round((frames * 1000) / (currentTime - startTime))
        resolve(fps)
      }
    }

    requestAnimationFrame(countFrames)
  })
}

// 이미지 로딩 성능 측정
export function measureImageLoadTime(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now()
    const img = new Image()

    img.onload = () => {
      const loadTime = performance.now() - startTime
      resolve(loadTime)
    }

    img.onerror = () => {
      reject(new Error('Image failed to load'))
    }

    img.src = src
  })
}

// API 요청 성능 측정
export function measureApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T; duration: number }> {
  const startTime = performance.now()

  return apiCall().then(data => {
    const duration = performance.now() - startTime
    return { data, duration }
  })
}

// 연결 속도 측정
export function getConnectionSpeed() {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return null
  }

  const connection = (navigator as { connection?: { effectiveType: string; downlink: number; rtt: number; saveData: boolean } }).connection
  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // 밀리초
    saveData: connection.saveData // 데이터 절약 모드
  }
}

// 성능 점수 계산
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100

  // LCP 점수 (0-40점)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) {
      score -= 40
    } else if (metrics.lcp > 2500) {
      score -= 20
    } else if (metrics.lcp > 1200) {
      score -= 10
    }
  }

  // FID 점수 (0-30점)
  if (metrics.fid) {
    if (metrics.fid > 300) {
      score -= 30
    } else if (metrics.fid > 100) {
      score -= 15
    } else if (metrics.fid > 50) {
      score -= 5
    }
  }

  // CLS 점수 (0-20점)
  if (metrics.cls) {
    if (metrics.cls > 0.25) {
      score -= 20
    } else if (metrics.cls > 0.1) {
      score -= 10
    } else if (metrics.cls > 0.05) {
      score -= 5
    }
  }

  // FCP 점수 (0-10점)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) {
      score -= 10
    } else if (metrics.fcp > 1800) {
      score -= 5
    }
  }

  return Math.max(0, score)
}

// 성능 등급 계산
export function getPerformanceGrade(score: number): string {
  if (score >= 90) {
    return 'A'
  }
  if (score >= 80) {
    return 'B'
  }
  if (score >= 70) {
    return 'C'
  }
  if (score >= 60) {
    return 'D'
  }
  return 'F'
}

// 성능 개선 제안
export function getPerformanceSuggestions(metrics: PerformanceMetrics): string[] {
  const suggestions: string[] = []

  if (metrics.lcp && metrics.lcp > 2500) {
    suggestions.push('이미지 최적화 및 지연 로딩을 고려하세요')
    suggestions.push('중요한 리소스의 우선순위를 높이세요')
  }

  if (metrics.fid && metrics.fid > 100) {
    suggestions.push('JavaScript 번들 크기를 줄이세요')
    suggestions.push('코드 분할을 사용하세요')
  }

  if (metrics.cls && metrics.cls > 0.1) {
    suggestions.push('이미지와 광고에 명시적인 크기를 지정하세요')
    suggestions.push('동적 콘텐츠 삽입을 최소화하세요')
  }

  if (metrics.fcp && metrics.fcp > 1800) {
    suggestions.push('중요하지 않은 CSS를 지연 로딩하세요')
    suggestions.push('서버 응답 시간을 개선하세요')
  }

  return suggestions
}

// 성능 모니터링 훅
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') {
    return null
  }

  const metrics: PerformanceMetrics = {}

  measureWebVitals((newMetrics) => {
    Object.assign(metrics, newMetrics)
  })

  return {
    metrics,
    memoryUsage: getMemoryUsage(),
    connectionSpeed: getConnectionSpeed(),
    score: calculatePerformanceScore(metrics),
    grade: getPerformanceGrade(calculatePerformanceScore(metrics)),
    suggestions: getPerformanceSuggestions(metrics)
  }
}
