'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { Stat } from '@/lib/types/dashboard'

interface SimpleStatDisplayProps {
  userStats: Stat[]
}

const STAT_CONFIG = {
  health: {
    name: '건강',
    emoji: '💪',
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    barColor: 'bg-gradient-to-r from-red-400 to-pink-500',
    hexColor: '#ef4444',
    lightColor: '#fca5a5',
    darkColor: '#dc2626'
  },
  learning: {
    name: '학습',
    emoji: '📚',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    barColor: 'bg-gradient-to-r from-blue-400 to-cyan-500',
    hexColor: '#3b82f6',
    lightColor: '#93c5fd',
    darkColor: '#2563eb'
  },
  relationship: {
    name: '관계',
    emoji: '🤝',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    barColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
    hexColor: '#10b981',
    lightColor: '#86efac',
    darkColor: '#059669'
  },
  achievement: {
    name: '성취',
    emoji: '🏆',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    barColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    hexColor: '#f59e0b',
    lightColor: '#fcd34d',
    darkColor: '#d97706'
  }
}

type ViewMode = 'bars' | 'donuts'

export function SimpleStatDisplay({ userStats }: SimpleStatDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bars')
  const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
  const maxLevel = Math.max(...userStats.map(s => s.level || 0))
  const minLevel = Math.min(...userStats.map(s => s.level || 0))
  const avgLevel = totalLevel / 4
  const levelDiff = maxLevel - minLevel


  return (
    <div className="space-y-4">
      {/* 헤더 - 전체 레벨 표시 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl text-white shadow-lg"
      >
        <div className="text-5xl mb-2">⚔️</div>
        <h2 className="text-3xl font-black">총 레벨 {totalLevel}</h2>
        <p className="text-white/80">모든 스탯의 합</p>
      </motion.div>

      {/* 보기 모드 선택 */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setViewMode('bars')}
          className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
            viewMode === 'bars'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          <span className="text-lg mr-2">📊</span>
          바 차트
        </button>
        <button
          onClick={() => setViewMode('donuts')}
          className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
            viewMode === 'donuts'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
          }`}
        >
          <span className="text-lg mr-2">🍩</span>
          도넛 차트
        </button>
      </div>

      {/* 보기 모드에 따른 렐더링 */}
      {viewMode === 'bars' && (
        <div className="space-y-3">
          {userStats.map((stat, index) => {
            const config = STAT_CONFIG[stat.type as keyof typeof STAT_CONFIG]
            const level = stat.level || 0
            const experience = stat.experience || 0
            const expProgress = experience % 100
            const percentage = (level / 10) * 100 // 10레벨 기준

            return (
              <motion.div
                key={stat.type}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${config.bgColor} rounded-2xl p-5 shadow-lg`}
              >
                {/* 상단 정보 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{config.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold">{config.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {experience} EXP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black bg-gradient-to-r ${config.color} bg-clip-text text-transparent">
                    Lv.{level}
                    </div>
                    {level === maxLevel && level > 1 && (
                      <div className="text-xs text-orange-500 font-medium animate-pulse">
                      최고 레벨!
                      </div>
                    )}
                  </div>
                </div>

                {/* 레벨 진행 바 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                    <span>레벨 진행도</span>
                    <span>{Math.min(percentage, 100)}%</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-full ${config.barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>

                {/* 경험치 진행 바 */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                    <span>다음 레벨까지</span>
                    <span>{100 - expProgress} EXP</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-400 dark:bg-gray-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${expProgress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}


      {viewMode === 'donuts' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-rose-50 via-purple-50/30 to-indigo-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-800 rounded-3xl p-8 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            레벨 분포도
          </h3>

          {/* 도넛 차트 컨테이너 */}
          <div className="relative max-w-md mx-auto">
            {/* 메인 도넛 차트 */}
            <div className="relative aspect-square">
              <svg viewBox="0 0 400 400" className="w-full h-full transform -rotate-90">
                {/* 그라데이션 정의 */}
                <defs>
                  <filter id="donutShadow">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/>
                  </filter>
                  {userStats.map((stat, i) => {
                    const config = STAT_CONFIG[stat.type as keyof typeof STAT_CONFIG]
                    return (
                      <linearGradient key={i} id={`donutGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={config.lightColor} />
                        <stop offset="100%" stopColor={config.darkColor} />
                      </linearGradient>
                    )
                  })}
                </defs>

                {/* 배경 링 */}
                <circle
                  cx="200"
                  cy="200"
                  r="140"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="60"
                />

                {/* 스탯 섹션 */}
                {userStats.map((stat, index) => {
                  const config = STAT_CONFIG[stat.type as keyof typeof STAT_CONFIG]
                  const level = stat.level || 0
                  const percentage = (level / totalLevel) * 100
                  const circumference = 2 * Math.PI * 140
                  const offset = userStats.slice(0, index).reduce((sum, s) =>
                    sum + ((s.level || 0) / totalLevel) * 100, 0
                  )

                  return (
                    <motion.circle
                      key={index}
                      cx="200"
                      cy="200"
                      r="140"
                      fill="none"
                      stroke={`url(#donutGrad${index})`}
                      strokeWidth="60"
                      strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                      strokeDashoffset={`${-(offset / 100) * circumference}`}
                      initial={{ strokeDashoffset: 0, opacity: 0 }}
                      animate={{
                        strokeDashoffset: `${-(offset / 100) * circumference}`,
                        opacity: 1
                      }}
                      transition={{
                        duration: 1,
                        delay: index * 0.2,
                        ease: 'easeInOut'
                      }}
                      filter="url(#donutShadow)"
                      className="cursor-pointer hover:brightness-110 transition-all"
                    />
                  )
                })}

                {/* 섹션 구분선 */}
                {userStats.map((stat, index) => {
                  const offset = userStats.slice(0, index).reduce((sum, s) =>
                    sum + ((s.level || 0) / totalLevel) * 360, 0
                  )
                  const angle = offset * Math.PI / 180
                  const x1 = 200 + 110 * Math.cos(angle)
                  const y1 = 200 + 110 * Math.sin(angle)
                  const x2 = 200 + 170 * Math.cos(angle)
                  const y2 = 200 + 170 * Math.sin(angle)

                  return (
                    <line
                      key={`line-${index}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="white"
                      strokeWidth="3"
                    />
                  )
                })}
              </svg>

              {/* 중앙 정보 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="bg-white dark:bg-gray-800 rounded-full p-8 shadow-inner"
                >
                  <div className="text-center">
                    <div className="text-6xl font-black bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {totalLevel}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      총 레벨
                    </div>
                    <div className="mt-2">
                      <div className="text-4xl">
                        {levelDiff <= 2 ? '🌟' : levelDiff <= 4 ? '⭐' : '💫'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {levelDiff <= 2 ? '완벽함' : levelDiff <= 4 ? '양호함' : '노력 필요'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 범례 */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {userStats.map((stat, i) => {
                const config = STAT_CONFIG[stat.type as keyof typeof STAT_CONFIG]
                const level = stat.level || 0
                const percentage = (level / totalLevel * 100).toFixed(1)

                return (
                  <motion.div
                    key={i}
                    initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${config.lightColor}, ${config.darkColor})` }}
                        >
                          <span className="text-2xl">{config.emoji}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {config.name}
                          </span>
                          <span className="text-2xl font-bold" style={{ color: config.hexColor }}>
                            {level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${config.lightColor}, ${config.darkColor})` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 하단 인사이트 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full px-6 py-3 shadow-lg">
              <span className="text-2xl">💡</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  가장 높은 스탯: {STAT_CONFIG[userStats.reduce((max, stat) =>
                    (stat.level || 0) > (max.level || 0) ? stat : max
                  ).type as keyof typeof STAT_CONFIG].name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {levelDiff > 2 ? '다른 스탯도 함께 키워보세요!' : '훌륭한 균형을 유지하고 있어요!'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 기존 균형 분석 - 모든 모드에서 표시 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5"
      >
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          상세 분석
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">최고 레벨</div>
            <div className="text-2xl font-bold">
              {STAT_CONFIG[userStats.reduce((max, stat) =>
                (stat.level || 1) > (max.level || 1) ? stat : max
              ).type as keyof typeof STAT_CONFIG].emoji} {maxLevel}
            </div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">최저 레벨</div>
            <div className="text-2xl font-bold">
              {STAT_CONFIG[userStats.reduce((min, stat) =>
                (stat.level || 0) < (min.level || 0) ? stat : min
              ).type as keyof typeof STAT_CONFIG].emoji} {minLevel}
            </div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">평균 레벨</div>
            <div className="text-2xl font-bold">{avgLevel.toFixed(1)}</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">레벨 차이</div>
            <div className={`text-2xl font-bold ${
              levelDiff <= 2 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {levelDiff}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
