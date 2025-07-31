// 던전별 스테이지 데이터
// 각 던전은 여러 스테이지로 구성되며, 점진적으로 어려워짐

import type { Stage, DungeonStages, StageBattleConfig } from '@/lib/types/stage'

// 건강의 시련 스테이지
const HEALTH_DUNGEON_STAGES: Stage[] = [
  {
    id: 'health-stage-1',
    number: 1,
    name: '준비운동',
    description: '가벼운 스트레칭으로 몸을 풀어보세요',
    monsterIds: ['slime-green', 'slime-blue', 'goblin-scout'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '몬스터 5마리 처치',
        target: 5
      }
    ],
    rewards: {
      exp: 30,
      gold: 20,
      items: ['health-potion']
    }
  },
  {
    id: 'health-stage-2',
    number: 2,
    name: '본격 운동',
    description: '조금 더 강도 높은 운동에 도전하세요',
    monsterIds: ['wolf-gray', 'goblin-warrior', 'orc-grunt'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '몬스터 8마리 처치',
        target: 8
      },
      {
        id: 'obj-2',
        type: 'survive_time',
        description: '2분간 생존',
        target: 120
      }
    ],
    rewards: {
      exp: 50,
      gold: 35,
      items: ['health-potion', 'stamina-potion']
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  },
  {
    id: 'health-stage-3',
    number: 3,
    name: '극한 도전',
    description: '한계를 뛰어넘는 운동에 도전하세요',
    monsterIds: ['orc-warrior', 'troll-forest', 'wolf-alpha'],
    bossId: 'ogre-mountain',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '보스 몬스터 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'defeat_monsters',
        description: '모든 몬스터 처치',
        target: 10
      }
    ],
    rewards: {
      exp: 80,
      gold: 60,
      items: ['stamina-potion', 'warrior-sword'],
      firstClearBonus: {
        exp: 50,
        gold: 100,
        items: ['rare-health-charm']
      }
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  }
]

// 지식의 던전 스테이지
const KNOWLEDGE_DUNGEON_STAGES: Stage[] = [
  {
    id: 'knowledge-stage-1',
    number: 1,
    name: '기초 학습',
    description: '기본 개념을 익혀보세요',
    monsterIds: ['sprite-mana', 'imp-shadow', 'wisp-light'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '지식의 정령 5마리 처치',
        target: 5
      }
    ],
    rewards: {
      exp: 40,
      gold: 25,
      items: ['wisdom-scroll']
    }
  },
  {
    id: 'knowledge-stage-2',
    number: 2,
    name: '심화 학습',
    description: '더 깊은 지식을 탐구하세요',
    monsterIds: ['elemental-fire', 'elemental-ice', 'mage-apprentice'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '원소 정령 처치',
        target: 6
      },
      {
        id: 'obj-2',
        type: 'collect_items',
        description: '지식의 조각 수집',
        target: 3
      }
    ],
    rewards: {
      exp: 65,
      gold: 45,
      items: ['wisdom-scroll', 'mana-potion']
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  },
  {
    id: 'knowledge-stage-3',
    number: 3,
    name: '지혜의 시험',
    description: '진정한 지혜를 증명하세요',
    monsterIds: ['mage-elemental', 'demon-lesser', 'wraith-soul'],
    bossId: 'lich-ancient',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '고대 리치 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'survive_time',
        description: '3분간 생존',
        target: 180
      }
    ],
    rewards: {
      exp: 100,
      gold: 80,
      items: ['wizard-staff', 'exp-booster'],
      firstClearBonus: {
        exp: 70,
        gold: 150,
        items: ['ancient-tome']
      }
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  },
  {
    id: 'knowledge-stage-4',
    number: 4,
    name: '현자의 길',
    description: '궁극의 지혜에 도달하세요',
    monsterIds: ['elemental-void', 'dragon-whelp', 'demon-elite'],
    bossId: 'dragon-ancient',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '고대 드래곤 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'defeat_monsters',
        description: '완벽한 처치 (노 데미지)',
        target: 1
      }
    ],
    rewards: {
      exp: 150,
      gold: 120,
      items: ['dragon-scale', 'legendary-staff'],
      firstClearBonus: {
        exp: 100,
        gold: 300,
        items: ['wisdom-crown']
      }
    },
    unlockCondition: {
      type: 'total_stars',
      value: 7 // 이전 스테이지에서 총 7개 이상의 별 필요
    }
  }
]

// 균형의 성소 스테이지
const BALANCE_DUNGEON_STAGES: Stage[] = [
  {
    id: 'balance-stage-1',
    number: 1,
    name: '조화의 시작',
    description: '모든 능력을 균형있게 사용하세요',
    monsterIds: ['slime-purple', 'goblin-shaman', 'skeleton-warrior'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '다양한 속성의 몬스터 처치',
        target: 6
      }
    ],
    rewards: {
      exp: 60,
      gold: 40,
      items: ['balance-charm']
    }
  },
  {
    id: 'balance-stage-2',
    number: 2,
    name: '시련의 길',
    description: '진정한 균형을 찾아가세요',
    monsterIds: ['knight-undead', 'harpy-wind', 'basilisk-stone'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '각 속성 몬스터 2마리씩 처치',
        target: 6
      },
      {
        id: 'obj-2',
        type: 'survive_time',
        description: '피해 없이 1분 생존',
        target: 60
      }
    ],
    rewards: {
      exp: 90,
      gold: 65,
      items: ['mystic-ring', 'all-stat-potion']
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  },
  {
    id: 'balance-stage-3',
    number: 3,
    name: '완벽한 조화',
    description: '모든 것이 하나가 되는 순간',
    monsterIds: ['angel-fallen', 'demon-greater', 'elemental-chaos'],
    bossId: 'guardian-balance',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '균형의 수호자 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'defeat_monsters',
        description: '5분 내 모든 적 처치',
        target: 15
      }
    ],
    rewards: {
      exp: 130,
      gold: 100,
      items: ['balance-blade', 'harmony-shield'],
      firstClearBonus: {
        exp: 80,
        gold: 200,
        items: ['equilibrium-crown']
      }
    },
    unlockCondition: {
      type: 'player_level',
      value: 10
    }
  },
  {
    id: 'balance-stage-4',
    number: 4,
    name: '초월의 경지',
    description: '균형을 넘어선 새로운 차원',
    monsterIds: ['titan-storm', 'phoenix-flame', 'leviathan-sea'],
    bossId: 'god-chaos',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '혼돈의 신 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'defeat_monsters',
        description: '단일 스킬로 연속 처치',
        target: 5
      }
    ],
    rewards: {
      exp: 200,
      gold: 150,
      items: ['chaos-orb', 'divine-armor'],
      firstClearBonus: {
        exp: 150,
        gold: 500,
        items: ['transcendent-wings']
      }
    },
    unlockCondition: {
      type: 'total_stars',
      value: 10
    }
  },
  {
    id: 'balance-stage-5',
    number: 5,
    name: '무한의 도전',
    description: '끝없는 적들과의 전투',
    monsterIds: ['all'], // 모든 몬스터 랜덤 등장
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '최대한 많은 적 처치',
        target: 999
      },
      {
        id: 'obj-2',
        type: 'survive_time',
        description: '최대한 오래 생존',
        target: 600
      }
    ],
    rewards: {
      exp: 300,
      gold: 200,
      items: ['infinity-stone'],
      firstClearBonus: {
        exp: 300,
        gold: 1000,
        items: ['eternal-badge']
      }
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  }
]

// 주간 보스 레이드 스테이지
const WEEKLY_BOSS_STAGES: Stage[] = [
  {
    id: 'weekly-boss-stage-1',
    number: 1,
    name: '보스의 부하들',
    description: '보스를 만나기 전 부하들을 처치하세요',
    monsterIds: ['orc-captain', 'troll-berserker', 'ogre-mage'],
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_monsters',
        description: '정예 몬스터 처치',
        target: 10
      }
    ],
    rewards: {
      exp: 100,
      gold: 80,
      items: ['boss-key']
    }
  },
  {
    id: 'weekly-boss-stage-2',
    number: 2,
    name: '보스의 시험',
    description: '보스가 당신의 실력을 시험합니다',
    monsterIds: ['dragon-whelp', 'demon-elite', 'giant-frost'],
    bossId: 'dragon-crimson',
    objectives: [
      {
        id: 'obj-1',
        type: 'defeat_boss',
        description: '붉은 용 처치',
        target: 1
      },
      {
        id: 'obj-2',
        type: 'survive_time',
        description: '5분 내 클리어',
        target: 300
      }
    ],
    rewards: {
      exp: 200,
      gold: 150,
      items: ['dragon-heart', 'legendary-sword'],
      firstClearBonus: {
        exp: 200,
        gold: 500,
        items: ['dragon-slayer-title']
      }
    },
    unlockCondition: {
      type: 'clear_previous',
      value: 1
    }
  }
]

// 전투 설정
export const STAGE_BATTLE_CONFIGS: Record<string, StageBattleConfig> = {
  'health-stage-1': {
    waveCount: 2,
    monstersPerWave: [2, 3],
    monsterLevel: { min: 1, max: 3 },
    difficultyMultiplier: 1.0
  },
  'health-stage-2': {
    waveCount: 3,
    monstersPerWave: [2, 3, 3],
    monsterLevel: { min: 3, max: 5 },
    difficultyMultiplier: 1.2,
    timeLimit: 180
  },
  'health-stage-3': {
    waveCount: 3,
    monstersPerWave: [3, 3, 4],
    monsterLevel: { min: 5, max: 8 },
    difficultyMultiplier: 1.5,
    timeLimit: 300
  },
  'knowledge-stage-1': {
    waveCount: 2,
    monstersPerWave: [2, 3],
    monsterLevel: { min: 2, max: 4 },
    difficultyMultiplier: 1.0
  },
  'knowledge-stage-2': {
    waveCount: 3,
    monstersPerWave: [2, 2, 2],
    monsterLevel: { min: 4, max: 6 },
    difficultyMultiplier: 1.3
  },
  'knowledge-stage-3': {
    waveCount: 4,
    monstersPerWave: [2, 3, 3, 1],
    monsterLevel: { min: 6, max: 10 },
    difficultyMultiplier: 1.6,
    timeLimit: 240
  },
  'knowledge-stage-4': {
    waveCount: 5,
    monstersPerWave: [3, 3, 4, 4, 1],
    monsterLevel: { min: 10, max: 15 },
    difficultyMultiplier: 2.0,
    timeLimit: 360
  },
  'balance-stage-1': {
    waveCount: 2,
    monstersPerWave: [3, 3],
    monsterLevel: { min: 5, max: 8 },
    difficultyMultiplier: 1.2
  },
  'balance-stage-2': {
    waveCount: 3,
    monstersPerWave: [2, 2, 2],
    monsterLevel: { min: 8, max: 12 },
    difficultyMultiplier: 1.5
  },
  'balance-stage-3': {
    waveCount: 4,
    monstersPerWave: [3, 4, 4, 4],
    monsterLevel: { min: 12, max: 18 },
    difficultyMultiplier: 1.8,
    timeLimit: 300
  },
  'balance-stage-4': {
    waveCount: 5,
    monstersPerWave: [4, 4, 5, 5, 2],
    monsterLevel: { min: 18, max: 25 },
    difficultyMultiplier: 2.5,
    timeLimit: 420
  },
  'balance-stage-5': {
    waveCount: 999, // 무한 웨이브
    monstersPerWave: [3, 4, 5, 6, 7], // 점점 증가
    monsterLevel: { min: 20, max: 50 },
    difficultyMultiplier: 3.0,
    timeLimit: 600
  },
  'weekly-boss-stage-1': {
    waveCount: 3,
    monstersPerWave: [3, 3, 4],
    monsterLevel: { min: 10, max: 15 },
    difficultyMultiplier: 1.5
  },
  'weekly-boss-stage-2': {
    waveCount: 2,
    monstersPerWave: [5, 1], // 마지막은 보스
    monsterLevel: { min: 15, max: 20 },
    difficultyMultiplier: 2.0,
    timeLimit: 300
  }
}

// 던전별 스테이지 매핑
export const DUNGEON_STAGES_MAP: Record<string, DungeonStages> = {
  'daily-health-1': {
    dungeonId: 'daily-health-1',
    stages: HEALTH_DUNGEON_STAGES,
    totalStages: HEALTH_DUNGEON_STAGES.length,
    requiredStagesForCompletion: 2 // 최소 2개 스테이지 클리어 시 던전 완료
  },
  'daily-study-1': {
    dungeonId: 'daily-study-1',
    stages: KNOWLEDGE_DUNGEON_STAGES,
    totalStages: KNOWLEDGE_DUNGEON_STAGES.length,
    requiredStagesForCompletion: 3
  },
  'daily-hard-balance': {
    dungeonId: 'daily-hard-balance',
    stages: BALANCE_DUNGEON_STAGES,
    totalStages: BALANCE_DUNGEON_STAGES.length,
    requiredStagesForCompletion: 3
  },
  'weekly-boss-1': {
    dungeonId: 'weekly-boss-1',
    stages: WEEKLY_BOSS_STAGES,
    totalStages: WEEKLY_BOSS_STAGES.length,
    requiredStagesForCompletion: 2
  }
}

// 스테이지 가져오기
export function getStagesForDungeon(dungeonId: string): Stage[] {
  return DUNGEON_STAGES_MAP[dungeonId]?.stages || []
}

export function getStageById(stageId: string): Stage | undefined {
  for (const dungeonStages of Object.values(DUNGEON_STAGES_MAP)) {
    const stage = dungeonStages.stages.find(s => s.id === stageId)
    if (stage) return stage
  }
  return undefined
}

export function getBattleConfig(stageId: string): StageBattleConfig | undefined {
  return STAGE_BATTLE_CONFIGS[stageId]
}