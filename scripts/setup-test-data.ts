// 테스트용 초기 데이터 설정 스크립트
import { dbHelpers } from '../lib/database/client'
import { GAME_CONFIG } from '../lib/config/game-config'
import type { UserProfile, Stat } from '../lib/database/types'

export async function setupTestData() {
  const userId = GAME_CONFIG.DEFAULT_USER_ID
  
  try {
    // 프로필 생성
    const existingProfile = await dbHelpers.getProfile(userId)
    if (!existingProfile) {
      const newProfile: Omit<UserProfile, 'id'> = {
        userId,
        name: '테스트 모험가',
        level: 1,
        coins: 1000,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await dbHelpers.createProfile(newProfile)
      console.log('✅ 프로필 생성 완료')
    }
    
    // 스탯 생성
    const existingStats = await dbHelpers.getStats(userId)
    if (existingStats.length === 0) {
      const statTypes = ['health', 'learning', 'relationship', 'achievement'] as const
      
      for (const type of statTypes) {
        const newStat: Omit<Stat, 'id'> = {
          userId,
          type,
          level: 1,
          experience: 50,
          totalActivities: 0,
          updatedAt: new Date()
        }
        
        await dbHelpers.createStat(newStat)
      }
      
      console.log('✅ 스탯 생성 완료')
    }
    
    // 초기 아이템 추가
    const { inventoryService } = await import('../lib/services/inventory-service')
    
    // 기본 아이템 추가
    inventoryService.addItem(userId, 'health-potion', 5)
    inventoryService.addItem(userId, 'energy-potion', 3)
    inventoryService.addItem(userId, 'iron-sword', 1)
    inventoryService.addItem(userId, 'leather-armor', 1)
    
    console.log('✅ 초기 아이템 추가 완료')
    
    // 스킬 초기화
    const { skillService } = await import('../lib/services/skill.service')
    skillService.initializeSkills(userId)
    
    console.log('✅ 스킬 초기화 완료')
    
    // 장비 초기화
    const { equipmentService } = await import('../lib/services/equipment.service')
    equipmentService.initializeEquipment(userId)
    
    console.log('✅ 장비 초기화 완료')
    
    console.log('🎉 모든 테스트 데이터 설정 완료!')
    
  } catch (error) {
    console.error('❌ 테스트 데이터 설정 중 오류:', error)
  }
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
  setupTestData()
}