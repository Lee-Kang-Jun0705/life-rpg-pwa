export interface JRPGQuest {
  id: string
  name: string
  description: string
  category: 'main' | 'side' | 'daily' | 'event'
  chapter?: number // 메인 퀘스트 챕터
  requirements: {
    level?: number
    questIds?: string[] // 선행 퀘스트
    items?: { itemId: string; quantity: number }[]
  }
  objectives: {
    id: string
    description: string
    type: 'defeat' | 'collect' | 'talk' | 'explore' | 'deliver'
    target?: string // 몬스터 ID, 아이템 ID, NPC ID, 지역 ID
    quantity?: number
    current?: number
    isHidden?: boolean // 숨겨진 목표
  }[]
  rewards: {
    exp: number
    gold: number
    items?: { itemId: string; quantity: number }[]
    skills?: string[] // 스킬 ID
    title?: string // 칭호
    unlocks?: string[] // 해금되는 컨텐츠
  }
  dialogue?: {
    start: string[]
    progress: string[]
    complete: string[]
  }
  isRepeatable?: boolean
  cooldownHours?: number // 반복 가능한 경우 쿨다운
  expiresAt?: Date // 이벤트 퀘스트 종료 시간
}

export const QUEST_DATABASE: Record<string, JRPGQuest> = {
  // ===== 메인 퀘스트 - 챕터 1: 모험의 시작 =====
  'quest_main_001': {
    id: 'quest_main_001',
    name: '영웅의 첫걸음',
    description: '당신의 영웅적인 여정이 시작됩니다. 첫 몬스터를 물리치고 모험가로서의 자질을 증명하세요.',
    category: 'main',
    chapter: 1,
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj_1',
        description: '슬라임 3마리 처치',
        type: 'defeat',
        target: 'monster_001',
        quantity: 3,
        current: 0
      }
    ],
    rewards: {
      exp: 100,
      gold: 50,
      items: [
        { itemId: 'item_002', quantity: 1 }, // 초보자의 검
        { itemId: 'item_201', quantity: 5 }  // 체력 포션 (소)
      ]
    },
    dialogue: {
      start: [
        "마을 촌장: 젊은 모험가여, 드디어 왔구나!",
        "마을 촌장: 최근 마을 주변에 슬라임들이 출몰하고 있어 농민들이 걱정하고 있다네.",
        "마을 촌장: 자네가 이들을 처치해준다면, 모험가로서의 첫 발걸음을 인정받게 될 것이야."
      ],
      progress: [
        "마을 촌장: 슬라임 처치는 순조롭게 진행되고 있나?"
      ],
      complete: [
        "마을 촌장: 훌륭해! 자네는 진정한 모험가의 자질을 갖추고 있군.",
        "마을 촌장: 이 검은 선대 영웅이 사용했던 것이네. 자네에게 주겠네.",
        "마을 촌장: 앞으로의 여정에 행운이 함께하길!"
      ]
    }
  },

  'quest_main_002': {
    id: 'quest_main_002',
    name: '고블린의 위협',
    description: '마을을 위협하는 고블린 무리를 처치하고 평화를 되찾으세요.',
    category: 'main',
    chapter: 1,
    requirements: {
      level: 3,
      questIds: ['quest_main_001']
    },
    objectives: [
      {
        id: 'obj_1',
        description: '고블린 5마리 처치',
        type: 'defeat',
        target: 'monster_002',
        quantity: 5,
        current: 0
      },
      {
        id: 'obj_2',
        description: '고블린 대장 처치',
        type: 'defeat',
        target: 'monster_003',
        quantity: 1,
        current: 0
      }
    ],
    rewards: {
      exp: 200,
      gold: 100,
      items: [
        { itemId: 'item_102', quantity: 1 }, // 가죽 갑옷
        { itemId: 'item_301', quantity: 1 }  // 힘의 반지
      ],
      unlocks: ['dungeon_cave'] // 어둠의 동굴 해금
    },
    dialogue: {
      start: [
        "경비대장: 모험가님! 큰일입니다!",
        "경비대장: 고블린들이 마을 창고를 습격하려 하고 있습니다.",
        "경비대장: 특히 그들의 대장이 매우 강력하다고 합니다. 조심하세요!"
      ],
      progress: [
        "경비대장: 고블린들을 막아주세요! 마을의 안전이 달려있습니다!"
      ],
      complete: [
        "경비대장: 정말 대단하십니다! 고블린 대장까지 물리치시다니!",
        "경비대장: 이 갑옷은 우리 경비대의 예비 장비입니다. 받아주세요.",
        "경비대장: 그리고... 고블린들이 나온 동굴에 뭔가 있을지도 모릅니다."
      ]
    }
  },

  // ===== 사이드 퀘스트 =====
  'quest_side_001': {
    id: 'quest_side_001',
    name: '상인의 부탁',
    description: '상인이 잃어버린 물건을 찾아주세요.',
    category: 'side',
    requirements: {
      level: 2
    },
    objectives: [
      {
        id: 'obj_1',
        description: '늑대 가죽 5개 수집',
        type: 'collect',
        target: 'item_401',
        quantity: 5,
        current: 0
      }
    ],
    rewards: {
      exp: 50,
      gold: 75,
      items: [
        { itemId: 'item_202', quantity: 3 } // 마나 포션 (소)
      ]
    },
    dialogue: {
      start: [
        "떠돌이 상인: 아, 모험가님! 제발 도와주세요!",
        "떠돌이 상인: 늑대 가죽을 구해와야 하는데, 저는 전투를 할 수 없어서...",
        "떠돌이 상인: 5개만 구해다 주시면 보답하겠습니다!"
      ],
      progress: [
        "떠돌이 상인: 늑대 가죽을 구하셨나요?"
      ],
      complete: [
        "떠돌이 상인: 감사합니다! 이제 장사를 계속할 수 있겠네요.",
        "떠돌이 상인: 이 포션들은 제 감사의 표시입니다."
      ]
    }
  },

  'quest_side_002': {
    id: 'quest_side_002',
    name: '약초 수집가',
    description: '마을 약사가 필요한 약초를 모아주세요.',
    category: 'side',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj_1',
        description: '치유의 약초 10개 수집',
        type: 'collect',
        target: 'item_402',
        quantity: 10,
        current: 0
      }
    ],
    rewards: {
      exp: 30,
      gold: 40,
      items: [
        { itemId: 'item_203', quantity: 1 } // 체력 포션 (중)
      ]
    },
    isRepeatable: true,
    cooldownHours: 24
  },

  // ===== 일일 퀘스트 =====
  'quest_daily_001': {
    id: 'quest_daily_001',
    name: '일일 수련',
    description: '매일 꾸준한 수련으로 실력을 쌓으세요.',
    category: 'daily',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj_1',
        description: '아무 몬스터 10마리 처치',
        type: 'defeat',
        quantity: 10,
        current: 0
      }
    ],
    rewards: {
      exp: 100,
      gold: 100,
      items: [
        { itemId: 'item_201', quantity: 3 } // 체력 포션 (소)
      ]
    },
    isRepeatable: true,
    cooldownHours: 24
  },

  'quest_daily_002': {
    id: 'quest_daily_002',
    name: '보급품 수집',
    description: '마을에 필요한 보급품을 모아주세요.',
    category: 'daily',
    requirements: {
      level: 5
    },
    objectives: [
      {
        id: 'obj_1',
        description: '아무 재료 아이템 20개 수집',
        type: 'collect',
        quantity: 20,
        current: 0
      }
    ],
    rewards: {
      exp: 150,
      gold: 150,
      items: [
        { itemId: 'item_501', quantity: 1 } // 강화석
      ]
    },
    isRepeatable: true,
    cooldownHours: 24
  },

  // ===== 이벤트 퀘스트 =====
  'quest_event_001': {
    id: 'quest_event_001',
    name: '🎄 겨울 축제 준비',
    description: '겨울 축제를 위한 특별한 아이템을 모아주세요!',
    category: 'event',
    requirements: {
      level: 1
    },
    objectives: [
      {
        id: 'obj_1',
        description: '눈송이 결정 20개 수집',
        type: 'collect',
        target: 'item_event_001',
        quantity: 20,
        current: 0
      }
    ],
    rewards: {
      exp: 500,
      gold: 500,
      items: [
        { itemId: 'item_event_002', quantity: 1 } // 겨울 축제 장비
      ],
      title: '겨울의 수호자'
    },
    expiresAt: new Date('2024-12-31'),
    dialogue: {
      start: [
        "축제 담당자: 겨울 축제가 곧 시작됩니다!",
        "축제 담당자: 특별한 눈송이 결정을 모아주시면 멋진 보상을 드릴게요!"
      ],
      complete: [
        "축제 담당자: 놀라워요! 이렇게 많은 눈송이 결정을!",
        "축제 담당자: 당신은 진정한 겨울의 수호자입니다!"
      ]
    }
  },

  // ===== 숨겨진 퀘스트 =====
  'quest_hidden_001': {
    id: 'quest_hidden_001',
    name: '전설의 시작',
    description: '???',
    category: 'side',
    requirements: {
      level: 10,
      items: [{ itemId: 'item_legendary_key', quantity: 1 }]
    },
    objectives: [
      {
        id: 'obj_1',
        description: '???',
        type: 'explore',
        target: 'hidden_temple',
        quantity: 1,
        current: 0,
        isHidden: true
      },
      {
        id: 'obj_2',
        description: '고대의 수호자 처치',
        type: 'defeat',
        target: 'monster_boss_001',
        quantity: 1,
        current: 0,
        isHidden: true
      }
    ],
    rewards: {
      exp: 1000,
      gold: 1000,
      items: [
        { itemId: 'item_legendary_001', quantity: 1 } // 전설 무기
      ],
      skills: ['skill_legendary_001'], // 전설 스킬
      title: '전설의 시작'
    }
  }
}

// 퀘스트 진행 상태
export interface QuestProgress {
  questId: string
  status: 'available' | 'active' | 'completed' | 'claimed'
  startedAt?: Date
  completedAt?: Date
  objectives: {
    id: string
    current: number
    completed: boolean
  }[]
  lastCooldownReset?: Date // 반복 퀘스트용
}

// 퀘스트 카테고리별 아이콘 및 색상
export const QUEST_CATEGORY_STYLES = {
  main: {
    icon: '⭐',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50'
  },
  side: {
    icon: '📜',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50'
  },
  daily: {
    icon: '📅',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50'
  },
  event: {
    icon: '🎉',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50'
  }
}

// 퀘스트 보상 미리보기 생성
export function generateRewardPreview(rewards: JRPGQuest['rewards']): string {
  const parts: string[] = []
  
  if (rewards.exp > 0) parts.push(`EXP +${rewards.exp}`)
  if (rewards.gold > 0) parts.push(`💰 ${rewards.gold}`)
  if (rewards.items && rewards.items.length > 0) {
    parts.push(`📦 ${rewards.items.length}개`)
  }
  if (rewards.skills && rewards.skills.length > 0) {
    parts.push(`✨ 스킬`)
  }
  if (rewards.title) parts.push(`🏆 칭호`)
  
  return parts.join(' • ')
}