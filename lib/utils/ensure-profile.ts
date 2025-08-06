/**
 * 프로필이 존재하는지 확인하고 없으면 생성하는 유틸리티
 */

import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'
import type { UserProfile, UserResources } from '@/lib/database/types'

export async function ensureUserProfile(userId: string = GAME_CONFIG.DEFAULT_USER_ID): Promise<void> {
  try {
    // 프로필 확인
    const existingProfile = await dbHelpers.getProfile(userId)
    
    if (!existingProfile) {
      console.log('📝 Creating new user profile for:', userId)
      
      // 새 프로필 생성
      const newProfile: Omit<UserProfile, 'id'> = {
        userId,
        email: `${userId}@example.com`,
        name: '플레이어',
        level: 1,
        experience: 0,
        totalExperience: 0,
        currentExperience: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await dbHelpers.createProfile(newProfile)
      console.log('✅ Profile created successfully')
    }
    
    // 리소스 확인
    const existingResources = await dbHelpers.getUserResources(userId)
    
    if (!existingResources) {
      console.log('💰 Creating new user resources for:', userId)
      
      // 새 리소스 생성
      const newResources: Omit<UserResources, 'id'> = {
        userId,
        gold: 1000,
        energy: 100,
        maxEnergy: 100,
        lastEnergyUpdate: new Date(),
        premiumCurrency: 0,
        updatedAt: new Date()
      }
      
      await dbHelpers.initializeUserResources(userId, newResources)
      console.log('✅ Resources created successfully')
    }
    
    // 기본 스탯 생성
    const stats = await dbHelpers.getStats(userId)
    if (!stats || stats.length === 0) {
      console.log('📊 Creating default stats for:', userId)
      
      const statTypes = ['health', 'learning', 'relationship', 'achievement'] as const
      
      for (const type of statTypes) {
        await dbHelpers.updateStat(userId, type, 0)
      }
      
      console.log('✅ Stats created successfully')
    }
    
  } catch (error) {
    console.error('❌ Failed to ensure user profile:', error)
    throw error
  }
}