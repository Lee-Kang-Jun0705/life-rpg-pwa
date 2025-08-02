'use client'

import { useState } from 'react'
import CompanionManager from '@/components/companion/CompanionManager'
import { companionService } from '@/lib/services/companion.service'
import { COMPANION_DATA } from '@/lib/data/companions'

export default function CompanionTestPage() {
  const [testLog, setTestLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 테스트용 컴패니언 추가
  const addTestCompanion = (rarity: string) => {
    const companions = COMPANION_DATA.filter(c => c.rarity === rarity)
    if (companions.length === 0) {
      addLog(`${rarity} 등급 컴패니언이 없습니다.`)
      return
    }

    const randomCompanion = companions[Math.floor(Math.random() * companions.length)]
    const instance = companionService.addCompanion('current-user', randomCompanion.id)
    
    if (instance) {
      addLog(`✅ ${randomCompanion.name} (${rarity}) 추가 완료`)
    } else {
      addLog(`❌ 컴패니언 추가 실패`)
    }
  }

  // 활성 컴패니언 경험치 추가
  const addExpToActive = () => {
    const activeCompanion = companionService.getActiveCompanion('current-user')
    if (!activeCompanion) {
      addLog('❌ 활성 컴패니언이 없습니다.')
      return
    }

    const success = companionService.addExperience('current-user', activeCompanion.id, 100)
    if (success) {
      addLog(`✅ ${activeCompanion.nickname}에게 경험치 100 추가`)
    }
  }

  // 상태 변경 테스트
  const testStateChange = () => {
    const activeCompanion = companionService.getActiveCompanion('current-user')
    if (!activeCompanion) {
      addLog('❌ 활성 컴패니언이 없습니다.')
      return
    }

    // 직접 상태 변경 (테스트용)
    const companions = companionService.getAllCompanions('current-user')
    const companion = companions.find(c => c.id === activeCompanion.id)
    if (companion) {
      companion.hunger = 20
      companion.fatigue = 90
      companionService.saveCompanions('current-user', companions)
      addLog(`✅ ${companion.nickname}의 상태 변경 (배고픔: 20, 피로도: 90)`)
    }
  }

  // 모든 컴패니언 삭제
  const clearAllCompanions = () => {
    const companions = companionService.getAllCompanions('current-user')
    companions.forEach(companion => {
      companionService.removeCompanion('current-user', companion.id)
    })
    addLog('✅ 모든 컴패니언 삭제 완료')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">컴패니언 시스템 테스트</h1>

      {/* 테스트 컨트롤 */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-bold mb-4">테스트 도구</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => addTestCompanion('common')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Common 추가
          </button>
          <button
            onClick={() => addTestCompanion('rare')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Rare 추가
          </button>
          <button
            onClick={() => addTestCompanion('epic')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Epic 추가
          </button>
          <button
            onClick={() => addTestCompanion('legendary')}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Legendary 추가
          </button>
          <button
            onClick={() => addTestCompanion('mythic')}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded hover:from-pink-600 hover:to-rose-600 transition-colors"
          >
            Mythic 추가
          </button>
          <button
            onClick={addExpToActive}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            경험치 +100
          </button>
          <button
            onClick={testStateChange}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            상태 변경
          </button>
          <button
            onClick={clearAllCompanions}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            모두 삭제
          </button>
        </div>

        {/* 테스트 로그 */}
        <div className="bg-black/10 dark:bg-black/30 rounded p-3 h-32 overflow-y-auto">
          <div className="font-mono text-xs space-y-1">
            {testLog.length === 0 ? (
              <p className="text-gray-500">테스트 로그가 여기에 표시됩니다...</p>
            ) : (
              testLog.map((log, index) => (
                <p key={index} className="text-gray-700 dark:text-gray-300">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 컴패니언 매니저 */}
      <CompanionManager />

      {/* 시스템 정보 */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="font-bold mb-2">컴패니언 시스템 정보</h3>
        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <li>✅ 7종의 컴패니언 구현 (Common~Mythic)</li>
          <li>✅ 레벨 시스템 (최대 100레벨)</li>
          <li>✅ 스킬 시스템 (액티브/패시브)</li>
          <li>✅ 상태 시스템 (충성도, 배고픔, 피로도)</li>
          <li>✅ 기분 시스템 (5가지 기분)</li>
          <li>✅ 활동 시스템 (먹이주기, 놀아주기, 훈련 등)</li>
          <li>✅ 전투력 계산 시스템</li>
          <li>✅ 진화 시스템 (일부 컴패니언)</li>
          <li>🔲 전투 시스템 통합 (추가 구현 필요)</li>
          <li>🔲 장비 시스템 (추가 구현 필요)</li>
        </ul>
      </div>
    </div>
  )
}