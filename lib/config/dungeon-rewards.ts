// 던전 보상 설정
export interface DungeonReward {
  dungeonId: number
  items: Array<{
    itemId: string
    minQuantity: number
    maxQuantity: number
    dropRate: number // 0-100
    isFirstClearOnly?: boolean
  }>
}

export const DUNGEON_REWARDS: DungeonReward[] = [
  {
    dungeonId: 1, // 초보자의 숲
    items: [
      { itemId: 'health-potion-small', minQuantity: 1, maxQuantity: 3, dropRate: 80 },
      { itemId: 'slime-gel', minQuantity: 2, maxQuantity: 5, dropRate: 100 },
      { itemId: 'wooden-sword', minQuantity: 1, maxQuantity: 1, dropRate: 30, isFirstClearOnly: true }
    ]
  },
  {
    dungeonId: 2, // 고블린 동굴
    items: [
      { itemId: 'health-potion-small', minQuantity: 2, maxQuantity: 4, dropRate: 70 },
      { itemId: 'goblin-tooth', minQuantity: 3, maxQuantity: 8, dropRate: 100 },
      { itemId: 'leather-armor', minQuantity: 1, maxQuantity: 1, dropRate: 25, isFirstClearOnly: true },
      { itemId: 'attack-buff-scroll', minQuantity: 1, maxQuantity: 2, dropRate: 40 }
    ]
  },
  {
    dungeonId: 3, // 버려진 광산
    items: [
      { itemId: 'health-potion-medium', minQuantity: 1, maxQuantity: 3, dropRate: 60 },
      { itemId: 'enhancement-stone-low', minQuantity: 1, maxQuantity: 3, dropRate: 50 },
      { itemId: 'iron-sword', minQuantity: 1, maxQuantity: 1, dropRate: 20, isFirstClearOnly: true },
      { itemId: 'simple-ring', minQuantity: 1, maxQuantity: 1, dropRate: 15, isFirstClearOnly: true }
    ]
  },
  {
    dungeonId: 4, // 얼어붙은 호수
    items: [
      { itemId: 'health-potion-medium', minQuantity: 2, maxQuantity: 4, dropRate: 70 },
      { itemId: 'defense-buff-scroll', minQuantity: 1, maxQuantity: 2, dropRate: 50 },
      { itemId: 'iron-armor', minQuantity: 1, maxQuantity: 1, dropRate: 20, isFirstClearOnly: true },
      { itemId: 'enhancement-stone-low', minQuantity: 2, maxQuantity: 4, dropRate: 60 }
    ]
  },
  {
    dungeonId: 5, // 용의 둥지
    items: [
      { itemId: 'health-potion-large', minQuantity: 1, maxQuantity: 3, dropRate: 60 },
      { itemId: 'steel-sword', minQuantity: 1, maxQuantity: 1, dropRate: 15, isFirstClearOnly: true },
      { itemId: 'silver-necklace', minQuantity: 1, maxQuantity: 1, dropRate: 20, isFirstClearOnly: true },
      { itemId: 'enhancement-stone-mid', minQuantity: 1, maxQuantity: 2, dropRate: 40 }
    ]
  },
  {
    dungeonId: 6, // 늪지대
    items: [
      { itemId: 'health-potion-large', minQuantity: 2, maxQuantity: 4, dropRate: 70 },
      { itemId: 'attack-buff-scroll', minQuantity: 2, maxQuantity: 3, dropRate: 60 },
      { itemId: 'defense-buff-scroll', minQuantity: 2, maxQuantity: 3, dropRate: 60 },
      { itemId: 'enhancement-stone-mid', minQuantity: 1, maxQuantity: 3, dropRate: 50 }
    ]
  },
  {
    dungeonId: 7, // 사막 신전
    items: [
      { itemId: 'health-potion-large', minQuantity: 3, maxQuantity: 5, dropRate: 80 },
      { itemId: 'mysterious-letter', minQuantity: 1, maxQuantity: 1, dropRate: 10, isFirstClearOnly: true },
      { itemId: 'enhancement-stone-mid', minQuantity: 2, maxQuantity: 4, dropRate: 60 },
      { itemId: 'old-key', minQuantity: 1, maxQuantity: 1, dropRate: 5, isFirstClearOnly: true }
    ]
  }
  // 높은 레벨 던전들은 나중에 추가
]

// 보상 계산 함수
export function calculateDungeonRewards(dungeonId: number, isFirstClear: boolean): Array<{ itemId: string; quantity: number }> {
  const dungeonReward = DUNGEON_REWARDS.find(dr => dr.dungeonId === dungeonId)
  if (!dungeonReward) return []
  
  const rewards: Array<{ itemId: string; quantity: number }> = []
  
  dungeonReward.items.forEach(itemReward => {
    // 첫 클리어 전용 아이템인데 첫 클리어가 아니면 스킵
    if (itemReward.isFirstClearOnly && !isFirstClear) return
    
    // 드롭 확률 체크
    const roll = Math.random() * 100
    if (roll <= itemReward.dropRate) {
      // 수량 계산
      const quantity = Math.floor(
        Math.random() * (itemReward.maxQuantity - itemReward.minQuantity + 1) + itemReward.minQuantity
      )
      
      // 반복 클리어 시 90% 감소 (올림 처리로 최소 1개 보장)
      const finalQuantity = isFirstClear ? quantity : Math.max(1, Math.ceil(quantity * 0.1))
      
      rewards.push({
        itemId: itemReward.itemId,
        quantity: finalQuantity
      })
    }
  })
  
  return rewards
}