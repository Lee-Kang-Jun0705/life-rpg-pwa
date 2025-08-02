import { 
  DifficultyLevel, 
  DifficultyModifiers, 
  DIFFICULTY_SETTINGS,
  EliteType,
  ELITE_MODIFIERS,
  DynamicDifficultyState,
  calculateDynamicDifficulty
} from '@/lib/types/difficulty-system'
import { EnemyData } from '@/lib/types/battle.types'
import { MonsterAIState } from '@/lib/types/monster-ai'
import { DungeonReward, DungeonItem } from '@/lib/types/dungeon'
import { BossData } from '@/lib/types/boss-system'

export class DifficultyService {
  private static currentDifficulty: DifficultyLevel = 'normal'
  private static dynamicState: DynamicDifficultyState = {
    baseLevel: 'normal',
    playerDeathCount: 0,
    playerVictoryStreak: 0,
    averageBattleDuration: 0,
    playerLevelDifference: 0
  }
  
  // 현재 난이도 가져오기
  static getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty
  }
  
  // 난이도 설정
  static setDifficulty(difficulty: DifficultyLevel) {
    this.currentDifficulty = difficulty
    this.dynamicState.baseLevel = difficulty
    console.log(`난이도가 ${difficulty}로 설정되었습니다.`)
  }
  
  // 난이도 수정자 가져오기 (동적 난이도 포함)
  static getDifficultyModifiers(useDynamic: boolean = false): DifficultyModifiers {
    const baseModifiers = { ...DIFFICULTY_SETTINGS[this.currentDifficulty] }
    
    if (useDynamic) {
      const dynamicModifiers = calculateDynamicDifficulty(this.dynamicState)
      
      // 동적 수정자 적용
      Object.entries(dynamicModifiers).forEach(([key, value]) => {
        if (typeof value === 'number' && key in baseModifiers) {
          (baseModifiers as any)[key] *= value
        }
      })
    }
    
    return baseModifiers
  }
  
  // 적 스탯에 난이도 적용
  static applyDifficultyToEnemy(enemy: EnemyData, difficulty?: DifficultyLevel): EnemyData {
    const modifiers = difficulty 
      ? DIFFICULTY_SETTINGS[difficulty]
      : this.getDifficultyModifiers()
    
    // 엘리트 몬스터 체크
    let isElite = false
    let eliteType: EliteType | null = null
    
    if (modifiers.enableEliteMonsters && Math.random() < modifiers.eliteMonsterChance) {
      isElite = true
      // 엘리트 타입 결정
      const rand = Math.random()
      if (rand < 0.1) {
        eliteType = 'champion'
      } else if (rand < 0.4) {
        eliteType = 'veteran'
      } else {
        eliteType = 'boss_minion'
      }
    }
    
    // 기본 난이도 수정자 적용
    const modifiedEnemy: EnemyData = {
      ...enemy,
      hp: Math.floor(enemy.hp * modifiers.enemyHpMultiplier),
      maxHp: Math.floor(enemy.maxHp * modifiers.enemyHpMultiplier),
      attack: Math.floor(enemy.attack * modifiers.enemyAttackMultiplier),
      defense: Math.floor(enemy.defense * modifiers.enemyDefenseMultiplier),
      speed: enemy.speed * modifiers.enemySpeedMultiplier,
      statusResistance: (enemy.statusResistance || 0) + modifiers.enemyStatusResistanceBonus
    }
    
    // AI 수정
    if (modifiedEnemy.aiState) {
      modifiedEnemy.aiState.aggression += modifiers.aiAggressionBonus
      modifiedEnemy.aiState.intelligence += modifiers.aiIntelligenceBonus
    }
    
    // 엘리트 수정자 적용
    if (isElite && eliteType) {
      const eliteModifiers = ELITE_MODIFIERS[eliteType]
      modifiedEnemy.hp = Math.floor(modifiedEnemy.hp * eliteModifiers.hpMultiplier)
      modifiedEnemy.maxHp = Math.floor(modifiedEnemy.maxHp * eliteModifiers.hpMultiplier)
      modifiedEnemy.attack = Math.floor(modifiedEnemy.attack * eliteModifiers.attackMultiplier)
      modifiedEnemy.defense = Math.floor(modifiedEnemy.defense * eliteModifiers.defenseMultiplier)
      
      // 엘리트 표시를 위한 추가 정보
      modifiedEnemy.name = `[엘리트] ${modifiedEnemy.name}`
      modifiedEnemy.isElite = true
      modifiedEnemy.eliteType = eliteType
      modifiedEnemy.glowColor = eliteModifiers.glowColor
    }
    
    return modifiedEnemy
  }
  
  // 보스에 난이도 적용
  static applyDifficultyToBoss(boss: BossData, difficulty?: DifficultyLevel): BossData {
    const modifiers = difficulty 
      ? DIFFICULTY_SETTINGS[difficulty]
      : this.getDifficultyModifiers()
    
    const modifiedBoss: BossData = {
      ...boss,
      stats: {
        ...boss.stats,
        hp: Math.floor(boss.stats.hp * modifiers.enemyHpMultiplier),
        attack: Math.floor(boss.stats.attack * modifiers.enemyAttackMultiplier),
        defense: Math.floor(boss.stats.defense * modifiers.enemyDefenseMultiplier),
        speed: boss.stats.speed * modifiers.enemySpeedMultiplier
      }
    }
    
    // 페이즈 비활성화 (쉬움 난이도)
    if (!modifiers.enableBossPhases) {
      modifiedBoss.phases = [modifiedBoss.phases[0]] // 첫 번째 페이즈만 유지
    }
    
    // 페이즈별 수정자 조정
    modifiedBoss.phases = modifiedBoss.phases.map(phase => ({
      ...phase,
      damageMultiplier: phase.damageMultiplier * modifiers.enemyAttackMultiplier,
      defenseMultiplier: phase.defenseMultiplier * modifiers.enemyDefenseMultiplier
    }))
    
    return modifiedBoss
  }
  
  // 보상에 난이도 적용
  static applyDifficultyToRewards(rewards: DungeonReward, difficulty?: DifficultyLevel): DungeonReward {
    const modifiers = difficulty 
      ? DIFFICULTY_SETTINGS[difficulty]
      : this.getDifficultyModifiers()
    
    return {
      ...rewards,
      gold: Math.floor(rewards.gold * modifiers.goldMultiplier),
      items: rewards.items.map(item => ({
        ...item,
        dropRate: item.dropRate * modifiers.itemDropRateMultiplier,
        // 레어 아이템 확률 증가
        rarity: item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary'
          ? item.rarity
          : Math.random() < (modifiers.rareItemChanceMultiplier - 1) * 0.1
            ? 'rare'
            : item.rarity
      }))
    }
  }
  
  // 전투 데미지 계산에 난이도 적용
  static applyDifficultyToDamage(damage: number, isPlayerReceiving: boolean): number {
    const modifiers = this.getDifficultyModifiers()
    
    if (isPlayerReceiving) {
      // 플레이어가 받는 피해
      return Math.floor(damage * (1 + modifiers.playerDamageReduction))
    }
    
    return damage
  }
  
  // 상태이상 확률에 난이도 적용
  static applyDifficultyToStatusChance(baseChance: number, isEnemyApplying: boolean): number {
    const modifiers = this.getDifficultyModifiers()
    
    if (isEnemyApplying) {
      return baseChance * modifiers.enemySkillChanceMultiplier
    }
    
    return baseChance
  }
  
  // 동적 난이도 업데이트
  static updateDynamicDifficulty(event: {
    type: 'death' | 'victory' | 'battle_end'
    battleDuration?: number
    playerLevel?: number
    recommendedLevel?: number
  }) {
    switch (event.type) {
      case 'death':
        this.dynamicState.playerDeathCount++
        this.dynamicState.playerVictoryStreak = 0
        break
        
      case 'victory':
        this.dynamicState.playerVictoryStreak++
        this.dynamicState.playerDeathCount = Math.max(0, this.dynamicState.playerDeathCount - 1)
        break
        
      case 'battle_end':
        if (event.battleDuration) {
          // 평균 전투 시간 업데이트 (이동평균)
          this.dynamicState.averageBattleDuration = 
            this.dynamicState.averageBattleDuration * 0.8 + event.battleDuration * 0.2
        }
        break
    }
    
    // 레벨 차이 업데이트
    if (event.playerLevel && event.recommendedLevel) {
      this.dynamicState.playerLevelDifference = event.playerLevel - event.recommendedLevel
    }
  }
  
  // 동적 난이도 상태 초기화
  static resetDynamicDifficulty() {
    this.dynamicState = {
      baseLevel: this.currentDifficulty,
      playerDeathCount: 0,
      playerVictoryStreak: 0,
      averageBattleDuration: 0,
      playerLevelDifference: 0
    }
  }
  
  // 난이도별 추천 레벨 계산
  static getRecommendedLevel(difficulty: DifficultyLevel, dungeonBaseLevel: number): number {
    const levelModifiers: Record<DifficultyLevel, number> = {
      easy: -5,
      normal: 0,
      hard: 10,
      expert: 20,
      legendary: 30
    }
    
    return Math.max(1, dungeonBaseLevel + levelModifiers[difficulty])
  }
  
  // 플레이어가 던전에 입장 가능한지 확인
  static canEnterDungeon(playerLevel: number, dungeonDifficulty: DifficultyLevel, dungeonBaseLevel: number): {
    canEnter: boolean
    message?: string
  } {
    const recommendedLevel = this.getRecommendedLevel(dungeonDifficulty, dungeonBaseLevel)
    const levelDifference = playerLevel - recommendedLevel
    
    if (levelDifference < -10) {
      return {
        canEnter: false,
        message: `레벨이 너무 낮습니다. 권장 레벨: ${recommendedLevel}`
      }
    }
    
    if (levelDifference < -5) {
      return {
        canEnter: true,
        message: `주의: 권장 레벨보다 ${Math.abs(levelDifference)}레벨 낮습니다.`
      }
    }
    
    return { canEnter: true }
  }
}

// 타입 확장
declare module '@/lib/types/battle.types' {
  interface EnemyData {
    isElite?: boolean
    eliteType?: EliteType
    glowColor?: string
  }
}