'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { persistenceService } from '@/lib/services/persistence.service'
import {
  Save,
  CloudOff,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

export function SaveLoadIndicator() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // 초기 저장 시간 로드
    loadLastSaveTime()

    // 저장 이벤트 리스너
    const handleSave = () => {
      setSaveStatus('saving')
      setShowStatus(true)

      setTimeout(() => {
        setSaveStatus('saved')
        loadLastSaveTime()

        setTimeout(() => {
          setShowStatus(false)
          setSaveStatus('idle')
        }, 2000)
      }, 500)
    }

    // 전역 저장 이벤트 리스너 (커스텀 이벤트)
    window.addEventListener('game-save', handleSave)

    return () => {
      window.removeEventListener('game-save', handleSave)
    }
  }, [])

  const loadLastSaveTime = async() => {
    const time = await persistenceService.getLastSaveTime('player-1')
    setLastSaveTime(time)
  }

  const handleManualSave = async() => {
    try {
      setSaveStatus('saving')
      setShowStatus(true)

      await persistenceService.saveAll('player-1')

      setSaveStatus('saved')
      await loadLastSaveTime()

      setTimeout(() => {
        setShowStatus(false)
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')

      setTimeout(() => {
        setShowStatus(false)
        setSaveStatus('idle')
      }, 3000)
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return '방금 전'
    }
    if (minutes < 60) {
      return `${minutes}분 전`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours}시간 전`
    }

    const days = Math.floor(hours / 24)
    return `${days}일 전`
  }

  return (
    <>
      {/* 고정 위치 저장 버튼 */}
      <motion.button
        onClick={handleManualSave}
        className="fixed bottom-4 left-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-colors z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={saveStatus === 'saving'}
        data-testid="manual-save-btn"
        aria-label={saveStatus === 'saving' ? '게임 저장 중' : '게임 수동 저장'}
        title={lastSaveTime ? `마지막 저장: ${formatTimeAgo(lastSaveTime)}` : '게임 수동 저장'}
      >
        {saveStatus === 'saving' ? (
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
        ) : (
          <Save className="w-5 h-5 text-gray-300" />
        )}
      </motion.button>

      {/* 저장 상태 표시 */}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 bg-gray-800 rounded-lg p-4 shadow-lg z-40"
            data-testid="save-status"
          >
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  <span>저장 중...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">저장 완료!</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">저장 실패</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 마지막 저장 시간 툴팁 */}
      {lastSaveTime && !showStatus && (
        <div className="fixed bottom-20 left-4 bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-40">
          마지막 저장: {formatTimeAgo(lastSaveTime)}
        </div>
      )}
    </>
  )
}

// 전역 저장 이벤트 발생 함수
export function triggerSave() {
  window.dispatchEvent(new Event('game-save'))
}
