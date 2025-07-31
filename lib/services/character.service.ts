/**
 * 캐릭터 관리 서비스
 * 캐릭터 정보, 스탯, 레벨 관리
 */

import type { Character, CoreStat, CombatStat } from '../types/game-core'
import { CoreStats, CombatStats } from '../types/game-core'
import { LEVEL_CONFIG } from '../constants/game.constants'
import { statFormulas, calculateCombatStats, calculateRequiredExperience } from '../utils/stat-calculator'

class CharacterService {
  private static instance: CharacterService
  private character: Character | null = null

  private constructor() {
    // 기본 캐릭터 생성
    this.createDefaultCharacter()
  }

  static getInstance(): CharacterService {
    if (!CharacterService.instance) {
      CharacterService.instance = new CharacterService()
    }
    return CharacterService.instance
  }

  // 기본 캐릭터 생성
  private createDefaultCharacter(): void {
    const defaultLevel = 0
    
    this.character = {
      id: 'player-1',
      name: '모험가',
      level: defaultLevel,
      experience: 0,
      coreStats: {
        [CoreStats.HEALTH]: 10,
        [CoreStats.LEARNING]: 10,
        [CoreStats.RELATIONSHIP]: 10,
        [CoreStats.ACHIEVEMENT]: 10
      },
      combatStats: calculateCombatStats(defaultLevel),
      energy: 100,
      maxEnergy: 100,
      gold: 0,
      gems: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
  }

  // 캐릭터 가져오기
  getCharacter(): Character | null {
    return this.character
  }

  // 캐릭터 설정
  setCharacter(character: Character): void {
    this.character = character
  }

  // 경험치 추가
  addExperience(amount: number): { leveledUp: boolean; newLevel: number } {
    if (!this.character) return { leveledUp: false, newLevel: 0 }

    const oldLevel = this.character.level
    let newExperience = this.character.experience + amount
    let newLevel = this.character.level
    let leveledUp = false

    // 레벨업 체크
    while (newExperience >= this.getRequiredExperience(newLevel)) {
      newExperience -= this.getRequiredExperience(newLevel)
      newLevel++
      leveledUp = true
    }

    // 새로운 캐릭터 객체 생성
    this.character = {
      ...this.character,
      experience: newExperience,
      level: newLevel,
      lastActiveAt: Date.now()
    }

    // 레벨업 보상
    if (leveledUp) {
      this.applyLevelUpRewards()
    }

    return { leveledUp, newLevel }
  }

  // 필요 경험치 계산
  getRequiredExperience(level: number): number {
    return calculateRequiredExperience(level)
  }

  // 레벨업 보상 적용
  private applyLevelUpRewards(): void {
    if (!this.character) return

    // 전체 스탯 재계산 (레벨 기반)
    this.recalculateStats()
    
    // HP/MP 완전 회복
    this.heal(9999, 9999)
  }

  // 골드 추가/제거
  modifyGold(amount: number): boolean {
    if (!this.character) return false
    
    if (this.character.gold + amount < 0) return false
    
    this.character = {
      ...this.character,
      gold: this.character.gold + amount,
      lastActiveAt: Date.now()
    }
    return true
  }

  // HP/MP 회복
  heal(hpAmount: number, mpAmount: number): void {
    if (!this.character) return

    // 최대 HP/MP 계산 (레벨 기반)
    const maxHp = this.calculateMaxHp(this.character.level)
    const maxMp = this.calculateMaxMp(this.character.level)

    // 새로운 객체 생성
    this.character = {
      ...this.character,
      combatStats: {
        ...this.character.combatStats,
        [CombatStats.HP]: Math.min(
          this.character.combatStats[CombatStats.HP] + hpAmount,
          maxHp
        ),
        [CombatStats.MP]: Math.min(
          this.character.combatStats[CombatStats.MP] + mpAmount,
          maxMp
        )
      },
      lastActiveAt: Date.now()
    }
  }

  // 데미지 받기
  takeDamage(damage: number): boolean {
    if (!this.character) return false

    // 새로운 객체 생성
    this.character = {
      ...this.character,
      combatStats: {
        ...this.character.combatStats,
        [CombatStats.HP]: Math.max(0, this.character.combatStats[CombatStats.HP] - damage)
      },
      lastActiveAt: Date.now()
    }
    
    // 사망 체크
    return this.character.combatStats[CombatStats.HP] <= 0
  }

  // MP 사용
  useMp(amount: number): boolean {
    if (!this.character) return false
    
    if (this.character.combatStats[CombatStats.MP] < amount) return false
    
    // 새로운 객체 생성
    this.character = {
      ...this.character,
      combatStats: {
        ...this.character.combatStats,
        [CombatStats.MP]: this.character.combatStats[CombatStats.MP] - amount
      },
      lastActiveAt: Date.now()
    }
    return true
  }

  // 스탯 버프/디버프
  modifyStat(stat: CombatStat, amount: number, duration?: number): void {
    if (!this.character) return

    // 임시 구현 - 추후 버프 시스템 구현 시 개선
    const currentValue = this.character.combatStats[stat]
    if (typeof currentValue === 'number') {
      this.character = {
        ...this.character,
        combatStats: {
          ...this.character.combatStats,
          [stat]: Math.max(0, currentValue + amount)
        },
        lastActiveAt: Date.now()
      }
    }
  }

  // 캐릭터 초기화
  resetCharacter(): void {
    this.createDefaultCharacter()
  }

  // 캐릭터 데이터 복원
  restoreCharacter(character: Character): void {
    this.character = { ...character }
  }

  // 최대 HP 계산
  calculateMaxHp(level: number): number {
    return statFormulas.hp(level)
  }

  // 최대 MP 계산
  calculateMaxMp(level: number): number {
    return statFormulas.mp(level)
  }

  // 전체 스탯 재계산
  recalculateStats(): void {
    if (!this.character) return

    const level = this.character.level
    
    // 새로운 객체 생성
    this.character = {
      ...this.character,
      combatStats: calculateCombatStats(level)
    }
  }
}

export const characterService = CharacterService.getInstance()