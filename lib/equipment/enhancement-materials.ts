// 강화 재료 데이터
import type { EnhancementMaterial } from '@/lib/types/equipment'

// 기본 강화석
export const ENHANCEMENT_STONES: EnhancementMaterial[] = [
  // 티어 1 강화석 (1-3강)
  {
    id: 'basic-stone',
    name: '일반 강화석',
    description: '기본적인 장비 강화에 사용되는 돌',
    tier: 1,
    successRateBonus: 10,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  {
    id: 'refined-stone',
    name: '정제된 강화석',
    description: '순도 높은 강화석으로 성공률이 높다',
    tier: 1,
    successRateBonus: 20,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  
  // 티어 2 강화석 (4-6강)
  {
    id: 'rare-stone',
    name: '희귀 강화석',
    description: '중급 장비 강화에 적합한 강화석',
    tier: 2,
    successRateBonus: 15,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  {
    id: 'blessed-stone',
    name: '축복받은 강화석',
    description: '신의 축복이 깃든 강화석',
    tier: 2,
    successRateBonus: 25,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
  
  // 티어 3 강화석 (7-9강)
  {
    id: 'epic-stone',
    name: '영웅 강화석',
    description: '영웅들이 사용했던 전설의 강화석',
    tier: 3,
    successRateBonus: 20,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  {
    id: 'protection-stone',
    name: '보호의 강화석',
    description: '실패해도 장비가 파괴되지 않는 특수 강화석',
    tier: 3,
    successRateBonus: 15,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
  
  // 티어 4 강화석 (10-12강)
  {
    id: 'legendary-stone',
    name: '전설 강화석',
    description: '전설적인 힘이 깃든 강화석',
    tier: 4,
    successRateBonus: 30,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  {
    id: 'divine-stone',
    name: '신성한 강화석',
    description: '신의 가호가 담긴 최상급 강화석',
    tier: 4,
    successRateBonus: 40,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
  
  // 티어 5 강화석 (13-15강)
  {
    id: 'mythic-stone',
    name: '신화 강화석',
    description: '신화 속에만 존재하던 궁극의 강화석',
    tier: 5,
    successRateBonus: 50,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
  {
    id: 'guaranteed-stone',
    name: '확정 강화석',
    description: '100% 성공이 보장되는 특별한 강화석',
    tier: 5,
    successRateBonus: 0,
    protectDestruction: true,
    guaranteedSuccess: true,
  },
]

// 특수 강화 재료
export const SPECIAL_ENHANCEMENT_ITEMS: EnhancementMaterial[] = [
  {
    id: 'protection-scroll',
    name: '파괴 방지 주문서',
    description: '강화 실패 시 장비 파괴를 막아주는 주문서',
    tier: 1,
    successRateBonus: 0,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
  {
    id: 'luck-charm',
    name: '행운의 부적',
    description: '강화 성공률을 크게 높여주는 부적',
    tier: 1,
    successRateBonus: 35,
    protectDestruction: false,
    guaranteedSuccess: false,
  },
  {
    id: 'restoration-crystal',
    name: '복구 수정',
    description: '강화 실패로 하락한 강화 수치를 복구',
    tier: 1,
    successRateBonus: 0,
    protectDestruction: true,
    guaranteedSuccess: false,
  },
]

// 강화 비용 테이블
export const ENHANCEMENT_COSTS = [
  { _level: 0, gold: 1000, materials: [{ id: 'basic-stone', amount: 1 }] },
  { _level: 1, gold: 2000, materials: [{ id: 'basic-stone', amount: 2 }] },
  { _level: 2, gold: 3000, materials: [{ id: 'basic-stone', amount: 3 }] },
  { _level: 3, gold: 5000, materials: [{ id: 'refined-stone', amount: 1 }] },
  { _level: 4, gold: 8000, materials: [{ id: 'rare-stone', amount: 1 }] },
  { _level: 5, gold: 12000, materials: [{ id: 'rare-stone', amount: 2 }] },
  { _level: 6, gold: 18000, materials: [{ id: 'blessed-stone', amount: 1 }] },
  { _level: 7, gold: 25000, materials: [{ id: 'epic-stone', amount: 1 }] },
  { _level: 8, gold: 35000, materials: [{ id: 'epic-stone', amount: 2 }] },
  { _level: 9, gold: 50000, materials: [{ id: 'protection-stone', amount: 1 }] },
  { _level: 10, gold: 75000, materials: [{ id: 'legendary-stone', amount: 1 }] },
  { _level: 11, gold: 100000, materials: [{ id: 'legendary-stone', amount: 2 }] },
  { _level: 12, gold: 150000, materials: [{ id: 'divine-stone', amount: 1 }] },
  { _level: 13, gold: 250000, materials: [{ id: 'mythic-stone', amount: 1 }] },
  { _level: 14, gold: 500000, materials: [{ id: 'mythic-stone', amount: 2 }] },
]

// 강화 보너스 계산
export function getEnhancementBonus(_level: number): number {
  // 레벨당 10% 스탯 증가
  return level * 0.1
}

// 강화 실패 패널티
export function getEnhancementFailurePenalty(_level: number): {
  destruction: boolean
  levelDecrease: number
} {
  if (level < 5) {
    // 5강 미만: 파괴 없음, 레벨 감소 없음
    return { destruction: false, levelDecrease: 0 }
  } else if (level < 10) {
    // 5-9강: 파괴 없음, 레벨 1 감소
    return { destruction: false, levelDecrease: 1 }
  } else if (level < 15) {
    // 10-14강: 파괴 가능, 레벨 1 감소
    return { destruction: true, levelDecrease: 1 }
  } else {
    // 15강: 최대치
    return { destruction: false, levelDecrease: 0 }
  }
}

// 재료 검색 함수
export function findEnhancementMaterial(id: string): EnhancementMaterial | undefined {
  return [...ENHANCEMENT_STONES, ...SPECIAL_ENHANCEMENT_ITEMS].find(
    material => material.id === id
  )
}

// 티어별 재료 필터
export function getMaterialsByTier(tier: number): EnhancementMaterial[] {
  return ENHANCEMENT_STONES.filter(material => material.tier === tier)
}

// 보호 재료 필터
export function getProtectionMaterials(): EnhancementMaterial[] {
  return [...ENHANCEMENT_STONES, ...SPECIAL_ENHANCEMENT_ITEMS].filter(
    material => material.protectDestruction
  )
}