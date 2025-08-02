'use client'

import React, { useState } from 'react'
import { SimpleBattleScreen } from '@/components/dungeon/SimpleBattleScreen'
import { BossData } from '@/lib/types/boss-system'
import { StatusEffectManager } from '@/lib/services/status-effect.service'
import { StatusEffectDisplay } from '@/components/battle/StatusEffectDisplay'
import { createStatusEffect } from '@/lib/types/status-effects'

export default function StatusEffectTestPage() {
  const [showBattle, setShowBattle] = useState(false)
  const [showStatusDemo, setShowStatusDemo] = useState(false)
  const [demoStatusManager] = useState(() => new StatusEffectManager())
  const [demoEffects, setDemoEffects] = useState<ReturnType<typeof createStatusEffect>[]>([])

  // 상태이상을 가진 테스트 몬스터들
  const testEnemies = [
    {
      name: '독 거미',
      emoji: '🕷️',
      stats: {
        hp: 50,
        attack: 8,
        defense: 3,
        speed: 1.2,
        specialAbility: 'poison',
        element: 'dark' as const
      },
      aiPattern: 'aggressive' as const
    },
    {
      name: '화염 정령',
      emoji: '🔥',
      stats: {
        hp: 60,
        attack: 10,
        defense: 5,
        speed: 0.9,
        specialAbility: 'fireBreath',
        element: 'fire' as const
      },
      aiPattern: 'berserker' as const
    },
    {
      name: '얼음 마법사',
      emoji: '🧙‍♂️',
      stats: {
        hp: 40,
        attack: 12,
        defense: 2,
        speed: 1.1,
        specialAbility: 'freeze',
        element: 'ice' as const
      },
      aiPattern: 'tactician' as const
    },
    {
      name: '번개 드레이크',
      emoji: '⚡',
      stats: {
        hp: 70,
        attack: 15,
        defense: 7,
        speed: 1.5,
        specialAbility: 'thunderStrike',
        element: 'electric' as const
      },
      aiPattern: 'balanced' as const
    }
  ]

  const handleBattleEnd = (victory: boolean, hpRatio?: number) => {
    console.log('전투 종료:', victory ? '승리' : '패배', '남은 HP 비율:', hpRatio)
    setShowBattle(false)
  }

  const addRandomStatus = () => {
    const statusTypes = ['poison', 'burn', 'freeze', 'paralysis', 'silence', 'blind', 'confusion', 'sleep', 'curse', 'fear'] as const
    const randomType = statusTypes[Math.floor(Math.random() * statusTypes.length)]
    
    const applied = demoStatusManager.addStatusEffect(randomType, undefined, 1, 0, 100)
    if (applied) {
      setDemoEffects(demoStatusManager.getActiveEffects())
    }
  }

  const addRandomBuff = () => {
    const buffTypes = ['attack_up', 'defense_up', 'speed_up', 'regeneration', 'shield', 'focus', 'berserk', 'evasion'] as const
    const randomType = buffTypes[Math.floor(Math.random() * buffTypes.length)]
    
    const applied = demoStatusManager.addStatusEffect(randomType, undefined, 1, 0, 100)
    if (applied) {
      setDemoEffects(demoStatusManager.getActiveEffects())
    }
  }

  const processTurn = () => {
    const turnStart = demoStatusManager.processTurnStart({ hp: 100, maxHp: 100 })
    const turnEnd = demoStatusManager.processTurnEnd({ hp: 100, maxHp: 100 })
    
    console.log('턴 시작 효과:', turnStart)
    console.log('턴 종료 효과:', turnEnd)
    
    setDemoEffects(demoStatusManager.getActiveEffects())
  }

  const clearAll = () => {
    demoStatusManager.removeAllDebuffs()
    demoStatusManager.removeAllBuffs()
    setDemoEffects([])
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">상태이상 시스템 테스트</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">1. 상태이상 데모</h2>
          <div className="space-x-2 mb-4">
            <button
              onClick={() => setShowStatusDemo(!showStatusDemo)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showStatusDemo ? '데모 숨기기' : '데모 표시'}
            </button>
          </div>
          
          {showStatusDemo && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <button
                  onClick={addRandomStatus}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  랜덤 디버프 추가
                </button>
                <button
                  onClick={addRandomBuff}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  랜덤 버프 추가
                </button>
                <button
                  onClick={processTurn}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  턴 처리
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  모두 제거
                </button>
              </div>
              
              {demoEffects.length > 0 && (
                <StatusEffectDisplay 
                  effects={demoEffects}
                  targetName="테스트 대상"
                />
              )}
              
              <div className="text-sm text-gray-400">
                <p>스탯 수정자: {JSON.stringify(demoStatusManager.getStatModifiers())}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">2. 전투 테스트</h2>
          <p className="text-sm text-gray-400 mb-2">
            다양한 상태이상 스킬을 가진 몬스터들과 전투
          </p>
          <button
            onClick={() => setShowBattle(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            전투 시작
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">테스트 몬스터 정보</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {testEnemies.map((enemy, index) => (
              <div key={index} className="bg-gray-700 p-2 rounded">
                <div className="font-semibold">{enemy.emoji} {enemy.name}</div>
                <div className="text-gray-400">
                  속성: {enemy.stats.element} / 스킬: {enemy.stats.specialAbility}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBattle && (
        <SimpleBattleScreen
          enemies={testEnemies}
          enemyLevel={10}
          playerLevel={10}
          onBattleEnd={handleBattleEnd}
          floorInfo={{
            currentFloor: 1,
            totalFloors: 1,
            dungeonName: '상태이상 테스트'
          }}
        />
      )}
    </div>
  )
}