import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface PerformanceMetrics {
  tabSwitchTime: number
  dataLoadTime: number
  renderTime: number
}

export function useAdventurePageMetrics() {
  const pathname = usePathname()
  const metricsRef = useRef<Partial<PerformanceMetrics>>({})
  const startTimeRef = useRef<number>(0)

  // 탭 전환 시간 측정
  const measureTabSwitch = (tabName: string) => {
    const endTime = performance.now()
    const switchTime = endTime - startTimeRef.current
    
    metricsRef.current.tabSwitchTime = switchTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Tab switch to ${tabName}: ${switchTime.toFixed(2)}ms`)
    }

    // 분석 도구로 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tab_switch', {
        event_category: 'Adventure Page',
        event_label: tabName,
        value: Math.round(switchTime),
        metric_name: 'tab_switch_time'
      })
    }
  }

  // 데이터 로드 시간 측정
  const measureDataLoad = (dataType: string, loadTime: number) => {
    metricsRef.current.dataLoadTime = loadTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Data load (${dataType}): ${loadTime.toFixed(2)}ms`)
    }

    // 분석 도구로 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'data_load', {
        event_category: 'Adventure Page',
        event_label: dataType,
        value: Math.round(loadTime),
        metric_name: 'data_load_time'
      })
    }
  }

  // 렌더링 시간 측정
  const measureRender = () => {
    // React DevTools Profiler API를 사용할 수도 있음
    const renderTime = performance.now() - startTimeRef.current
    metricsRef.current.renderTime = renderTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Page render: ${renderTime.toFixed(2)}ms`)
    }
  }

  // 탭 전환 시작 시간 기록
  const startTabSwitch = () => {
    startTimeRef.current = performance.now()
  }

  // 페이지 전체 성능 리포트
  const reportPageMetrics = () => {
    const metrics = metricsRef.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Adventure Page Metrics:', {
        tabSwitchTime: metrics.tabSwitchTime?.toFixed(2) + 'ms',
        dataLoadTime: metrics.dataLoadTime?.toFixed(2) + 'ms',
        renderTime: metrics.renderTime?.toFixed(2) + 'ms'
      })
    }

    // 종합 메트릭 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_performance', {
        event_category: 'Adventure Page',
        tab_switch_time: Math.round(metrics.tabSwitchTime || 0),
        data_load_time: Math.round(metrics.dataLoadTime || 0),
        render_time: Math.round(metrics.renderTime || 0)
      })
    }
  }

  // 페이지 이탈시 메트릭 리포트
  useEffect(() => {
    if (pathname === '/adventure') {
      startTimeRef.current = performance.now()
      
      return () => {
        reportPageMetrics()
      }
    }
  }, [pathname])

  return {
    startTabSwitch,
    measureTabSwitch,
    measureDataLoad,
    measureRender,
    reportPageMetrics
  }
}