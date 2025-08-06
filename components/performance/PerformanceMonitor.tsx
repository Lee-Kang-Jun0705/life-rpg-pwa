'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X } from 'lucide-react'

interface Metric {
  name: string
  value: number
  unit: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<Metric[]>([])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const newMetrics: Metric[] = []

      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          newMetrics.push({
            name: 'Page Load',
            value: navEntry.loadEventEnd - navEntry.fetchStart,
            unit: 'ms',
            rating: navEntry.loadEventEnd - navEntry.fetchStart < 3000 ? 'good' : 'poor'
          })
        }
      })

      setMetrics(prev => [...prev, ...newMetrics].slice(-10)) // 최근 10개만 유지
    })

    observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] })

    return () => observer.disconnect()
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        aria-label="성능 모니터 토글"
      >
        <Activity className="w-5 h-5" />
      </button>

      {/* 성능 모니터 패널 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 bottom-20 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Performance Monitor</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {metrics.length === 0 ? (
                <p className="text-gray-500 text-sm">측정된 메트릭이 없습니다</p>
              ) : (
                metrics.map((metric, index) => (
                  <div key={index} className="bg-gray-800 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm text-gray-300">{metric.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        metric.rating === 'good' 
                          ? 'bg-green-900 text-green-300'
                          : metric.rating === 'needs-improvement'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {metric.rating}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {metric.value.toFixed(0)}<span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                개발 환경에서만 표시됩니다
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}