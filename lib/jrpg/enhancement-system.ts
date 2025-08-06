import type { ItemInstance } from './types'
import { ITEM_DATABASE } from './items-database'
import { ItemRarity } from './item-rarity'

// 강화 성공률 테이블
export const ENHANCEMENT_SUCCESS_RATES: Record<number, number> = {
  0: 100,   // +0 → +1: 100%
  1: 95,    // +1 → +2: 95%
  2: 90,    // +2 → +3: 90%
  3: 85,    // +3 → +4: 85%
  4: 80,    // +4 → +5: 80%
  5: 70,    // +5 → +6: 70%
  6: 60,    // +6 → +7: 60%
  7: 50,    // +7 → +8: 50%
  8: 40,    // +8 → +9: 40%
  9: 30,    // +9 → +10: 30%
  10: 20,   // +10 → +11: 20%
  11: 15,   // +11 → +12: 15%
  12: 10,   // +12 → +13: 10%
  13: 5,    // +13 → +14: 5%
  14: 3,    // +14 → +15: 3%
}

// 강화 비용 계산
export function calculateEnhancementCost(item: ItemInstance): {
  gold: number
  materials: Array<{ itemId: string; quantity: number }>
} {
  const itemDef = ITEM_DATABASE[item.itemId]
  if (!itemDef) return { gold: 0, materials: [] }
  
  const currentLevel = item.enhancement || 0
  const rarityMultiplier = {
    [ItemRarity.COMMON]: 1,
    [ItemRarity.UNCOMMON]: 2,
    [ItemRarity.RARE]: 3,
    [ItemRarity.EPIC]: 5,
    [ItemRarity.LEGENDARY]: 8,
    [ItemRarity.MYTHIC]: 15
  }[item.rarity] || 1
  
  // 골드 비용 = 기본가격 * 강화레벨^2 * 등급배수
  const goldCost = Math.floor(itemDef.price * Math.pow(currentLevel + 1, 2) * rarityMultiplier * 0.5)
  
  // 필요 재료
  const materials: Array<{ itemId: string; quantity: number }> = []
  
  // 기본 강화석
  materials.push({
    itemId: 'item_501', // 강화석
    quantity: Math.max(1, Math.floor((currentLevel + 1) / 3))
  })
  
  // 높은 강화 레벨에서 추가 재료
  if (currentLevel >= 5) {
    materials.push({
      itemId: 'item_502', // 고급 강화석
      quantity: Math.max(1, Math.floor((currentLevel - 4) / 2))
    })
  }
  
  if (currentLevel >= 10) {
    materials.push({
      itemId: 'item_503', // 마법 강화석
      quantity: Math.max(1, Math.floor((currentLevel - 9) / 2))
    })
  }
  
  // 등급별 추가 재료
  if (item.rarity === ItemRarity.EPIC || item.rarity === ItemRarity.LEGENDARY || item.rarity === ItemRarity.MYTHIC) {
    materials.push({
      itemId: 'item_504', // 희귀 정수
      quantity: 1
    })
  }
  
  return { gold: goldCost, materials }
}

// 강화 시도
export function attemptEnhancement(
  item: ItemInstance,
  useProtection: boolean = false
): {
  success: boolean
  newLevel: number
  destroyed: boolean
} {
  const currentLevel = item.enhancement || 0
  const successRate = ENHANCEMENT_SUCCESS_RATES[currentLevel] || 0
  
  // 보호 아이템 사용 시 파괴 방지
  const protectionActive = useProtection && currentLevel >= 7
  
  // 성공 판정
  const roll = Math.random() * 100
  const success = roll <= successRate
  
  if (success) {
    return {
      success: true,
      newLevel: currentLevel + 1,
      destroyed: false
    }
  } else {
    // 실패 시 처리
    if (currentLevel < 5) {
      // +5 미만: 레벨 유지
      return {
        success: false,
        newLevel: currentLevel,
        destroyed: false
      }
    } else if (currentLevel < 10) {
      // +5~+9: 레벨 -1
      return {
        success: false,
        newLevel: Math.max(0, currentLevel - 1),
        destroyed: false
      }
    } else {
      // +10 이상: 파괴 위험
      if (protectionActive) {
        // 보호 아이템 사용: 레벨 -3
        return {
          success: false,
          newLevel: Math.max(0, currentLevel - 3),
          destroyed: false
        }
      } else {
        // 30% 확률로 파괴
        const destroyed = Math.random() < 0.3
        return {
          success: false,
          newLevel: destroyed ? 0 : Math.max(0, currentLevel - 3),
          destroyed
        }
      }
    }
  }
}

// 강화 보너스 계산
export function calculateEnhancementBonus(
  baseValue: number,
  enhancementLevel: number,
  statType: 'attack' | 'defense' | 'hp' | 'mp' | 'other' = 'other'
): number {
  // 스탯 타입별 보너스 배율
  const typeMultiplier = {
    attack: 0.15,    // 공격력: 레벨당 15%
    defense: 0.12,   // 방어력: 레벨당 12%
    hp: 0.10,        // 체력: 레벨당 10%
    mp: 0.10,        // 마나: 레벨당 10%
    other: 0.08      // 기타: 레벨당 8%
  }[statType]
  
  return Math.floor(baseValue * enhancementLevel * typeMultiplier)
}

// 강화 시뮬레이션 (디버깅/통계용)
export function simulateEnhancement(
  fromLevel: number,
  toLevel: number,
  useProtection: boolean = false,
  simulations: number = 10000
): {
  averageCost: number
  averageTries: number
  destructionRate: number
  successPaths: Array<{ tries: number; cost: number }>
} {
  const results: Array<{ tries: number; cost: number; destroyed: boolean }> = []
  
  for (let i = 0; i < simulations; i++) {
    let currentLevel = fromLevel
    let totalCost = 0
    let tries = 0
    let destroyed = false
    
    while (currentLevel < toLevel && !destroyed) {
      tries++
      // 임시 아이템으로 비용 계산
      const tempItem: ItemInstance = {
        id: 'temp',
        itemId: 'item_001',
        rarity: ItemRarity.RARE,
        enhancement: currentLevel,
        quantity: 1
      }
      
      const cost = calculateEnhancementCost(tempItem)
      totalCost += cost.gold
      
      const result = attemptEnhancement(tempItem, useProtection)
      currentLevel = result.newLevel
      destroyed = result.destroyed
    }
    
    results.push({ tries, cost: totalCost, destroyed })
  }
  
  // 통계 계산
  const successfulRuns = results.filter(r => !r.destroyed)
  const averageTries = successfulRuns.reduce((sum, r) => sum + r.tries, 0) / successfulRuns.length
  const averageCost = successfulRuns.reduce((sum, r) => sum + r.cost, 0) / successfulRuns.length
  const destructionRate = (results.filter(r => r.destroyed).length / simulations) * 100
  
  return {
    averageCost: Math.floor(averageCost),
    averageTries: Math.floor(averageTries),
    destructionRate,
    successPaths: successfulRuns.slice(0, 10).map(r => ({
      tries: r.tries,
      cost: r.cost
    }))
  }
}

// 강화 이펙트 정보
export const ENHANCEMENT_EFFECTS = {
  glow: {
    0: null,
    1: 'blue-glow-weak',
    3: 'blue-glow',
    5: 'purple-glow',
    7: 'orange-glow',
    10: 'red-glow',
    12: 'rainbow-glow',
    15: 'divine-glow'
  },
  
  prefix: {
    0: '',
    1: '',
    3: '빛나는',
    5: '강화된',
    7: '정제된',
    10: '축복받은',
    12: '전설의',
    15: '신화의'
  }
}

// 강화 관련 아이템 정의
export const ENHANCEMENT_ITEMS = {
  'item_501': {
    id: 'item_501',
    name: '강화석',
    description: '장비를 강화할 때 사용하는 기본 재료',
    icon: '💎',
    type: 'material' as const,
    rarity: ItemRarity.COMMON,
    price: 100,
    stackable: true,
    maxStack: 999
  },
  
  'item_502': {
    id: 'item_502',
    name: '고급 강화석',
    description: '높은 강화 단계에 필요한 고급 재료',
    icon: '🔷',
    type: 'material' as const,
    rarity: ItemRarity.UNCOMMON,
    price: 500,
    stackable: true,
    maxStack: 999
  },
  
  'item_503': {
    id: 'item_503',
    name: '마법 강화석',
    description: '강력한 마법이 깃든 강화 재료',
    icon: '🔮',
    type: 'material' as const,
    rarity: ItemRarity.RARE,
    price: 2000,
    stackable: true,
    maxStack: 999
  },
  
  'item_504': {
    id: 'item_504',
    name: '희귀 정수',
    description: '고급 장비 강화에 필요한 희귀한 정수',
    icon: '✨',
    type: 'material' as const,
    rarity: ItemRarity.EPIC,
    price: 5000,
    stackable: true,
    maxStack: 999
  },
  
  'item_505': {
    id: 'item_505',
    name: '보호의 부적',
    description: '강화 실패 시 장비 파괴를 막아주는 부적',
    icon: '🛡️',
    type: 'consumable' as const,
    rarity: ItemRarity.RARE,
    price: 10000,
    stackable: true,
    maxStack: 10,
    effect: {
      type: 'protection',
      description: '강화 실패 시 장비 파괴 방지'
    }
  }
}