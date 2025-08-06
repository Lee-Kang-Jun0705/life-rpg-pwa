// JRPG 도전과제 데이터베이스

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'combat' | 'collection' | 'progression' | 'exploration' | 'social' | 'special'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  points: number
  hidden: boolean
  requirements: {
    type: 'kill_count' | 'item_collect' | 'quest_complete' | 'level_reach' | 
          'gold_earn' | 'enhance_success' | 'skill_master' | 'dungeon_clear' |
          'pvp_win' | 'play_time' | 'custom'
    target?: string
    value: number
    current?: number
  }
  rewards: {
    title?: string
    items?: Array<{ itemId: string; quantity: number }>
    gold?: number
    premium?: number
  }
  unlockedAt?: Date
}

// AchievementProgress 타입 추가 (Achievement 컴포넌트에서 사용)
export interface AchievementProgress {
  achievementId: string
  progress: number
  maxProgress: number
  completed: boolean
  unlockedAt?: Date
}

// 도전과제 데이터베이스
export const ACHIEVEMENT_DATABASE: Record<string, Achievement> = {
  // 전투 도전과제
  'ach_001': {
    id: 'ach_001',
    name: '첫 번째 승리',
    description: '첫 전투에서 승리하세요',
    icon: '⚔️',
    category: 'combat',
    rarity: 'common',
    points: 10,
    hidden: false,
    requirements: {
      type: 'kill_count',
      value: 1
    },
    rewards: {
      title: '초보 전사',
      gold: 100
    }
  },
  
  'ach_002': {
    id: 'ach_002',
    name: '몬스터 사냥꾼',
    description: '몬스터 100마리 처치',
    icon: '🗡️',
    category: 'combat',
    rarity: 'uncommon',
    points: 25,
    hidden: false,
    requirements: {
      type: 'kill_count',
      value: 100
    },
    rewards: {
      title: '숙련된 사냥꾼',
      gold: 500,
      items: [{ itemId: 'item_301', quantity: 5 }] // 체력 포션
    }
  },
  
  'ach_003': {
    id: 'ach_003',
    name: '크리티컬 마스터',
    description: '크리티컬 히트 500회 달성',
    icon: '💥',
    category: 'combat',
    rarity: 'rare',
    points: 50,
    hidden: false,
    requirements: {
      type: 'custom',
      target: 'critical_hits',
      value: 500
    },
    rewards: {
      title: '치명타의 달인',
      items: [{ itemId: 'item_104', quantity: 1 }] // 레어 무기
    }
  },
  
  // 수집 도전과제
  'ach_004': {
    id: 'ach_004',
    name: '수집가의 시작',
    description: '아이템 50개 수집',
    icon: '📦',
    category: 'collection',
    rarity: 'common',
    points: 15,
    hidden: false,
    requirements: {
      type: 'item_collect',
      value: 50
    },
    rewards: {
      title: '초보 수집가',
      gold: 200
    }
  },
  
  'ach_005': {
    id: 'ach_005',
    name: '전설의 수집가',
    description: '전설 아이템 10개 획득',
    icon: '💎',
    category: 'collection',
    rarity: 'legendary',
    points: 100,
    hidden: true,
    requirements: {
      type: 'item_collect',
      target: 'legendary',
      value: 10
    },
    rewards: {
      title: '전설의 수집가',
      items: [{ itemId: 'item_506', quantity: 1 }] // 특별 장신구
    }
  },
  
  // 진행 도전과제
  'ach_006': {
    id: 'ach_006',
    name: '성장의 증명',
    description: '캐릭터 레벨 10 달성',
    icon: '🌟',
    category: 'progression',
    rarity: 'common',
    points: 20,
    hidden: false,
    requirements: {
      type: 'level_reach',
      value: 10
    },
    rewards: {
      title: '성장하는 영웅',
      gold: 300,
      items: [{ itemId: 'item_301', quantity: 10 }]
    }
  },
  
  'ach_007': {
    id: 'ach_007',
    name: '퀘스트 마스터',
    description: '퀘스트 50개 완료',
    icon: '📜',
    category: 'progression',
    rarity: 'rare',
    points: 60,
    hidden: false,
    requirements: {
      type: 'quest_complete',
      value: 50
    },
    rewards: {
      title: '퀘스트의 달인',
      gold: 1000
    }
  },
  
  'ach_008': {
    id: 'ach_008',
    name: '백만장자',
    description: '누적 골드 1,000,000 획득',
    icon: '💰',
    category: 'progression',
    rarity: 'epic',
    points: 75,
    hidden: false,
    requirements: {
      type: 'gold_earn',
      value: 1000000
    },
    rewards: {
      title: '부유한 모험가',
      premium: 100
    }
  },
  
  // 탐험 도전과제
  'ach_009': {
    id: 'ach_009',
    name: '던전 탐험가',
    description: '모든 던전 클리어',
    icon: '🏰',
    category: 'exploration',
    rarity: 'uncommon',
    points: 40,
    hidden: false,
    requirements: {
      type: 'dungeon_clear',
      target: 'all',
      value: 3
    },
    rewards: {
      title: '던전 정복자',
      items: [{ itemId: 'item_205', quantity: 1 }]
    }
  },
  
  'ach_010': {
    id: 'ach_010',
    name: '나이트메어 슬레이어',
    description: '나이트메어 난이도로 보스 10회 처치',
    icon: '👹',
    category: 'exploration',
    rarity: 'legendary',
    points: 150,
    hidden: true,
    requirements: {
      type: 'custom',
      target: 'nightmare_boss_kills',
      value: 10
    },
    rewards: {
      title: '악몽을 정복한 자',
      items: [{ itemId: 'item_108', quantity: 1 }] // 전설 무기
    }
  },
  
  // 강화 도전과제
  'ach_011': {
    id: 'ach_011',
    name: '강화의 시작',
    description: '아이템 강화 +5 달성',
    icon: '✨',
    category: 'progression',
    rarity: 'common',
    points: 20,
    hidden: false,
    requirements: {
      type: 'enhance_success',
      value: 5
    },
    rewards: {
      title: '초보 대장장이',
      items: [{ itemId: 'item_401', quantity: 10 }] // 강화석
    }
  },
  
  'ach_012': {
    id: 'ach_012',
    name: '완벽한 강화',
    description: '아이템 강화 +15 달성',
    icon: '🌟',
    category: 'progression',
    rarity: 'legendary',
    points: 200,
    hidden: true,
    requirements: {
      type: 'enhance_success',
      value: 15
    },
    rewards: {
      title: '전설의 대장장이',
      items: [{ itemId: 'item_505', quantity: 5 }], // 보호석
      premium: 200
    }
  },
  
  // 스킬 도전과제
  'ach_013': {
    id: 'ach_013',
    name: '다재다능',
    description: '모든 스킬 습득',
    icon: '📚',
    category: 'progression',
    rarity: 'epic',
    points: 80,
    hidden: false,
    requirements: {
      type: 'skill_master',
      value: 12
    },
    rewards: {
      title: '스킬 마스터',
      gold: 2000
    }
  },
  
  // 특별 도전과제
  'ach_014': {
    id: 'ach_014',
    name: '베타 테스터',
    description: '게임 초기 버전 플레이',
    icon: '🎮',
    category: 'special',
    rarity: 'epic',
    points: 100,
    hidden: false,
    requirements: {
      type: 'custom',
      target: 'beta_player',
      value: 1
    },
    rewards: {
      title: '베타 테스터',
      items: [{ itemId: 'item_506', quantity: 1 }],
      premium: 100
    }
  },
  
  'ach_015': {
    id: 'ach_015',
    name: '일일 전사',
    description: '30일 연속 접속',
    icon: '📅',
    category: 'special',
    rarity: 'rare',
    points: 50,
    hidden: false,
    requirements: {
      type: 'custom',
      target: 'consecutive_login',
      value: 30
    },
    rewards: {
      title: '꾸준한 모험가',
      gold: 1500,
      premium: 50
    }
  }
}

// 도전과제 카테고리 스타일
export const ACHIEVEMENT_CATEGORY_STYLES = {
  combat: { color: 'text-red-400', bgColor: 'bg-red-600/20', label: '전투' },
  collection: { color: 'text-yellow-400', bgColor: 'bg-yellow-600/20', label: '수집' },
  progression: { color: 'text-green-400', bgColor: 'bg-green-600/20', label: '진행' },
  exploration: { color: 'text-blue-400', bgColor: 'bg-blue-600/20', label: '탐험' },
  social: { color: 'text-purple-400', bgColor: 'bg-purple-600/20', label: '소셜' },
  special: { color: 'text-pink-400', bgColor: 'bg-pink-600/20', label: '특별' }
}

// 희귀도 스타일
export const ACHIEVEMENT_RARITY_STYLES = {
  common: { color: 'text-gray-400', points: 10 },
  uncommon: { color: 'text-green-400', points: 25 },
  rare: { color: 'text-blue-400', points: 50 },
  epic: { color: 'text-purple-400', points: 75 },
  legendary: { color: 'text-orange-400', points: 100 }
}