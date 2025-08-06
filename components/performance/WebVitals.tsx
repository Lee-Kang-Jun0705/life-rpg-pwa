'use client'

import { useEffect } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

// 개발 환경에서만 콘솔에 로그
const logMetric = (metric: WebVitalsMetric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta
    })
  }
}

// 프로덕션에서는 분석 도구로 전송
const sendToAnalytics = (metric: WebVitalsMetric) => {
  // Google Analytics, Sentry, 또는 커스텀 분석 서비스로 전송
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true
    })
  }
}

export function WebVitals() {
  useEffect(() => {
    // 각 Web Vital 메트릭 추적
    onCLS((metric) => {
      logMetric(metric)
      sendToAnalytics(metric)
    })

    onFCP((metric) => {
      logMetric(metric)
      sendToAnalytics(metric)
    })

    onLCP((metric) => {
      logMetric(metric)
      sendToAnalytics(metric)
    })

    onTTFB((metric) => {
      logMetric(metric)
      sendToAnalytics(metric)
    })

    onINP((metric) => {
      logMetric(metric)
      sendToAnalytics(metric)
    })
  }, [])

  return null
}