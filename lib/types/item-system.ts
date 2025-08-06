/**
 * 아이템 시스템 타입 정의
 * 랜덤 스탯, 세트 효과, 조합 시스템 포함
 */

// 아이템 희귀도 - 6단계 시스템
export const ItemRarity = {
  COMMON: 'common',      // 일반 (회색) - 기본 스탯
  MAGIC: 'magic',        // 매직 (파란색) - 추가 스탯 1-2개
  RARE: 'rare',          // 레어 (노란색) - 추가 스탯 2-3개 + 특수 효과
  EPIC: 'epic',          // 에픽 (보라색) - 추가 스탯 3-4개 + 강력한 효과
  LEGENDARY: 'legendary', // 전설 (주황색) - 추가 스탯 4-5개 + 고유 효과
  MYTHIC: 'mythic'       // 신화 (빨간색) - 추가 스탯 5-6개 + 세트 효과
} as const

export type ItemRarity = typeof ItemRarity[keyof typeof ItemRarity]

// 아이템 타입
export const ItemType = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material'
} as const

export type ItemType = typeof ItemType[keyof typeof ItemType]

// 스탯 타입
export const StatType = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  HP: 'hp',
  MP: 'mp',
  SPEED: 'speed',
  CRIT_RATE: 'critRate',
  CRIT_DAMAGE: 'critDamage',
  DODGE: 'dodge',
  LIFE_STEAL: 'lifeSteal',
  MP_REGEN: 'mpRegen',
  EXP_BONUS: 'expBonus',
  GOLD_BONUS: 'goldBonus'
} as const

export type StatType = typeof StatType[keyof typeof StatType]

// 기본 스탯
export interface BaseStats {
  readonly [StatType.ATTACK]?: number
  readonly [StatType.DEFENSE]?: number
  readonly [StatType.HP]?: number
  readonly [StatType.MP]?: number
  readonly [StatType.SPEED]?: number
}

// 랜덤 스탯
export interface RandomStat {
  readonly type: StatType
  readonly value: number
  readonly tier: 1 | 2 | 3 | 4 | 5 // 스탯 티어 (높을수록 좋음)
}

// 특수 효과
export interface SpecialEffect {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly type: 'passive' | 'active' | 'conditional'
  readonly trigger?: TriggerCondition
  readonly effect: Effect
}

// 발동 조건
export interface TriggerCondition {
  readonly type: 'onAttack' | 'onHit' | 'onCrit' | 'onKill' | 'onLowHp' | 'always'
  readonly chance?: number // 0-100
  readonly threshold?: number // HP 비율 등
}

// 효과
export interface Effect {
  readonly type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon'
  readonly value: number | { min: number; max: number }
  readonly duration?: number // 턴 수
  readonly stackable?: boolean
}

// 소비 아이템 효과
export interface ConsumableEffect {
  readonly type: 'heal' | 'buff' | 'teleport' | 'skill_book' | 'quest' | 'collect'
  readonly value?: number
  readonly duration?: number
  readonly skillId?: string // skill_book 타입일 때 사용
  readonly reveals?: string // quest 타입일 때 사용
  readonly required?: number // collect 타입일 때 필요 개수
  readonly reward?: string // collect 타입일 때 보상
}

// 아이템 인터페이스
export interface Item {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly type: ItemType
  readonly rarity: ItemRarity
  readonly level: number
  readonly baseStats: Readonly<BaseStats>
  readonly randomStats: ReadonlyArray<RandomStat>
  readonly specialEffects?: ReadonlyArray<SpecialEffect>
  readonly setId?: string
  readonly value: number // 판매 가격
  readonly stackable: boolean
  readonly maxStack?: number
  readonly consumableEffect?: ConsumableEffect // 소비 아이템 효과
}

// 생성된 아이템 (인스턴스)
export interface GeneratedItem extends Item {
  readonly uniqueId: string // 고유 ID
  readonly generatedAt: number // 생성 시간
  readonly seed: number // 랜덤 시드
  readonly icon?: string // 아이템 아이콘 (이모지 또는 URL)
}

// 강화 가능한 아이템 (강화 시스템용)
export interface EnhanceableItem extends GeneratedItem {
  enhancementLevel?: number // 강화 레벨
  stats?: BaseStats // 현재 스탯 (강화 적용)
  quantity?: number // 아이템 수량
}

// 세트 효과
export interface SetBonus {
  readonly requiredPieces: 2 | 3 | 4 | 5 | 6
  readonly stats?: Partial<BaseStats>
  readonly specialEffect?: SpecialEffect
  readonly description: string
}

// 아이템 세트
export interface ItemSet {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly itemIds: ReadonlyArray<string>
  readonly bonuses: ReadonlyArray<SetBonus>
}

// 아이템 생성 옵션
export interface ItemGenerationOptions {
  readonly baseItemId: string
  readonly level: number
  readonly rarity: ItemRarity
  readonly guaranteedStats?: ReadonlyArray<StatType>
  readonly seed?: number
}

// 아이템 생성 결과
export type ItemGenerationResult =
  | { success: true; item: GeneratedItem }
  | { success: false; error: ItemGenerationError }

// 아이템 생성 에러
export interface ItemGenerationError {
  readonly code: 'INVALID_BASE_ITEM' | 'INVALID_LEVEL' | 'GENERATION_FAILED'
  readonly message: string
}

// 아이템 조합 레시피
export interface CraftingRecipe {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly materials: ReadonlyArray<{
    readonly itemId: string
    readonly quantity: number
  }>
  readonly results: ReadonlyArray<{
    readonly itemId: string
    readonly quantity: number
    readonly chance: number // 0-100
  }>
  readonly requirements?: {
    readonly level?: number
    readonly crafts?: number // 이전 제작 횟수
  }
}

// 아이템 비교 결과
export interface ItemComparison {
  readonly better: ReadonlyArray<{ stat: StatType; difference: number }>
  readonly worse: ReadonlyArray<{ stat: StatType; difference: number }>
  readonly same: ReadonlyArray<StatType>
  readonly overallScore: number // -1 ~ 1
}

// 인벤토리 아이템
export interface InventoryItem {
  readonly item: GeneratedItem
  readonly quantity: number
  readonly equipped: boolean
  readonly locked: boolean // 실수로 판매/분해 방지
  readonly obtainedAt: number
}

// 타입 가드 함수들
export function isValidItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    Object.values(ItemType).includes(item.type as ItemType) &&
    Object.values(ItemRarity).includes(item.rarity as ItemRarity) &&
    typeof item.level === 'number' &&
    typeof item.baseStats === 'object' &&
    Array.isArray(item.randomStats) &&
    typeof item.value === 'number' &&
    typeof item.stackable === 'boolean'
  )
}

export function isGeneratedItem(value: unknown): value is GeneratedItem {
  if (!isValidItem(value)) {
    return false
  }

  const item = value as unknown as Record<string, unknown>

  return (
    typeof item.uniqueId === 'string' &&
    typeof item.generatedAt === 'number' &&
    typeof item.seed === 'number'
  )
}

// 유틸리티 타입
export type ItemFilter = {
  readonly type?: ItemType[]
  readonly rarity?: ItemRarity[]
  readonly minLevel?: number
  readonly maxLevel?: number
  readonly hasSetBonus?: boolean
  readonly hasSpecialEffect?: boolean
}

export type ItemSortOption =
  | 'name'
  | 'level'
  | 'rarity'
  | 'type'
  | 'value'
  | 'power'
  | 'obtainedAt'
