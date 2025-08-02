import { BossData } from '../types/boss-system';

// 보스 몬스터 데이터
export const BOSS_MONSTERS: Record<string, BossData> = {
  // 불의 군주 이프리트
  'boss_ifrit': {
    id: 'boss_ifrit',
    name: '이프리트',
    title: '불의 군주',
    description: '고대의 화염을 다스리는 정령왕. 그의 분노는 모든 것을 재로 만든다.',
    level: 20,
    hp: 5000,
    maxHp: 5000,
    attack: 150,
    defense: 100,
    speed: 80,
    element: 'fire',
    imageUrl: '/images/bosses/ifrit.png',
    size: 'huge',
    
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 100,
        name: '각성',
        description: '이프리트가 서서히 깨어난다',
        aiPattern: 'balanced',
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        speedMultiplier: 1.0,
      },
      {
        phaseNumber: 2,
        hpThreshold: 60,
        name: '분노',
        description: '화염이 격렬해지며 공격이 강해진다',
        aiPattern: 'aggressive',
        damageMultiplier: 1.3,
        defenseMultiplier: 0.9,
        speedMultiplier: 1.2,
        specialMechanics: [
          {
            id: 'flame_burst',
            name: '화염 폭발',
            description: '주변을 화염으로 뒤덮는다',
            triggerCondition: 'turnCount',
            triggerValue: 3,
            effect: {
              type: 'damage',
              value: 100,
              targetType: 'player',
              additionalData: { element: 'fire', aoe: true }
            }
          }
        ]
      },
      {
        phaseNumber: 3,
        hpThreshold: 30,
        name: '최종 각성',
        description: '이프리트의 진정한 힘이 해방된다',
        aiPattern: 'berserker',
        damageMultiplier: 1.5,
        defenseMultiplier: 0.7,
        speedMultiplier: 1.5,
        specialMechanics: [
          {
            id: 'inferno',
            name: '인페르노',
            description: '모든 것을 태우는 궁극의 화염',
            triggerCondition: 'hpThreshold',
            triggerValue: 10,
            effect: {
              type: 'special',
              targetType: 'all',
              additionalData: { 
                damage: 200, 
                burnDuration: 3,
                message: '이프리트가 최후의 인페르노를 발동했다!'
              }
            }
          }
        ]
      }
    ],
    
    currentPhase: 1,
    
    patterns: [
      {
        id: 'flame_strike',
        name: '화염 강타',
        description: '강력한 화염 공격',
        cooldown: 2,
        currentCooldown: 0,
        damageMultiplier: 1.5,
        element: 'fire'
      },
      {
        id: 'heat_wave',
        name: '열파',
        description: '지속적인 화염 데미지',
        cooldown: 4,
        currentCooldown: 0,
        damageMultiplier: 0.8,
        hitCount: 3,
        element: 'fire',
        statusEffect: 'burn'
      },
      {
        id: 'magma_armor',
        name: '마그마 갑옷',
        description: '방어력을 크게 증가',
        cooldown: 5,
        currentCooldown: 0,
        damageMultiplier: 0,
        animation: 'shield'
      }
    ],
    
    rewards: {
      gold: { min: 1000, max: 1500 },
      exp: 2000,
      items: [
        { itemId: 'flame_sword', dropRate: 30, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'fire_crystal', dropRate: 100, minQuantity: 2, maxQuantity: 5 },
        { itemId: 'ifrit_core', dropRate: 10, minQuantity: 1, maxQuantity: 1 }
      ],
      firstClearBonus: {
        items: [
          { itemId: 'ifrit_summon', dropRate: 100, minQuantity: 1, maxQuantity: 1 }
        ],
        achievement: 'flame_conqueror'
      }
    },
    
    immunities: ['burn', 'freeze'],
    weaknesses: ['water', 'ice'],
    resistances: ['fire', 'electric']
  },
  
  // 얼음 여왕 시바
  'boss_shiva': {
    id: 'boss_shiva',
    name: '시바',
    title: '얼음 여왕',
    description: '영원한 겨울을 다스리는 여왕. 그녀의 차가운 숨결은 생명을 얼려버린다.',
    level: 25,
    hp: 4500,
    maxHp: 4500,
    attack: 120,
    defense: 150,
    speed: 100,
    element: 'ice',
    imageUrl: '/images/bosses/shiva.png',
    size: 'large',
    
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 100,
        name: '우아한 춤',
        description: '시바가 우아하게 전투를 시작한다',
        aiPattern: 'tactician',
        damageMultiplier: 1.0,
        defenseMultiplier: 1.2,
        speedMultiplier: 1.0,
      },
      {
        phaseNumber: 2,
        hpThreshold: 50,
        name: '다이아몬드 더스트',
        description: '주변이 얼어붙기 시작한다',
        aiPattern: 'defensive',
        damageMultiplier: 1.2,
        defenseMultiplier: 1.5,
        speedMultiplier: 0.8,
        specialMechanics: [
          {
            id: 'ice_shield',
            name: '얼음 방벽',
            description: '얼음 방벽을 생성한다',
            triggerCondition: 'turnCount',
            triggerValue: 4,
            effect: {
              type: 'shield',
              value: 500,
              duration: 3,
              targetType: 'self'
            }
          }
        ]
      },
      {
        phaseNumber: 3,
        hpThreshold: 20,
        name: '절대영도',
        description: '모든 것이 얼어붙는다',
        aiPattern: 'support',
        damageMultiplier: 1.4,
        defenseMultiplier: 1.0,
        speedMultiplier: 1.3,
        specialMechanics: [
          {
            id: 'absolute_zero',
            name: '절대영도',
            description: '즉사급의 얼음 공격',
            triggerCondition: 'random',
            triggerValue: 30,
            effect: {
              type: 'special',
              targetType: 'player',
              additionalData: { 
                damage: 300, 
                freezeChance: 80,
                message: '시바가 절대영도를 시전한다!'
              }
            }
          }
        ]
      }
    ],
    
    currentPhase: 1,
    
    patterns: [
      {
        id: 'ice_spear',
        name: '빙창',
        description: '날카로운 얼음 창 투척',
        cooldown: 2,
        currentCooldown: 0,
        damageMultiplier: 1.3,
        hitCount: 2,
        element: 'ice'
      },
      {
        id: 'blizzard',
        name: '블리자드',
        description: '강력한 눈보라',
        cooldown: 3,
        currentCooldown: 0,
        damageMultiplier: 1.0,
        element: 'ice',
        statusEffect: 'freeze'
      },
      {
        id: 'ice_heal',
        name: '얼음 치유',
        description: 'HP를 회복한다',
        cooldown: 6,
        currentCooldown: 0,
        damageMultiplier: -0.2, // 음수는 힐
        animation: 'heal'
      }
    ],
    
    rewards: {
      gold: { min: 1200, max: 1800 },
      exp: 2500,
      items: [
        { itemId: 'frost_staff', dropRate: 30, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'ice_crystal', dropRate: 100, minQuantity: 2, maxQuantity: 5 },
        { itemId: 'shiva_tear', dropRate: 10, minQuantity: 1, maxQuantity: 1 }
      ],
      firstClearBonus: {
        items: [
          { itemId: 'shiva_summon', dropRate: 100, minQuantity: 1, maxQuantity: 1 }
        ],
        achievement: 'ice_breaker'
      }
    },
    
    immunities: ['freeze', 'slow'],
    weaknesses: ['fire', 'rock'],
    resistances: ['ice', 'water']
  },
  
  // 뇌신 라무
  'boss_ramu': {
    id: 'boss_ramu',
    name: '라무',
    title: '뇌신',
    description: '천둥과 번개를 다스리는 고대신. 그의 심판은 하늘에서 내려온다.',
    level: 30,
    hp: 4000,
    maxHp: 4000,
    attack: 180,
    defense: 80,
    speed: 150,
    element: 'electric',
    imageUrl: '/images/bosses/ramu.png',
    size: 'huge',
    
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 100,
        name: '전류 충전',
        description: '라무가 전기를 모으기 시작한다',
        aiPattern: 'balanced',
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        speedMultiplier: 1.2,
      },
      {
        phaseNumber: 2,
        hpThreshold: 70,
        name: '번개 폭풍',
        description: '하늘에서 번개가 쏟아진다',
        aiPattern: 'aggressive',
        damageMultiplier: 1.4,
        defenseMultiplier: 0.8,
        speedMultiplier: 1.5,
        specialMechanics: [
          {
            id: 'chain_lightning',
            name: '연쇄 번개',
            description: '번개가 연속으로 타격한다',
            triggerCondition: 'turnCount',
            triggerValue: 2,
            effect: {
              type: 'damage',
              value: 80,
              targetType: 'player',
              additionalData: { 
                element: 'electric', 
                hitCount: 3,
                paralyzeChance: 30
              }
            }
          }
        ]
      },
      {
        phaseNumber: 3,
        hpThreshold: 30,
        name: '심판의 번개',
        description: '라무의 최종 심판이 시작된다',
        aiPattern: 'berserker',
        damageMultiplier: 1.8,
        defenseMultiplier: 0.5,
        speedMultiplier: 2.0,
        specialMechanics: [
          {
            id: 'judgment_bolt',
            name: '심판의 번개',
            description: '하늘을 가르는 거대한 번개',
            triggerCondition: 'hpThreshold',
            triggerValue: 15,
            effect: {
              type: 'special',
              targetType: 'player',
              additionalData: { 
                damage: 400, 
                paralyzeChance: 100,
                message: '라무가 심판의 번개를 내린다!'
              }
            }
          }
        ]
      }
    ],
    
    currentPhase: 1,
    
    patterns: [
      {
        id: 'thunder_strike',
        name: '천둥 강타',
        description: '강력한 전기 공격',
        cooldown: 1,
        currentCooldown: 0,
        damageMultiplier: 1.2,
        element: 'electric'
      },
      {
        id: 'static_field',
        name: '정전기장',
        description: '지속 전기 데미지',
        cooldown: 3,
        currentCooldown: 0,
        damageMultiplier: 0.6,
        hitCount: 4,
        element: 'electric',
        statusEffect: 'paralysis'
      },
      {
        id: 'charge_up',
        name: '충전',
        description: '다음 공격 강화',
        cooldown: 4,
        currentCooldown: 0,
        damageMultiplier: 0,
        animation: 'charge'
      }
    ],
    
    rewards: {
      gold: { min: 1500, max: 2000 },
      exp: 3000,
      items: [
        { itemId: 'thunder_hammer', dropRate: 30, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'lightning_crystal', dropRate: 100, minQuantity: 2, maxQuantity: 5 },
        { itemId: 'ramu_horn', dropRate: 10, minQuantity: 1, maxQuantity: 1 }
      ],
      firstClearBonus: {
        items: [
          { itemId: 'ramu_summon', dropRate: 100, minQuantity: 1, maxQuantity: 1 }
        ],
        achievement: 'storm_caller'
      }
    },
    
    immunities: ['paralysis', 'shock'],
    weaknesses: ['rock', 'grass'],
    resistances: ['electric', 'water']
  },
  
  // 어둠의 제왕 하데스
  'boss_hades': {
    id: 'boss_hades',
    name: '하데스',
    title: '어둠의 제왕',
    description: '지하 세계의 지배자. 죽음과 어둠의 권능을 다스린다.',
    level: 40,
    hp: 6000,
    maxHp: 6000,
    attack: 160,
    defense: 140,
    speed: 90,
    element: 'dark',
    imageUrl: '/images/bosses/hades.png',
    size: 'colossal',
    
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 100,
        name: '어둠의 강림',
        description: '하데스가 현세에 나타난다',
        aiPattern: 'tactician',
        damageMultiplier: 1.0,
        defenseMultiplier: 1.3,
        speedMultiplier: 0.9,
      },
      {
        phaseNumber: 2,
        hpThreshold: 60,
        name: '망자의 군단',
        description: '죽은 자들이 일어난다',
        aiPattern: 'support',
        damageMultiplier: 1.2,
        defenseMultiplier: 1.1,
        speedMultiplier: 1.0,
        specialMechanics: [
          {
            id: 'summon_undead',
            name: '언데드 소환',
            description: '망자들을 소환한다',
            triggerCondition: 'turnCount',
            triggerValue: 5,
            effect: {
              type: 'summon',
              targetType: 'self',
              additionalData: { 
                summonType: 'skeleton_warrior',
                count: 2
              }
            }
          }
        ]
      },
      {
        phaseNumber: 3,
        hpThreshold: 30,
        name: '죽음의 화신',
        description: '하데스가 진정한 모습을 드러낸다',
        aiPattern: 'berserker',
        damageMultiplier: 1.6,
        defenseMultiplier: 1.5,
        speedMultiplier: 1.1,
        specialMechanics: [
          {
            id: 'death_sentence',
            name: '죽음의 선고',
            description: '즉사의 저주',
            triggerCondition: 'hpThreshold',
            triggerValue: 10,
            effect: {
              type: 'special',
              targetType: 'player',
              additionalData: { 
                instakillChance: 30,
                damage: 500,
                curseStacks: 5,
                message: '하데스가 죽음의 선고를 내린다!'
              }
            }
          }
        ]
      }
    ],
    
    currentPhase: 1,
    
    patterns: [
      {
        id: 'shadow_bolt',
        name: '암흑탄',
        description: '어둠의 에너지 발사',
        cooldown: 2,
        currentCooldown: 0,
        damageMultiplier: 1.4,
        element: 'dark'
      },
      {
        id: 'life_drain',
        name: '생명력 흡수',
        description: 'HP를 흡수한다',
        cooldown: 4,
        currentCooldown: 0,
        damageMultiplier: 1.0,
        element: 'dark',
        statusEffect: 'curse'
      },
      {
        id: 'dark_shield',
        name: '어둠의 장막',
        description: '어둠으로 몸을 감싼다',
        cooldown: 5,
        currentCooldown: 0,
        damageMultiplier: 0,
        animation: 'dark_shield'
      },
      {
        id: 'soul_burn',
        name: '영혼 연소',
        description: '영혼을 불태운다',
        cooldown: 6,
        currentCooldown: 0,
        damageMultiplier: 2.0,
        element: 'dark',
        statusEffect: 'burn'
      }
    ],
    
    rewards: {
      gold: { min: 2000, max: 3000 },
      exp: 5000,
      items: [
        { itemId: 'death_scythe', dropRate: 25, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'dark_crystal', dropRate: 100, minQuantity: 3, maxQuantity: 7 },
        { itemId: 'hades_crown', dropRate: 5, minQuantity: 1, maxQuantity: 1 }
      ],
      firstClearBonus: {
        items: [
          { itemId: 'hades_summon', dropRate: 100, minQuantity: 1, maxQuantity: 1 },
          { itemId: 'legendary_chest', dropRate: 100, minQuantity: 1, maxQuantity: 1 }
        ],
        achievement: 'death_defier'
      }
    },
    
    immunities: ['curse', 'instant_death', 'fear'],
    weaknesses: ['light'],
    resistances: ['dark', 'fire', 'ice']
  }
};

// 던전별 보스 매칭
export const DUNGEON_BOSSES: Record<string, string> = {
  // 기존 던전 이름 매핑
  '화산_동굴': 'boss_ifrit',
  '항구_도시': 'boss_ramu',
  '고대_신전': 'boss_shiva',
  '지하_감옥': 'boss_hades',
  
  // 영어 이름 매핑 (호환성)
  'volcano': 'boss_ifrit',
  'frozen_palace': 'boss_shiva', 
  'thunder_peak': 'boss_ramu',
  'underworld': 'boss_hades',
  'ancient_temple': 'boss_shiva',
  'underground_prison': 'boss_hades'
};

// 보스 난이도 조정 함수
export function adjustBossForDifficulty(boss: BossData, difficulty: number): BossData {
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.2;
  
  return {
    ...boss,
    hp: Math.floor(boss.hp * difficultyMultiplier),
    maxHp: Math.floor(boss.maxHp * difficultyMultiplier),
    attack: Math.floor(boss.attack * difficultyMultiplier),
    defense: Math.floor(boss.defense * difficultyMultiplier),
    speed: Math.floor(boss.speed * (1 + (difficulty - 1) * 0.1)),
    rewards: {
      ...boss.rewards,
      gold: {
        min: Math.floor(boss.rewards.gold.min * difficultyMultiplier),
        max: Math.floor(boss.rewards.gold.max * difficultyMultiplier)
      },
      exp: Math.floor(boss.rewards.exp * difficultyMultiplier)
    }
  };
}