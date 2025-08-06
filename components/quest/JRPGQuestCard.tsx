'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Lock, CheckCircle, Circle, Gift, Clock } from 'lucide-react'
import type { JRPGQuest, QuestProgress } from '@/lib/jrpg/quests-database'
import { QUEST_CATEGORY_STYLES, generateRewardPreview } from '@/lib/jrpg/quests-database'
import { ITEM_DATABASE } from '@/lib/jrpg/items-database'
import { cn } from '@/lib/utils'

interface JRPGQuestCardProps {
  quest: JRPGQuest
  progress?: QuestProgress
  onAccept?: () => void
  onClaim?: () => void
  onClick?: () => void
  selected?: boolean
  locked?: boolean
  lockReason?: string
}

export function JRPGQuestCard({
  quest,
  progress,
  onAccept,
  onClaim,
  onClick,
  selected,
  locked,
  lockReason
}: JRPGQuestCardProps) {
  const categoryStyle = QUEST_CATEGORY_STYLES[quest.category]
  const isActive = progress?.status === 'active'
  const isCompleted = progress?.status === 'completed'
  const isClaimed = progress?.status === 'claimed'
  
  // 진행률 계산
  const completionPercentage = progress ? 
    Math.round((progress.objectives.filter(obj => obj.completed).length / quest.objectives.length) * 100) : 0
  
  return (
    <motion.div
      whileHover={{ scale: locked ? 1 : 1.02 }}
      whileTap={{ scale: locked ? 1 : 0.98 }}
      className={cn(
        "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
        selected ? [
          "bg-gradient-to-br",
          categoryStyle.color,
          "border-white/50"
        ] : [
          categoryStyle.bgColor,
          categoryStyle.borderColor,
          "hover:border-white/30"
        ],
        locked && "opacity-50 cursor-not-allowed"
      )}
      onClick={!locked ? onClick : undefined}
    >
      {/* 카테고리 뱃지 */}
      <div className="absolute -top-2 -left-2">
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r",
          categoryStyle.color,
          "text-white shadow-lg"
        )}>
          {categoryStyle.icon} {quest.category === 'main' ? `챕터 ${quest.chapter}` : quest.category.toUpperCase()}
        </div>
      </div>
      
      {/* 잠금 아이콘 */}
      {locked && (
        <div className="absolute -top-2 -right-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
      
      {/* 퀘스트 정보 */}
      <div className="mt-2">
        <h3 className="font-bold text-white mb-1">{quest.name}</h3>
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{quest.description}</p>
        
        {/* 목표 목록 */}
        {(isActive || isCompleted) && progress && (
          <div className="space-y-1 mb-3">
            {quest.objectives.filter(obj => !obj.isHidden || progress.objectives.find(p => p.id === obj.id && p.current > 0)).map((objective, index) => {
              const objProgress = progress.objectives[index]
              return (
                <div key={objective.id} className="flex items-center gap-2 text-xs">
                  {objProgress.completed ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={objProgress.completed ? "text-gray-400 line-through" : "text-gray-300"}>
                    {objective.description}
                    {objective.quantity && (
                      <span className="ml-1 text-gray-500">
                        ({objProgress.current}/{objective.quantity})
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        
        {/* 보상 미리보기 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-400">
            <Gift className="w-3 h-3" />
            <span>{generateRewardPreview(quest.rewards)}</span>
          </div>
          
          {/* 진행률 또는 상태 */}
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-gray-400">{completionPercentage}%</span>
            </div>
          )}
          
          {isCompleted && (
            <span className="text-green-400 font-bold">완료!</span>
          )}
          
          {isClaimed && quest.isRepeatable && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>쿨다운</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 액션 버튼 */}
      {!locked && (
        <>
          {!progress && onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAccept()
              }}
              className="absolute bottom-2 right-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-bold"
            >
              수락
            </button>
          )}
          
          {isCompleted && onClaim && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClaim()
              }}
              className="absolute bottom-2 right-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded font-bold animate-pulse"
            >
              보상 수령
            </button>
          )}
        </>
      )}
      
      {/* 잠금 이유 툴팁 */}
      {locked && lockReason && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-gray-800 px-3 py-2 rounded text-xs text-gray-300 text-center max-w-[200px]">
            {lockReason}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// 퀘스트 상세 정보 모달
interface JRPGQuestDetailsProps {
  quest: JRPGQuest
  progress?: QuestProgress
  onClose: () => void
  onAccept?: () => void
  onClaim?: () => void
}

export function JRPGQuestDetails({
  quest,
  progress,
  onClose,
  onAccept,
  onClaim
}: JRPGQuestDetailsProps) {
  const categoryStyle = QUEST_CATEGORY_STYLES[quest.category]
  const isActive = progress?.status === 'active'
  const isCompleted = progress?.status === 'completed'
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* 헤더 */}
        <div className={cn(
          "p-6 bg-gradient-to-r",
          categoryStyle.color
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-bold text-white/80 mb-1">
                {categoryStyle.icon} {quest.category === 'main' ? `메인 퀘스트 - 챕터 ${quest.chapter}` : `${quest.category.toUpperCase()} 퀘스트`}
              </div>
              <h2 className="text-2xl font-bold text-white">{quest.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white rotate-90" />
            </button>
          </div>
        </div>
        
        {/* 내용 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 설명 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-2">퀘스트 설명</h3>
            <p className="text-gray-300">{quest.description}</p>
          </div>
          
          {/* 대화 */}
          {quest.dialogue && !progress && (
            <div className="mb-6 bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-2">대화</h3>
              <div className="space-y-2">
                {quest.dialogue.start.map((line, index) => (
                  <p key={index} className="text-gray-300 italic">"{line}"</p>
                ))}
              </div>
            </div>
          )}
          
          {/* 목표 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-2">목표</h3>
            <div className="space-y-2">
              {quest.objectives.filter(obj => !obj.isHidden || (progress && progress.objectives.find(p => p.id === obj.id && p.current > 0))).map((objective, index) => {
                const objProgress = progress?.objectives[index]
                return (
                  <div key={objective.id} className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
                    {objProgress?.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        objProgress?.completed ? "text-gray-400 line-through" : "text-white"
                      )}>
                        {objective.description}
                      </p>
                      {objective.quantity && objProgress && (
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                                style={{ width: `${(objProgress.current / objective.quantity) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {objProgress.current}/{objective.quantity}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* 보상 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-2">보상</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              {quest.rewards.exp > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <span className="text-gray-300">경험치 +{quest.rewards.exp}</span>
                </div>
              )}
              {quest.rewards.gold > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-gray-300">골드 +{quest.rewards.gold}</span>
                </div>
              )}
              {quest.rewards.items && quest.rewards.items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📦</span>
                    <span className="text-gray-300">아이템</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quest.rewards.items.map((item, index) => {
                      const itemDef = ITEM_DATABASE[item.itemId]
                      if (!itemDef) return null
                      return (
                        <div key={index} className="bg-gray-700 rounded p-2 text-center">
                          <div className="text-2xl mb-1">{itemDef.icon}</div>
                          <div className="text-xs text-gray-300">{itemDef.name}</div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">x{item.quantity}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {quest.rewards.title && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span className="text-gray-300">칭호: {quest.rewards.title}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 요구사항 */}
          {quest.requirements && (
            <div>
              <h3 className="text-lg font-bold text-white mb-2">요구사항</h3>
              <div className="space-y-1 text-sm">
                {quest.requirements.level && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span>• 레벨 {quest.requirements.level} 이상</span>
                  </div>
                )}
                {quest.requirements.questIds && quest.requirements.questIds.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span>• 선행 퀘스트 완료 필요</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 액션 버튼 */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
            >
              닫기
            </button>
            {!progress && onAccept && (
              <button
                onClick={onAccept}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
              >
                퀘스트 수락
              </button>
            )}
            {isCompleted && onClaim && (
              <button
                onClick={onClaim}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold animate-pulse"
              >
                보상 수령
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}