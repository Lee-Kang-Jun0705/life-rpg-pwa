import { CompanionData } from '@/lib/types/companion'

export const COMPANION_DATA: CompanionData[] = [
  // Common 등급
  {
    id: 'companion-cat-normal',
    name: '고양이',
    species: 'cat',
    emoji: '🐱',
    description: '귀여운 고양이 친구. 민첩하고 재빠르다.',
    rarity: 'common',
    type: 'balanced',
    element: 'normal',
    baseStats: {
      hp: 50,
      attack: 15,
      defense: 10,
      speed: 20,
      critRate: 10,
      critDamage: 150
    },
    growthRates: {
      hp: 5,
      attack: 2,
      defense: 1.5,
      speed: 2.5
    },
    skills: [
      {
        id: 'cat-scratch',
        name: '할퀴기',
        description: '날카로운 발톱으로 적을 공격한다',
        icon: '🐾',
        type: 'active',
        targetType: 'enemy',
        unlockLevel: 1,
        effects: {
          damage: 120,
          statusEffect: {
            type: 'bleed',
            chance: 20,
            duration: 3
          }
        },
        cooldown: 2
      },
      {
        id: 'cat-agility',
        name: '민첩함',
        description: '타고난 민첩성으로 회피율이 증가한다',
        icon: '✨',
        type: 'passive',
        targetType: 'self',
        unlockLevel: 5,
        effects: {
          buff: {
            stat: 'speed',
            value: 15,
            duration: -1 // 영구
          }
        }
      }
    ],
    traits: [
      {
        id: 'cat-reflexes',
        name: '고양이 반사신경',
        description: '10% 확률로 공격을 회피한다',
        effects: {
          combatEffect: {
            type: 'dodge',
            value: 10,
            chance: 100
          }
        }
      }
    ]
  },
  
  {
    id: 'companion-dog-normal',
    name: '강아지',
    species: 'dog',
    emoji: '🐕',
    description: '충성스러운 강아지 친구. 주인을 지키는데 특화되어 있다.',
    rarity: 'common',
    type: 'defensive',
    element: 'normal',
    baseStats: {
      hp: 70,
      attack: 12,
      defense: 15,
      speed: 15,
      critRate: 5,
      critDamage: 130
    },
    growthRates: {
      hp: 7,
      attack: 1.5,
      defense: 2.5,
      speed: 1.5
    },
    skills: [
      {
        id: 'dog-guard',
        name: '가드',
        description: '주인을 보호하며 방어력을 높인다',
        icon: '🛡️',
        type: 'active',
        targetType: 'player',
        unlockLevel: 1,
        effects: {
          buff: {
            stat: 'defense',
            value: 30,
            duration: 3
          }
        },
        cooldown: 3
      },
      {
        id: 'loyal-companion',
        name: '충성심',
        description: '주인의 HP가 낮을 때 공격력이 증가한다',
        icon: '❤️',
        type: 'passive',
        targetType: 'self',
        unlockLevel: 7,
        effects: {
          buff: {
            stat: 'attack',
            value: 25,
            duration: -1
          }
        }
      }
    ],
    traits: [
      {
        id: 'dog-loyalty',
        name: '충성스러운 마음',
        description: '충성도 상승률 20% 증가',
        effects: {
          utilityEffect: {
            type: 'loyalty-gain',
            value: 20
          }
        }
      }
    ]
  },

  // Rare 등급
  {
    id: 'companion-flame-spirit',
    name: '화염 정령',
    species: 'spirit',
    emoji: '🔥',
    description: '작은 불꽃의 정령. 화염 마법을 다룬다.',
    rarity: 'rare',
    type: 'offensive',
    element: 'fire',
    baseStats: {
      hp: 45,
      attack: 25,
      defense: 8,
      speed: 18,
      critRate: 15,
      critDamage: 175
    },
    growthRates: {
      hp: 4,
      attack: 3.5,
      defense: 1,
      speed: 2
    },
    skills: [
      {
        id: 'flame-burst',
        name: '화염 폭발',
        description: '적에게 강력한 화염 데미지를 입힌다',
        icon: '💥',
        type: 'active',
        targetType: 'enemy',
        unlockLevel: 1,
        effects: {
          damage: 150,
          statusEffect: {
            type: 'burn',
            chance: 40,
            duration: 3
          }
        },
        cooldown: 3
      },
      {
        id: 'fire-aura',
        name: '화염의 오라',
        description: '주변의 모든 적에게 지속 데미지를 입힌다',
        icon: '🌟',
        type: 'active',
        targetType: 'all-enemies',
        unlockLevel: 10,
        effects: {
          damage: 80,
          statusEffect: {
            type: 'burn',
            chance: 20,
            duration: 2
          }
        },
        cooldown: 5
      }
    ],
    traits: [
      {
        id: 'flame-affinity',
        name: '화염 친화',
        description: '화염 속성 데미지 20% 증가',
        effects: {
          statBonus: {
            stat: 'attack',
            value: 20
          }
        }
      }
    ]
  },

  {
    id: 'companion-water-fairy',
    name: '물의 요정',
    species: 'fairy',
    emoji: '🧚',
    description: '치유의 힘을 가진 물의 요정.',
    rarity: 'rare',
    type: 'support',
    element: 'water',
    baseStats: {
      hp: 55,
      attack: 10,
      defense: 12,
      speed: 22,
      critRate: 8,
      critDamage: 140
    },
    growthRates: {
      hp: 5.5,
      attack: 1,
      defense: 2,
      speed: 3
    },
    skills: [
      {
        id: 'healing-water',
        name: '치유의 물결',
        description: '주인의 HP를 회복시킨다',
        icon: '💧',
        type: 'active',
        targetType: 'player',
        unlockLevel: 1,
        effects: {
          healing: 150
        },
        cooldown: 3
      },
      {
        id: 'water-shield',
        name: '물의 보호막',
        description: '일정량의 데미지를 흡수하는 보호막을 생성한다',
        icon: '🛡️',
        type: 'active',
        targetType: 'player',
        unlockLevel: 8,
        effects: {
          buff: {
            stat: 'defense',
            value: 50,
            duration: 3
          }
        },
        cooldown: 4
      }
    ],
    traits: [
      {
        id: 'healing-boost',
        name: '치유 증폭',
        description: '모든 치유 효과 25% 증가',
        effects: {
          statBonus: {
            stat: 'hp',
            value: 25
          }
        }
      }
    ]
  },

  // Epic 등급
  {
    id: 'companion-lightning-wolf',
    name: '번개 늑대',
    species: 'wolf',
    emoji: '⚡',
    description: '번개의 힘을 다루는 늑대. 빠르고 강력하다.',
    rarity: 'epic',
    type: 'offensive',
    element: 'wind',
    baseStats: {
      hp: 65,
      attack: 30,
      defense: 15,
      speed: 35,
      critRate: 20,
      critDamage: 200
    },
    growthRates: {
      hp: 6,
      attack: 4,
      defense: 2,
      speed: 4.5
    },
    skills: [
      {
        id: 'lightning-strike',
        name: '번개 강타',
        description: '번개로 적을 강타하여 마비시킨다',
        icon: '⚡',
        type: 'active',
        targetType: 'enemy',
        unlockLevel: 1,
        effects: {
          damage: 180,
          statusEffect: {
            type: 'paralyze',
            chance: 30,
            duration: 2
          }
        },
        cooldown: 3
      },
      {
        id: 'thunder-howl',
        name: '천둥의 울부짖음',
        description: '모든 적의 속도를 감소시킨다',
        icon: '🌩️',
        type: 'active',
        targetType: 'all-enemies',
        unlockLevel: 12,
        effects: {
          debuff: {
            stat: 'speed',
            value: 30,
            duration: 3
          }
        },
        cooldown: 5
      },
      {
        id: 'electric-charge',
        name: '전기 충전',
        description: '다음 공격의 치명타 확률과 데미지가 증가한다',
        icon: '💫',
        type: 'active',
        targetType: 'self',
        unlockLevel: 15,
        effects: {
          buff: {
            stat: 'critRate',
            value: 50,
            duration: 2
          }
        },
        cooldown: 4
      }
    ],
    traits: [
      {
        id: 'swift-hunter',
        name: '신속한 사냥꾼',
        description: '속도가 25% 증가하고 선제공격 확률 증가',
        effects: {
          statBonus: {
            stat: 'speed',
            value: 25
          }
        }
      }
    ],
    evolution: {
      toCompanionId: 'companion-storm-wolf',
      requiredLevel: 30,
      requiredItems: [
        { itemId: 'thunder-stone', quantity: 1 }
      ]
    }
  },

  // Legendary 등급
  {
    id: 'companion-baby-dragon',
    name: '아기 드래곤',
    species: 'dragon',
    emoji: '🐉',
    description: '전설의 드래곤 새끼. 성장 잠재력이 무한하다.',
    rarity: 'legendary',
    type: 'balanced',
    element: 'fire',
    baseStats: {
      hp: 80,
      attack: 35,
      defense: 25,
      speed: 25,
      critRate: 15,
      critDamage: 180
    },
    growthRates: {
      hp: 8,
      attack: 5,
      defense: 3.5,
      speed: 3
    },
    skills: [
      {
        id: 'dragon-breath',
        name: '드래곤 브레스',
        description: '강력한 화염을 내뿜어 모든 적을 공격한다',
        icon: '🔥',
        type: 'active',
        targetType: 'all-enemies',
        unlockLevel: 1,
        effects: {
          damage: 120,
          statusEffect: {
            type: 'burn',
            chance: 50,
            duration: 3
          }
        },
        cooldown: 4
      },
      {
        id: 'dragon-scales',
        name: '용의 비늘',
        description: '받는 데미지를 감소시킨다',
        icon: '🛡️',
        type: 'passive',
        targetType: 'self',
        unlockLevel: 10,
        effects: {
          buff: {
            stat: 'defense',
            value: 30,
            duration: -1
          }
        }
      },
      {
        id: 'dragon-roar',
        name: '용의 포효',
        description: '모든 아군의 공격력을 증가시킨다',
        icon: '🗣️',
        type: 'active',
        targetType: 'all-allies',
        unlockLevel: 20,
        effects: {
          buff: {
            stat: 'attack',
            value: 35,
            duration: 4
          }
        },
        cooldown: 6
      }
    ],
    traits: [
      {
        id: 'dragon-pride',
        name: '용의 자존심',
        description: 'HP가 50% 이하일 때 모든 스탯 30% 증가',
        effects: {
          statBonus: {
            stat: 'attack',
            value: 30
          }
        }
      },
      {
        id: 'ancient-bloodline',
        name: '고대의 혈통',
        description: '경험치 획득량 50% 증가',
        effects: {
          utilityEffect: {
            type: 'exp-bonus',
            value: 50
          }
        }
      }
    ],
    evolution: {
      toCompanionId: 'companion-ancient-dragon',
      requiredLevel: 50,
      requiredItems: [
        { itemId: 'dragon-heart', quantity: 1 },
        { itemId: 'ancient-scale', quantity: 5 }
      ]
    }
  },

  // Mythic 등급
  {
    id: 'companion-phoenix',
    name: '불사조',
    species: 'phoenix',
    emoji: '🦅',
    description: '죽음에서 부활하는 전설의 불사조.',
    rarity: 'mythic',
    type: 'support',
    element: 'fire',
    baseStats: {
      hp: 100,
      attack: 40,
      defense: 30,
      speed: 30,
      critRate: 20,
      critDamage: 200
    },
    growthRates: {
      hp: 10,
      attack: 6,
      defense: 4,
      speed: 4
    },
    skills: [
      {
        id: 'phoenix-rebirth',
        name: '불사조의 부활',
        description: '전투 중 한 번만 부활할 수 있다',
        icon: '🔥',
        type: 'passive',
        targetType: 'self',
        unlockLevel: 1,
        effects: {
          healing: 100 // HP 100% 회복
        }
      },
      {
        id: 'healing-flames',
        name: '치유의 불꽃',
        description: '모든 아군의 HP를 회복시킨다',
        icon: '❤️‍🔥',
        type: 'active',
        targetType: 'all-allies',
        unlockLevel: 10,
        effects: {
          healing: 200
        },
        cooldown: 5
      },
      {
        id: 'phoenix-blessing',
        name: '불사조의 축복',
        description: '주인이 치명적인 피해를 받을 때 한 번 무효화한다',
        icon: '✨',
        type: 'passive',
        targetType: 'player',
        unlockLevel: 20,
        effects: {
          combatEffect: {
            type: 'shield',
            value: 100,
            chance: 100
          }
        }
      },
      {
        id: 'solar-flare',
        name: '태양 플레어',
        description: '모든 적에게 막대한 화염 데미지를 입힌다',
        icon: '☀️',
        type: 'active',
        targetType: 'all-enemies',
        unlockLevel: 30,
        effects: {
          damage: 250,
          statusEffect: {
            type: 'burn',
            chance: 100,
            duration: 5
          }
        },
        cooldown: 8
      }
    ],
    traits: [
      {
        id: 'eternal-flame',
        name: '영원한 불꽃',
        description: '매 턴 HP 5% 자동 회복',
        effects: {
          combatEffect: {
            type: 'lifesteal',
            value: 5,
            chance: 100
          }
        }
      },
      {
        id: 'mythic-presence',
        name: '신화적 존재',
        description: '모든 보상 100% 증가',
        effects: {
          utilityEffect: {
            type: 'gold-bonus',
            value: 100
          }
        }
      }
    ]
  }
]

// 희귀도별 컴패니언 분류
export const COMPANIONS_BY_RARITY = {
  common: COMPANION_DATA.filter(c => c.rarity === 'common'),
  rare: COMPANION_DATA.filter(c => c.rarity === 'rare'),
  epic: COMPANION_DATA.filter(c => c.rarity === 'epic'),
  legendary: COMPANION_DATA.filter(c => c.rarity === 'legendary'),
  mythic: COMPANION_DATA.filter(c => c.rarity === 'mythic')
}

// 타입별 컴패니언 분류
export const COMPANIONS_BY_TYPE = {
  offensive: COMPANION_DATA.filter(c => c.type === 'offensive'),
  defensive: COMPANION_DATA.filter(c => c.type === 'defensive'),
  support: COMPANION_DATA.filter(c => c.type === 'support'),
  balanced: COMPANION_DATA.filter(c => c.type === 'balanced')
}

// 컴패니언 ID로 데이터 가져오기
export function getCompanionById(id: string): CompanionData | undefined {
  return COMPANION_DATA.find(c => c.id === id)
}