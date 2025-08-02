import { ElementType } from '@/lib/types/element-system'
import { AIPattern } from '@/lib/types/monster-ai'

export interface EnhancedMonster {
  name: string
  emoji: string
  stats: {
    hp: number
    attack: number
    defense: number
    speed: number
    element: ElementType
  }
  aiPattern: AIPattern
  specialAbility?: string | null
  description?: string
}

// 슬라임 계열
export const SLIME_MONSTERS: EnhancedMonster[] = [
  {
    name: '초록 슬라임',
    emoji: '🟢',
    stats: { hp: 30, attack: 8, defense: 5, speed: 0.8, element: 'grass' },
    aiPattern: 'balanced',
    description: '평화로운 초원의 슬라임'
  },
  {
    name: '불타는 슬라임',
    emoji: '🔴',
    stats: { hp: 35, attack: 12, defense: 4, speed: 1.0, element: 'fire' },
    aiPattern: 'aggressive',
    specialAbility: 'burn',
    description: '화산 지대의 뜨거운 슬라임'
  },
  {
    name: '얼음 슬라임',
    emoji: '🔵',
    stats: { hp: 40, attack: 10, defense: 8, speed: 0.6, element: 'ice' },
    aiPattern: 'defensive',
    specialAbility: 'freeze',
    description: '빙하에서 온 차가운 슬라임'
  },
  {
    name: '전기 슬라임',
    emoji: '🟡',
    stats: { hp: 32, attack: 14, defense: 3, speed: 1.5, element: 'electric' },
    aiPattern: 'berserker',
    specialAbility: 'paralyze',
    description: '번개처럼 빠른 슬라임'
  }
]

// 고블린 계열
export const GOBLIN_MONSTERS: EnhancedMonster[] = [
  {
    name: '고블린 전사',
    emoji: '👺',
    stats: { hp: 45, attack: 15, defense: 8, speed: 1.0, element: 'normal' },
    aiPattern: 'aggressive',
    description: '검을 든 고블린 전사'
  },
  {
    name: '고블린 궁수',
    emoji: '🏹',
    stats: { hp: 35, attack: 18, defense: 5, speed: 1.2, element: 'normal' },
    aiPattern: 'tactician',
    specialAbility: 'doubleStrike',
    description: '활을 든 고블린 저격수'
  },
  {
    name: '고블린 마법사',
    emoji: '🧙',
    stats: { hp: 30, attack: 20, defense: 4, speed: 0.9, element: 'dark' },
    aiPattern: 'support',
    specialAbility: 'curse',
    description: '어둠의 마법을 쓰는 고블린'
  },
  {
    name: '고블린 족장',
    emoji: '👹',
    stats: { hp: 60, attack: 16, defense: 10, speed: 0.8, element: 'normal' },
    aiPattern: 'balanced',
    specialAbility: 'lifeDrain',
    description: '고블린 무리의 우두머리'
  }
]

// 언데드 계열
export const UNDEAD_MONSTERS: EnhancedMonster[] = [
  {
    name: '스켈레톤',
    emoji: '💀',
    stats: { hp: 40, attack: 14, defense: 12, speed: 0.9, element: 'dark' },
    aiPattern: 'defensive',
    description: '움직이는 해골 전사'
  },
  {
    name: '좀비',
    emoji: '🧟',
    stats: { hp: 55, attack: 16, defense: 6, speed: 0.5, element: 'dark' },
    aiPattern: 'aggressive',
    specialAbility: 'poison',
    description: '느리지만 강력한 언데드'
  },
  {
    name: '유령',
    emoji: '👻',
    stats: { hp: 35, attack: 18, defense: 2, speed: 1.4, element: 'dark' },
    aiPattern: 'berserker',
    specialAbility: 'lifeDrain',
    description: '실체가 없는 영혼'
  },
  {
    name: '리치',
    emoji: '🧛',
    stats: { hp: 50, attack: 22, defense: 8, speed: 1.0, element: 'dark' },
    aiPattern: 'tactician',
    specialAbility: 'curse',
    description: '강력한 언데드 마법사'
  }
]

// 원소 정령 계열
export const ELEMENTAL_MONSTERS: EnhancedMonster[] = [
  {
    name: '화염 정령',
    emoji: '🔥',
    stats: { hp: 45, attack: 20, defense: 5, speed: 1.1, element: 'fire' },
    aiPattern: 'aggressive',
    specialAbility: 'lavaArmor',
    description: '불꽃으로 이루어진 정령'
  },
  {
    name: '물의 정령',
    emoji: '💧',
    stats: { hp: 50, attack: 15, defense: 10, speed: 1.0, element: 'water' },
    aiPattern: 'support',
    specialAbility: 'heal',
    description: '맑은 물로 이루어진 정령'
  },
  {
    name: '바람 정령',
    emoji: '🌪️',
    stats: { hp: 38, attack: 18, defense: 6, speed: 1.8, element: 'electric' },
    aiPattern: 'berserker',
    specialAbility: 'doubleStrike',
    description: '폭풍을 일으키는 정령'
  },
  {
    name: '대지 정령',
    emoji: '🗿',
    stats: { hp: 65, attack: 16, defense: 15, speed: 0.6, element: 'rock' },
    aiPattern: 'defensive',
    specialAbility: 'shield',
    description: '단단한 바위로 된 정령'
  }
]

// 드래곤 계열
export const DRAGON_MONSTERS: EnhancedMonster[] = [
  {
    name: '어린 드래곤',
    emoji: '🐉',
    stats: { hp: 60, attack: 22, defense: 12, speed: 1.2, element: 'fire' },
    aiPattern: 'balanced',
    specialAbility: 'burn',
    description: '아직 어린 용'
  },
  {
    name: '얼음 드래곤',
    emoji: '🐲',
    stats: { hp: 70, attack: 20, defense: 15, speed: 1.0, element: 'ice' },
    aiPattern: 'tactician',
    specialAbility: 'freeze',
    description: '얼음 숨결을 내뿜는 용'
  },
  {
    name: '번개 드래곤',
    emoji: '⚡',
    stats: { hp: 55, attack: 25, defense: 10, speed: 1.5, element: 'electric' },
    aiPattern: 'berserker',
    specialAbility: 'paralyze',
    description: '번개를 다루는 용'
  },
  {
    name: '어둠의 드래곤',
    emoji: '🌑',
    stats: { hp: 65, attack: 24, defense: 14, speed: 1.1, element: 'dark' },
    aiPattern: 'aggressive',
    specialAbility: 'curse',
    description: '어둠에 물든 사악한 용'
  }
]

// 던전별 몬스터 그룹
export const DUNGEON_MONSTER_GROUPS = {
  // 초보자 던전
  beginner: [
    ...SLIME_MONSTERS.slice(0, 2),
    GOBLIN_MONSTERS[0]
  ],
  
  // 중급 던전
  intermediate: [
    ...SLIME_MONSTERS.slice(2, 4),
    ...GOBLIN_MONSTERS.slice(1, 3),
    UNDEAD_MONSTERS[0]
  ],
  
  // 상급 던전
  advanced: [
    GOBLIN_MONSTERS[3],
    ...UNDEAD_MONSTERS.slice(1, 4),
    ...ELEMENTAL_MONSTERS.slice(0, 2)
  ],
  
  // 전문가 던전
  expert: [
    ...ELEMENTAL_MONSTERS.slice(2, 4),
    ...DRAGON_MONSTERS
  ]
}

// 레벨에 따른 몬스터 스탯 조정
export function adjustMonsterStats(
  monster: EnhancedMonster,
  level: number
): EnhancedMonster {
  const multiplier = 1 + (level - 1) * 0.1
  
  return {
    ...monster,
    stats: {
      ...monster.stats,
      hp: Math.floor(monster.stats.hp * multiplier),
      attack: Math.floor(monster.stats.attack * multiplier),
      defense: Math.floor(monster.stats.defense * multiplier)
    }
  }
}

// 랜덤 몬스터 선택
export function getRandomMonsters(
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
  count: number,
  level: number
): EnhancedMonster[] {
  const monsterPool = DUNGEON_MONSTER_GROUPS[difficulty]
  const selected: EnhancedMonster[] = []
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * monsterPool.length)
    const monster = adjustMonsterStats(monsterPool[randomIndex], level)
    selected.push(monster)
  }
  
  return selected
}