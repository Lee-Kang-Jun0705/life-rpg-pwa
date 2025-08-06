'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sword, Trophy, ChevronRight } from 'lucide-react'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { dbHelpers } from '@/lib/database/client'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'

// 간단한 던전 데이터
const SIMPLE_DUNGEONS = [
  {
    id: 1,
    name: '초보자의 숲',
    level: 1,
    description: '첫 모험을 시작하기 좋은 곳',
    difficulty: 'easy',
    rewards: { gold: 100, exp: 50 }
  },
  {
    id: 2,
    name: '고블린 동굴',
    level: 5,
    description: '고블린들이 숨어있는 어두운 동굴',
    difficulty: 'normal',
    rewards: { gold: 200, exp: 100 }
  },
  {
    id: 3,
    name: '버려진 광산',
    level: 10,
    description: '오래 전 버려진 위험한 광산',
    difficulty: 'hard',
    rewards: { gold: 400, exp: 200 }
  },
  {
    id: 4,
    name: '얼어붙은 호수',
    level: 15,
    description: '얼음 정령들이 서식하는 호수',
    difficulty: 'hard',
    rewards: { gold: 600, exp: 300 }
  }
]

export function SimpleDungeonTabFixed() {
  const [selectedDungeon, setSelectedDungeon] = useState<typeof SIMPLE_DUNGEONS[0] | null>(null)
  const [userLevel, setUserLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null)
  const battleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true
    
    const loadUserLevel = async () => {
      try {
        const stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        if (mounted && stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setUserLevel(level)
        }
      } catch (error) {
        console.error('Failed to load user level:', error)
        if (mounted) {
          setUserLevel(1) // 기본값
        }
      }
    }
    loadUserLevel()
    
    return () => {
      mounted = false
      if (battleTimerRef.current) {
        clearTimeout(battleTimerRef.current)
      }
    }
  }, [])

  const handleDungeonSelect = (dungeon: typeof SIMPLE_DUNGEONS[0]) => {
    setSelectedDungeon(dungeon)
    setBattleResult(null)
  }

  const handleStartBattle = async () => {
    if (!selectedDungeon) return
    
    setIsLoading(true)
    setBattleResult(null)
    
    // 이전 타이머 정리
    if (battleTimerRef.current) {
      clearTimeout(battleTimerRef.current)
    }
    
    // 간단한 전투 시뮬레이션
    battleTimerRef.current = setTimeout(() => {
      const levelDiff = userLevel - selectedDungeon.level
      const successChance = Math.min(0.9, Math.max(0.1, 0.5 + levelDiff * 0.1))
      const victory = Math.random() < successChance
      
      setBattleResult(victory ? 'victory' : 'defeat')
      setIsLoading(false)
      
      if (victory) {
        // 보상 처리 (실제로는 서비스 호출)
        console.log('Victory! Rewards:', selectedDungeon.rewards)
      }
      
      battleTimerRef.current = null
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {!selectedDungeon ? (
        <>
          <h2 className="text-xl font-bold text-white mb-4">던전 선택</h2>
          <div className="grid gap-3">
            {SIMPLE_DUNGEONS.map((dungeon) => (
              <motion.button
                key={dungeon.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDungeonSelect(dungeon)}
                className={`bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-4 text-left transition-all ${
                  userLevel < dungeon.level ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sword className="w-5 h-5 text-purple-400" />
                      {dungeon.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{dungeon.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        권장 레벨: {dungeon.level}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        dungeon.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        dungeon.difficulty === 'normal' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {dungeon.difficulty === 'easy' ? '쉬움' :
                         dungeon.difficulty === 'normal' ? '보통' : '어려움'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedDungeon(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 던전 목록으로
          </button>
          
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedDungeon.name}</h2>
            <p className="text-gray-400 mb-4">{selectedDungeon.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/30 rounded p-3">
                <p className="text-sm text-gray-400">권장 레벨</p>
                <p className="text-lg font-bold text-white">{selectedDungeon.level}</p>
              </div>
              <div className="bg-gray-700/30 rounded p-3">
                <p className="text-sm text-gray-400">내 레벨</p>
                <p className="text-lg font-bold text-white">{userLevel}</p>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded p-3 mb-6">
              <p className="text-sm text-gray-400 mb-2">예상 보상</p>
              <div className="flex gap-4">
                <span className="text-yellow-400">💰 {selectedDungeon.rewards.gold} 골드</span>
                <span className="text-blue-400">⭐ {selectedDungeon.rewards.exp} 경험치</span>
              </div>
            </div>
            
            {!battleResult && (
              <button
                onClick={handleStartBattle}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isLoading ? '전투 중...' : '전투 시작'}
              </button>
            )}
            
            {battleResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-lg text-center ${
                  battleResult === 'victory' 
                    ? 'bg-green-500/20 border border-green-500' 
                    : 'bg-red-500/20 border border-red-500'
                }`}
              >
                <Trophy className={`w-12 h-12 mx-auto mb-3 ${
                  battleResult === 'victory' ? 'text-green-400' : 'text-red-400'
                }`} />
                <h3 className="text-xl font-bold mb-2">
                  {battleResult === 'victory' ? '승리!' : '패배...'}
                </h3>
                {battleResult === 'victory' && (
                  <div className="text-sm space-y-1">
                    <p className="text-yellow-400">+{selectedDungeon.rewards.gold} 골드</p>
                    <p className="text-blue-400">+{selectedDungeon.rewards.exp} 경험치</p>
                  </div>
                )}
                <button
                  onClick={() => setSelectedDungeon(null)}
                  className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  확인
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}