export interface MonsterAbility {
  id: string
  name: string
  description: string
  type: 'damage' | 'debuff' | 'buff' | 'special'
  trigger: 'onAttack' | 'onHit' | 'onTurnStart' | 'onTurnEnd' | 'onBelowHalfHp'
  chance: number // 0-1
  cooldown?: number // turns
  effects: AbilityEffect[]
}

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'poison' | 'burn' | 'freeze' | 'stun' | 'buff' | 'debuff' | 'lifeDrain' | 'multiHit' | 'shield' | 'reflect'
  target: 'self' | 'player' | 'allEnemies' | 'allAllies'
  value?: number
  duration?: number // turns
  stat?: 'attack' | 'defense' | 'speed' | 'critRate' | 'critDamage'
  multiplier?: number
}

export const MONSTER_ABILITIES: Record<string, MonsterAbility> = {
  // 독 계열
  poison: {
    id: 'poison',
    name: '독공격',
    description: '공격 시 일정 확률로 독을 부여합니다',
    type: 'debuff',
    trigger: 'onAttack',
    chance: 0.3,
    effects: [{
      type: 'poison',
      target: 'player',
      value: 5, // damage per turn
      duration: 3
    }]
  },
  
  // 화염 계열
  fireBreath: {
    id: 'fireBreath',
    name: '화염 숨결',
    description: '강력한 화염 공격을 가합니다',
    type: 'damage',
    trigger: 'onAttack',
    chance: 0.25,
    cooldown: 3,
    effects: [{
      type: 'damage',
      target: 'player',
      multiplier: 1.5
    }, {
      type: 'burn',
      target: 'player',
      value: 3,
      duration: 2
    }]
  },
  
  lavaArmor: {
    id: 'lavaArmor',
    name: '용암 갑옷',
    description: '피격 시 공격자에게 화상 피해를 입힙니다',
    type: 'special',
    trigger: 'onHit',
    chance: 1.0,
    effects: [{
      type: 'damage',
      target: 'player',
      value: 5
    }]
  },
  
  // 얼음 계열
  freeze: {
    id: 'freeze',
    name: '빙결',
    description: '적을 얼려 행동을 막습니다',
    type: 'debuff',
    trigger: 'onAttack',
    chance: 0.2,
    cooldown: 4,
    effects: [{
      type: 'freeze',
      target: 'player',
      duration: 1
    }]
  },
  
  // 언데드 계열
  lifeDrain: {
    id: 'lifeDrain',
    name: '생명력 흡수',
    description: '피해를 입히고 체력을 회복합니다',
    type: 'special',
    trigger: 'onAttack',
    chance: 0.3,
    effects: [{
      type: 'lifeDrain',
      target: 'player',
      multiplier: 0.5
    }]
  },
  
  curse: {
    id: 'curse',
    name: '저주',
    description: '적의 능력치를 감소시킵니다',
    type: 'debuff',
    trigger: 'onTurnStart',
    chance: 0.25,
    cooldown: 5,
    effects: [{
      type: 'debuff',
      target: 'player',
      stat: 'attack',
      multiplier: 0.8,
      duration: 3
    }, {
      type: 'debuff',
      target: 'player',
      stat: 'defense',
      multiplier: 0.8,
      duration: 3
    }]
  },
  
  // 치유 계열
  heal: {
    id: 'heal',
    name: '치유',
    description: '자신이나 아군의 체력을 회복합니다',
    type: 'buff',
    trigger: 'onBelowHalfHp',
    chance: 0.5,
    cooldown: 5,
    effects: [{
      type: 'heal',
      target: 'self',
      multiplier: 0.3
    }]
  },
  
  // 특수 능력
  doubleStrike: {
    id: 'doubleStrike',
    name: '연속 공격',
    description: '한 턴에 두 번 공격합니다',
    type: 'damage',
    trigger: 'onAttack',
    chance: 0.35,
    effects: [{
      type: 'multiHit',
      target: 'player',
      value: 2
    }]
  },
  
  tentacleGrab: {
    id: 'tentacleGrab',
    name: '촉수 포박',
    description: '촉수로 적을 포박하여 속도를 감소시킵니다',
    type: 'debuff',
    trigger: 'onAttack',
    chance: 0.4,
    effects: [{
      type: 'debuff',
      target: 'player',
      stat: 'speed',
      multiplier: 0.5,
      duration: 2
    }]
  },
  
  hellfire: {
    id: 'hellfire',
    name: '지옥불',
    description: '강력한 지옥의 불꽃을 발사합니다',
    type: 'damage',
    trigger: 'onTurnStart',
    chance: 0.3,
    cooldown: 4,
    effects: [{
      type: 'damage',
      target: 'player',
      multiplier: 2.0
    }, {
      type: 'burn',
      target: 'player',
      value: 5,
      duration: 3
    }]
  },
  
  timeWarp: {
    id: 'timeWarp',
    name: '시간 조작',
    description: '시간을 조작하여 추가 턴을 얻습니다',
    type: 'special',
    trigger: 'onTurnEnd',
    chance: 0.15,
    cooldown: 6,
    effects: [{
      type: 'buff',
      target: 'self',
      stat: 'speed',
      multiplier: 2.0,
      duration: 1
    }]
  },
  
  shadowClone: {
    id: 'shadowClone',
    name: '그림자 분신',
    description: '그림자 분신을 만들어 회피율을 높입니다',
    type: 'buff',
    trigger: 'onBelowHalfHp',
    chance: 1.0,
    cooldown: 999, // Once per battle
    effects: [{
      type: 'buff',
      target: 'self',
      stat: 'speed',
      multiplier: 1.5,
      duration: 999
    }]
  },
  
  divineWrath: {
    id: 'divineWrath',
    name: '신의 분노',
    description: '신성한 힘으로 강력한 공격을 가합니다',
    type: 'damage',
    trigger: 'onAttack',
    chance: 0.2,
    cooldown: 3,
    effects: [{
      type: 'damage',
      target: 'player',
      multiplier: 3.0
    }]
  },
  
  voidCall: {
    id: 'voidCall',
    name: '무의 부름',
    description: '심연의 힘을 불러 모든 능력치를 강화합니다',
    type: 'buff',
    trigger: 'onBelowHalfHp',
    chance: 1.0,
    cooldown: 999,
    effects: [{
      type: 'buff',
      target: 'self',
      stat: 'attack',
      multiplier: 1.5,
      duration: 999
    }, {
      type: 'buff',
      target: 'self',
      stat: 'defense',
      multiplier: 1.5,
      duration: 999
    }]
  }
}