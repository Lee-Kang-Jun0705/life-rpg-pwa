// 레벨 트래킹 서비스
// 캐릭터 레벨 변화를 감지하고 레벨업 시 보상을 지급합니다

import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { skillService } from './skill-service'
import { SKILL_CONSTANTS } from '@/lib/types/skill.types'

const LEVEL_STORAGE_KEY = 'life-rpg-character-level'

class LevelTrackingService {
  private static instance: LevelTrackingService

  static getInstance(): LevelTrackingService {
    if (!LevelTrackingService.instance) {
      LevelTrackingService.instance = new LevelTrackingService()
    }
    return LevelTrackingService.instance
  }

  // 저장된 레벨 가져오기
  private getSavedLevel(userId: string): number {
    try {
      const saved = localStorage.getItem(`${LEVEL_STORAGE_KEY}-${userId}`)
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  }

  // 레벨 저장
  private saveLevel(userId: string, level: number): void {
    try {
      localStorage.setItem(`${LEVEL_STORAGE_KEY}-${userId}`, level.toString())
    } catch (error) {
      console.error('Failed to save level:', error)
    }
  }

  // 레벨 체크 및 업데이트
  async checkAndUpdateLevel(userId: string): Promise<{
    levelChanged: boolean
    oldLevel: number
    newLevel: number
    levelUps: number
  }> {
    try {
      // 현재 스탯 가져오기
      const stats = await dbHelpers.getStats(userId)
      if (!stats || stats.length === 0) {
        return { levelChanged: false, oldLevel: 0, newLevel: 0, levelUps: 0 }
      }

      // 현재 레벨 계산
      const currentLevel = calculateCharacterLevel(stats)
      
      // 저장된 레벨 가져오기
      const savedLevel = this.getSavedLevel(userId)
      
      // 레벨 변화 확인
      if (currentLevel > savedLevel) {
        const levelUps = currentLevel - savedLevel
        
        // 레벨업 보상 지급
        this.grantLevelUpRewards(userId, levelUps)
        
        // 새 레벨 저장
        this.saveLevel(userId, currentLevel)
        
        // 레벨업 이벤트 발생
        window.dispatchEvent(new CustomEvent('level-up', {
          detail: { userId, oldLevel: savedLevel, newLevel: currentLevel, levelUps }
        }))
        
        return { levelChanged: true, oldLevel: savedLevel, newLevel: currentLevel, levelUps }
      }
      
      // 첫 실행이거나 레벨이 같은 경우
      if (savedLevel === 0) {
        this.saveLevel(userId, currentLevel)
      }
      
      return { levelChanged: false, oldLevel: currentLevel, newLevel: currentLevel, levelUps: 0 }
    } catch (error) {
      console.error('Failed to check level:', error)
      return { levelChanged: false, oldLevel: 0, newLevel: 0, levelUps: 0 }
    }
  }

  // 레벨업 보상 지급
  private grantLevelUpRewards(userId: string, levelUps: number): void {
    // 스킬 포인트 지급 (레벨당 1포인트)
    const skillPoints = levelUps * SKILL_CONSTANTS.SKILL_POINT_PER_LEVEL
    skillService.addSkillPoints(userId, skillPoints)
    
    console.log(`🎉 레벨업! ${levelUps}레벨 상승, ${skillPoints} 스킬 포인트 획득!`)
    
    // 레벨업 알림 표시
    this.showLevelUpNotification(levelUps, skillPoints)
  }

  // 레벨업 알림 표시
  private showLevelUpNotification(levelUps: number, skillPoints: number): void {
    // 간단한 알림 (나중에 더 화려하게 개선 가능)
    const message = `🎉 레벨업! +${levelUps} 레벨\n✨ 스킬 포인트 +${skillPoints} 획득!`
    
    // 커스텀 이벤트로 알림 전달
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message, type: 'levelup' }
    }))
  }

  // 초기화 (앱 시작 시 호출)
  async initialize(userId: string): Promise<void> {
    // 현재 레벨 확인 및 초기값 설정
    await this.checkAndUpdateLevel(userId)
    
    // 주기적으로 레벨 체크 (10초마다)
    setInterval(() => {
      this.checkAndUpdateLevel(userId)
    }, 10000)
  }
}

export const levelTrackingService = LevelTrackingService.getInstance()