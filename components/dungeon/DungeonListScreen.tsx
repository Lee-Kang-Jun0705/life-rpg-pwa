'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Dungeon, DungeonProgress } from '@/lib/types/dungeon'
import { dungeonService } from '@/lib/services/dungeon-service'
import { ImprovedDungeonList } from './ImprovedDungeonList'
import { dbHelpers } from '@/lib/database/client'
import { Sword, Shield } from 'lucide-react'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { GAME_CONFIG } from '@/lib/config/game-config'

interface DungeonListScreenProps {
  onSelectDungeon: (dungeon: Dungeon) => void
  userId: string
}

export function DungeonListScreen({ onSelectDungeon, userId }: DungeonListScreenProps) {
  const [dungeons, setDungeons] = useState<Dungeon[]>([])
  const [progress, setProgress] = useState<Map<string, DungeonProgress>>(new Map())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [playerLevel, setPlayerLevel] = useState(0)
  console.log('DungeonListScreen playerLevel:', playerLevel)

  useEffect(() => {
    // 병렬로 로드하여 성능 개선
    Promise.all([loadDungeons(), loadPlayerLevel()])
  }, [userId])

  const loadPlayerLevel = async () => {
    const defaultUserId = GAME_CONFIG.DEFAULT_USER_ID
    try {
      const stats = await dbHelpers.getStats(defaultUserId)
      if (stats && stats.length > 0) {
        const characterLevel = calculateCharacterLevel(stats)
        setPlayerLevel(characterLevel)
      }
    } catch (error) {
      console.error('Failed to load player level:', error)
      setPlayerLevel(0) // 기본값을 0으로 설정
    }
  }

  const loadDungeons = async () => {
    try {
      // 로딩을 나중에 설정하여 초기 렌더링 개선
      const allDungeons = await dungeonService.getDungeons()
      setDungeons(allDungeons)
      
      // 진행 상황은 비동기로 나중에 로드
      if (userId) {
        loadDungeonProgress(allDungeons)
      }
    } catch (error) {
      console.error('Failed to load dungeons:', error)
      // 기본 던전 데이터 설정
      setDungeons([])
    } finally {
      setLoading(false)
    }
  }

  const loadDungeonProgress = async (dungeons: Dungeon[]) => {
    try {
      const progressData = await dbHelpers.getAllDungeonProgress(userId)
      const progressMap = new Map<string, DungeonProgress>()
      
      progressData.forEach(dp => {
        progressMap.set(dp.dungeonId, {
          dungeonId: dp.dungeonId,
          stageId: '',
          status: dp.status as unknown,
          startTime: dp.lastAttemptAt || new Date(),
          currentStage: 1,
          totalStages: dungeons.find(d => d.id === dp.dungeonId)?.stages || 5,
          defeatedMonsters: 0,
          totalMonsters: 0,
          earnedExp: dp.rewards?.exp || 0,
          earnedGold: dp.rewards?.coins || 0,
          earnedItems: [],
          damageDealt: 0,
          damageTaken: 0,
          criticalHits: 0,
          skillsUsed: 0,
          completionTime: 0,
          survivedWithFullHP: false,
          usedNoConsumables: true,
          clearedStages: 0,
          isCleared: dp.status === 'completed'
        })
      })
      
      setProgress(progressMap)
    } catch (error) {
      console.error('Failed to load dungeon progress:', error)
    }
  }


  const filteredDungeons = dungeons.filter(dungeon => {
    if (selectedCategory === 'all') return true
    return dungeon.type === selectedCategory
  })

  const categories = ['all', 'story', 'daily', 'raid', 'special', 'challenge']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">던전 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 초컴팩트 헤더와 카테고리 필터 한 줄 통합 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-3 py-1.5 md:py-2"
      >
        <div className="flex items-center gap-2 md:gap-3">
          {/* 제목과 아이콘 */}
          <div className="flex items-center gap-2 min-w-fit">
            <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded">
              <Sword className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <h1 className="text-base md:text-lg font-bold text-white whitespace-nowrap">던전</h1>
          </div>

          {/* 카테고리 필터 - 같은 줄에 배치 */}
          <div className="flex gap-1 md:gap-1.5 overflow-x-auto">
            {categories.map(category => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 md:px-3 md:py-1.5 rounded md:rounded-md transition-all whitespace-nowrap text-[10px] md:text-xs ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {category === 'all' ? '전체' :
                 category === 'story' ? '스토리' :
                 category === 'daily' ? '일일' :
                 category === 'raid' ? '레이드' :
                 category === 'special' ? '특별' :
                 category === 'challenge' ? '도전' : category}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 개선된 던전 목록 */}
      <div className="mt-2">
        <ImprovedDungeonList 
          dungeons={filteredDungeons}
          onSelectDungeon={onSelectDungeon}
          playerLevel={playerLevel}
        />
      </div>

      {/* 빈 상태 */}
      {filteredDungeons.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 md:py-20"
        >
          <Shield className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 text-gray-600" />
          <p className="text-sm md:text-base text-gray-400">
            {selectedCategory === 'all' 
              ? '던전이 없습니다.' 
              : '해당 카테고리에 던전이 없습니다.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}