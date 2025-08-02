// 확장된 장비 시스템 타입 정의
// 150종 이상의 장비와 세트 효과 시스템

export type EquipmentType = 'weapon' | 'shield' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'accessory'
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type EquipmentTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// 기본 스탯
export interface EquipmentStats {
  attack?: number
  defense?: number
  hp?: number
  health?: number // 건강 스탯 추가
  speed?: number
  critRate?: number
  critDamage?: number
  elementalDamage?: number
  resistance?: number
  luck?: number
  expBonus?: number
  goldBonus?: number
}

// 특수 효과
export interface SpecialEffect {
  id: string
  name: string
  description: string
  type: 'passive' | 'active' | 'conditional'
  trigger?: 'onAttack' | 'onDefend' | 'onSkill' | 'onCrit' | 'onLowHp' | 'always'
  chance?: number // 발동 확률 (0-100)
  value?: number
  duration?: number // 턴 수
}

// 장비 인터페이스
export interface Equipment {
  id: string
  name: string
  description: string
  icon?: string // 아이템 아이콘
  type: EquipmentType
  rarity: EquipmentRarity
  tier: EquipmentTier
  level: number // 요구 레벨
  stats: EquipmentStats
  specialEffects?: SpecialEffect[]
  setId?: string // 세트 아이템인 경우
  price: number
  enhancementLevel?: number // 강화 레벨 (0-15)
  locked?: boolean // 강화 시 파괴 방지
}

// 세트 효과
export interface SetBonus {
  requiredPieces: number // 필요한 세트 아이템 개수
  stats?: EquipmentStats
  specialEffect?: SpecialEffect
  description: string
}

// 장비 세트
export interface EquipmentSet {
  id: string
  name: string
  description: string
  pieces: string[] // 장비 ID 목록
  setBonuses: SetBonus[] // 2세트, 4세트, 6세트 효과 등
  tier: EquipmentTier
}

// 장착된 장비 상태
export interface EquippedGear {
  weapon?: Equipment
  shield?: Equipment
  helmet?: Equipment
  armor?: Equipment
  gloves?: Equipment
  boots?: Equipment
  accessory1?: Equipment
  accessory2?: Equipment
  accessory3?: Equipment
}

// 장비 인벤토리
export interface EquipmentInventory {
  equipment: Equipment[]
  maxSlots: number
  sortBy: 'type' | 'rarity' | 'level' | 'power'
}

// 강화 재료
export interface EnhancementMaterial {
  id: string
  name: string
  description: string
  tier: EquipmentTier
  successRateBonus: number // 강화 성공률 증가
  protectDestruction?: boolean // 파괴 방지
  guaranteedSuccess?: boolean // 100% 성공
}

// 강화 시스템
export interface EnhancementInfo {
  level: number
  successRate: number
  cost: number
  materials: { id: string; amount: number }[]
  statMultiplier: number // 스탯 증가 배수
}

// 장비 필터 옵션
export interface EquipmentFilter {
  type?: EquipmentType[]
  rarity?: EquipmentRarity[]
  tier?: EquipmentTier[]
  minLevel?: number
  maxLevel?: number
  hasSetBonus?: boolean
  hasSpecialEffect?: boolean
}

// 장비 정렬 옵션
export type EquipmentSortOption =
  | 'name'
  | 'level'
  | 'rarity'
  | 'type'
  | 'power'
  | 'price'
  | 'enhancementLevel'

// 장비 스탯 계산
export function calculateEquipmentPower(equipment: Equipment): number {
  const stats = equipment.stats
  const basepower =
    (stats.attack || 0) * 2 +
    (stats.defense || 0) * 1.5 +
    (stats.hp || 0) * 0.1 +
    (stats.speed || 0) * 1.2 +
    (stats.critRate || 0) * 3 +
    (stats.critDamage || 0) * 2

  // 강화 레벨에 따른 보너스
  const enhancementBonus = (equipment.enhancementLevel || 0) * 0.1

  // 희귀도에 따른 보너스
  const rarityMultiplier = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2,
    legendary: 3,
    mythic: 5
  }[equipment.rarity]

  return Math.floor(basepower * (1 + enhancementBonus) * rarityMultiplier)
}

// 세트 보너스 확인
export function getActiveSetBonuses(
  _equippedGear: EquippedGear,
  _equipmentSets: EquipmentSet[]
): { setId: string; bonuses: SetBonus[] }[] {
  const activeBonuses: { setId: string; bonuses: SetBonus[] }[] = []

  // 장착된 장비 목록
  const equippedItems = Object.values(equippedGear).filter(Boolean) as Equipment[]

  // 각 세트별로 확인
  for (const set of equipmentSets) {
    const equippedPieces = equippedItems.filter(item =>
      item.setId === set.id
    ).length

    if (equippedPieces > 0) {
      const bonuses = set.setBonuses.filter(bonus =>
        equippedPieces >= bonus.requiredPieces
      )

      if (bonuses.length > 0) {
        activeBonuses.push({ setId: set.id, bonuses })
      }
    }
  }

  return activeBonuses
}

// 총 스탯 계산 (장비 + 세트 보너스)
export function calculateTotalStats(
  _equippedGear: EquippedGear,
  _equipmentSets: EquipmentSet[]
): EquipmentStats {
  const totalStats: EquipmentStats = {}

  // 장비 스탯 합산
  const equippedItems = Object.values(equippedGear).filter(Boolean) as Equipment[]

  for (const item of equippedItems) {
    for (const [stat, value] of Object.entries(item.stats)) {
      totalStats[stat as keyof EquipmentStats] =
        (totalStats[stat as keyof EquipmentStats] || 0) + value
    }
  }

  // 세트 보너스 적용
  const activeBonuses = getActiveSetBonuses(equippedGear, equipmentSets)

  for (const { bonuses } of activeBonuses) {
    for (const bonus of bonuses) {
      if (bonus.stats) {
        for (const [stat, value] of Object.entries(bonus.stats)) {
          totalStats[stat as keyof EquipmentStats] =
            (totalStats[stat as keyof EquipmentStats] || 0) + value
        }
      }
    }
  }

  return totalStats
}

// 강화 성공률 계산
export function calculateEnhancementSuccessRate(
  currentLevel: number,
  baseMaterial?: EnhancementMaterial
): number {
  // 기본 성공률 (레벨이 높을수록 감소)
  const baseRates = [
    100, // 0->1
    100, // 1->2
    100, // 2->3
    95,  // 3->4
    90,  // 4->5
    85,  // 5->6
    75,  // 6->7
    65,  // 7->8
    55,  // 8->9
    45,  // 9->10
    35,  // 10->11
    25,  // 11->12
    15,  // 12->13
    10,  // 13->14
    5   // 14->15
  ]

  const baseRate = baseRates[currentLevel] || 5
  const materialBonus = baseMaterial?.successRateBonus || 0

  return Math.min(100, baseRate + materialBonus)
}
