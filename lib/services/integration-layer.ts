/**
 * Integration Layer - 기존 컴포넌트와 새로운 서비스 매니저 연결
 * 
 * 코딩 규칙:
 * - any 타입 금지
 * - 하드코딩 금지
 * - 일관된 스타일
 */

// 순환 참조 방지를 위한 지연 로딩
let battleManager: any
let skillManager: any
let shopManager: any
let inventoryManager: any
let dungeonManager: any
let soundManager: any
let autoBattleAI: any
let saveManager: any
let levelSyncService: any
import type { SkillInstance } from '@/lib/jrpg/types'


/**
 * 스킬 시스템 통합 헬퍼
 */
export const skillIntegration = {
  // JRPG 스킬을 새로운 스킬 매니저 형식으로 변환
  convertJRPGSkillToManagerFormat(jrpgSkill: SkillInstance): {
    id: string
    name: string
    level: number
    equipped: boolean
    slot?: number
  } {
    return {
      id: jrpgSkill.skillId,
      name: jrpgSkill.skillId, // TODO: 실제 이름으로 매핑
      level: jrpgSkill.level,
      equipped: jrpgSkill.equippedSlot !== undefined,
      slot: jrpgSkill.equippedSlot
    }
  },

  // 스킬 장착 - JRPG 시스템과 새 매니저 연동
  async equipSkillBridge(userId: string, skillId: string, slot: number): Promise<boolean> {
    try {
      // 새로운 스킬 매니저로 장착
      const result = await skillManager.equipSkill(skillId, slot)
      
      if (result.success) {
        // 기존 JRPG DB에도 반영
        const { jrpgDbHelpers } = await import('@/lib/jrpg/database-helpers')
        await jrpgDbHelpers.equipSkill(userId, skillId, slot)
        
        // 사운드 재생
        soundManager.playSFX('button_success')
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SkillIntegration] equipSkillBridge error:', error)
      return false
    }
  },

  // 스킬 장착 해제
  async unequipSkillBridge(userId: string, skillId: string): Promise<boolean> {
    try {
      const result = await skillManager.unequipSkill(skillId)
      
      if (result.success) {
        const { jrpgDbHelpers } = await import('@/lib/jrpg/database-helpers')
        await jrpgDbHelpers.unequipSkill(userId, skillId)
        
        soundManager.playSFX('button_click')
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SkillIntegration] unequipSkillBridge error:', error)
      return false
    }
  }
}

/**
 * 전투 시스템 통합 헬퍼
 */
export const battleIntegration = {
  // 자동전투 토글
  toggleAutoBattle(): boolean {
    const isEnabled = autoBattleAI.toggle()
    
    if (isEnabled) {
      soundManager.playSFX('button_success')
      console.log('[BattleIntegration] 자동전투 활성화됨')
    } else {
      soundManager.playSFX('button_click')
      console.log('[BattleIntegration] 자동전투 비활성화됨')
    }
    
    return isEnabled
  },

  // 자동전투 상태 확인
  isAutoBattleEnabled(): boolean {
    return autoBattleAI.isEnabled()
  },

  // 전투 시작 브릿지
  async startBattleBridge(dungeonId: string, monsterId: string): Promise<boolean> {
    try {
      // 레벨 동기화
      const playerLevel = levelSyncService.getLevel()
      
      // 전투 시작
      const result = await battleManager.startBattle({
        dungeonId,
        monsters: [monsterId],
        playerLevel
      })
      
      if (result.success) {
        soundManager.playBGM('battle')
        return true
      }
      
      return false
    } catch (error) {
      console.error('[BattleIntegration] startBattleBridge error:', error)
      return false
    }
  }
}

/**
 * 상점 시스템 통합 헬퍼
 */
export const shopIntegration = {
  // 아이템 구매
  async purchaseItemBridge(itemId: string, quantity: number = 1): Promise<{
    success: boolean
    message: string
    totalCost?: number
  }> {
    try {
      const result = await shopManager.buyItem(itemId, quantity)
      
      if (result.success) {
        soundManager.playSFX('coin')
        
        // 골드 차감 이벤트 발송
        window.dispatchEvent(new CustomEvent('gold-spent', {
          detail: { amount: result.totalCost }
        }))
      } else {
        soundManager.playSFX('error')
      }
      
      return result
    } catch (error) {
      console.error('[ShopIntegration] purchaseItemBridge error:', error)
      return {
        success: false,
        message: '구매 중 오류가 발생했습니다.'
      }
    }
  },

  // 아이템 판매
  async sellItemBridge(itemId: string, quantity: number = 1): Promise<{
    success: boolean
    message: string
    totalGold?: number
  }> {
    try {
      const result = await shopManager.sellItem(itemId, quantity)
      
      if (result.success) {
        soundManager.playSFX('coin')
        
        // 골드 획득 이벤트 발송
        window.dispatchEvent(new CustomEvent('gold-earned', {
          detail: { amount: result.totalGold }
        }))
      }
      
      return result
    } catch (error) {
      console.error('[ShopIntegration] sellItemBridge error:', error)
      return {
        success: false,
        message: '판매 중 오류가 발생했습니다.'
      }
    }
  }
}

/**
 * 게임 상태 저장/로드 통합
 */
export const saveIntegration = {
  // 자동 저장
  async autoSave(): Promise<boolean> {
    try {
      const slot = 0 // 자동 저장 슬롯
      const result = await saveManager.saveGame(slot, '자동 저장')
      
      if (result.success) {
        console.log('[SaveIntegration] 자동 저장 완료')
      }
      
      return result.success
    } catch (error) {
      console.error('[SaveIntegration] autoSave error:', error)
      return false
    }
  },

  // 게임 로드
  async loadGame(slot: number): Promise<boolean> {
    try {
      const result = await saveManager.loadGame(slot)
      
      if (result.success) {
        soundManager.playSFX('button_success')
        console.log('[SaveIntegration] 게임 로드 완료')
        
        // 페이지 새로고침하여 상태 반영
        window.location.reload()
      }
      
      return result.success
    } catch (error) {
      console.error('[SaveIntegration] loadGame error:', error)
      return false
    }
  }
}

/**
 * 통합 레이어 초기화
 */
export async function initializeIntegrationLayer(): Promise<void> {
  console.log('[IntegrationLayer] 초기화 시작')

  try {
    // 매니저들 지연 로딩
    const [
      battleModule,
      skillModule,
      shopModule,
      inventoryModule,
      dungeonModule,
      soundModule,
      autoBattleModule,
      saveModule,
      levelSyncModule
    ] = await Promise.all([
      import('@/lib/services/battle-manager'),
      import('@/lib/services/skill-manager'),
      import('@/lib/services/shop-manager'),
      import('@/lib/services/inventory-manager'),
      import('@/lib/services/dungeon-manager'),
      import('@/lib/services/sound-manager'),
      import('@/lib/services/auto-battle-ai'),
      import('@/lib/services/save-manager'),
      import('@/lib/services/level-sync.service')
    ])
    
    // 모듈에서 export된 인스턴스 가져오기
    battleManager = battleModule.battleManager
    skillManager = skillModule.skillManager
    shopManager = shopModule.shopManager
    inventoryManager = inventoryModule.inventoryManager
    dungeonManager = dungeonModule.dungeonManager
    soundManager = soundModule.soundManager
    autoBattleAI = autoBattleModule.autoBattleAI
    saveManager = saveModule.saveManager
    levelSyncService = levelSyncModule.levelSyncService
    
    console.log('[IntegrationLayer] 매니저 로드 완료')
    console.log('[IntegrationLayer] battleManager:', battleManager)
    console.log('[IntegrationLayer] skillManager:', skillManager)
    console.log('[IntegrationLayer] shopManager:', shopManager)
    
    // 전역 매니저 등록
    if (typeof window !== 'undefined') {
      (window as any).gameManagers = {
        battleManager,
        skillManager,
        shopManager,
        inventoryManager,
        dungeonManager,
        soundManager,
        autoBattleAI,
        saveManager,
        levelSyncService
      }
      
      console.log('[IntegrationLayer] gameManagers 등록 완료:', (window as any).gameManagers)
    }

    // 레벨 동기화 시작
    levelSyncService.startSync()

    // 자동 저장 설정 (5분마다)
    setInterval(() => {
      saveIntegration.autoSave()
    }, 5 * 60 * 1000)

    // 전역 이벤트 리스너 등록
    window.addEventListener('beforeunload', () => {
      // 페이지 떠나기 전 자동 저장
      saveIntegration.autoSave()
    })

    console.log('[IntegrationLayer] 초기화 완료')
  } catch (error) {
    console.error('[IntegrationLayer] 초기화 실패:', error)
  }
}

// 브라우저 환경에서 자동 초기화
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initializeIntegrationLayer()
  })
}