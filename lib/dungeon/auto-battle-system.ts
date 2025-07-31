import { Stat } from '@/lib/types/dashboard'

export interface AutoBattleCharacter {
  name: string
  emoji: string
  stats: {
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    physicalAttack: number
    magicalAttack: number
    defense: number
    speed: number
    critRate: number
    dodgeRate: number
    buffPower: number
  }
  skills: BattleSkill[]
  position: { x: number; y: number }
}

export interface BattleSkill {
  id: string
  name: string
  type: 'physical' | 'magical' | 'buff' | 'debuff' | 'heal'
  power: number
  mpCost: number
  cooldown: number
  currentCooldown: number
  animation: string
  range: number
}

export interface BattleAction {
  attacker: 'player' | 'enemy'
  skill: BattleSkill
  damage?: number
  healing?: number
  effect?: string
  isCritical?: boolean
  isDodged?: boolean
  timestamp: number
}

export interface BattleResult {
  winner: 'player' | 'enemy'
  turns: number
  actions: BattleAction[]
  rewards?: {
    exp: number
    coins: number
    items: string[]
  }
}

// 스탯을 전투 능력치로 변환
export function convertStatsToBattleStats(stats: Stat[]): AutoBattleCharacter['stats'] {
  const health = stats.find(s => s.type === 'health') || { level: 1, experience: 0 }
  const learning = stats.find(s => s.type === 'learning') || { level: 1, experience: 0 }
  const relationship = stats.find(s => s.type === 'relationship') || { level: 1, experience: 0 }
  const achievement = stats.find(s => s.type === 'achievement') || { level: 1, experience: 0 }

  return {
    // 건강 스탯 → HP와 물리공격력
    hp: 100 + health.level * 20,
    maxHp: 100 + health.level * 20,
    physicalAttack: 10 + health.level * 5,
    
    // 학습 스탯 → MP와 마법공격력
    mp: 50 + learning.level * 10,
    maxMp: 50 + learning.level * 10,
    magicalAttack: 10 + learning.level * 5,
    
    // 관계 스탯 → 버프 효과와 방어력
    buffPower: 1 + relationship.level * 0.1,
    defense: 5 + relationship.level * 3,
    
    // 성취 스탯 → 크리티컬과 회피율
    critRate: 0.05 + achievement.level * 0.02,
    dodgeRate: 0.05 + achievement.level * 0.02,
    speed: 10 + achievement.level * 2
  }
}

// 레벨에 따른 사용 가능 스킬
export function getAvailableSkills(stats: Stat[]): BattleSkill[] {
  const skills: BattleSkill[] = [
    {
      id: 'basic_attack',
      name: '기본 공격',
      type: 'physical',
      power: 1.0,
      mpCost: 0,
      cooldown: 0,
      currentCooldown: 0,
      animation: 'slash',
      range: 1
    }
  ]

  const health = stats.find(s => s.type === 'health')
  const learning = stats.find(s => s.type === 'learning')
  const relationship = stats.find(s => s.type === 'relationship')
  const achievement = stats.find(s => s.type === 'achievement')

  // 건강 레벨 3 이상: 파워 스트라이크
  if (health && health.level >= 3) {
    skills.push({
      id: 'power_strike',
      name: '파워 스트라이크',
      type: 'physical',
      power: 2.0,
      mpCost: 10,
      cooldown: 3,
      currentCooldown: 0,
      animation: 'power_slash',
      range: 1
    })
  }

  // 학습 레벨 3 이상: 파이어볼
  if (learning && learning.level >= 3) {
    skills.push({
      id: 'fireball',
      name: '파이어볼',
      type: 'magical',
      power: 2.2,
      mpCost: 15,
      cooldown: 3,
      currentCooldown: 0,
      animation: 'fireball',
      range: 3
    })
  }

  // 관계 레벨 2 이상: 힐
  if (relationship && relationship.level >= 2) {
    skills.push({
      id: 'heal',
      name: '힐',
      type: 'heal',
      power: 1.5,
      mpCost: 20,
      cooldown: 5,
      currentCooldown: 0,
      animation: 'heal',
      range: 0
    })
  }

  // 관계 레벨 5 이상: 버프
  if (relationship && relationship.level >= 5) {
    skills.push({
      id: 'power_buff',
      name: '파워 버프',
      type: 'buff',
      power: 1.3,
      mpCost: 25,
      cooldown: 8,
      currentCooldown: 0,
      animation: 'buff',
      range: 0
    })
  }

  // 성취 레벨 5 이상: 연속 공격
  if (achievement && achievement.level >= 5) {
    skills.push({
      id: 'multi_strike',
      name: '연속 공격',
      type: 'physical',
      power: 0.8,
      mpCost: 30,
      cooldown: 5,
      currentCooldown: 0,
      animation: 'multi_slash',
      range: 2
    })
  }

  return skills
}

export class AutoBattleSystem {
  private player: AutoBattleCharacter
  private enemy: AutoBattleCharacter
  private actions: BattleAction[] = []
  private turn: number = 0
  private isRunning: boolean = false
  private battleSpeed: number = 1000 // ms per action

  constructor(playerStats: Stat[], enemy: Omit<AutoBattleCharacter, 'position'>) {
    const battleStats = convertStatsToBattleStats(playerStats)
    const skills = getAvailableSkills(playerStats)
    
    this.player = {
      name: '플레이어',
      emoji: '🦸',
      stats: { ...battleStats },
      skills: skills,
      position: { x: 100, y: 200 }
    }

    this.enemy = {
      ...enemy,
      position: { x: 500, y: 200 }
    }
  }

  get currentPlayer() {
    return this.player
  }

  get currentEnemy() {
    return this.enemy
  }

  get battleActions() {
    return this.actions
  }

  get isOver() {
    return this.player.stats.hp <= 0 || this.enemy.stats.hp <= 0
  }

  get winner() {
    if (!this.isOver) return null
    return this.player.stats.hp > 0 ? 'player' : 'enemy'
  }

  // 자동 전투 시작
  async startAutoBattle(onActionCallback?: (action: BattleAction) => void): Promise<BattleResult> {
    this.isRunning = true
    
    while (!this.isOver && this.isRunning) {
      // 속도에 따른 행동 순서 결정
      const playerFirst = this.player.stats.speed >= this.enemy.stats.speed

      if (playerFirst) {
        await this.executeCharacterTurn('player', onActionCallback)
        if (!this.isOver) {
          await this.executeCharacterTurn('enemy', onActionCallback)
        }
      } else {
        await this.executeCharacterTurn('enemy', onActionCallback)
        if (!this.isOver) {
          await this.executeCharacterTurn('player', onActionCallback)
        }
      }

      this.turn++
      await this.delay(this.battleSpeed)

      // 쿨다운 감소
      this.updateCooldowns()
    }

    return {
      winner: this.winner!,
      turns: this.turn,
      actions: this.actions,
      rewards: this.winner === 'player' ? this.calculateRewards() : undefined
    }
  }

  private async executeCharacterTurn(
    character: 'player' | 'enemy',
    onActionCallback?: (action: BattleAction) => void
  ) {
    const attacker = character === 'player' ? this.player : this.enemy
    const defender = character === 'player' ? this.enemy : this.player

    // AI: 사용 가능한 스킬 중 선택
    const availableSkills = attacker.skills.filter(
      skill => skill.currentCooldown === 0 && attacker.stats.mp >= skill.mpCost
    )

    if (availableSkills.length === 0) return

    // 스킬 선택 로직
    let selectedSkill: BattleSkill

    // HP가 낮으면 힐 우선
    if (attacker.stats.hp < attacker.stats.maxHp * 0.3) {
      const healSkill = availableSkills.find(s => s.type === 'heal')
      if (healSkill) {
        selectedSkill = healSkill
      } else {
        selectedSkill = this.selectOffensiveSkill(availableSkills, attacker, defender)
      }
    } else {
      selectedSkill = this.selectOffensiveSkill(availableSkills, attacker, defender)
    }

    // 스킬 실행
    const action = this.executeSkill(attacker, defender, selectedSkill, character)
    this.actions.push(action)

    if (onActionCallback) {
      onActionCallback(action)
    }

    // MP 소모 및 쿨다운 적용
    attacker.stats.mp -= selectedSkill.mpCost
    selectedSkill.currentCooldown = selectedSkill.cooldown
  }

  private selectOffensiveSkill(
    skills: BattleSkill[],
    attacker: AutoBattleCharacter,
    defender: AutoBattleCharacter
  ): BattleSkill {
    // 강력한 스킬 우선 사용
    const offensiveSkills = skills
      .filter(s => s.type === 'physical' || s.type === 'magical')
      .sort((a, b) => b.power - a.power)

    if (offensiveSkills.length > 0) {
      return offensiveSkills[0]
    }

    // 버프가 있으면 사용
    const buffSkill = skills.find(s => s.type === 'buff')
    if (buffSkill) return buffSkill

    // 기본 공격
    return skills[0]
  }

  private executeSkill(
    attacker: AutoBattleCharacter,
    defender: AutoBattleCharacter,
    skill: BattleSkill,
    attackerType: 'player' | 'enemy'
  ): BattleAction {
    const action: BattleAction = {
      attacker: attackerType,
      skill: skill,
      timestamp: Date.now()
    }

    // 회피 체크
    if (skill.type === 'physical' || skill.type === 'magical') {
      if (Math.random() < defender.stats.dodgeRate) {
        action.isDodged = true
        return action
      }
    }

    switch (skill.type) {
      case 'physical':
        const physicalDamage = this.calculateDamage(
          attacker.stats.physicalAttack * skill.power,
          defender.stats.defense,
          attacker.stats.critRate
        )
        defender.stats.hp = Math.max(0, defender.stats.hp - physicalDamage.damage)
        action.damage = physicalDamage.damage
        action.isCritical = physicalDamage.isCritical
        break

      case 'magical':
        const magicalDamage = this.calculateDamage(
          attacker.stats.magicalAttack * skill.power,
          defender.stats.defense * 0.7, // 마법 방어는 물리 방어의 70%
          attacker.stats.critRate
        )
        defender.stats.hp = Math.max(0, defender.stats.hp - magicalDamage.damage)
        action.damage = magicalDamage.damage
        action.isCritical = magicalDamage.isCritical
        break

      case 'heal':
        const healAmount = Math.floor(attacker.stats.magicalAttack * skill.power)
        attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + healAmount)
        action.healing = healAmount
        break

      case 'buff':
        // 버프 효과는 일시적으로 공격력 증가
        attacker.stats.physicalAttack *= skill.power
        attacker.stats.magicalAttack *= skill.power
        action.effect = `공격력 ${Math.floor((skill.power - 1) * 100)}% 증가`
        break
    }

    return action
  }

  private calculateDamage(
    attackPower: number,
    defense: number,
    critRate: number
  ): { damage: number; isCritical: boolean } {
    const baseDamage = Math.max(1, attackPower - defense * 0.5)
    const variance = 0.9 + Math.random() * 0.2 // 90% ~ 110%
    const isCritical = Math.random() < critRate
    const critMultiplier = isCritical ? 2 : 1

    return {
      damage: Math.floor(baseDamage * variance * critMultiplier),
      isCritical
    }
  }

  private updateCooldowns() {
    [this.player, this.enemy].forEach(character => {
      character.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--
        }
      })
    })
  }

  private calculateRewards() {
    // 적 레벨과 난이도에 따른 보상 계산
    const baseExp = 50
    const baseCoins = 20
    
    return {
      exp: baseExp + Math.floor(Math.random() * 20),
      coins: baseCoins + Math.floor(Math.random() * 10),
      items: Math.random() < 0.3 ? ['potion_small'] : []
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stopBattle() {
    this.isRunning = false
  }
}

// 몬스터 데이터베이스 (자동전투용)
export const AUTO_BATTLE_MONSTERS: { [key: string]: Omit<AutoBattleCharacter, 'position'> } = {
  slime: {
    name: '슬라임',
    emoji: '🟢',
    stats: {
      hp: 50,
      maxHp: 50,
      mp: 20,
      maxMp: 20,
      physicalAttack: 8,
      magicalAttack: 5,
      defense: 3,
      speed: 5,
      critRate: 0.05,
      dodgeRate: 0.1,
      buffPower: 1
    },
    skills: [
      {
        id: 'slime_bounce',
        name: '슬라임 바운스',
        type: 'physical',
        power: 1.2,
        mpCost: 5,
        cooldown: 2,
        currentCooldown: 0,
        animation: 'bounce',
        range: 1
      }
    ]
  },
  goblin: {
    name: '고블린',
    emoji: '👺',
    stats: {
      hp: 80,
      maxHp: 80,
      mp: 30,
      maxMp: 30,
      physicalAttack: 15,
      magicalAttack: 8,
      defense: 8,
      speed: 12,
      critRate: 0.15,
      dodgeRate: 0.15,
      buffPower: 1
    },
    skills: [
      {
        id: 'goblin_slash',
        name: '고블린 슬래시',
        type: 'physical',
        power: 1.5,
        mpCost: 10,
        cooldown: 2,
        currentCooldown: 0,
        animation: 'slash',
        range: 1
      },
      {
        id: 'goblin_rage',
        name: '고블린의 분노',
        type: 'buff',
        power: 1.3,
        mpCost: 15,
        cooldown: 5,
        currentCooldown: 0,
        animation: 'rage',
        range: 0
      }
    ]
  },
  orc: {
    name: '오크',
    emoji: '👹',
    stats: {
      hp: 150,
      maxHp: 150,
      mp: 50,
      maxMp: 50,
      physicalAttack: 25,
      magicalAttack: 10,
      defense: 15,
      speed: 8,
      critRate: 0.2,
      dodgeRate: 0.05,
      buffPower: 1.1
    },
    skills: [
      {
        id: 'orc_smash',
        name: '오크 스매시',
        type: 'physical',
        power: 1.8,
        mpCost: 15,
        cooldown: 2,
        currentCooldown: 0,
        animation: 'smash',
        range: 1
      },
      {
        id: 'orc_battlecry',
        name: '전투 함성',
        type: 'buff',
        power: 1.5,
        mpCost: 20,
        cooldown: 4,
        currentCooldown: 0,
        animation: 'battlecry',
        range: 0
      }
    ]
  },
  dragon: {
    name: '드래곤',
    emoji: '🐉',
    stats: {
      hp: 300,
      maxHp: 300,
      mp: 100,
      maxMp: 100,
      physicalAttack: 40,
      magicalAttack: 50,
      defense: 25,
      speed: 20,
      critRate: 0.25,
      dodgeRate: 0.1,
      buffPower: 1.2
    },
    skills: [
      {
        id: 'dragon_breath',
        name: '드래곤 브레스',
        type: 'magical',
        power: 2.5,
        mpCost: 30,
        cooldown: 3,
        currentCooldown: 0,
        animation: 'fire_breath',
        range: 5
      },
      {
        id: 'dragon_claw',
        name: '드래곤 클로',
        type: 'physical',
        power: 2.0,
        mpCost: 20,
        cooldown: 2,
        currentCooldown: 0,
        animation: 'claw',
        range: 2
      },
      {
        id: 'dragon_roar',
        name: '드래곤 로어',
        type: 'debuff',
        power: 0.7,
        mpCost: 25,
        cooldown: 5,
        currentCooldown: 0,
        animation: 'roar',
        range: 10
      }
    ]
  }
}