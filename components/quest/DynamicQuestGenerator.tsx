'use client'

import React, { useState, useEffect } from 'react'
import { DynamicQuest, DynamicQuestGenerationOptions } from '@/lib/types/dynamic-quest'
import { DynamicQuestService } from '@/lib/services/dynamic-quest.service'
import { PlayerBehaviorService } from '@/lib/services/player-behavior.service'
import { DynamicQuestCard } from './DynamicQuestCard'
import { RefreshCw, Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DynamicQuestGeneratorProps {
  userId: string
  onQuestAccept?: (quest: DynamicQuest) => void
}

export function DynamicQuestGenerator({
  userId,
  onQuestAccept
}: DynamicQuestGeneratorProps) {
  const [dynamicQuests, setDynamicQuests] = useState<DynamicQuest[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [playerPreferences, setPlayerPreferences] = useState<ReturnType<typeof PlayerBehaviorService.analyzePlayerPreferences> | null>(null)

  // 초기 로드
  useEffect(() => {
    loadDynamicQuests()
    analyzePlayer()
  }, [userId])

  const loadDynamicQuests = () => {
    const stored = localStorage.getItem(`dynamic-quests-${userId}`)
    if (stored) {
      const quests: DynamicQuest[] = JSON.parse(stored)
      // 만료되지 않은 퀘스트만 필터링
      const activeQuests = quests.filter(q => 
        q.status === 'available' && 
        new Date(q.expiresAt!) > new Date()
      )
      setDynamicQuests(activeQuests)
    }
  }

  const analyzePlayer = () => {
    const preferences = PlayerBehaviorService.analyzePlayerPreferences(userId)
    setPlayerPreferences(preferences)
  }

  const generateQuests = async (forceGeneration = false) => {
    setIsGenerating(true)
    
    try {
      const options: DynamicQuestGenerationOptions = {
        userId,
        maxQuests: 3,
        forceGeneration
      }
      
      const newQuests = await DynamicQuestService.generateDynamicQuests(options)
      setDynamicQuests(newQuests)
      setLastGenerated(new Date())
      
      // 플레이어 행동 기록
      PlayerBehaviorService.recordPlaySession(userId, {
        startTime: new Date(Date.now() - 1000),
        endTime: new Date()
      })
    } catch (error) {
      console.error('퀘스트 생성 실패:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptQuest = (questId: string) => {
    const quest = dynamicQuests.find(q => q.id === questId)
    if (quest) {
      // 퀘스트 수락 처리
      quest.status = 'in_progress'
      
      // 부모 컴포넌트에 전달
      if (onQuestAccept) {
        onQuestAccept(quest)
      }
      
      // 목록에서 제거
      setDynamicQuests(dynamicQuests.filter(q => q.id !== questId))
      
      // 행동 데이터 업데이트
      PlayerBehaviorService.updateProgression(userId, {
        questCompleted: false
      })
    }
  }

  const handleRejectQuest = (questId: string) => {
    // 퀘스트 거절
    DynamicQuestService.removeDynamicQuest(userId, questId)
    setDynamicQuests(dynamicQuests.filter(q => q.id !== questId))
  }

  // 재생성 가능 시간 계산
  const getRegenerationTime = () => {
    if (!lastGenerated) return 0
    
    const cooldown = 4 * 60 * 60 * 1000 // 4시간
    const elapsed = Date.now() - lastGenerated.getTime()
    const remaining = Math.max(0, cooldown - elapsed)
    
    return Math.ceil(remaining / (60 * 1000)) // 분 단위
  }

  const remainingMinutes = getRegenerationTime()
  const canRegenerate = remainingMinutes === 0

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">맞춤형 퀘스트</h2>
          </div>
          
          <button
            onClick={() => generateQuests(false)}
            disabled={!canRegenerate || isGenerating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded",
              "bg-purple-600 text-white font-semibold text-sm",
              "hover:bg-purple-700 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              isGenerating && "animate-spin"
            )} />
            {isGenerating ? '생성 중...' : '새로고침'}
          </button>
        </div>
        
        {/* 플레이어 분석 정보 */}
        {playerPreferences && (
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>주 활동: {playerPreferences.primaryCategory}</span>
            </div>
            <span>•</span>
            <span>플레이 스타일: {
              playerPreferences.playStyle === 'casual' ? '캐주얼' :
              playerPreferences.playStyle === 'regular' ? '일반' : '하드코어'
            }</span>
            {!canRegenerate && (
              <>
                <span>•</span>
                <span className="text-yellow-400">
                  재생성 가능: {remainingMinutes}분 후
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 동적 퀘스트 목록 */}
      {dynamicQuests.length > 0 ? (
        <div className="grid gap-4">
          {dynamicQuests.map(quest => (
            <DynamicQuestCard
              key={quest.id}
              quest={quest}
              onAccept={handleAcceptQuest}
              onReject={handleRejectQuest}
              disabled={isGenerating}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            {isGenerating ? '퀘스트를 생성하는 중...' : '생성된 퀘스트가 없습니다'}
          </p>
          {!isGenerating && (
            <button
              onClick={() => generateQuests(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              퀘스트 생성하기
            </button>
          )}
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
        <p className="flex items-start gap-2">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            동적 퀘스트는 당신의 플레이 스타일과 선호도를 분석하여 자동으로 생성됩니다. 
            매칭률이 높은 퀘스트일수록 더 나은 보상을 제공합니다.
          </span>
        </p>
      </div>
    </div>
  )
}