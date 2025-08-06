/**
 * 보스 전용 고유 드롭 아이템
 * 각 보스마다 특별한 아이템과 스킬북을 드롭
 */

import type { BaseItem } from '@/lib/types/item-system'

// 보스 고유 아이템 정의
export const bossUniqueItems: Record<string, BaseItem[]> = {
  // 슬라임 킹 드롭
  'slime-king': [
    {
      id: 'slime-crown',
      name: '슬라임 왕관',
      type: 'accessory',
      description: '슬라임 킹이 쓰던 끈적한 왕관. 착용 시 HP 재생력이 증가한다.',
      rarity: 'rare',
      icon: '👑',
      level: 10,
      value: 5000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 10
      }
    },
    {
      id: 'skill-book-slime-shield',
      name: '스킬북: 슬라임 방패',
      type: 'consumable',
      description: '슬라임 킹의 방어 기술을 배울 수 있는 스킬북',
      rarity: 'rare',
      icon: '📗',
      level: 10,
      value: 8000,
      stackable: false,
      tradeable: true,
      consumable: {
        effect: 'learnSkill',
        value: 'slime_shield'
      }
    }
  ],

  // 고블린 킹 드롭
  'goblin-king': [
    {
      id: 'goblin-scepter',
      name: '고블린 왕의 홀',
      type: 'weapon',
      description: '고블린 킹이 사용하던 지휘봉. 소환 스킬의 위력이 증가한다.',
      rarity: 'epic',
      icon: '🏺',
      level: 30,
      value: 15000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 30
      }
    },
    {
      id: 'goblin-crown',
      name: '고블린 왕관',
      type: 'accessory',
      description: '고블린 왕국의 상징. 착용 시 리더십 스탯이 증가한다.',
      rarity: 'epic',
      icon: '👑',
      level: 30,
      value: 12000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 30
      }
    },
    {
      id: 'skill-book-summon-goblin',
      name: '스킬북: 고블린 소환',
      type: 'consumable',
      description: '고블린 부하를 소환하는 기술을 배울 수 있는 스킬북',
      rarity: 'epic',
      icon: '📕',
      level: 30,
      value: 20000,
      stackable: false,
      tradeable: true,
      consumable: {
        effect: 'learnSkill',
        value: 'summon_goblin'
      }
    }
  ],

  // 드래곤 로드 드롭
  'dragon-lord': [
    {
      id: 'dragon-scale-armor',
      name: '용린 갑옷',
      type: 'armor',
      description: '드래곤의 비늘로 만든 전설의 갑옷. 모든 속성 저항력이 증가한다.',
      rarity: 'legendary',
      icon: '🛡️',
      level: 60,
      value: 50000,
      stackable: false,
      tradeable: false, // 거래 불가
      requirements: {
        level: 60
      }
    },
    {
      id: 'dragon-fang-blade',
      name: '용아검',
      type: 'weapon',
      description: '드래곤의 이빨로 만든 검. 치명타 확률과 데미지가 크게 증가한다.',
      rarity: 'legendary',
      icon: '⚔️',
      level: 60,
      value: 60000,
      stackable: false,
      tradeable: false,
      requirements: {
        level: 60
      }
    },
    {
      id: 'dragon-heart',
      name: '용의 심장',
      type: 'material',
      description: '드래곤 로드의 심장. 최고급 아이템 제작에 필요한 전설의 재료.',
      rarity: 'mythic',
      icon: '❤️‍🔥',
      level: 60,
      value: 100000,
      stackable: false,
      tradeable: false,
      requirements: {
        level: 60
      }
    },
    {
      id: 'skill-book-dragon-breath',
      name: '스킬북: 드래곤 브레스',
      type: 'consumable',
      description: '드래곤의 브레스 공격을 배울 수 있는 전설의 스킬북',
      rarity: 'legendary',
      icon: '📙',
      level: 60,
      value: 80000,
      stackable: false,
      tradeable: false,
      consumable: {
        effect: 'learnSkill',
        value: 'dragon_breath'
      }
    }
  ],

  // 얼음 여왕 드롭
  'ice-queen': [
    {
      id: 'frozen-crown',
      name: '얼어붙은 왕관',
      type: 'accessory',
      description: '얼음 여왕의 왕관. 착용 시 빙결 저항력과 마나 재생력이 증가한다.',
      rarity: 'epic',
      icon: '❄️',
      level: 40,
      value: 18000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 40
      }
    },
    {
      id: 'ice-crystal-staff',
      name: '빙결의 지팡이',
      type: 'weapon',
      description: '얼음 마법의 위력을 증폭시키는 마법 지팡이',
      rarity: 'epic',
      icon: '🔮',
      level: 40,
      value: 22000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 40,
        class: ['mage', 'wizard']
      }
    },
    {
      id: 'skill-book-frost-armor',
      name: '스킬북: 서리 갑옷',
      type: 'consumable',
      description: '얼음 갑옷으로 자신을 보호하는 마법을 배울 수 있는 스킬북',
      rarity: 'epic',
      icon: '📘',
      level: 40,
      value: 25000,
      stackable: false,
      tradeable: true,
      consumable: {
        effect: 'learnSkill',
        value: 'frost_armor'
      }
    }
  ],

  // 언데드 리치 드롭
  'undead-lich': [
    {
      id: 'necromancer-robe',
      name: '네크로맨서의 로브',
      type: 'armor',
      description: '죽음의 마법사가 입던 로브. 어둠 속성 마법 위력이 증가한다.',
      rarity: 'legendary',
      icon: '🥼',
      level: 50,
      value: 35000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 50,
        class: ['necromancer', 'warlock', 'dark_mage']
      }
    },
    {
      id: 'soul-harvester',
      name: '영혼 수확자',
      type: 'weapon',
      description: '적의 영혼을 흡수하는 낫. 처치 시 HP와 MP를 회복한다.',
      rarity: 'legendary',
      icon: '🗡️',
      level: 50,
      value: 45000,
      stackable: false,
      tradeable: true,
      requirements: {
        level: 50
      }
    },
    {
      id: 'skill-book-raise-dead',
      name: '스킬북: 시체 소생',
      type: 'consumable',
      description: '죽은 적을 언데드로 소환하는 금단의 마법서',
      rarity: 'legendary',
      icon: '📗',
      level: 50,
      value: 50000,
      stackable: false,
      tradeable: false,
      consumable: {
        effect: 'learnSkill',
        value: 'raise_dead'
      }
    }
  ]
}

// 보스별 드롭 확률 설정
export const bossDropRates = {
  'slime-king': {
    'slime-crown': 30,              // 30% 확률
    'skill-book-slime-shield': 15   // 15% 확률
  },
  'goblin-king': {
    'goblin-scepter': 20,           // 20% 확률
    'goblin-crown': 25,             // 25% 확률
    'skill-book-summon-goblin': 10  // 10% 확률
  },
  'dragon-lord': {
    'dragon-scale-armor': 5,        // 5% 확률
    'dragon-fang-blade': 5,         // 5% 확률
    'dragon-heart': 1,              // 1% 확률
    'skill-book-dragon-breath': 3   // 3% 확률
  },
  'ice-queen': {
    'frozen-crown': 20,             // 20% 확률
    'ice-crystal-staff': 15,        // 15% 확률
    'skill-book-frost-armor': 10    // 10% 확률
  },
  'undead-lich': {
    'necromancer-robe': 10,         // 10% 확률
    'soul-harvester': 8,            // 8% 확률
    'skill-book-raise-dead': 5      // 5% 확률
  }
}

// 보스 처치 보상 계산 함수
export function calculateBossRewards(bossId: string, playerLuck: number = 0): BaseItem[] {
  const drops: BaseItem[] = []
  const bossItems = bossUniqueItems[bossId]
  const dropRates = bossDropRates[bossId as keyof typeof bossDropRates]

  if (!bossItems || !dropRates) {
    console.warn(`No drops defined for boss: ${bossId}`)
    return drops
  }

  // 각 아이템에 대해 드롭 확률 계산
  bossItems.forEach(item => {
    const baseRate = dropRates[item.id as keyof typeof dropRates] || 0
    const finalRate = baseRate + (playerLuck * 0.1) // 행운 스탯 1당 0.1% 추가
    
    if (Math.random() * 100 < finalRate) {
      drops.push(item)
    }
  })

  // 최소 1개는 드롭 보장 (보스 처치 보상)
  if (drops.length === 0 && bossItems.length > 0) {
    // 가장 드롭률이 높은 아이템 드롭
    const sortedItems = bossItems.sort((a, b) => {
      const rateA = dropRates[a.id as keyof typeof dropRates] || 0
      const rateB = dropRates[b.id as keyof typeof dropRates] || 0
      return rateB - rateA
    })
    drops.push(sortedItems[0])
  }

  return drops
}