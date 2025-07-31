'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import type { Stat } from '@/lib/types/dashboard'

interface StatLevelDisplayProps {
  userStats: Stat[]
}

interface StatInfo {
  type: string
  name: string
  emoji: string
  color: string
  gradient: string
}

const STAT_INFO: Record<string, StatInfo> = {
  health: {
    type: 'health',
    name: '건강',
    emoji: '💪',
    color: '#FF6B6B',
    gradient: 'from-red-400 to-pink-400'
  },
  learning: {
    type: 'learning',
    name: '학습',
    emoji: '📚',
    color: '#4ECDC4',
    gradient: 'from-blue-400 to-cyan-400'
  },
  relationship: {
    type: 'relationship',
    name: '관계',
    emoji: '🤝',
    color: '#95E1D3',
    gradient: 'from-green-400 to-emerald-400'
  },
  achievement: {
    type: 'achievement',
    name: '성취',
    emoji: '🏆',
    color: '#FFD93D',
    gradient: 'from-yellow-400 to-orange-400'
  }
}

export function StatLevelDisplay({ userStats }: StatLevelDisplayProps) {
  const maxLevel = 100
  const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
  const averageLevel = totalLevel / 4

  // 원형 진행률 계산
  const calculateCircleProgress = (level: number) => {
    const radius = 60
    const circumference = 2 * Math.PI * radius
    const progress = (level / maxLevel) * 100
    const offset = circumference - (progress / 100) * circumference
    return { circumference, offset }
  }

  return (
    <div className="space-y-6">
      {/* 전체 스탯 요약 카드 */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <div className="text-6xl mb-2">⚔️</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              총 레벨 {totalLevel}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              평균 Lv.{averageLevel.toFixed(1)}
            </p>
          </motion.div>
        </div>
      </Card>

      {/* 개별 스탯 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {userStats.map((stat, index) => {
          const info = STAT_INFO[stat.type]
          const level = stat.level || 0
          const experience = stat.experience || 0
          const { circumference, offset } = calculateCircleProgress(level)
          const expProgress = (experience % 100)

          return (
            <motion.div
              key={stat.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden bg-gradient-to-br ${info.gradient} p-4`}>
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-8 -top-8 text-8xl rotate-12">{info.emoji}</div>
                </div>

                {/* 원형 프로그레스 - 모바일 최적화 */}
                <div className="relative z-10">
                  <div className="relative flex justify-center mb-3">
                    <svg width="120" height="120" className="transform -rotate-90">
                      {/* 배경 원 */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="10"
                        fill="none"
                      />
                      {/* 진행률 원 */}
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="white"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 - (level / maxLevel) * 2 * Math.PI * 50}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 - (level / maxLevel) * 2 * Math.PI * 50 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    {/* 중앙 컨텐츠 - SVG 밖에 배치 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl mb-1">{info.emoji}</div>
                      <div className="text-white text-xl font-bold">Lv.{level}</div>
                    </div>
                  </div>

                  {/* 스탯 이름 */}
                  <div className="text-center text-white">
                    <h4 className="text-lg font-bold mb-1">{info.name}</h4>
                    
                    {/* 경험치 바 */}
                    <div className="bg-white/30 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${expProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs mt-1 opacity-90 font-medium">
                      {expProgress}%
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* 스탯 비교 바 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">스탯 비교</h3>
        <div className="space-y-4">
          {userStats.map((stat, index) => {
            const info = STAT_INFO[stat.type]
            const level = stat.level || 0
            const percentage = (level / 10) * 100 // 10레벨 기준

            return (
              <motion.div
                key={stat.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-2xl w-8">{info.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{info.name}</span>
                    <span className="font-bold text-lg">Lv.{level}</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${info.gradient} flex items-center justify-end pr-2`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    >
                      {percentage >= 20 && (
                        <span className="text-white text-xs font-bold">
                          {level}/10
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}