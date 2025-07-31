'use client'

import type { Dungeon, DungeonItem, DungeonMonster, DungeonBoss } from '@/lib/types/dungeon'

// 던전 아이템
export const DUNGEON_ITEMS: Record<string, DungeonItem> = {
  // 장비
  'iron-sword': {
    id: 'iron-sword',
    name: '철제 검',
    type: 'equipment',
    rarity: 'common',
    icon: '⚔️',
    quantity: 1,
    dropRate: 15,
    description: '튼튼한 철로 만든 기본 검'
  },
  'steel-armor': {
    id: 'steel-armor',
    name: '강철 갑옷',
    type: 'equipment',
    rarity: 'uncommon',
    icon: '🛡️',
    quantity: 1,
    dropRate: 10,
    description: '견고한 강철로 제작된 갑옷'
  },
  'magic-ring': {
    id: 'magic-ring',
    name: '마법 반지',
    type: 'equipment',
    rarity: 'rare',
    icon: '💍',
    quantity: 1,
    dropRate: 5,
    description: '마력이 깃든 신비한 반지'
  },
  'legendary-blade': {
    id: 'legendary-blade',
    name: '전설의 검',
    type: 'equipment',
    rarity: 'legendary',
    icon: '🗡️',
    quantity: 1,
    dropRate: 1,
    description: '전설 속에만 존재한다는 강력한 검'
  },
  
  // 소비품
  'health-potion': {
    id: 'health-potion',
    name: '회복 물약',
    type: 'consumable',
    rarity: 'common',
    icon: '🧪',
    quantity: 3,
    dropRate: 25,
    description: 'HP를 즉시 회복하는 물약'
  },
  'mana-potion': {
    id: 'mana-potion',
    name: '마나 물약',
    type: 'consumable',
    rarity: 'common',
    icon: '💙',
    quantity: 2,
    dropRate: 20,
    description: 'MP를 즉시 회복하는 물약'
  },
  
  // 재료
  'monster-core': {
    id: 'monster-core',
    name: '몬스터 코어',
    type: 'material',
    rarity: 'uncommon',
    icon: '💎',
    quantity: 1,
    dropRate: 8,
    description: '몬스터의 핵심에서 추출한 에너지 결정'
  },
  'ancient-rune': {
    id: 'ancient-rune',
    name: '고대 룬',
    type: 'material',
    rarity: 'rare',
    icon: '🔮',
    quantity: 1,
    dropRate: 3,
    description: '고대 마법이 새겨진 신비한 돌'
  }
}

// 던전 몬스터
export const DUNGEON_MONSTERS: Record<string, DungeonMonster> = {
  // 초보자 몬스터 (레벨 4-10)
  'slime': {
    id: 'slime',
    name: '슬라임',
    level: 5,
    hp: 200,
    attack: 50,
    defense: 30,
    icon: '🟢',
    skills: ['끈적이기', '튀기'],
    dropRate: 90,
    drops: [DUNGEON_ITEMS['health-potion']]
  },
  'wolf': {
    id: 'wolf',
    name: '늑대',
    level: 7,
    hp: 350,
    attack: 80,
    defense: 50,
    icon: '🐺',
    skills: ['물기', '울부짖기'],
    dropRate: 85,
    drops: [DUNGEON_ITEMS['health-potion'], DUNGEON_ITEMS['iron-sword']]
  },
  'mushroom': {
    id: 'mushroom',
    name: '독버섯',
    level: 9,
    hp: 450,
    attack: 100,
    defense: 60,
    icon: '🍄',
    skills: ['포자 뿌리기', '독 공격'],
    dropRate: 85,
    drops: [DUNGEON_ITEMS['mana-potion'], DUNGEON_ITEMS['monster-core']]
  },
  'giant-slime': {
    id: 'giant-slime',
    name: '거대 슬라임',
    level: 8,
    hp: 600,
    attack: 70,
    defense: 80,
    icon: '🟩',
    skills: ['압착', '분열'],
    dropRate: 80,
    drops: [DUNGEON_ITEMS['health-potion'], DUNGEON_ITEMS['steel-armor']]
  },
  
  'goblin': {
    id: 'goblin',
    name: '고블린',
    level: 15,
    hp: 800,
    attack: 120,
    defense: 80,
    icon: '👹',
    skills: ['찌르기', '도망'],
    dropRate: 80,
    drops: [DUNGEON_ITEMS['health-potion'], DUNGEON_ITEMS['monster-core']]
  },
  'orc-warrior': {
    id: 'orc-warrior',
    name: '오크 전사',
    level: 25,
    hp: 1500,
    attack: 200,
    defense: 150,
    icon: '🧌',
    skills: ['강타', '분노', '방패막기'],
    dropRate: 75,
    drops: [DUNGEON_ITEMS['iron-sword'], DUNGEON_ITEMS['steel-armor']]
  },
  'dark-mage': {
    id: 'dark-mage',
    name: '다크 메이지',
    level: 35,
    hp: 1200,
    attack: 300,
    defense: 100,
    icon: '🧙‍♂️',
    skills: ['암흑 볼트', '생명력 흡수', '텔레포트'],
    dropRate: 70,
    drops: [DUNGEON_ITEMS['mana-potion'], DUNGEON_ITEMS['magic-ring']]
  },
  'skeleton-knight': {
    id: 'skeleton-knight',
    name: '스켈레톤 기사',
    level: 45,
    hp: 2000,
    attack: 250,
    defense: 200,
    icon: '💀',
    skills: ['검술', '언데드 재생', '방패 돌진'],
    dropRate: 65,
    drops: [DUNGEON_ITEMS['steel-armor'], DUNGEON_ITEMS['ancient-rune']]
  }
}

// 던전 보스
export const DUNGEON_BOSSES: Record<string, DungeonBoss> = {
  // 초보자 보스
  'slime-king': {
    id: 'slime-king',
    name: '슬라임 킹',
    level: 10,
    hp: 1500,
    attack: 120,
    defense: 100,
    icon: '👑',
    skills: ['거대화', '슬라임 소환', '산성 공격'],
    dropRate: 100,
    drops: [DUNGEON_ITEMS['iron-sword'], DUNGEON_ITEMS['health-potion']],
    phases: [
      {
        id: 'phase1',
        name: '1단계: 일반',
        hpThreshold: 100,
        description: '슬라임 킹이 일반 공격을 합니다',
        skills: ['산성 공격', '끈적이기'],
        mechanics: ['일반 공격']
      },
      {
        id: 'phase2',
        name: '2단계: 분열',
        hpThreshold: 50,
        description: '슬라임 킹이 작은 슬라임들을 소환합니다',
        skills: ['슬라임 소환', '치유'],
        mechanics: ['미니 슬라임 3마리 소환']
      }
    ],
    enrageTimer: 180,
    specialMechanics: ['분열', '치유']
  },
  
  'goblin-king': {
    id: 'goblin-king',
    name: '고블린 킹',
    level: 30,
    hp: 5000,
    attack: 300,
    defense: 200,
    icon: '👑',
    skills: ['왕의 분노', '소환술', '광전사화'],
    dropRate: 100,
    drops: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['ancient-rune']],
    phases: [
      {
        id: 'phase1',
        name: '1단계: 분노',
        hpThreshold: 100,
        description: '고블린 킹이 분노하며 공격력이 증가합니다',
        skills: ['왕의 분노', '연속 공격'],
        mechanics: ['공격력 50% 증가']
      },
      {
        id: 'phase2',
        name: '2단계: 소환',
        hpThreshold: 50,
        description: '고블린 킹이 부하들을 소환합니다',
        skills: ['소환술', '치유'],
        mechanics: ['고블린 4마리 소환', '매 턴 HP 회복']
      },
      {
        id: 'phase3',
        name: '3단계: 광전사',
        hpThreshold: 20,
        description: '고블린 킹이 광전사 상태가 됩니다',
        skills: ['광전사화', '파괴의 일격'],
        mechanics: ['공격력 100% 증가', '방어력 50% 감소', '매 턴 광역 공격']
      }
    ],
    enrageTimer: 300,
    specialMechanics: ['광역 공격', '부하 소환', '분노 모드']
  },
  'dragon-lord': {
    id: 'dragon-lord',
    name: '드래곤 로드',
    level: 60,
    hp: 15000,
    attack: 500,
    defense: 300,
    icon: '🐉',
    skills: ['화염 브레스', '용의 분노', '비행', '메테오'],
    dropRate: 100,
    drops: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['magic-ring']],
    phases: [
      {
        id: 'phase1',
        name: '1단계: 지상전',
        hpThreshold: 100,
        description: '드래곤이 지상에서 싸웁니다',
        skills: ['화염 브레스', '꼬리 휘두르기'],
        mechanics: ['화염 장판 생성']
      },
      {
        id: 'phase2',
        name: '2단계: 공중전',
        hpThreshold: 60,
        description: '드래곤이 하늘로 날아올라 공중에서 공격합니다',
        skills: ['비행', '공중 화염 브레스', '급강하'],
        mechanics: ['근접 공격 불가', '원거리 공격만 가능']
      },
      {
        id: 'phase3',
        name: '3단계: 최후의 분노',
        hpThreshold: 20,
        description: '드래곤의 최후의 발악',
        skills: ['메테오', '용의 분노', '전멸의 브레스'],
        mechanics: ['매 턴 메테오 낙하', '전체 화염 피해']
      }
    ],
    enrageTimer: 600,
    specialMechanics: ['비행 상태', '화염 면역', '광역 마법']
  }
}

// 던전 데이터
export const DUNGEONS: Dungeon[] = [
  // 초보자 던전 (레벨 4부터)
  {
    id: 'beginner-01',
    name: '슬라임 늪',
    description: '초보 모험가를 위한 쉬운 던전. 귀여운 슬라임들이 서식하는 평화로운 늪입니다.',
    type: 'story',
    difficulty: 'easy',
    icon: '🟢',
    backgroundImage: '/images/dungeons/slime-swamp.jpg',
    requirements: {
      level: 4,
      energy: 5
    },
    rewards: {
      exp: 200,
      gold: 500,
      items: [DUNGEON_ITEMS['health-potion']],
      firstClearBonus: {
        exp: 400,
        gold: 1000,
        items: [DUNGEON_ITEMS['iron-sword']]
      }
    },
    stages: 3,
    estimatedTime: 10,
    recommendedCombatPower: 500,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'beginner-02',
    name: '늑대 굴',
    description: '야생 늑대들이 살고 있는 작은 동굴. 조심하면 충분히 클리어할 수 있습니다.',
    type: 'story',
    difficulty: 'easy',
    icon: '🐺',
    backgroundImage: '/images/dungeons/wolf-den.jpg',
    requirements: {
      level: 6,
      energy: 7
    },
    rewards: {
      exp: 300,
      gold: 700,
      items: [DUNGEON_ITEMS['health-potion'], DUNGEON_ITEMS['mana-potion']],
      firstClearBonus: {
        exp: 600,
        gold: 1400,
        items: [DUNGEON_ITEMS['steel-armor']]
      }
    },
    stages: 4,
    estimatedTime: 12,
    recommendedCombatPower: 800,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'beginner-03',
    name: '버섯 동굴',
    description: '거대한 버섯들이 자라는 신비한 동굴. 독버섯 몬스터들을 조심하세요!',
    type: 'story',
    difficulty: 'easy',
    icon: '🍄',
    backgroundImage: '/images/dungeons/mushroom-cave.jpg',
    requirements: {
      level: 8,
      previousDungeon: 'beginner-02',
      energy: 8
    },
    rewards: {
      exp: 400,
      gold: 900,
      items: [DUNGEON_ITEMS['mana-potion'], DUNGEON_ITEMS['monster-core']],
      firstClearBonus: {
        exp: 800,
        gold: 1800,
        items: [DUNGEON_ITEMS['magic-ring']]
      }
    },
    stages: 5,
    estimatedTime: 15,
    recommendedCombatPower: 1000,
    status: 'locked',
    clearedCount: 0
  },
  
  // 무한의 탑
  {
    id: 'infinite-tower',
    name: '무한의 탑',
    description: '끝이 보이지 않는 거대한 탑. 매 층마다 점점 강해지는 적들이 기다리고 있습니다. 얼마나 높이 올라갈 수 있을까요?',
    type: 'infinite',
    difficulty: 'dynamic',
    icon: '🏰',
    backgroundImage: '/images/dungeons/infinite-tower.jpg',
    requirements: {
      level: 30,
      energy: 0, // 무제한
      tickets: 1 // 일일 입장권
    },
    rewards: {
      exp: 0, // 층별로 다름
      gold: 0, // 층별로 다름
      items: [],
      firstClearBonus: {
        exp: 10000,
        gold: 50000,
        items: [DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 999, // 무한
    estimatedTime: 0, // 플레이어에 따라 다름
    recommendedCombatPower: 3000,
    status: 'available',
    clearedCount: 0
  },
  
  // 스토리 던전
  {
    id: 'story-01',
    name: '고블린 동굴',
    description: '고블린들이 우글거리는 위험한 동굴입니다. 초보자도 도전할 수 있는 난이도입니다.',
    type: 'story',
    difficulty: 'easy',
    icon: '🕳️',
    backgroundImage: '/images/dungeons/goblin-cave.jpg',
    requirements: {
      level: 10,
      energy: 10
    },
    rewards: {
      exp: 500,
      gold: 1000,
      items: [DUNGEON_ITEMS['iron-sword'], DUNGEON_ITEMS['health-potion']],
      firstClearBonus: {
        exp: 1000,
        gold: 2000,
        items: [DUNGEON_ITEMS['steel-armor']]
      }
    },
    stages: 5,
    estimatedTime: 15,
    recommendedCombatPower: 1200,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'story-02',
    name: '어둠의 숲',
    description: '고대 마법에 의해 저주받은 숲. 다크 메이지들의 근거지입니다.',
    type: 'story',
    difficulty: 'normal',
    icon: '🌲',
    requirements: {
      level: 25,
      previousDungeon: 'story-01',
      energy: 15
    },
    rewards: {
      exp: 1200,
      gold: 2500,
      items: [DUNGEON_ITEMS['magic-ring'], DUNGEON_ITEMS['mana-potion']],
      firstClearBonus: {
        exp: 2000,
        gold: 4000,
        items: [DUNGEON_ITEMS['ancient-rune']]
      }
    },
    stages: 7,
    estimatedTime: 25,
    recommendedCombatPower: 2500,
    status: 'locked',
    clearedCount: 0
  },
  {
    id: 'story-03',
    name: '언데드 성채',
    description: '언데드들이 지배하는 고대 성채. 강력한 스켈레톤 기사들이 수호합니다.',
    type: 'story',
    difficulty: 'hard',
    icon: '🏰',
    requirements: {
      level: 40,
      previousDungeon: 'story-02',
      energy: 20
    },
    rewards: {
      exp: 2500,
      gold: 5000,
      items: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['ancient-rune']],
      firstClearBonus: {
        exp: 4000,
        gold: 8000,
        items: [DUNGEON_ITEMS['magic-ring']]
      }
    },
    stages: 10,
    estimatedTime: 40,
    recommendedCombatPower: 5000,
    status: 'locked',
    clearedCount: 0
  },

  // 일일 던전
  // 원소 던전들
  {
    id: 'elemental-fire',
    name: '화염의 심장',
    description: '용암이 끓어오르는 화산 내부. 화염 정령들과 불의 마법사들이 지배하는 곳입니다.',
    type: 'challenge',
    difficulty: 'hard',
    icon: '🔥',
    requirements: {
      level: 35,
      energy: 25
    },
    rewards: {
      exp: 3000,
      gold: 4000,
      items: [DUNGEON_ITEMS['magic-ring'], DUNGEON_ITEMS['ancient-rune']],
      firstClearBonus: {
        exp: 5000,
        gold: 8000,
        items: [DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 8,
    estimatedTime: 35,
    recommendedCombatPower: 4500,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'elemental-ice',
    name: '얼음 궁전',
    description: '영원히 얼어붙은 궁전. 얼음 여왕과 그녀의 수호자들이 기다립니다.',
    type: 'challenge',
    difficulty: 'hard',
    icon: '❄️',
    requirements: {
      level: 35,
      energy: 25
    },
    rewards: {
      exp: 3000,
      gold: 4000,
      items: [DUNGEON_ITEMS['steel-armor'], DUNGEON_ITEMS['mana-potion']],
      firstClearBonus: {
        exp: 5000,
        gold: 8000,
        items: [DUNGEON_ITEMS['magic-ring']]
      }
    },
    stages: 8,
    estimatedTime: 35,
    recommendedCombatPower: 4500,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'elemental-thunder',
    name: '번개의 탑',
    description: '하늘 높이 솟은 탑. 번개와 천둥의 정령들이 거주하는 곳입니다.',
    type: 'challenge',
    difficulty: 'hard',
    icon: '⚡',
    requirements: {
      level: 40,
      energy: 25
    },
    rewards: {
      exp: 3500,
      gold: 4500,
      items: [DUNGEON_ITEMS['magic-ring'], DUNGEON_ITEMS['health-potion']],
      firstClearBonus: {
        exp: 6000,
        gold: 9000,
        items: [DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 9,
    estimatedTime: 40,
    recommendedCombatPower: 5000,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'elemental-earth',
    name: '대지의 미궁',
    description: '거대한 지하 미궁. 대지의 거인들과 골렘들이 수호하고 있습니다.',
    type: 'challenge',
    difficulty: 'hard',
    icon: '🪨',
    requirements: {
      level: 40,
      energy: 25
    },
    rewards: {
      exp: 3500,
      gold: 4500,
      items: [DUNGEON_ITEMS['steel-armor'], DUNGEON_ITEMS['monster-core']],
      firstClearBonus: {
        exp: 6000,
        gold: 9000,
        items: [DUNGEON_ITEMS['ancient-rune']]
      }
    },
    stages: 9,
    estimatedTime: 40,
    recommendedCombatPower: 5000,
    status: 'available',
    clearedCount: 0
  },

  // 종족 던전들
  {
    id: 'race-elf',
    name: '엘프의 숲',
    description: '신비로운 엘프들이 사는 고대 숲. 자연의 수호자들을 만날 수 있습니다.',
    type: 'special',
    difficulty: 'normal',
    icon: '🧝',
    requirements: {
      level: 30,
      energy: 20
    },
    rewards: {
      exp: 2000,
      gold: 3000,
      items: [DUNGEON_ITEMS['mana-potion'], DUNGEON_ITEMS['ancient-rune']],
      firstClearBonus: {
        exp: 3500,
        gold: 5000,
        items: [DUNGEON_ITEMS['magic-ring']]
      }
    },
    stages: 6,
    estimatedTime: 30,
    recommendedCombatPower: 3500,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'race-dwarf',
    name: '드워프 광산',
    description: '드워프들의 비밀 광산. 전설적인 대장장이들과 그들의 작품을 볼 수 있습니다.',
    type: 'special',
    difficulty: 'normal',
    icon: '⛏️',
    requirements: {
      level: 30,
      energy: 20
    },
    rewards: {
      exp: 2000,
      gold: 4000, // 드워프 광산은 골드가 많음
      items: [DUNGEON_ITEMS['iron-sword'], DUNGEON_ITEMS['steel-armor']],
      firstClearBonus: {
        exp: 3500,
        gold: 7000,
        items: [DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 6,
    estimatedTime: 30,
    recommendedCombatPower: 3500,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'race-demon',
    name: '악마의 성',
    description: '지옥의 문이 열린 곳. 악마들과 타락한 영혼들이 배회합니다.',
    type: 'special',
    difficulty: 'expert',
    icon: '😈',
    requirements: {
      level: 50,
      energy: 30
    },
    rewards: {
      exp: 5000,
      gold: 6000,
      items: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['ancient-rune']],
      firstClearBonus: {
        exp: 8000,
        gold: 10000,
        items: [DUNGEON_ITEMS['magic-ring'], DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 12,
    estimatedTime: 60,
    recommendedCombatPower: 8000,
    status: 'locked',
    clearedCount: 0
  },

  // 특수 던전들
  {
    id: 'special-time',
    name: '시간의 틈',
    description: '시간이 뒤틀린 이상한 공간. 과거와 미래의 적들이 동시에 나타납니다.',
    type: 'special',
    difficulty: 'expert',
    icon: '⏰',
    requirements: {
      level: 45,
      energy: 30
    },
    rewards: {
      exp: 4500,
      gold: 5500,
      items: [DUNGEON_ITEMS['ancient-rune'], DUNGEON_ITEMS['magic-ring']],
      firstClearBonus: {
        exp: 7000,
        gold: 9000,
        items: [DUNGEON_ITEMS['legendary-blade']]
      }
    },
    stages: 10,
    estimatedTime: 50,
    recommendedCombatPower: 7000,
    status: 'available',
    clearedCount: 0
  },
  {
    id: 'special-boss-rush',
    name: '보스 러시',
    description: '역대 모든 보스들이 연속으로 등장! 최강자만이 도전할 수 있습니다.',
    type: 'challenge',
    difficulty: 'legendary',
    icon: '👹',
    requirements: {
      level: 60,
      energy: 50,
      previousDungeon: 'story-03' // 스토리 클리어 필요
    },
    rewards: {
      exp: 10000,
      gold: 15000,
      items: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['magic-ring'], DUNGEON_ITEMS['ancient-rune']],
      firstClearBonus: {
        exp: 20000,
        gold: 30000,
        items: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['legendary-blade']] // 전설 장비 2개
      }
    },
    stages: 15, // 15명의 보스
    estimatedTime: 90,
    recommendedCombatPower: 10000,
    status: 'locked',
    clearedCount: 0
  },
  {
    id: 'special-survival',
    name: '생존의 투기장',
    description: '끝없이 몰려오는 적들로부터 살아남으세요. 얼마나 오래 버틸 수 있을까요?',
    type: 'challenge',
    difficulty: 'dynamic',
    icon: '🏟️',
    requirements: {
      level: 35,
      energy: 30
    },
    rewards: {
      exp: 0, // 생존 시간에 비례
      gold: 0, // 처치 수에 비례
      items: [],
      firstClearBonus: {
        exp: 5000,
        gold: 8000,
        items: [DUNGEON_ITEMS['magic-ring']]
      }
    },
    stages: 1, // 단일 스테이지 (무한 웨이브)
    estimatedTime: 0, // 생존 시간에 따라
    recommendedCombatPower: 4000,
    status: 'available',
    clearedCount: 0
  },

  // 일일 던전들
  {
    id: 'daily-gold',
    name: '황금 광산',
    description: '골드를 대량으로 획득할 수 있는 특별한 광산입니다.',
    type: 'daily',
    difficulty: 'normal',
    icon: '💰',
    requirements: {
      level: 20,
      energy: 20
    },
    rewards: {
      exp: 800,
      gold: 8000,
      items: [DUNGEON_ITEMS['monster-core']]
    },
    stages: 3,
    estimatedTime: 10,
    recommendedCombatPower: 2000,
    status: 'available',
    clearedCount: 0,
    dailyLimit: 3,
    availableDays: [1, 3, 5] // 월, 수, 금
  },
  {
    id: 'daily-exp',
    name: '지혜의 탑',
    description: '경험치를 대량으로 획득할 수 있는 신비한 탑입니다.',
    type: 'daily',
    difficulty: 'normal',
    icon: '🗼',
    requirements: {
      level: 20,
      energy: 20
    },
    rewards: {
      exp: 5000,
      gold: 1000,
      items: [DUNGEON_ITEMS['ancient-rune']]
    },
    stages: 3,
    estimatedTime: 10,
    recommendedCombatPower: 2000,
    status: 'available',
    clearedCount: 0,
    dailyLimit: 3,
    availableDays: [2, 4, 6] // 화, 목, 토
  },
  {
    id: 'daily-equipment',
    name: '무기고',
    description: '고급 장비를 획득할 수 있는 고대 무기고입니다.',
    type: 'daily',
    difficulty: 'hard',
    icon: '⚔️',
    requirements: {
      level: 30,
      energy: 25
    },
    rewards: {
      exp: 1500,
      gold: 3000,
      items: [DUNGEON_ITEMS['steel-armor'], DUNGEON_ITEMS['legendary-blade']]
    },
    stages: 5,
    estimatedTime: 20,
    recommendedCombatPower: 3500,
    status: 'available',
    clearedCount: 0,
    dailyLimit: 2,
    availableDays: [0, 6] // 일, 토
  },

  // 레이드 던전
  {
    id: 'raid-dragon',
    name: '고대 용의 둥지',
    description: '전설의 드래곤 로드가 잠들어 있는 위험한 둥지입니다.',
    type: 'raid',
    difficulty: 'legendary',
    icon: '🐉',
    requirements: {
      level: 50,
      energy: 50,
      tickets: 1
    },
    rewards: {
      exp: 10000,
      gold: 20000,
      items: [DUNGEON_ITEMS['legendary-blade'], DUNGEON_ITEMS['magic-ring']],
      firstClearBonus: {
        exp: 20000,
        gold: 50000,
        items: [DUNGEON_ITEMS['ancient-rune']]
      }
    },
    stages: 1,
    estimatedTime: 60,
    recommendedCombatPower: 10000,
    status: 'locked',
    clearedCount: 0,
    weeklyLimit: 1
  }
]

// 던전 타입별 정보
export const DUNGEON_TYPE_INFO = {
  story: {
    name: '스토리',
    description: '메인 스토리를 진행하는 던전',
    icon: '📖',
    color: 'blue'
  },
  daily: {
    name: '일일',
    description: '매일 도전할 수 있는 특별 던전',
    icon: '📅',
    color: 'green'
  },
  weekly: {
    name: '주간',
    description: '주간 보상을 얻을 수 있는 던전',
    icon: '📆',
    color: 'teal'
  },
  raid: {
    name: '레이드',
    description: '강력한 보스와의 대결',
    icon: '⚔️',
    color: 'red'
  },
  special: {
    name: '특별',
    description: '이벤트 기간에만 등장하는 던전',
    icon: '⭐',
    color: 'yellow'
  },
  challenge: {
    name: '도전',
    description: '고수들을 위한 극한 난이도',
    icon: '🔥',
    color: 'purple'
  },
  infinite: {
    name: '무한',
    description: '끝없이 올라가는 무한의 탑',
    icon: '🏰',
    color: 'indigo'
  }
}

// 난이도별 정보
export const DIFFICULTY_INFO = {
  easy: {
    name: '쉬움',
    color: 'green',
    multiplier: 1.0
  },
  normal: {
    name: '보통',
    color: 'blue',
    multiplier: 1.5
  },
  hard: {
    name: '어려움',
    color: 'orange',
    multiplier: 2.0
  },
  expert: {
    name: '전문가',
    color: 'red',
    multiplier: 3.0
  },
  legendary: {
    name: '전설',
    color: 'purple',
    multiplier: 5.0
  },
  dynamic: {
    name: '동적',
    color: 'indigo',
    multiplier: 1.0 // 층수에 따라 동적으로 변화
  }
}