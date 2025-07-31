import { useEffect, useRef } from 'react'
import { PerformanceMonitor, VisibilityManager } from '@/lib/utils/performance-monitor'

interface PerformanceMetrics {
  activeTimers: number
  activeIntervals: number
  lastUpdate: number
}

export function usePerformanceMonitor(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    activeTimers: 0,
    activeIntervals: 0,
    lastUpdate: Date.now()
  })

  useEffect(() => {
    // 초기 상태 기록
    const initialCount = PerformanceMonitor.getActiveCount()
    console.log(`[${componentName}] Initial timers:`, initialCount)

    // 페이지 가시성 변경 처리
    VisibilityManager.onHidden(`${componentName}-pause`, () => {
      console.log(`[${componentName}] Page hidden - pausing timers`)
      PerformanceMonitor.cleanupComponent(componentName)
    })

    VisibilityManager.onVisible(`${componentName}-resume`, () => {
      console.log(`[${componentName}] Page visible - resuming`)
    })

    // 주기적 메트릭 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const metricsInterval = setInterval(() => {
        const current = PerformanceMonitor.getActiveCount()
        const now = Date.now()
        const timeDiff = now - metricsRef.current.lastUpdate

        if (current.timers !== metricsRef.current.activeTimers || 
            current.intervals !== metricsRef.current.activeIntervals) {
          console.log(`[${componentName}] Performance update:`, {
            timers: current.timers,
            intervals: current.intervals,
            timeSinceLastUpdate: `${timeDiff}ms`
          })

          metricsRef.current = {
            ...current,
            lastUpdate: now
          }
        }
      }, 5000) // 5초마다 체크

      return () => {
        clearInterval(metricsInterval)
        PerformanceMonitor.cleanupComponent(componentName)
        VisibilityManager.remove(`${componentName}-pause`)
        VisibilityManager.remove(`${componentName}-resume`)
        
        const finalCount = PerformanceMonitor.getActiveCount()
        console.log(`[${componentName}] Cleanup complete:`, finalCount)
      }
    }

    return () => {
      PerformanceMonitor.cleanupComponent(componentName)
      VisibilityManager.remove(`${componentName}-pause`)
      VisibilityManager.remove(`${componentName}-resume`)
    }
  }, [componentName])

  // 배터리 상태 모니터링
  useEffect(() => {
    if ('getBattery' in navigator && navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        console.log(`[${componentName}] Battery status:`, {
          level: `${(battery.level * 100).toFixed(1)}%`,
          charging: battery.charging
        })

        // 배터리가 20% 이하일 때 최적화 모드 활성화
        if (battery.level < 0.2 && !battery.charging) {
          console.log(`[${componentName}] Low battery detected - enabling optimization`)
          PerformanceMonitor.enableBatteryOptimization()
        }

        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2 && !battery.charging) {
            PerformanceMonitor.enableBatteryOptimization()
          }
        })
      })
    }
  }, [componentName])

  return {
    registerTimer: (id: string, callback: () => void, delay: number) => 
      PerformanceMonitor.registerTimer(`${componentName}-${id}`, callback, delay),
    registerInterval: (id: string, callback: () => void, interval: number) =>
      PerformanceMonitor.registerInterval(`${componentName}-${id}`, callback, interval),
    cleanup: () => PerformanceMonitor.cleanupComponent(componentName)
  }
}