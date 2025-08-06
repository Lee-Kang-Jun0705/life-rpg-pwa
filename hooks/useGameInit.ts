'use client'

import { useEffect, useState } from 'react'
import { persistenceService } from '@/lib/services/persistence.service'
// import { inventoryService } from '@/lib/services/inventory.service' // 미구현
// import { skillManagementService } from '@/lib/services/skill-management.service' // 미구현

interface GameInitStatus {
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  error: Error | null
  lastSaveTime: Date | null
}

export function useGameInit(characterId = 'player-1') {
  const [status, setStatus] = useState<GameInitStatus>({
    isLoading: true,
    isLoaded: false,
    hasError: false,
    error: null,
    lastSaveTime: null
  })

  useEffect(() => {
    const initializeGame = async() => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true }))

        // 저장된 데이터 불러오기
        const success = await persistenceService.loadAll(characterId)

        if (success) {
          // 마지막 저장 시간 가져오기
          const lastSave = await persistenceService.getLastSaveTime(characterId)

          setStatus({
            isLoading: false,
            isLoaded: true,
            hasError: false,
            error: null,
            lastSaveTime: lastSave
          })
        } else {
          // 저장된 데이터가 없으면 기본값으로 시작
          console.log('No saved data found, starting with defaults')

          // 미구현 - 기본 아이템 생성 (테스트용)
          // const { itemGenerationService } = await import('@/lib/services/item-generation.service')

          // 미구현 - 몇 개의 시작 아이템 생성
          // const startingItems = ['rusty_sword', 'wooden_staff', 'iron_sword']
          // for (const itemId of startingItems) {
          //   const result = itemGenerationService.generateItem({
          //     baseItemId: itemId,
          //     level: 1,
          //     rarity: 'common'
          //   })
          //   if (result.success) {
          //     inventoryService.addItem(result.item)
          //   }
          // }

          // 미구현 - 시작 스킬 포인트
          // skillManagementService.addSkillPoints(5)

          // 초기 데이터 저장
          await persistenceService.saveAll(characterId)

          setStatus({
            isLoading: false,
            isLoaded: true,
            hasError: false,
            error: null,
            lastSaveTime: new Date()
          })
        }
      } catch (error) {
        console.error('Failed to initialize game:', error)
        setStatus({
          isLoading: false,
          isLoaded: false,
          hasError: true,
          error: error as Error,
          lastSaveTime: null
        })
      }
    }

    initializeGame()
  }, [characterId])

  return status
}
