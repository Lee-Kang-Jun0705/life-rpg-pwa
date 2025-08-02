'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Calendar, Award, Clock, Star, Zap, Target } from 'lucide-react'
import { leaderboardService } from '@/lib/services/leaderboard.service'
import type { LeaderboardCategory, PersonalRecord, LeaderboardStats } from '@/lib/services/leaderboard.service'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function PersonalLeaderboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<LeaderboardCategory[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboardData()
  }, [])

  const loadLeaderboardData = async() => {
    try {
      await leaderboardService.initialize()
      setCategories(leaderboardService.getCategories())
      setStats(await leaderboardService.getStats())
    } catch (error) {
      console.error('Failed to load leaderboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecordIcon = (record: PersonalRecord) => {
    if (record.icon) {
      return record.icon
    }

    const iconMap: Record<string, string> = {
      'highest_level': '📈',
      'max_daily_exp': '⭐',
      'activity_streak': '🔥',
      'dungeons_cleared': '🏰',
      'total_damage': '💥',
      'max_combo': '🎯',
      'total_monsters': '👾',
      'total_items': '🎁'
    }

    return iconMap[record.id] || '🏆'
  }

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      'level': 'from-purple-500 to-pink-500',
      'dungeon': 'from-blue-500 to-cyan-500',
      'combat': 'from-red-500 to-orange-500',
      'collection': 'from-green-500 to-emerald-500',
      'daily': 'from-yellow-500 to-amber-500',
      'achievement': 'from-indigo-500 to-purple-500'
    }
    return colors[categoryId] || 'from-gray-500 to-gray-600'
  }

  const formatValue = (record: PersonalRecord): string => {
    if (record.unit === '초') {
      const minutes = Math.floor(record.value / 60)
      const seconds = record.value % 60
      return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`
    }
    return `${record.value.toLocaleString()} ${record.unit}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const filteredRecords = selectedCategory === 'all'
    ? categories.flatMap(c => c.records)
    : categories.find(c => c.id === selectedCategory)?.records || []

  return (
    <div className="min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">개인 리더보드</h1>
            <p className="text-gray-400">나의 최고 기록과 성과를 확인하세요</p>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-xl p-4"
            >
              <Trophy className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalRecords}</div>
              <div className="text-sm text-purple-300">총 기록</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-xl p-4"
            >
              <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.categoriesWithRecords}</div>
              <div className="text-sm text-blue-300">달성 카테고리</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-orange-600/20 to-orange-500/20 rounded-xl p-4"
            >
              <Calendar className="w-6 h-6 text-orange-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.streakDays}</div>
              <div className="text-sm text-orange-300">연속 활동일</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-600/20 to-green-500/20 rounded-xl p-4"
            >
              <Award className="w-6 h-6 text-green-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.bestStreak}</div>
              <div className="text-sm text-green-300">최고 연속일</div>
            </motion.div>
          </div>
        )}

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            전체
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
              {category.records.length > 0 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  {category.records.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 최근 기록 */}
        {selectedCategory === 'all' && stats && stats.recentRecords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              최근 달성 기록
            </h2>
            <div className="grid gap-3">
              {stats.recentRecords.map(record => (
                <motion.div
                  key={`${record.category}-${record.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-3xl">{getRecordIcon(record)}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{record.name}</h3>
                    <p className="text-sm text-gray-400">
                      {format(new Date(record.achievedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {formatValue(record)}
                    </div>
                    {record.previousBest && (
                      <div className="text-xs text-green-400">
                        ▲ {record.previousBest} → {record.value}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리별 기록 */}
        {selectedCategory !== 'all' && (
          <div>
            {categories
              .filter(c => c.id === selectedCategory)
              .map(category => (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 bg-gradient-to-br ${getCategoryColor(category.id)} rounded-xl`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{category.name}</h2>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  </div>

                  {category.records.length > 0 ? (
                    <div className="grid gap-3">
                      {category.records.map(record => (
                        <motion.div
                          key={record.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">{getRecordIcon(record)}</div>
                            <div className="flex-1">
                              <h3 className="font-medium text-white">{record.name}</h3>
                              <p className="text-sm text-gray-400">
                                달성일: {format(new Date(record.achievedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">
                                {formatValue(record)}
                              </div>
                              {record.previousBest && (
                                <div className="text-sm text-gray-400">
                                  이전 기록: {record.previousBest} {record.unit}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 진행도 바 (이전 기록 대비) */}
                          {record.previousBest && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>이전</span>
                                <span>현재</span>
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(record.previousBest / record.value) * 100}%` }}
                                  className="h-full bg-gradient-to-r from-gray-500 to-gray-400"
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ delay: 0.3 }}
                                  className={`h-full bg-gradient-to-r ${getCategoryColor(category.id)} -mt-2`}
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4 opacity-20">🏆</div>
                      <p className="text-gray-500">아직 기록이 없습니다</p>
                      <p className="text-sm text-gray-600 mt-2">활동을 시작하여 기록을 만들어보세요!</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* 전체 보기에서 카테고리별 그룹 */}
        {selectedCategory === 'all' && (
          <div className="space-y-8">
            {categories
              .filter(c => c.records.length > 0)
              .map(category => (
                <div key={category.id}>
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h2>
                  <div className="grid gap-3">
                    {category.records.slice(0, 3).map(record => (
                      <motion.div
                        key={record.id}
                        whileHover={{ x: 4 }}
                        className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700/50 transition-all"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="text-2xl">{getRecordIcon(record)}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{record.name}</h3>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {formatValue(record)}
                        </div>
                      </motion.div>
                    ))}
                    {category.records.length > 3 && (
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className="text-center py-2 text-sm text-purple-400 hover:text-purple-300"
                      >
                        더보기 ({category.records.length - 3}개)
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
