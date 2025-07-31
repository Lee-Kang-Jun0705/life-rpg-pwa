/**
 * 스킬북 서비스
 * 스킬북 아이템을 사용하여 스킬을 배우는 기능
 */

import { skillManagementService } from './skill-management.service'
import { inventoryService } from './inventory.service'
import { ALL_ITEMS } from '@/lib/data/items'
import type { GeneratedItem } from '@/lib/types/item-system'

class SkillBookService {
  private static instance: SkillBookService
  
  private constructor() {}
  
  static getInstance(): SkillBookService {
    if (!SkillBookService.instance) {
      SkillBookService.instance = new SkillBookService()
    }
    return SkillBookService.instance
  }

  /**
   * 스킬북 사용
   */
  async useSkillBook(_itemUniqueId: string): Promise<{
    success: boolean
    message: string
    skillId?: string
  }> {
    try {
      // 아이템 가져오기
      const item = inventoryService.getItem(itemUniqueId)
      if (!item) {
        return {
          success: false,
          message: '아이템을 찾을 수 없습니다.'
        }
      }

      // 스킬북인지 확인
      if (item.type !== 'consumable' || !item.consumableEffect?.type || item.consumableEffect.type !== 'skill_book') {
        return {
          success: false,
          message: '스킬북이 아닙니다.'
        }
      }

      const skillId = item.consumableEffect.skillId
      if (!skillId) {
        return {
          success: false,
          message: '스킬 정보가 없습니다.'
        }
      }

      // 이미 배운 스킬인지 확인
      const learnedSkills = skillManagementService.getAllLearnedSkills()
      if (learnedSkills.some(ls => ls.skillId === skillId)) {
        return {
          success: false,
          message: '이미 배운 스킬입니다.'
        }
      }

      // 스킬 배우기 (스킬 포인트 소비 없이)
      const learned = skillManagementService.learnSkillFromBook(skillId)
      if (!learned) {
        return {
          success: false,
          message: '스킬을 배울 수 없습니다.'
        }
      }

      // 스킬북 소비
      const removed = inventoryService.removeItem(itemUniqueId, 1)
      if (!removed) {
        // 스킬 배우기 롤백
        skillManagementService.unlearnSkill(skillId)
        return {
          success: false,
          message: '스킬북 사용에 실패했습니다.'
        }
      }

      const skill = skillManagementService.getSkill(skillId)
      return {
        success: true,
        message: `${skill?.name} 스킬을 배웠습니다!`,
        skillId
      }
    } catch (error) {
      console.error('Failed to use skill book:', error)
      return {
        success: false,
        message: '스킬북 사용 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 아이템이 스킬북인지 확인
   */
  isSkillBook(_item: GeneratedItem): boolean {
    return item.type === 'consumable' && 
           item.consumableEffect?.type === 'skill_book' &&
           !!item.consumableEffect.skillId
  }

  /**
   * 스킬북으로 배울 수 있는 스킬 정보 가져오기
   */
  getSkillBookInfo(_item: GeneratedItem): {
    skillId: string
    skillName: string
    skillDescription: string
    canLearn: boolean
    reason?: string
  } | null {
    if (!this.isSkillBook(item)) {
      return null
    }

    const skillId = item.consumableEffect!.skillId!
    const skill = skillManagementService.getSkill(skillId)
    if (!skill) {
      return null
    }

    // 이미 배운 스킬인지 확인
    const learnedSkills = skillManagementService.getAllLearnedSkills()
    const isLearned = learnedSkills.some(ls => ls.skillId === skillId)

    return {
      skillId,
      skillName: skill.name,
      skillDescription: skill.description,
      canLearn: !isLearned,
      reason: isLearned ? '이미 배운 스킬입니다.' : undefined
    }
  }

  /**
   * 인벤토리의 모든 스킬북 가져오기
   */
  getSkillBooksInInventory(): GeneratedItem[] {
    const allItems = inventoryService.getItems()
    return allItems.filter(item => this.isSkillBook(item))
  }
}

export const skillBookService = SkillBookService.getInstance()