export interface BattleStats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
  critRate: number
}

export interface Monster {
  id: string
  name: string
  emoji: string
  level: number
  stats: BattleStats
  rewards: {
    exp: number
    coins: number
    itemDropRate: number
    possibleItems: string[]
  }
  skills: MonsterSkill[]
}

export interface MonsterSkill {
  id: string
  name: string
  damage: number
  mpCost: number
  effect?: 'stun' | 'poison' | 'burn' | 'freeze'
  effectChance?: number
}

export interface PlayerBattleState extends BattleStats {
  level: number
  statusEffects: StatusEffect[]
  skills: PlayerSkill[]
}

export interface StatusEffect {
  type: 'stun' | 'poison' | 'burn' | 'freeze' | 'buff' | 'debuff'
  duration: number
  value?: number
}

export interface PlayerSkill {
  id: string
  name: string
  type: 'physical' | 'magical' | 'heal' | 'buff'
  power: number
  mpCost: number
  cooldown: number
  currentCooldown: number
  statRequirement?: {
    type: 'health' | 'learning' | 'relationship' | 'achievement'
    level: number
  }
}

export interface BattleAction {
  type: 'attack' | 'skill' | 'item' | 'flee'
  skillId?: string
  itemId?: string
  target?: 'enemy' | 'self'
}

export interface BattleLog {
  message: string
  type: 'damage' | 'heal' | 'effect' | 'critical' | 'miss' | 'system'
  value?: number
}

export class BattleSystem {
  private playerState: PlayerBattleState
  private monsterState: Monster & { currentHp: number; currentMp: number; statusEffects: StatusEffect[] }
  private battleLog: BattleLog[] = []
  private turn = 0
  private isPlayerTurn = true

  constructor(player: PlayerBattleState, monster: Monster) {
    this.playerState = { ...player }
    this.monsterState = {
      ...monster,
      currentHp: monster.stats.hp,
      currentMp: monster.stats.mp,
      statusEffects: []
    }

    // 전투 시작 메시지
    this.addLog({
      message: `${monster.name}과(와)의 전투가 시작되었습니다!`,
      type: 'system'
    })
  }

  get player() {
    return this.playerState
  }

  get monster() {
    return this.monsterState
  }

  get logs() {
    return this.battleLog
  }

  get currentTurn() {
    return this.turn
  }

  get isPlayersTurn() {
    return this.isPlayerTurn
  }

  get isBattleOver() {
    return this.playerState.hp <= 0 || this.monsterState.currentHp <= 0
  }

  get winner() {
    if (!this.isBattleOver) {
      return null
    }
    return this.playerState.hp > 0 ? 'player' : 'monster'
  }

  private addLog(log: BattleLog) {
    this.battleLog.push(log)
  }

  private calculateDamage(attacker: { attack: number; critRate: number }, defender: { defense: number }) {
    const baseDamage = Math.max(1, attacker.attack - defender.defense * 0.5)
    const variance = 0.8 + Math.random() * 0.4 // 80% ~ 120%
    const isCritical = Math.random() < attacker.critRate
    const critMultiplier = isCritical ? 2 : 1

    const finalDamage = Math.floor(baseDamage * variance * critMultiplier)

    return { damage: finalDamage, isCritical }
  }

  private applyStatusEffects(target: 'player' | 'monster') {
    const state = target === 'player' ? this.playerState : this.monsterState
    const toRemove: number[] = []

    state.statusEffects.forEach((effect, index) => {
      switch (effect.type) {
        case 'poison':
          const poisonDamage = effect.value || 5
          if (target === 'player') {
            this.playerState.hp = Math.max(0, this.playerState.hp - poisonDamage)
          } else {
            this.monsterState.currentHp = Math.max(0, this.monsterState.currentHp - poisonDamage)
          }
          this.addLog({
            message: `${target === 'player' ? '플레이어' : this.monsterState.name}가 독 데미지를 받았습니다!`,
            type: 'effect',
            value: poisonDamage
          })
          break
        case 'burn':
          const burnDamage = effect.value || 3
          if (target === 'player') {
            this.playerState.hp = Math.max(0, this.playerState.hp - burnDamage)
          } else {
            this.monsterState.currentHp = Math.max(0, this.monsterState.currentHp - burnDamage)
          }
          this.addLog({
            message: `${target === 'player' ? '플레이어' : this.monsterState.name}가 화상 데미지를 받았습니다!`,
            type: 'effect',
            value: burnDamage
          })
          break
      }

      effect.duration--
      if (effect.duration <= 0) {
        toRemove.push(index)
      }
    })

    // Remove expired effects
    toRemove.reverse().forEach(index => {
      state.statusEffects.splice(index, 1)
    })
  }

  private updateCooldowns() {
    this.playerState.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--
      }
    })
  }

  executePlayerAction(action: BattleAction): BattleLog[] {
    if (!this.isPlayerTurn || this.isBattleOver) {
      return []
    }

    this.battleLog = []

    switch (action.type) {
      case 'attack':
        const { damage, isCritical } = this.calculateDamage(
          { attack: this.playerState.attack, critRate: this.playerState.critRate },
          { defense: this.monsterState.stats.defense }
        )
        this.monsterState.currentHp = Math.max(0, this.monsterState.currentHp - damage)
        this.addLog({
          message: isCritical
            ? `플레이어의 강력한 일격! ${this.monsterState.name}에게 치명타!`
            : `플레이어가 ${this.monsterState.name}을(를) 공격했습니다!`,
          type: isCritical ? 'critical' : 'damage',
          value: damage
        })
        break

      case 'skill':
        if (!action.skillId) {
          break
        }
        const skill = this.playerState.skills.find(s => s.id === action.skillId)
        if (!skill || skill.currentCooldown > 0 || this.playerState.mp < skill.mpCost) {
          this.addLog({
            message: '스킬을 사용할 수 없습니다!',
            type: 'system'
          })
          return this.battleLog
        }

        this.playerState.mp -= skill.mpCost
        skill.currentCooldown = skill.cooldown

        if (skill.type === 'heal') {
          const healAmount = skill.power
          this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + healAmount)
          this.addLog({
            message: `${skill.name}으로 체력을 회복했습니다!`,
            type: 'heal',
            value: healAmount
          })
        } else {
          const skillDamage = skill.power
          this.monsterState.currentHp = Math.max(0, this.monsterState.currentHp - skillDamage)
          this.addLog({
            message: `${skill.name}을 사용했습니다!`,
            type: 'damage',
            value: skillDamage
          })
        }
        break

      case 'flee':
        const fleeChance = 0.5 + (this.playerState.speed - this.monsterState.stats.speed) * 0.05
        if (Math.random() < fleeChance) {
          this.addLog({
            message: '재빠르게 전투에서 도망쳤습니다!',
            type: 'system'
          })
          return this.battleLog
        } else {
          this.addLog({
            message: `${this.monsterState.name}이(가) 도망치는 것을 막았습니다!`,
            type: 'system'
          })
        }
        break
    }

    // Apply status effects
    this.applyStatusEffects('player')
    this.applyStatusEffects('monster')

    // Update cooldowns
    this.updateCooldowns()

    // Check if battle is over
    if (!this.isBattleOver) {
      this.isPlayerTurn = false
      this.executeMonsterTurn()
    }

    this.turn++
    return this.battleLog
  }

  private executeMonsterTurn() {
    if (this.isBattleOver) {
      return
    }

    // Simple AI: Choose random skill or basic attack
    const availableSkills = this.monsterState.skills.filter(
      skill => this.monsterState.currentMp >= skill.mpCost
    )

    const useSkill = availableSkills.length > 0 && Math.random() < 0.5

    if (useSkill) {
      const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
      this.monsterState.currentMp -= skill.mpCost

      const damage = skill.damage
      this.playerState.hp = Math.max(0, this.playerState.hp - damage)

      this.addLog({
        message: `${this.monsterState.name}이(가) ${skill.name} 스킬을 사용했습니다!`,
        type: 'damage',
        value: damage
      })

      // Apply status effect if any
      if (skill.effect && skill.effectChance && Math.random() < skill.effectChance) {
        this.playerState.statusEffects.push({
          type: skill.effect,
          duration: 3,
          value: Math.floor(skill.damage * 0.3)
        })
        this.addLog({
          message: `${skill.effect} 상태에 걸렸습니다!`,
          type: 'effect'
        })
      }
    } else {
      // Basic attack
      const { damage, isCritical } = this.calculateDamage(
        { attack: this.monsterState.stats.attack, critRate: this.monsterState.stats.critRate },
        { defense: this.playerState.defense }
      )
      this.playerState.hp = Math.max(0, this.playerState.hp - damage)
      this.addLog({
        message: isCritical
          ? `${this.monsterState.name}의 강력한 일격! 플레이어에게 치명타!`
          : `${this.monsterState.name}이(가) 플레이어를 공격했습니다!`,
        type: isCritical ? 'critical' : 'damage',
        value: damage
      })
    }

    this.isPlayerTurn = true
  }

  getBattleRewards() {
    if (!this.isBattleOver || this.winner !== 'player') {
      return null
    }

    const rewards = { ...this.monsterState.rewards }
    const droppedItems: string[] = []

    if (Math.random() < rewards.itemDropRate) {
      const randomItem = rewards.possibleItems[
        Math.floor(Math.random() * rewards.possibleItems.length)
      ]
      if (randomItem) {
        droppedItems.push(randomItem)
      }
    }

    return {
      exp: rewards.exp,
      coins: rewards.coins,
      items: droppedItems
    }
  }
}

// 몬스터 데이터베이스
export const MONSTERS: { [key: string]: Monster } = {
  slime: {
    id: 'slime',
    name: '슬라임',
    emoji: '🟢',
    level: 1,
    stats: {
      hp: 20,
      maxHp: 20,
      mp: 5,
      maxMp: 5,
      attack: 5,
      defense: 2,
      speed: 3,
      critRate: 0.05
    },
    rewards: {
      exp: 10,
      coins: 5,
      itemDropRate: 0.1,
      possibleItems: ['potion_small']
    },
    skills: [{
      id: 'slime_bounce',
      name: '슬라임 바운스',
      damage: 7,
      mpCost: 2,
      effect: undefined,
      effectChance: 0
    }]
  },
  goblin: {
    id: 'goblin',
    name: '고블린',
    emoji: '👺',
    level: 3,
    stats: {
      hp: 35,
      maxHp: 35,
      mp: 10,
      maxMp: 10,
      attack: 12,
      defense: 5,
      speed: 7,
      critRate: 0.1
    },
    rewards: {
      exp: 25,
      coins: 15,
      itemDropRate: 0.2,
      possibleItems: ['potion_medium', 'sword_basic']
    },
    skills: [{
      id: 'goblin_strike',
      name: '고블린 스트라이크',
      damage: 15,
      mpCost: 3,
      effect: undefined,
      effectChance: 0
    }]
  },
  dragon: {
    id: 'dragon',
    name: '드래곤',
    emoji: '🐉',
    level: 10,
    stats: {
      hp: 200,
      maxHp: 200,
      mp: 50,
      maxMp: 50,
      attack: 50,
      defense: 30,
      speed: 20,
      critRate: 0.2
    },
    rewards: {
      exp: 500,
      coins: 200,
      itemDropRate: 0.8,
      possibleItems: ['potion_large', 'sword_legendary', 'armor_legendary']
    },
    skills: [
      {
        id: 'fire_breath',
        name: '화염 숨결',
        damage: 60,
        mpCost: 10,
        effect: 'burn',
        effectChance: 0.5
      },
      {
        id: 'dragon_roar',
        name: '용의 포효',
        damage: 40,
        mpCost: 5,
        effect: 'stun',
        effectChance: 0.3
      }
    ]
  }
}

// 플레이어 스킬 데이터베이스
export const PLAYER_SKILLS: { [key: string]: PlayerSkill } = {
  basic_attack: {
    id: 'basic_attack',
    name: '기본 공격',
    type: 'physical',
    power: 10,
    mpCost: 0,
    cooldown: 0,
    currentCooldown: 0
  },
  power_strike: {
    id: 'power_strike',
    name: '파워 스트라이크',
    type: 'physical',
    power: 25,
    mpCost: 5,
    cooldown: 2,
    currentCooldown: 0,
    statRequirement: {
      type: 'health',
      level: 3
    }
  },
  heal: {
    id: 'heal',
    name: '힐',
    type: 'heal',
    power: 30,
    mpCost: 10,
    cooldown: 3,
    currentCooldown: 0,
    statRequirement: {
      type: 'learning',
      level: 2
    }
  },
  fire_ball: {
    id: 'fire_ball',
    name: '파이어볼',
    type: 'magical',
    power: 35,
    mpCost: 15,
    cooldown: 3,
    currentCooldown: 0,
    statRequirement: {
      type: 'learning',
      level: 5
    }
  }
}
