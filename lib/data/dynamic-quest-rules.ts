import { DynamicQuestRule } from '@/lib/types/dynamic-quest'

export const DYNAMIC_QUEST_RULES: DynamicQuestRule[] = [
  // 전투 선호 플레이어용 퀘스트
  {
    id: 'dq-rule-combat-lover',
    name: '전투 애호가',
    description: '전투를 즐기는 플레이어를 위한 퀘스트',
    conditions: {
      minLevel: 5,
      playerBehavior: {
        minBattles: 50,
        preferredCategory: ['battle']
      }
    },
    template: {
      titleTemplates: [
        '{monsterType} 사냥꾼',
        '전투의 달인',
        '{element}의 정복자',
        '최강의 전사를 향해'
      ],
      descriptionTemplates: [
        '최근 {monsterType}의 개체수가 급증했습니다. 처치를 부탁드립니다.',
        '당신의 전투 실력을 시험해볼 때입니다.',
        '{element} 속성 몬스터들이 날뛰고 있습니다.'
      ],
      typeOptions: ['daily', 'side'],
      categoryOptions: ['battle'],
      objectiveTemplates: [
        {
          type: 'kill',
          targetOptions: ['any', 'specific-element', 'specific-type'],
          quantityRange: { min: 10, max: 50 },
          descriptionTemplate: '{target} {quantity}마리 처치'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 10 * objectives',
        goldFormula: 'level * 5 * objectives',
        itemPools: [
          {
            rarity: 'common',
            items: ['health-potion', 'energy-potion'],
            chance: 0.8
          },
          {
            rarity: 'rare',
            items: ['attack-boost', 'defense-boost'],
            chance: 0.2
          }
        ]
      }
    },
    generation: {
      priority: 10,
      maxActive: 3,
      cooldown: 4,
      expireTime: 24
    }
  },

  // 던전 탐험가용 퀘스트
  {
    id: 'dq-rule-dungeon-explorer',
    name: '던전 탐험가',
    description: '던전 탐험을 즐기는 플레이어를 위한 퀘스트',
    conditions: {
      minLevel: 10,
      playerBehavior: {
        minDungeonClears: 20,
        preferredCategory: ['exploration']
      }
    },
    template: {
      titleTemplates: [
        '{dungeonName}의 비밀',
        '숨겨진 보물을 찾아서',
        '던전 마스터의 도전',
        '{difficulty} 난이도 정복'
      ],
      descriptionTemplates: [
        '{dungeonName}에 새로운 비밀이 발견되었습니다.',
        '특별한 보상이 기다리는 던전에 도전해보세요.',
        '당신의 실력에 맞는 새로운 도전이 기다립니다.'
      ],
      typeOptions: ['daily', 'weekly'],
      categoryOptions: ['exploration'],
      objectiveTemplates: [
        {
          type: 'dungeon',
          targetOptions: ['specific-dungeon', 'any-dungeon', 'difficulty-based'],
          quantityRange: { min: 1, max: 5 },
          descriptionTemplate: '{target} {quantity}회 클리어'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 20 * objectives',
        goldFormula: 'level * 15 * objectives',
        itemPools: [
          {
            rarity: 'rare',
            items: ['dungeon-key', 'treasure-map'],
            chance: 0.5
          },
          {
            rarity: 'epic',
            items: ['epic-equipment-box'],
            chance: 0.1
          }
        ]
      }
    },
    generation: {
      priority: 8,
      maxActive: 2,
      cooldown: 6,
      expireTime: 48
    }
  },

  // 수집가용 퀘스트
  {
    id: 'dq-rule-collector',
    name: '수집가',
    description: '아이템 수집을 즐기는 플레이어를 위한 퀘스트',
    conditions: {
      minLevel: 3,
      playerBehavior: {
        preferredCategory: ['collection']
      }
    },
    template: {
      titleTemplates: [
        '희귀한 {itemType} 수집',
        '수집가의 꿈',
        '{npcName}의 부탁',
        '특별한 재료 모으기'
      ],
      descriptionTemplates: [
        '{npcName}이(가) 특별한 {itemType}을(를) 찾고 있습니다.',
        '희귀한 재료를 모아 특별한 보상을 받으세요.',
        '이번 주 한정! 특별한 수집 퀘스트입니다.'
      ],
      typeOptions: ['side', 'event'],
      categoryOptions: ['collection'],
      objectiveTemplates: [
        {
          type: 'collect',
          targetOptions: ['common-materials', 'rare-materials', 'event-items'],
          quantityRange: { min: 5, max: 20 },
          descriptionTemplate: '{target} {quantity}개 수집'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 5 * objectives',
        goldFormula: 'level * 10 * objectives',
        itemPools: [
          {
            rarity: 'common',
            items: ['crafting-materials', 'collection-box'],
            chance: 0.9
          },
          {
            rarity: 'rare',
            items: ['rare-material-box'],
            chance: 0.3
          }
        ]
      }
    },
    generation: {
      priority: 6,
      maxActive: 4,
      cooldown: 3,
      expireTime: 72
    }
  },

  // 복귀 유저용 퀘스트
  {
    id: 'dq-rule-comeback',
    name: '돌아온 영웅',
    description: '오랜만에 접속한 플레이어를 위한 특별 퀘스트',
    conditions: {
      playerBehavior: {
        inactivityDays: 7
      }
    },
    template: {
      titleTemplates: [
        '돌아온 영웅을 환영합니다!',
        '복귀 선물',
        '다시 시작하는 모험',
        '특별한 환영 선물'
      ],
      descriptionTemplates: [
        '오랜만에 돌아오신 것을 환영합니다! 특별한 보상을 준비했어요.',
        '당신이 없는 동안 많은 일이 있었습니다. 다시 시작해볼까요?',
        '복귀를 축하하며 특별한 퀘스트를 준비했습니다.'
      ],
      typeOptions: ['event'],
      categoryOptions: ['achievement'],
      objectiveTemplates: [
        {
          type: 'kill',
          targetOptions: ['any'],
          quantityRange: { min: 5, max: 10 },
          descriptionTemplate: '워밍업! 아무 몬스터 {quantity}마리 처치'
        },
        {
          type: 'dungeon',
          targetOptions: ['any-dungeon'],
          quantityRange: { min: 1, max: 2 },
          descriptionTemplate: '던전 {quantity}회 클리어'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 50',
        goldFormula: 'level * 100',
        itemPools: [
          {
            rarity: 'rare',
            items: ['comeback-gift-box', 'premium-potion-set'],
            chance: 1.0
          },
          {
            rarity: 'epic',
            items: ['7-day-premium-pass'],
            chance: 0.5
          }
        ]
      }
    },
    generation: {
      priority: 15,
      maxActive: 1,
      cooldown: 168, // 7일
      expireTime: 168 // 7일
    }
  },

  // 시간대별 퀘스트
  {
    id: 'dq-rule-night-owl',
    name: '밤의 사냥꾼',
    description: '밤 시간대에 플레이하는 유저를 위한 퀘스트',
    conditions: {
      timeConditions: {
        hourOfDay: [20, 21, 22, 23, 0, 1, 2, 3] // 오후 8시 ~ 새벽 3시
      }
    },
    template: {
      titleTemplates: [
        '달빛 아래의 사냥',
        '밤의 몬스터 토벌',
        '어둠 속의 모험',
        '야행성 몬스터 처치'
      ],
      descriptionTemplates: [
        '밤에만 나타나는 특별한 몬스터들을 처치하세요.',
        '달빛이 비추는 동안 특별한 보상이 기다립니다.',
        '어둠의 기운이 강해지는 밤, 몬스터들이 활개칩니다.'
      ],
      typeOptions: ['daily'],
      categoryOptions: ['battle'],
      objectiveTemplates: [
        {
          type: 'kill',
          targetOptions: ['night-monsters', 'dark-element'],
          quantityRange: { min: 15, max: 30 },
          descriptionTemplate: '야행성 {target} {quantity}마리 처치'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 15 * 1.5', // 야간 보너스
        goldFormula: 'level * 10 * 1.5',
        itemPools: [
          {
            rarity: 'rare',
            items: ['night-vision-potion', 'moonlight-shard'],
            chance: 0.4
          }
        ]
      }
    },
    generation: {
      priority: 7,
      maxActive: 2,
      cooldown: 24,
      expireTime: 8
    }
  },

  // 연속 플레이 보상
  {
    id: 'dq-rule-daily-streak',
    name: '꾸준한 모험가',
    description: '매일 접속하는 플레이어를 위한 보너스 퀘스트',
    conditions: {
      playerBehavior: {
        preferredCategory: ['achievement']
      }
    },
    template: {
      titleTemplates: [
        '{day}일차 연속 접속 보상',
        '꾸준함의 보상',
        '매일매일 성장하기',
        '출석 체크 보너스'
      ],
      descriptionTemplates: [
        '매일 꾸준히 플레이하는 당신을 위한 특별 보상!',
        '{day}일 연속 접속을 축하합니다!',
        '오늘도 함께해주셔서 감사합니다.'
      ],
      typeOptions: ['daily'],
      categoryOptions: ['achievement'],
      objectiveTemplates: [
        {
          type: 'kill',
          targetOptions: ['any'],
          quantityRange: { min: 10, max: 10 },
          descriptionTemplate: '오늘의 미션: 몬스터 {quantity}마리 처치'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 10 * streakDays',
        goldFormula: 'level * 5 * streakDays',
        itemPools: [
          {
            rarity: 'common',
            items: ['daily-box'],
            chance: 1.0
          },
          {
            rarity: 'rare',
            items: ['streak-bonus-box'],
            chance: 0.1
          }
        ]
      }
    },
    generation: {
      priority: 9,
      maxActive: 1,
      cooldown: 24,
      expireTime: 24
    }
  },

  // 주말 특별 퀘스트
  {
    id: 'dq-rule-weekend-special',
    name: '주말 특별 이벤트',
    description: '주말에만 등장하는 특별 퀘스트',
    conditions: {
      timeConditions: {
        dayOfWeek: [0, 6] // 일요일, 토요일
      }
    },
    template: {
      titleTemplates: [
        '주말 특별 보상',
        '휴일의 대모험',
        '주말 한정 도전',
        '특별한 주말 미션'
      ],
      descriptionTemplates: [
        '주말을 맞아 특별한 도전과 보상을 준비했습니다!',
        '평일보다 2배 많은 보상! 주말 특별 이벤트입니다.',
        '이번 주말만 도전 가능한 특별 퀘스트!'
      ],
      typeOptions: ['event'],
      categoryOptions: ['exploration', 'battle'],
      objectiveTemplates: [
        {
          type: 'dungeon',
          targetOptions: ['weekend-dungeon', 'any-dungeon'],
          quantityRange: { min: 3, max: 5 },
          descriptionTemplate: '주말 던전 {quantity}회 클리어'
        },
        {
          type: 'kill',
          targetOptions: ['elite-monsters'],
          quantityRange: { min: 5, max: 10 },
          descriptionTemplate: '엘리트 몬스터 {quantity}마리 처치'
        }
      ],
      rewardCalculation: {
        expFormula: 'level * 30 * 2', // 주말 2배
        goldFormula: 'level * 20 * 2',
        itemPools: [
          {
            rarity: 'rare',
            items: ['weekend-box', 'bonus-ticket'],
            chance: 0.7
          },
          {
            rarity: 'epic',
            items: ['weekend-special-item'],
            chance: 0.3
          }
        ]
      }
    },
    generation: {
      priority: 12,
      maxActive: 2,
      cooldown: 48,
      expireTime: 48
    }
  }
]

// 동적 퀘스트 생성에 사용할 몬스터/던전/아이템 템플릿
export const QUEST_GENERATION_TEMPLATES = {
  monsterTypes: ['고블린', '오크', '트롤', '드래곤', '언데드', '정령', '악마', '늑대'],
  elements: ['화염', '얼음', '번개', '대지', '어둠', '빛', '바람', '물'],
  dungeonNames: ['고대 숲', '용암 동굴', '어둠의 성', '설원 동굴', '하늘 성채', '심연의 미궁'],
  difficulties: ['쉬움', '보통', '어려움', '전문가', '전설'],
  itemTypes: ['포션', '강화석', '룬', '보석', '재료', '장비'],
  npcNames: ['토비 상인', '경비대장 렌', '마법사 아리아', '대장장이 토르', '약초상 엘라']
}