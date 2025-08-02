'use client'

import React, { useState } from 'react'
import { DynamicQuestGenerator } from '@/components/quest/DynamicQuestGenerator'
import { PlayerBehaviorService } from '@/lib/services/player-behavior.service'
import { DynamicQuestService } from '@/lib/services/dynamic-quest.service'

export default function DynamicQuestTestPage() {
  const userId = 'test-user'
  const [behaviorData, setBehaviorData] = useState(PlayerBehaviorService.getBehaviorData(userId))

  const simulateBattleActivity = () => {
    PlayerBehaviorService.recordBattleActivity(userId, {
      duration: 180000, // 3분
      won: true,
      enemyElement: 'fire',
      skillsUsed: ['fireball', 'lightning-strike']
    })
    setBehaviorData(PlayerBehaviorService.getBehaviorData(userId))
  }

  const simulateDungeonActivity = () => {
    PlayerBehaviorService.recordDungeonActivity(userId, {
      dungeonId: '1',
      dungeonType: 'story',
      clearTime: 600000, // 10분
      difficulty: 'normal',
      cleared: true
    })
    setBehaviorData(PlayerBehaviorService.getBehaviorData(userId))
  }

  const simulateCollectionActivity = () => {
    PlayerBehaviorService.recordCollectionActivity(userId, {
      itemId: 'health-potion',
      itemType: 'consumable',
      quantity: 5,
      fromCrafting: false
    })
    setBehaviorData(PlayerBehaviorService.getBehaviorData(userId))
  }

  const simulateInactivity = () => {
    const behavior = PlayerBehaviorService.getBehaviorData(userId)
    behavior.playTimePattern.lastPlayedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    PlayerBehaviorService.saveBehaviorData(behavior)
    setBehaviorData(behavior)
  }

  const updateProgression = () => {
    PlayerBehaviorService.updateProgression(userId, {
      level: 15,
      exp: 500,
      questCompleted: true,
      mainQuestProgress: 25
    })
    setBehaviorData(PlayerBehaviorService.getBehaviorData(userId))
  }

  const resetBehaviorData = () => {
    const newData = PlayerBehaviorService.initializeBehaviorData(userId)
    PlayerBehaviorService.saveBehaviorData(newData)
    setBehaviorData(newData)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">동적 퀘스트 시스템 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 플레이어 행동 시뮬레이션 */}
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">플레이어 행동 시뮬레이션</h2>
            
            <div className="space-y-2">
              <button
                onClick={simulateBattleActivity}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                전투 활동 추가 (화염 속성)
              </button>
              
              <button
                onClick={simulateDungeonActivity}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                던전 클리어 추가
              </button>
              
              <button
                onClick={simulateCollectionActivity}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                아이템 수집 추가
              </button>
              
              <button
                onClick={simulateInactivity}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                8일 비활성 시뮬레이션
              </button>
              
              <button
                onClick={updateProgression}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                레벨 15로 업데이트
              </button>
              
              <button
                onClick={resetBehaviorData}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                행동 데이터 초기화
              </button>
            </div>
          </div>
          
          {/* 현재 행동 데이터 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">현재 플레이어 데이터</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">레벨:</span> {behaviorData.progression.currentLevel}
              </div>
              <div>
                <span className="text-gray-400">총 전투:</span> {behaviorData.combatPreference.totalBattles}
              </div>
              <div>
                <span className="text-gray-400">승률:</span> {behaviorData.combatPreference.winRate.toFixed(1)}%
              </div>
              <div>
                <span className="text-gray-400">던전 클리어:</span> {behaviorData.explorationPreference.totalDungeonsCleared}
              </div>
              <div>
                <span className="text-gray-400">수집한 아이템:</span> {behaviorData.collectionPreference.totalItemsCollected}
              </div>
              <div>
                <span className="text-gray-400">완료한 퀘스트:</span> {behaviorData.progression.completedQuestCount}
              </div>
              <div>
                <span className="text-gray-400">마지막 플레이:</span> {new Date(behaviorData.playTimePattern.lastPlayedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* 동적 퀘스트 생성기 */}
        <div>
          <DynamicQuestGenerator
            userId={userId}
            onQuestAccept={(quest) => {
              console.log('퀘스트 수락:', quest)
              alert(`퀘스트 "${quest.title}" 수락됨!`)
            }}
          />
        </div>
      </div>
    </div>
  )
}