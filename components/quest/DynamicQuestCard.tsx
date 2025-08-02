'use client'

import React from 'react'
import { DynamicQuest } from '@/lib/types/dynamic-quest'
import { cn } from '@/lib/utils'
import { Clock, Zap, Target, Award, Sparkles } from 'lucide-react'

interface DynamicQuestCardProps {
  quest: DynamicQuest
  onAccept: (questId: string) => void
  onReject: (questId: string) => void
  disabled?: boolean
}

export function DynamicQuestCard({
  quest,
  onAccept,
  onReject,
  disabled = false
}: DynamicQuestCardProps) {
  // 남은 시간 계산
  const getTimeRemaining = () => {
    if (!quest.expiresAt) return ''
    
    const now = new Date()
    const expires = new Date(quest.expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return '만료됨'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}일 남음`
    }
    
    return `${hours}시간 ${minutes}분 남음`
  }

  // 퀘스트 타입별 색상
  const typeColors = {
    daily: 'bg-blue-500',
    weekly: 'bg-purple-500',
    event: 'bg-yellow-500',
    side: 'bg-green-500',
    main: 'bg-red-500'
  }

  // 카테고리별 아이콘
  const categoryIcons = {
    battle: '⚔️',
    collection: '📦',
    exploration: '🗺️',
    social: '👥',
    achievement: '🏆'
  }

  const matchScore = quest.adaptiveData?.playerMatchScore || 0
  const difficultyAdjustment = quest.adaptiveData?.difficultyAdjustment || 0

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-4",
        "bg-gradient-to-br from-gray-800 to-gray-900",
        "transition-all duration-300",
        matchScore > 80 ? "border-yellow-500 shadow-yellow-500/20" : "border-gray-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{
        boxShadow: matchScore > 80 ? '0 0 20px rgba(234, 179, 8, 0.2)' : undefined
      }}
    >
      {/* 동적 퀘스트 표시 */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-400">동적 퀘스트</span>
      </div>

      {/* 헤더 */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{categoryIcons[quest.category]}</span>
          <h3 className="font-bold text-lg text-white">{quest.title}</h3>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <span className={cn(
            "px-2 py-0.5 rounded",
            typeColors[quest.type]
          )}>
            {quest.type === 'daily' && '일일'}
            {quest.type === 'weekly' && '주간'}
            {quest.type === 'event' && '이벤트'}
            {quest.type === 'side' && '사이드'}
            {quest.type === 'main' && '메인'}
          </span>
          
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{getTimeRemaining()}</span>
          </div>
          
          {matchScore > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <Target className="w-3 h-3" />
              <span>{matchScore}% 매칭</span>
            </div>
          )}
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-300 mb-3">{quest.description}</p>

      {/* 목표 */}
      <div className="mb-3 space-y-1">
        <h4 className="text-sm font-semibold text-gray-400">목표</h4>
        {quest.objectives.map((obj) => (
          <div key={obj.id} className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">{obj.description}</span>
          </div>
        ))}
      </div>

      {/* 보상 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-1">보상</h4>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400">{quest.rewards.exp} EXP</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400">{quest.rewards.gold} Gold</span>
          </div>
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <span className="text-green-400">
              +{quest.rewards.items.length} 아이템
            </span>
          )}
        </div>
        
        {/* 난이도 조정 표시 */}
        {difficultyAdjustment !== 0 && (
          <div className="mt-1 text-xs text-gray-500">
            난이도 조정: {difficultyAdjustment > 0 ? '+' : ''}{(difficultyAdjustment * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(quest.id)}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-2 rounded font-semibold text-white",
            "bg-gradient-to-r from-blue-500 to-blue-600",
            "hover:from-blue-600 hover:to-blue-700",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          수락하기
        </button>
        
        <button
          onClick={() => onReject(quest.id)}
          disabled={disabled}
          className={cn(
            "px-4 py-2 rounded font-semibold",
            "border border-gray-600 text-gray-400",
            "hover:bg-gray-800 hover:text-gray-300",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          거절
        </button>
      </div>

      {/* 플레이어 매칭 인디케이터 */}
      {matchScore > 80 && (
        <div className="absolute -top-1 -right-1">
          <div className="relative">
            <div className="absolute inset-0 animate-ping bg-yellow-400 rounded-full opacity-75"></div>
            <div className="relative bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              추천!
            </div>
          </div>
        </div>
      )}
    </div>
  )
}