import type { Quest } from '@/lib/types/quest'

export const MAIN_QUESTS: Quest[] = [
  {
    id: 'main-001',
    title: '모험의 시작',
    description: '당신의 첫 모험을 시작하세요. 기본적인 전투와 탐험을 배워봅시다.',
    type: 'main',
    category: 'exploration',
    status: 'available',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj-001',
        description: '고블린 소굴 던전 클리어',
        type: 'dungeon',
        target: '1', // 던전 ID 1번
        current: 0,
        required: 1,
        completed: false
      },
      {
        id: 'obj-002',
        description: '체력 포션 3개 수집',
        type: 'collect',
        target: 'item-health-potion',
        current: 0,
        required: 3,
        completed: false
      }
    ],
    rewards: {
      exp: 100,
      gold: 50,
      items: [
        { itemId: 'iron-sword', quantity: 1 },
        { itemId: 'health-potion', quantity: 5 }
      ]
    },
    npcId: 'npc-guide',
    dialogues: {
      start: [
        '안녕하세요, 모험가님!',
        '이 세계에 오신 것을 환영합니다.',
        '먼저 기본적인 전투와 탐험을 배워보시죠.'
      ],
      progress: [
        '잘 하고 계시네요!',
        '계속해서 목표를 달성해주세요.'
      ],
      complete: [
        '훌륭합니다!',
        '이제 진정한 모험가가 되셨군요.',
        '이 보상을 받으세요.'
      ]
    }
  },
  {
    id: 'main-002',
    title: '어둠의 위협',
    description: '마을 근처에 어둠의 기운이 감지됩니다. 원인을 조사하세요.',
    type: 'main',
    category: 'battle',
    status: 'locked',
    requirements: {
      level: 5,
      quests: ['main-001']
    },
    objectives: [
      {
        id: 'obj-003',
        description: '어둠의 늑대 10마리 처치',
        type: 'kill',
        target: 'monster-dark-wolf',
        current: 0,
        required: 10,
        completed: false
      },
      {
        id: 'obj-004',
        description: '어둠의 성 던전 탐험',
        type: 'dungeon',
        target: '3', // 던전 ID 3번
        current: 0,
        required: 1,
        completed: false
      }
    ],
    rewards: {
      exp: 500,
      gold: 200,
      items: [
        { itemId: 'steel-sword', quantity: 1 },
        { itemId: 'leather-armor', quantity: 1 }
      ],
      titles: ['어둠 사냥꾼']
    }
  }
]

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'daily-001',
    title: '일일 훈련',
    description: '매일 꾸준한 훈련으로 실력을 쌓으세요.',
    type: 'daily',
    category: 'battle',
    status: 'available',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj-daily-001',
        description: '아무 몬스터 20마리 처치',
        type: 'kill',
        target: 'any',
        current: 0,
        required: 20,
        completed: false
      }
    ],
    rewards: {
      exp: 50,
      gold: 30,
      items: [
        { itemId: 'energy-potion', quantity: 1 }
      ]
    },
    resetType: 'daily'
  },
  {
    id: 'daily-002',
    title: '던전 탐험가',
    description: '다양한 던전을 탐험하며 보상을 획득하세요.',
    type: 'daily',
    category: 'exploration',
    status: 'available',
    requirements: {
      level: 3
    },
    objectives: [
      {
        id: 'obj-daily-002',
        description: '던전 3회 클리어',
        type: 'dungeon',
        target: 'any', // 아무 던전
        current: 0,
        required: 3,
        completed: false
      }
    ],
    rewards: {
      exp: 100,
      gold: 50,
      items: [
        { itemId: 'mystery-box', quantity: 1 }
      ]
    },
    resetType: 'daily'
  },
  {
    id: 'daily-003',
    title: '수집가의 일과',
    description: '다양한 아이템을 수집해보세요.',
    type: 'daily',
    category: 'collection',
    status: 'available',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj-daily-003',
        description: '아이템 10개 획득',
        type: 'collect',
        target: 'any-item',
        current: 0,
        required: 10,
        completed: false
      }
    ],
    rewards: {
      exp: 30,
      gold: 20,
      items: [
        { itemId: 'lucky-charm', quantity: 1 }
      ]
    },
    resetType: 'daily'
  }
]

export const SIDE_QUESTS: Quest[] = [
  {
    id: 'side-001',
    title: '상인의 부탁',
    description: '토비 상인이 특별한 재료를 구해달라고 부탁했습니다.',
    type: 'side',
    category: 'collection',
    status: 'available',
    requirements: {
      level: 3
    },
    objectives: [
      {
        id: 'obj-side-001',
        description: '빛나는 버섯 5개 수집',
        type: 'collect',
        target: 'item-glowing-mushroom',
        current: 0,
        required: 5,
        completed: false
      }
    ],
    rewards: {
      exp: 150,
      gold: 100,
      items: [
        { itemId: 'merchant-token', quantity: 3 }
      ]
    },
    npcId: 'npc-merchant-toby',
    dialogues: {
      start: [
        '아, 모험가님!',
        '혹시 빛나는 버섯을 구해주실 수 있나요?',
        '특별한 물약을 만들려고 하는데 재료가 필요해요.'
      ],
      progress: [
        '빛나는 버섯은 어둠의 동굴에서 찾을 수 있어요.',
        '조심하세요!'
      ],
      complete: [
        '정말 감사합니다!',
        '이제 특별한 물약을 만들 수 있겠어요.',
        '이건 감사의 표시입니다.'
      ]
    }
  },
  {
    id: 'side-002',
    title: '잃어버린 반지',
    description: '마을 주민이 소중한 반지를 잃어버렸습니다.',
    type: 'side',
    category: 'exploration',
    status: 'available',
    requirements: {
      level: 5
    },
    objectives: [
      {
        id: 'obj-side-002',
        description: '잃어버린 반지 찾기',
        type: 'collect',
        target: 'item-lost-ring',
        current: 0,
        required: 1,
        completed: false
      }
    ],
    rewards: {
      exp: 200,
      gold: 150,
      items: [
        { itemId: 'blessing-scroll', quantity: 1 }
      ]
    },
    npcId: 'npc-villager',
    dialogues: {
      start: [
        '모험가님, 도와주세요!',
        '제 할머니의 반지를 잃어버렸어요.',
        '숲 어딘가에 떨어뜨린 것 같은데...'
      ],
      progress: [
        '아직 못 찾으셨나요?',
        '숲의 깊은 곳을 찾아보세요.'
      ],
      complete: [
        '찾으셨군요! 정말 감사합니다!',
        '이 반지는 우리 가족의 보물이에요.',
        '이걸 받아주세요.'
      ]
    }
  },
  {
    id: 'side-003',
    title: '던전 마스터의 길',
    description: '다양한 던전을 정복하여 진정한 던전 마스터가 되어보세요.',
    type: 'side',
    category: 'exploration',
    status: 'available',
    requirements: {
      level: 10
    },
    objectives: [
      {
        id: 'obj-side-003-1',
        description: '고대 숲 던전 10회 클리어',
        type: 'dungeon',
        target: '1',
        current: 0,
        required: 10,
        completed: false
      },
      {
        id: 'obj-side-003-2',
        description: '용암 동굴 던전 5회 클리어',
        type: 'dungeon',
        target: '2',
        current: 0,
        required: 5,
        completed: false
      },
      {
        id: 'obj-side-003-3',
        description: '어둠의 성 던전 3회 클리어',
        type: 'dungeon',
        target: '3',
        current: 0,
        required: 3,
        completed: false
      }
    ],
    rewards: {
      exp: 1000,
      gold: 500,
      titles: ['던전 마스터']
    }
  },
  {
    id: 'side-004',
    title: '속도의 도전',
    description: '빠른 시간 안에 던전을 클리어하는 도전입니다.',
    type: 'side',
    category: 'achievement',
    status: 'available',
    requirements: {
      level: 15
    },
    objectives: [
      {
        id: 'obj-side-004',
        description: '3분 이내에 고대 숲 던전 클리어',
        type: 'dungeon',
        target: '1',
        current: 0,
        required: 1,
        completed: false
      }
    ],
    rewards: {
      exp: 500,
      gold: 300,
      titles: ['스피드러너']
    }
  }
]

export const EVENT_QUESTS: Quest[] = [
  {
    id: 'event-001',
    title: '겨울 축제',
    description: '특별한 겨울 축제 이벤트에 참여하세요!',
    type: 'event',
    category: 'achievement',
    status: 'available',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj-event-001',
        description: '눈사람 토큰 10개 수집',
        type: 'collect',
        target: 'item-snowman-token',
        current: 0,
        required: 10,
        completed: false
      },
      {
        id: 'obj-event-002',
        description: '겨울 던전 5회 클리어',
        type: 'dungeon',
        target: '4', // 던전 ID 4번 (설원 동굴)
        current: 0,
        required: 5,
        completed: false
      }
    ],
    rewards: {
      exp: 1000,
      gold: 500,
      items: [
        { itemId: 'winter-costume', quantity: 1 },
        { itemId: 'snowflake-gem', quantity: 5 }
      ],
      titles: ['겨울의 영웅']
    },
    timeLimit: 7 * 24 * 60 * 60 * 1000, // 7일
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// 모든 퀘스트 통합
export const ALL_QUESTS = [
  ...MAIN_QUESTS,
  ...DAILY_QUESTS,
  ...SIDE_QUESTS,
  ...EVENT_QUESTS
]

// 퀘스트 체인
export const QUEST_CHAINS = [
  {
    id: 'chain-main-story',
    name: '메인 스토리',
    description: '이 세계를 구하는 대서사시',
    quests: ['main-001', 'main-002', 'main-003', 'main-004'],
    rewards: {
      exp: 5000,
      gold: 2000,
      titles: ['세계의 구원자']
    }
  }
]
