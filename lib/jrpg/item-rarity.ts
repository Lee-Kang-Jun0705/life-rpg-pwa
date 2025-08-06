// 아이템 등급 시스템
export enum ItemRarity {
  COMMON = 'common',        // 일반 (회색)
  UNCOMMON = 'uncommon',    // 고급 (녹색)
  RARE = 'rare',            // 희귀 (파란색)
  EPIC = 'epic',            // 영웅 (보라색)
  LEGENDARY = 'legendary',  // 전설 (주황색)
  MYTHIC = 'mythic'        // 신화 (빨간색)
}

export const RARITY_COLORS = {
  [ItemRarity.COMMON]: '#9CA3AF',      // gray-400
  [ItemRarity.UNCOMMON]: '#10B981',    // emerald-500
  [ItemRarity.RARE]: '#3B82F6',        // blue-500
  [ItemRarity.EPIC]: '#A855F7',        // purple-500
  [ItemRarity.LEGENDARY]: '#F97316',   // orange-500
  [ItemRarity.MYTHIC]: '#EF4444'       // red-500
} as const

export const RARITY_GLOW_COLORS = {
  [ItemRarity.COMMON]: 'rgba(156, 163, 175, 0.3)',
  [ItemRarity.UNCOMMON]: 'rgba(16, 185, 129, 0.3)',
  [ItemRarity.RARE]: 'rgba(59, 130, 246, 0.3)',
  [ItemRarity.EPIC]: 'rgba(168, 85, 247, 0.3)',
  [ItemRarity.LEGENDARY]: 'rgba(249, 115, 22, 0.3)',
  [ItemRarity.MYTHIC]: 'rgba(239, 68, 68, 0.3)'
} as const

export const RARITY_MULTIPLIERS = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 1.5,
  [ItemRarity.RARE]: 2,
  [ItemRarity.EPIC]: 3,
  [ItemRarity.LEGENDARY]: 5,
  [ItemRarity.MYTHIC]: 10
} as const