'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { persistenceService } from '@/lib/services/persistence.service'
import { 
  Save, 
  Download, 
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Cloud
} from 'lucide-react'

interface SaveManagementProps {
  characterId?: string
}

export function SaveManagement({ characterId = 'player-1' }: SaveManagementProps) {
  const [saveStatus, setSaveStatus] = useState<{
    hasCharacterSave: boolean
    hasInventorySave: boolean
    hasSkillsSave: boolean
    lastSaveTime: Date | null
  }>({
    hasCharacterSave: false,
    hasInventorySave: false,
    hasSkillsSave: false,
    lastSaveTime: null
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    loadSaveStatus()
  }, [characterId])

  const loadSaveStatus = async () => {
    try {
      const status = await persistenceService.getSaveStatus(characterId)
      setSaveStatus(status)
    } catch (error) {
      console.error('Failed to load save status:', error)
    }
  }

  const handleManualSave = async () => {
    try {
      setIsLoading(true)
      setMessage(null)
      
      await persistenceService.saveAll(characterId)
      await loadSaveStatus()
      
      setMessage({ type: 'success', text: '게임이 성공적으로 저장되었습니다!' })
      
      // 전역 저장 이벤트 발생
      window.dispatchEvent(new Event('game-save'))
    } catch (error) {
      console.error('Save failed:', error)
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoad = async () => {
    try {
      setIsLoading(true)
      setMessage(null)
      
      const success = await persistenceService.loadAll(characterId)
      
      if (success) {
        setMessage({ type: 'success', text: '게임 데이터를 성공적으로 불러왔습니다!' })
        // 페이지 새로고침하여 로드된 데이터 반영
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'info', text: '불러올 저장 데이터가 없습니다.' })
      }
    } catch (error) {
      console.error('Load failed:', error)
      setMessage({ type: 'error', text: '불러오기 중 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSave = async () => {
    if (!confirm('정말로 저장된 데이터를 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)
      
      await persistenceService.deleteCharacterData(characterId)
      await loadSaveStatus()
      
      setMessage({ type: 'success', text: '저장 데이터가 삭제되었습니다.' })
    } catch (error) {
      console.error('Delete failed:', error)
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '저장된 데이터 없음'
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(date)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <HardDrive className="w-8 h-8 text-purple-500" />
        저장 데이터 관리
      </h2>

      {/* 저장 상태 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          저장 상태
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">마지막 저장 시간</span>
            <span className="font-medium">
              {formatDateTime(saveStatus.lastSaveTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">캐릭터 데이터</span>
            <span className="flex items-center gap-2">
              {saveStatus.hasCharacterSave ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">저장됨</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">없음</span>
                </>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">인벤토리 데이터</span>
            <span className="flex items-center gap-2">
              {saveStatus.hasInventorySave ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">저장됨</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">없음</span>
                </>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">스킬 데이터</span>
            <span className="flex items-center gap-2">
              {saveStatus.hasSkillsSave ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">저장됨</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">없음</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.button
          onClick={handleManualSave}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span className="font-medium">수동 저장</span>
        </motion.button>

        <motion.button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span className="font-medium">불러오기</span>
        </motion.button>

        <motion.button
          onClick={handleDeleteSave}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
          <span className="font-medium">데이터 삭제</span>
        </motion.button>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-600' :
            message.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* 정보 패널 */}
      <div className="bg-gray-800 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          자동 저장 정보
        </h3>
        <ul className="space-y-2 text-gray-400">
          <li>• 게임은 30초마다 자동으로 저장됩니다</li>
          <li>• 인벤토리나 스킬 변경 시 자동 저장됩니다</li>
          <li>• 브라우저를 닫거나 페이지를 나갈 때 자동 저장됩니다</li>
          <li>• 모든 데이터는 브라우저의 IndexedDB에 로컬 저장됩니다</li>
        </ul>
      </div>
    </div>
  )
}