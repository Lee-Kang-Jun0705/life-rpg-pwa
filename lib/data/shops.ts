import { ShopData } from '../types/shop.types'

export const shops: Record<string, ShopData> = {
  generalShop: {
    id: 'generalShop',
    name: '일반 상점',
    description: '기본 장비와 소모품을 판매합니다',
    type: 'general',
    icon: '🏪',
    items: [
      // 무기
      {
        id: 'shop_wooden_sword',
        name: '나무 검',
        description: '기본적인 나무 검입니다',
        price: 100,
        type: 'equipment',
        rarity: 'common',
        icon: '🗡️',
        category: 'weapon',
        stock: -1,
        itemData: {
          id: 'wooden-sword',
          name: '나무 검',
          type: 'weapon',
          rarity: 'common',
          stats: {
            attack: 5,
            critRate: 0.02
          },
          levelRequirement: 1,
          icon: '🗡️',
          description: '기본적인 나무 검',
          slot: 'weapon',
          enhancementLevel: 0
        }
      },
      {
        id: 'shop_iron_sword',
        name: '철 검',
        description: '견고한 철제 검입니다',
        price: 500,
        type: 'equipment',
        rarity: 'uncommon',
        icon: '⚔️',
        category: 'weapon',
        requirements: {
          level: 10
        },
        stock: -1,
        itemData: {
          id: 'iron-sword',
          name: '철 검',
          type: 'weapon',
          rarity: 'uncommon',
          stats: {
            attack: 15,
            critRate: 0.05
          },
          levelRequirement: 10,
          icon: '⚔️',
          description: '견고한 철제 검',
          slot: 'weapon',
          enhancementLevel: 0
        }
      },
      // 방어구
      {
        id: 'shop_leather_armor',
        name: '가죽 갑옷',
        description: '기본적인 가죽 갑옷입니다',
        price: 150,
        type: 'equipment',
        rarity: 'common',
        icon: '🛡️',
        category: 'armor',
        stock: -1,
        itemData: {
          id: 'leather-armor',
          name: '가죽 갑옷',
          type: 'armor',
          rarity: 'common',
          stats: {
            defense: 3,
            hp: 20
          },
          levelRequirement: 1,
          icon: '🛡️',
          description: '기본적인 가죽 갑옷',
          slot: 'armor',
          enhancementLevel: 0
        }
      },
      {
        id: 'shop_iron_armor',
        name: '철 갑옷',
        description: '튼튼한 철제 갑옷입니다',
        price: 600,
        type: 'equipment',
        rarity: 'uncommon',
        icon: '🛡️',
        category: 'armor',
        requirements: {
          level: 10
        },
        stock: -1,
        itemData: {
          id: 'iron-armor',
          name: '철 갑옷',
          type: 'armor',
          rarity: 'uncommon',
          stats: {
            defense: 10,
            hp: 50
          },
          levelRequirement: 10,
          icon: '🛡️',
          description: '튼튼한 철제 갑옷',
          slot: 'armor',
          enhancementLevel: 0
        }
      },
      // 액세서리
      {
        id: 'shop_wooden_ring',
        name: '나무 반지',
        description: '간단한 나무 반지입니다',
        price: 80,
        type: 'equipment',
        rarity: 'common',
        icon: '💍',
        category: 'accessory',
        stock: -1,
        itemData: {
          id: 'simple-ring',
          name: '나무 반지',
          type: 'accessory',
          rarity: 'common',
          stats: {
            hp: 10,
            speed: 1
          },
          levelRequirement: 1,
          icon: '💍',
          description: '간단한 나무 반지',
          slot: 'accessory',
          enhancementLevel: 0
        }
      },
      // 소모품
      {
        id: 'shop_small_hp_potion',
        name: '소형 체력 포션',
        description: 'HP를 50 회복합니다',
        price: 20,
        type: 'consumable',
        icon: '🧪',
        category: 'potion',
        stock: -1,
        itemData: {
          effect: 'heal',
          value: 50,
          target: 'self'
        }
      },
      {
        id: 'shop_small_mp_potion',
        name: '소형 마나 포션',
        description: 'MP를 30 회복합니다',
        price: 30,
        type: 'consumable',
        icon: '💙',
        category: 'potion',
        stock: -1,
        itemData: {
          effect: 'restore_mp',
          value: 30,
          target: 'self'
        }
      }
    ]
  },
  
  skillShop: {
    id: 'skillShop',
    name: '스킬 상점',
    description: '스킬북을 구매할 수 있습니다',
    type: 'skill',
    icon: '📚',
    unlockConditions: {
      level: 5
    },
    items: [
      {
        id: 'shop_skill_power_strike',
        name: '파워 스트라이크 스킬북',
        description: '파워 스트라이크 스킬을 배울 수 있습니다',
        price: 1000,
        type: 'skill',
        icon: '📖',
        category: 'skillbook',
        requirements: {
          level: 5
        },
        stock: 1,
        itemData: {
          skillId: 'power_strike',
          learnOnPurchase: true
        }
      },
      {
        id: 'shop_skill_heal',
        name: '힐 스킬북',
        description: '힐 스킬을 배울 수 있습니다',
        price: 1500,
        type: 'skill',
        icon: '📗',
        category: 'skillbook',
        requirements: {
          level: 8
        },
        stock: 1,
        itemData: {
          skillId: 'heal',
          learnOnPurchase: true
        }
      },
      {
        id: 'shop_skill_whirlwind',
        name: '회전베기 스킬북',
        description: '회전베기 스킬을 배울 수 있습니다',
        price: 2000,
        type: 'skill',
        icon: '📕',
        category: 'skillbook',
        requirements: {
          level: 12
        },
        stock: 1,
        itemData: {
          skillId: 'whirlwind',
          learnOnPurchase: true
        }
      }
    ]
  },
  
  specialShop: {
    id: 'specialShop',
    name: '특별 상점',
    description: '희귀한 아이템을 판매합니다',
    type: 'special',
    icon: '✨',
    refreshInterval: 24 * 60 * 60 * 1000, // 24시간마다 갱신
    unlockConditions: {
      level: 20
    },
    items: [
      {
        id: 'shop_legendary_sword',
        name: '전설의 검',
        description: '엄청난 힘이 깃든 전설의 검',
        price: 10000,
        type: 'equipment',
        rarity: 'legendary',
        icon: '🗡️',
        category: 'weapon',
        requirements: {
          level: 50
        },
        stock: 1,
        itemData: {
          id: 'legendary_sword',
          name: '전설의 검',
          type: 'weapon',
          rarity: 'legendary',
          stats: {
            attack: 100,
            critRate: 0.15,
            critDamage: 0.5
          },
          levelRequirement: 50,
          icon: '🗡️',
          description: '엄청난 힘이 깃든 전설의 검',
          slot: 'weapon',
          enhancementLevel: 0
        }
      },
      {
        id: 'shop_lucky_charm',
        name: '행운의 부적',
        description: '드롭률을 20% 증가시킵니다',
        price: 5000,
        type: 'equipment',
        rarity: 'epic',
        icon: '🍀',
        category: 'accessory',
        requirements: {
          level: 30
        },
        stock: 1,
        itemData: {
          id: 'lucky_charm',
          name: '행운의 부적',
          type: 'accessory',
          rarity: 'epic',
          stats: {
            dropRate: 0.2,
            speed: 5
          },
          levelRequirement: 30,
          icon: '🍀',
          description: '드롭률을 20% 증가시킵니다',
          slot: 'accessory',
          enhancementLevel: 0
        }
      }
    ]
  }
}