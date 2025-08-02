'use client'

import React, { useState } from 'react'
import { DifficultySelector } from '@/components/dungeon/DifficultySelector'
import { DifficultyLevel, DIFFICULTY_SETTINGS, DIFFICULTY_DESCRIPTIONS } from '@/lib/types/difficulty-system'
import { DifficultyService } from '@/lib/services/difficulty.service'
import { SimpleBattleScreen } from '@/components/dungeon/SimpleBattleScreen'
import { getRandomMonsters } from '@/lib/data/monsters-enhanced'

export default function DifficultyTestPage() {
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('normal')
  const [showBattle, setShowBattle] = useState(false)
  const [playerLevel] = useState(30)
  const [dynamicEvents, setDynamicEvents] = useState<string[]>([])

  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    setCurrentDifficulty(difficulty)
    DifficultyService.setDifficulty(difficulty)
    setDynamicEvents(prev => [...prev, `난이도가 ${difficulty}로 변경됨`])
  }

  const startTestBattle = () => {
    setShowBattle(true)
  }

  const handleBattleEnd = (victory: boolean, hpRatio?: number) => {
    setShowBattle(false)
    
    // 동적 난이도 업데이트
    DifficultyService.updateDynamicDifficulty({
      type: victory ? 'victory' : 'death',
      playerLevel,
      recommendedLevel: 30
    })
    
    setDynamicEvents(prev => [...prev, 
      victory ? `승리! (남은 HP: ${Math.floor((hpRatio || 0) * 100)}%)` : '패배...'
    ])
  }

  // 테스트용 몬스터 생성
  const getTestEnemies = () => {
    const baseMonsters = getRandomMonsters('intermediate', 3, playerLevel)
    
    return baseMonsters.map((monster, index) => ({
      id: index,
      name: monster.name,
      emoji: monster.emoji,
      hp: monster.stats.hp,
      maxHp: monster.stats.hp,
      attack: monster.stats.attack,
      defense: monster.stats.defense,
      speed: monster.stats.speed || 1.0,
      specialAbility: monster.specialAbility,
      element: monster.stats.element,
      aiPattern: monster.aiPattern,
      statusEffects: [],
      statusResistance: 0
    })).map(enemy => DifficultyService.applyDifficultyToEnemy(enemy, currentDifficulty))
  }

  const currentModifiers = DIFFICULTY_SETTINGS[currentDifficulty]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">난이도 시스템 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 난이도 선택 */}
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">난이도 선택</h2>
            <DifficultySelector
              currentDifficulty={currentDifficulty}
              onDifficultyChange={handleDifficultyChange}
              playerLevel={playerLevel}
              recommendedLevel={30}
            />
          </div>
          
          {/* 현재 난이도 정보 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">현재 난이도 상세</h2>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-400">적 HP:</span>
                <span className="text-white">{(currentModifiers.enemyHpMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">적 공격력:</span>
                <span className="text-white">{(currentModifiers.enemyAttackMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">적 방어력:</span>
                <span className="text-white">{(currentModifiers.enemyDefenseMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">적 속도:</span>
                <span className="text-white">{(currentModifiers.enemySpeedMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">골드 보상:</span>
                <span className="text-yellow-400">{(currentModifiers.goldMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">아이템 드랍률:</span>
                <span className="text-green-400">{(currentModifiers.itemDropRateMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">경험치:</span>
                <span className="text-blue-400">{(currentModifiers.expMultiplier * 100).toFixed(0)}%</span>
                
                <span className="text-gray-400">플레이어 피해:</span>
                <span className={currentModifiers.playerDamageReduction > 0 ? "text-green-400" : "text-red-400"}>
                  {currentModifiers.playerDamageReduction > 0 ? '-' : '+'}{Math.abs(currentModifiers.playerDamageReduction * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-gray-400 mb-1">특수 기능:</p>
                <div className="space-y-1">
                  {currentModifiers.enableBossPhases && (
                    <p className="text-green-400">✓ 보스 페이즈 활성화</p>
                  )}
                  {currentModifiers.enableEliteMonsters && (
                    <p className="text-purple-400">✓ 엘리트 몬스터 출현 ({(currentModifiers.eliteMonsterChance * 100).toFixed(0)}%)</p>
                  )}
                  {currentModifiers.aiIntelligenceBonus > 0 && (
                    <p className="text-blue-400">✓ AI 지능 보너스 +{currentModifiers.aiIntelligenceBonus}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 테스트 전투 */}
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">전투 테스트</h2>
            <button
              onClick={startTestBattle}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              테스트 전투 시작
            </button>
            
            {/* 동적 난이도 이벤트 로그 */}
            {dynamicEvents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">이벤트 로그</h3>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {dynamicEvents.map((event, index) => (
                    <p key={index} className="text-gray-300">{event}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 테스트 몬스터 미리보기 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">테스트 몬스터 ({currentDifficulty})</h2>
            <div className="space-y-2">
              {getTestEnemies().map((enemy, index) => (
                <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {enemy.emoji} {enemy.name}
                      {enemy.isElite && (
                        <span 
                          className="ml-2 text-xs px-1 rounded"
                          style={{ backgroundColor: enemy.glowColor + '33', color: enemy.glowColor }}
                        >
                          엘리트
                        </span>
                      )}
                    </span>
                    <span className="text-gray-400">{enemy.element || 'normal'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-gray-400">
                    <span>HP: {enemy.hp}</span>
                    <span>공격: {enemy.attack}</span>
                    <span>방어: {enemy.defense}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 전투 화면 */}
      {showBattle && (
        <SimpleBattleScreen
          enemies={getTestEnemies().map(enemy => ({
            name: enemy.name,
            emoji: enemy.emoji,
            stats: {
              hp: enemy.hp,
              attack: enemy.attack,
              defense: enemy.defense,
              speed: enemy.speed,
              specialAbility: enemy.specialAbility,
              element: enemy.element
            },
            aiPattern: enemy.aiPattern
          }))}
          enemyLevel={playerLevel}
          playerLevel={playerLevel}
          onBattleEnd={handleBattleEnd}
          floorInfo={{
            currentFloor: 1,
            totalFloors: 1,
            dungeonName: '난이도 테스트'
          }}
        />
      )}
    </div>
  )
}