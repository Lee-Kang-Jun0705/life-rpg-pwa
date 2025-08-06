'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, RotateCcw, Copy, Check } from 'lucide-react'
import { useFeatureFlagAdmin, useFeatureFlag } from '@/lib/feature-flags'
import { featureFlagConfig } from '@/lib/feature-flags/config'

/**
 * Feature Flag 디버그 패널
 * 개발 환경에서만 표시
 */
export function FeatureFlagPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const { flags, updateFlag, reset } = useFeatureFlagAdmin()
  const isDebugMode = useFeatureFlag('enable-debug-mode')

  // 개발 환경이 아니거나 디버그 모드가 비활성화된 경우 표시하지 않음
  if (process.env.NODE_ENV !== 'development' && !isDebugMode) {
    return null
  }

  const handleCopyConfig = () => {
    const config = Object.entries(flags)
      .map(([key, value]) => `NEXT_PUBLIC_FF_${key.toUpperCase().replace(/-/g, '_')}=${value}`)
      .join('\n')
    
    navigator.clipboard.writeText(config)
    setCopied('config')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyFlag = (flagKey: string, value: boolean) => {
    const envVar = `NEXT_PUBLIC_FF_${flagKey.toUpperCase().replace(/-/g, '_')}=${value}`
    navigator.clipboard.writeText(envVar)
    setCopied(flagKey)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.button
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Feature Flags"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 h-full w-96 bg-gray-900 text-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Feature Flags</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyConfig}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Copy all as env vars"
                >
                  {copied === 'config' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={reset}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Reset all flags"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 플래그 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(featureFlagConfig.flags).map(([key, flag]) => {
                const isEnabled = flags[key] ?? flag.defaultValue
                const hasOverride = flags[key] !== undefined && flags[key] !== flag.defaultValue

                return (
                  <div
                    key={key}
                    className={`bg-gray-800 rounded-lg p-4 ${hasOverride ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{flag.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{flag.description}</p>
                        <div className="flex gap-2 mt-2">
                          <code className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {key}
                          </code>
                          {flag.enabledEnvironments && (
                            <span className="text-xs text-gray-500">
                              {flag.enabledEnvironments.join(', ')}
                            </span>
                          )}
                          {flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100 && (
                            <span className="text-xs text-yellow-400">
                              {flag.rolloutPercentage}% rollout
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyFlag(key, isEnabled)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Copy as env var"
                        >
                          {copied === key ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isEnabled}
                            onChange={(e) => updateFlag(key, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* 의존성 표시 */}
                    {flag.dependencies && flag.dependencies.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Depends on: {flag.dependencies.join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="text-xs text-gray-400">
                <p>환경: {process.env.NODE_ENV}</p>
                <p>변경사항은 로컬 스토리지에 저장됩니다</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}