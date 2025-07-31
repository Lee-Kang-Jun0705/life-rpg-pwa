'use client'

import { Quest } from '@/lib/types/quest'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Circle, Lock, Trophy, Clock, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestDetailsProps {
  quest: Quest
  onClose: () => void
  onAccept?: () => void
  onComplete?: () => void
  onClaim?: () => void
}

export function QuestDetails({ quest, onClose, onAccept, onComplete, onClaim }: QuestDetailsProps) {
  const canAccept = quest.status === 'available'
  const canComplete = quest.status === 'in_progress' && quest.objectives.every(obj => obj.completed)
  const canClaim = quest.status === 'completed'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 배경 오버레이 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
        />

        {/* 모달 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
        >
          {/* 헤더 */}
          <div className="relative p-6 border-b border-gray-700">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{quest.title}</h2>
                <p className="text-gray-400">{quest.description}</p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                quest.type === 'main' && "bg-gradient-to-r from-purple-500 to-pink-500",
                quest.type === 'daily' && "bg-gradient-to-r from-blue-500 to-cyan-500",
                quest.type === 'side' && "bg-gradient-to-r from-green-500 to-emerald-500",
                quest.type === 'event' && "bg-gradient-to-r from-red-500 to-rose-500",
                "text-white"
              )}>
                {quest.type === 'main' && '메인 퀘스트'}
                {quest.type === 'daily' && '일일 퀘스트'}
                {quest.type === 'side' && '사이드 퀘스트'}
                {quest.type === 'event' && '이벤트 퀘스트'}
              </div>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="p-6 space-y-6">
            {/* NPC 대화 */}
            {quest.dialogues && quest.status === 'available' && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💬</span>
                  <span className="text-sm font-medium text-gray-400">NPC 대화</span>
                </div>
                <div className="space-y-2">
                  {quest.dialogues.start.map((line, i) => (
                    <p key={i} className="text-gray-300 italic">"{line}"</p>
                  ))}
                </div>
              </div>
            )}

            {/* 목표 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                퀘스트 목표
              </h3>
              <div className="space-y-2">
                {quest.objectives.map(objective => (
                  <div
                    key={objective.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      objective.completed ? "bg-green-900/20" : "bg-gray-800/30"
                    )}
                  >
                    {objective.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        objective.completed ? "text-gray-400 line-through" : "text-white"
                      )}>
                        {objective.description}
                      </p>
                      {!objective.completed && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 transition-all"
                              style={{ width: `${(objective.current / objective.required) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {objective.current}/{objective.required}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 보상 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                보상
              </h3>
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-xl">✨</span>
                    <span className="text-white font-medium">{quest.rewards.exp} EXP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-xl">💰</span>
                    <span className="text-white font-medium">{quest.rewards.gold} Gold</span>
                  </div>
                </div>
                
                {quest.rewards.items && quest.rewards.items.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">아이템 보상:</p>
                    <div className="flex flex-wrap gap-2">
                      {quest.rewards.items.map((item, i) => (
                        <div key={i} className="bg-gray-700/50 px-3 py-1 rounded-lg text-sm text-gray-300">
                          {item.itemId} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {quest.rewards.titles && quest.rewards.titles.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">칭호 보상:</p>
                    <div className="flex flex-wrap gap-2">
                      {quest.rewards.titles.map((title, i) => (
                        <div key={i} className="bg-purple-500/20 border border-purple-500/50 px-3 py-1 rounded-lg text-sm text-purple-300">
                          {title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 요구사항 */}
            {quest.requirements && Object.keys(quest.requirements).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-500" />
                  요구사항
                </h3>
                <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                  {quest.requirements.level && (
                    <p className="text-sm text-gray-400">
                      레벨 {quest.requirements.level} 이상
                    </p>
                  )}
                  {quest.requirements.quests && quest.requirements.quests.length > 0 && (
                    <p className="text-sm text-gray-400">
                      선행 퀘스트: {quest.requirements.quests.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 시간 제한 */}
            {quest.timeLimit && quest.expiresAt && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  <p className="text-red-400 font-medium">
                    {new Date(quest.expiresAt).toLocaleString()} 까지
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="p-6 border-t border-gray-700">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                닫기
              </button>
              
              {canAccept && onAccept && (
                <button
                  onClick={onAccept}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  퀘스트 수락
                </button>
              )}
              
              {canComplete && onComplete && (
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  퀘스트 완료
                </button>
              )}
              
              {canClaim && onClaim && (
                <button
                  onClick={onClaim}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  보상 수령
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}