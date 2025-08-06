'use client'

import { motion } from 'framer-motion'
import { Difficulty, DIFFICULTY_MODIFIERS } from '@/lib/jrpg/types'

// 던전 타입 정의
export interface DungeonDefinition {
  id: string
  name: string
  description: string
  recommendedLevel: number
  floors: number
  monsters: string[]
  boss: string
  level?: number
}

// 던전 정의 (나중에 설정 파일로 이동 가능)
export const DUNGEONS: DungeonDefinition[] = [
  {
    id: 'beginner',
    name: '초보자의 숲',
    description: '초보 모험가를 위한 안전한 숲',
    recommendedLevel: 1,
    floors: 5,
    monsters: ['monster_001', 'monster_002'],
    boss: 'monster_003'
  },
  {
    id: 'cave',
    name: '어둠의 동굴',
    description: '위험한 몬스터가 서식하는 동굴',
    recommendedLevel: 5,
    floors: 7,
    monsters: ['monster_003', 'monster_004'],
    boss: 'monster_005'
  },
  {
    id: 'tower',
    name: '마법사의 탑',
    description: '강력한 마법 생물들이 지키는 탑',
    recommendedLevel: 10,
    floors: 10,
    monsters: ['monster_005', 'monster_006'],
    boss: 'monster_007'
  }
]

interface DungeonSelectorProps {
  characterLevel: number
  selectedDifficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
  onDungeonSelect: (dungeon: DungeonDefinition) => void
}

export function DungeonSelector({
  characterLevel,
  selectedDifficulty,
  onDifficultyChange,
  onDungeonSelect
}: DungeonSelectorProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">던전 탐험</h2>
      
      {/* 난이도 선택 */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-white mb-3">난이도 선택</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(Difficulty).map(diff => {
            const modifier = DIFFICULTY_MODIFIERS[diff]
            return (
              <button
                key={diff}
                onClick={() => onDifficultyChange(diff)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedDifficulty === diff
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="font-bold text-white mb-1">
                  {diff === Difficulty.EASY && '초급'}
                  {diff === Difficulty.NORMAL && '중급'}
                  {diff === Difficulty.HARD && '상급'}
                  {diff === Difficulty.NIGHTMARE && '악몽'}
                </div>
                <div className="text-xs text-gray-400">
                  <div>데미지: {Math.round(modifier.damageMultiplier * 100)}%</div>
                  <div>보상: {Math.round(modifier.rewardMultiplier * 100)}%</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 던전 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DUNGEONS.map(dungeon => (
          <motion.div
            key={dungeon.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => onDungeonSelect(dungeon)}
          >
            <h3 className="text-xl font-bold text-white mb-2">{dungeon.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{dungeon.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">권장 레벨</span>
                <span className={characterLevel >= dungeon.recommendedLevel ? 'text-green-400' : 'text-red-400'}>
                  Lv.{dungeon.recommendedLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">층수</span>
                <span className="text-white">{dungeon.floors}층</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}