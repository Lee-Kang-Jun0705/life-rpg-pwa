'use client'

import React from 'react'
import type { Achievement, AchievementProgress } from '@/lib/types/achievements'
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DIFFICULTIES } from '@/lib/achievements/achievement-data'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Clock, Check, Zap, Coins, Crown, Gift, Calendar, Target } from 'lucide-react'

interface AchievementDetailModalProps {
  achievement: Achievement
  progress: AchievementProgress
  onClose: () => void
}

const difficultyColors = {
  easy: 'from-orange-400 to-orange-600',
  normal: 'from-gray-400 to-gray-600', 
  hard: 'from-yellow-400 to-yellow-600',
  expert: 'from-cyan-400 to-cyan-600',
  legendary: 'from-purple-400 to-purple-600'
}

export function AchievementDetailModal({ achievement, progress, onClose }: AchievementDetailModalProps) {
  const categoryInfo = ACHIEVEMENT_CATEGORIES[achievement.category]
  const difficultyInfo = ACHIEVEMENT_DIFFICULTIES[achievement.difficulty]
  const isUnlocked = achievement.isUnlocked

  return (
    <AnimatePresence>
      <motion.div
        initial={{ _opacity: 0 }}
        animate={{ _opacity: 1 }}
        exit={{ _opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, _opacity: 0 }}
          animate={{ scale: 1, _opacity: 1 }}
          exit={{ scale: 0.9, _opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className={`relative p-6 bg-gradient-to-br ${difficultyColors[achievement.difficulty]} text-white`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 상태 표시 */}
            <div className="absolute top-4 left-4">
              {isUnlocked ? (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-500/80 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  달성
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-500/80 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  진행중
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <div className="text-6xl mb-4">{achievement.icon}</div>
              <h2 className="text-3xl font-bold mb-2">{achievement.name}</h2>
              <div className="flex items-center justify-center gap-3 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  {categoryInfo.icon} {categoryInfo.name}
                </span>
                <span>•</span>
                <span>{difficultyInfo.name}</span>
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {/* 설명 */}
            <div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {achievement.description}
              </p>
            </div>

            {/* 진행도 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                진행도
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">현재 진행</span>
                  <span className="font-medium">
                    {isUnlocked ? '완료!' : `${progress.current} / ${progress.target}`}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${difficultyColors[achievement.difficulty]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {Math.floor(progress.percentage)}% 완료
                </div>

                {progress.lastUpdated && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>마지막 업데이트: {new Date(progress.lastUpdated).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 조건 */}
            <div>
              <h3 className="font-semibold mb-3">달성 조건</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-blue-800 dark:text-blue-200">
                  {getConditionDescription(achievement.condition)}
                </p>
              </div>
            </div>

            {/* 선행 조건 */}
            {achievement.prerequisites && achievement.prerequisites.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">선행 조건</h3>
                <div className="space-y-2">
                  {achievement.prerequisites.map(prereqId => (
                    <div key={prereqId} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>&ldquo;{prereqId}&rdquo; 업적 달성</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보상 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500" />
                보상
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievement.rewards.exp && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{achievement.rewards.exp} 경험치</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">모든 스탯에 분배</div>
                    </div>
                  </div>
                )}
                
                {achievement.rewards.gold && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <Coins className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{achievement.rewards.gold} 골드</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">즉시 지급</div>
                    </div>
                  </div>
                )}
                
                {achievement.rewards.title && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">칭호: {achievement.rewards.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">프로필에 표시</div>
                    </div>
                  </div>
                )}
                
                {achievement.rewards.items && achievement.rewards.items.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">아이템 {achievement.rewards.items.length}개</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {achievement.rewards.items.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
                
                {achievement.rewards.stat && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {achievement.rewards.stat.type} +{achievement.rewards.stat.value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">영구 스탯 증가</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 달성 정보 */}
            {isUnlocked && achievement.unlockedAt && (
              <div>
                <h3 className="font-semibold mb-3">달성 정보</h3>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(achievement.unlockedAt).toLocaleString()}에 달성</span>
                  </div>
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// 조건 설명 생성
function getConditionDescription(condition: Achievement['condition']): string {
  switch (condition.type) {
    case 'level_reach':
      return `레벨 ${condition.target}에 도달하세요`
    case 'monster_kill':
      if (condition.target) {
        return `${condition.target}을(를) ${condition.count}마리 처치하세요`
      }
      return `몬스터를 ${condition.count}마리 처치하세요`
    case 'boss_kill':
      return `보스 몬스터를 ${condition.count}마리 처치하세요`
    case 'battle_streak':
      return `${condition.count}연승을 달성하세요`
    case 'critical_hits':
      return `치명타를 ${condition.count}번 기록하세요`
    case 'dungeon_clear':
      return `던전을 ${condition.count}번 클리어하세요`
    case 'item_collect':
      return `아이템을 ${condition.count}개 수집하세요`
    case 'equipment_enhance':
      return `장비를 +${condition.target}까지 강화하세요`
    case 'daily_login':
      return `${condition.count}일 연속 로그인하세요`
    case 'daily_mission':
      return `일일 미션을 ${condition.count}개 완료하세요`
    case 'total_gold':
      return `골드 ${condition.target?.toLocaleString()}개를 보유하세요`
    case 'total_exp':
      return `총 경험치 ${condition.target?.toLocaleString()}을 획득하세요`
    default:
      return '특별한 조건을 만족하세요'
  }
}