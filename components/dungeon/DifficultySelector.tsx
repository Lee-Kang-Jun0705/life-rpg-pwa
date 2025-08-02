'use client'

import React from 'react'
import { DifficultyLevel, DIFFICULTY_DESCRIPTIONS } from '@/lib/types/difficulty-system'
import { cn } from '@/lib/utils'

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel
  onDifficultyChange: (difficulty: DifficultyLevel) => void
  playerLevel: number
  recommendedLevel: number
  disabled?: boolean
}

export function DifficultySelector({
  currentDifficulty,
  onDifficultyChange,
  playerLevel,
  recommendedLevel,
  disabled = false
}: DifficultySelectorProps) {
  const difficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'expert', 'legendary']

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">난이도 선택</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {difficulties.map((difficulty) => {
          const difficultyInfo = DIFFICULTY_DESCRIPTIONS[difficulty]
          const isSelected = currentDifficulty === difficulty
          const levelRange = difficultyInfo.recommendedLevel
          
          // 권장 레벨 체크
          const [minLevel] = levelRange.split('-').map(l => parseInt(l) || 0)
          const isUnderleveled = playerLevel < minLevel - 5
          
          return (
            <button
              key={difficulty}
              onClick={() => onDifficultyChange(difficulty)}
              disabled={disabled || isUnderleveled}
              className={cn(
                "p-3 rounded-lg transition-all duration-200 flex flex-col items-center",
                "border-2",
                isSelected 
                  ? "border-white bg-opacity-30" 
                  : "border-transparent bg-opacity-10",
                isUnderleveled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-opacity-20 cursor-pointer",
                "backdrop-blur-sm"
              )}
              style={{
                backgroundColor: `${difficultyInfo.color}33`,
                borderColor: isSelected ? difficultyInfo.color : 'transparent'
              }}
            >
              <span 
                className="font-bold text-sm mb-1"
                style={{ color: difficultyInfo.color }}
              >
                {difficultyInfo.name}
              </span>
              <span className="text-xs text-gray-300">
                Lv.{levelRange}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* 선택된 난이도 설명 */}
      <div className="p-3 bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-300">
          {DIFFICULTY_DESCRIPTIONS[currentDifficulty].description}
        </p>
        
        {/* 레벨 경고 */}
        {playerLevel < recommendedLevel - 5 && (
          <p className="text-sm text-yellow-400 mt-2">
            ⚠️ 권장 레벨보다 {recommendedLevel - playerLevel}레벨 낮습니다!
          </p>
        )}
      </div>
      
      {/* 난이도별 보상 정보 */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <span className="text-gray-400">골드</span>
          <span className="block text-yellow-400">
            {getDifficultyMultiplier(currentDifficulty, 'gold')}x
          </span>
        </div>
        <div className="text-center">
          <span className="text-gray-400">아이템</span>
          <span className="block text-green-400">
            {getDifficultyMultiplier(currentDifficulty, 'item')}x
          </span>
        </div>
        <div className="text-center">
          <span className="text-gray-400">경험치</span>
          <span className="block text-blue-400">
            {getDifficultyMultiplier(currentDifficulty, 'exp')}x
          </span>
        </div>
      </div>
    </div>
  )
}

// 난이도별 보상 배율 표시
function getDifficultyMultiplier(difficulty: DifficultyLevel, type: 'gold' | 'item' | 'exp'): string {
  const multipliers = {
    easy: { gold: 0.8, item: 1.0, exp: 0.8 },
    normal: { gold: 1.0, item: 1.0, exp: 1.0 },
    hard: { gold: 1.5, item: 1.3, exp: 1.3 },
    expert: { gold: 2.0, item: 1.6, exp: 1.6 },
    legendary: { gold: 3.0, item: 2.0, exp: 2.0 }
  }
  
  return multipliers[difficulty][type].toFixed(1)
}