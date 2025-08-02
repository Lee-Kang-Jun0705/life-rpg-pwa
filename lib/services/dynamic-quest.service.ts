'use client'

import { 
  DynamicQuest, 
  DynamicQuestGenerationOptions,
  DynamicQuestStats,
  PlayerBehaviorData 
} from '@/lib/types/dynamic-quest'
import { Quest } from '@/lib/types/quest'
import { DYNAMIC_QUEST_RULES, QUEST_GENERATION_TEMPLATES } from '@/lib/data/dynamic-quest-rules'
import { PlayerBehaviorService } from './player-behavior.service'
import { v4 as uuidv4 } from 'uuid'

/**
 * 동적 퀘스트 생성 및 관리 서비스
 */
export class DynamicQuestService {
  private static STORAGE_KEY = 'dynamic-quests'
  private static STATS_KEY = 'dynamic-quest-stats'
  private static HISTORY_KEY = 'dynamic-quest-history'

  /**
   * 동적 퀘스트 생성
   */
  static async generateDynamicQuests(
    options: DynamicQuestGenerationOptions
  ): Promise<DynamicQuest[]> {
    const playerBehavior = PlayerBehaviorService.getBehaviorData(options.userId)
    const playerPreferences = PlayerBehaviorService.analyzePlayerPreferences(options.userId)
    const inactivityDays = PlayerBehaviorService.getInactivityDays(options.userId)
    
    // 현재 활성 퀘스트 확인
    const activeQuests = this.getActiveDynamicQuests(options.userId)
    
    // 생성 가능한 규칙 필터링
    const eligibleRules = DYNAMIC_QUEST_RULES.filter(rule => {
      // 제외 규칙 확인
      if (options.excludeRules?.includes(rule.id)) {
        return false
      }
      
      // 카테고리 필터
      if (options.categories && 
          !rule.template.categoryOptions.some(cat => options.categories?.includes(cat))) {
        return false
      }
      
      // 최대 활성 개수 확인
      const activeRuleQuests = activeQuests.filter(q => q.generatedBy === rule.id)
      if (activeRuleQuests.length >= rule.generation.maxActive) {
        return false
      }
      
      // 쿨다운 확인
      const lastGenerated = this.getLastGeneratedTime(options.userId, rule.id)
      if (lastGenerated) {
        const cooldownMs = rule.generation.cooldown * 60 * 60 * 1000
        if (Date.now() - lastGenerated < cooldownMs) {
          return false
        }
      }
      
      // 강제 생성이면 조건 무시
      if (options.forceGeneration) {
        return true
      }
      
      // 조건 확인
      return this.checkRuleConditions(rule, playerBehavior, inactivityDays)
    })
    
    // 우선순위에 따라 정렬
    eligibleRules.sort((a, b) => b.generation.priority - a.generation.priority)
    
    // 퀘스트 생성
    const generatedQuests: DynamicQuest[] = []
    const maxQuests = options.maxQuests || 3
    
    for (let i = 0; i < Math.min(eligibleRules.length, maxQuests); i++) {
      const rule = eligibleRules[i]
      const quest = this.createQuestFromRule(
        rule, 
        playerBehavior, 
        playerPreferences
      )
      
      generatedQuests.push(quest)
      
      // 생성 기록
      this.recordQuestGeneration(options.userId, rule.id, quest.id)
    }
    
    // 저장
    this.saveDynamicQuests(options.userId, generatedQuests)
    
    return generatedQuests
  }

  /**
   * 규칙 조건 확인
   */
  private static checkRuleConditions(
    rule: typeof DYNAMIC_QUEST_RULES[0],
    behavior: PlayerBehaviorData,
    inactivityDays: number
  ): boolean {
    const conditions = rule.conditions
    
    // 레벨 조건
    if (conditions.minLevel && behavior.progression.currentLevel < conditions.minLevel) {
      return false
    }
    if (conditions.maxLevel && behavior.progression.currentLevel > conditions.maxLevel) {
      return false
    }
    
    // 플레이어 행동 조건
    if (conditions.playerBehavior) {
      const pb = conditions.playerBehavior
      
      if (pb.minBattles && behavior.combatPreference.totalBattles < pb.minBattles) {
        return false
      }
      
      if (pb.minDungeonClears && 
          behavior.explorationPreference.totalDungeonsCleared < pb.minDungeonClears) {
        return false
      }
      
      if (pb.inactivityDays && inactivityDays < pb.inactivityDays) {
        return false
      }
    }
    
    // 시간 조건
    if (conditions.timeConditions) {
      const tc = conditions.timeConditions
      const now = new Date()
      
      if (tc.dayOfWeek && !tc.dayOfWeek.includes(now.getDay())) {
        return false
      }
      
      if (tc.hourOfDay && !tc.hourOfDay.includes(now.getHours())) {
        return false
      }
    }
    
    return true
  }

  /**
   * 규칙으로부터 퀘스트 생성
   */
  private static createQuestFromRule(
    rule: typeof DYNAMIC_QUEST_RULES[0],
    behavior: PlayerBehaviorData,
    preferences: ReturnType<typeof PlayerBehaviorService.analyzePlayerPreferences>
  ): DynamicQuest {
    const template = rule.template
    
    // 제목과 설명 생성
    const title = this.generateTextFromTemplate(
      this.getRandomElement(template.titleTemplates),
      behavior
    )
    const description = this.generateTextFromTemplate(
      this.getRandomElement(template.descriptionTemplates),
      behavior
    )
    
    // 타입과 카테고리 선택
    const type = this.getRandomElement(template.typeOptions)
    const category = this.getRandomElement(template.categoryOptions)
    
    // 목표 생성
    const objectives = template.objectiveTemplates.map((objTemplate, index) => {
      const quantity = this.randomBetween(
        objTemplate.quantityRange.min,
        objTemplate.quantityRange.max
      )
      const target = this.selectTarget(objTemplate.targetOptions, behavior)
      
      return {
        id: `dq-obj-${index}`,
        description: this.generateTextFromTemplate(
          objTemplate.descriptionTemplate,
          behavior,
          { target, quantity }
        ),
        type: objTemplate.type,
        target,
        current: 0,
        required: quantity,
        completed: false
      }
    })
    
    // 난이도 조정
    const difficultyAdjustment = this.calculateDifficultyAdjustment(
      behavior,
      preferences
    )
    
    // 보상 계산
    const rewards = this.calculateRewards(
      template.rewardCalculation,
      behavior.progression.currentLevel,
      objectives.length,
      difficultyAdjustment
    )
    
    // 플레이어 매칭 점수 계산
    const matchScore = this.calculateMatchScore(rule, behavior, preferences)
    
    const quest: DynamicQuest = {
      id: `dq-${uuidv4()}`,
      title,
      description,
      type,
      category,
      status: 'available',
      isDynamic: true,
      generatedAt: new Date().toISOString(),
      generatedBy: rule.id,
      personalizedFor: behavior.userId,
      requirements: {
        level: rule.conditions.minLevel
      },
      objectives,
      rewards,
      timeLimit: rule.generation.expireTime * 60 * 60 * 1000,
      expiresAt: new Date(Date.now() + rule.generation.expireTime * 60 * 60 * 1000).toISOString(),
      adaptiveData: {
        difficultyAdjustment,
        rewardMultiplier: 1 + (difficultyAdjustment * 0.5),
        playerMatchScore: matchScore
      }
    }
    
    return quest
  }

  /**
   * 템플릿으로부터 텍스트 생성
   */
  private static generateTextFromTemplate(
    template: string,
    behavior: PlayerBehaviorData,
    extras?: Record<string, unknown>
  ): string {
    let text = template
    
    // 기본 변수 치환
    text = text.replace('{playerName}', '모험가')
    text = text.replace('{level}', behavior.progression.currentLevel.toString())
    
    // 템플릿 데이터 치환
    const templates = QUEST_GENERATION_TEMPLATES
    text = text.replace('{monsterType}', this.getRandomElement(templates.monsterTypes))
    text = text.replace('{element}', this.getRandomElement(templates.elements))
    text = text.replace('{dungeonName}', this.getRandomElement(templates.dungeonNames))
    text = text.replace('{difficulty}', this.getRandomElement(templates.difficulties))
    text = text.replace('{itemType}', this.getRandomElement(templates.itemTypes))
    text = text.replace('{npcName}', this.getRandomElement(templates.npcNames))
    
    // 추가 변수 치환
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value))
      })
    }
    
    // 연속 접속 일수
    const streakDays = this.getLoginStreak(behavior.userId)
    text = text.replace('{day}', streakDays.toString())
    
    return text
  }

  /**
   * 타겟 선택
   */
  private static selectTarget(
    targetOptions: string[],
    behavior: PlayerBehaviorData
  ): string {
    const option = this.getRandomElement(targetOptions)
    
    switch (option) {
      case 'specific-element':
        return behavior.combatPreference.preferredElements[0] || 'normal'
      case 'specific-type':
        return this.getRandomElement(QUEST_GENERATION_TEMPLATES.monsterTypes)
      case 'specific-dungeon':
        return behavior.explorationPreference.preferredDungeonTypes[0] || '1'
      case 'night-monsters':
        return 'night-wolf'
      case 'dark-element':
        return 'dark'
      case 'elite-monsters':
        return 'elite'
      case 'weekend-dungeon':
        return '4' // 특별 던전
      default:
        return option
    }
  }

  /**
   * 난이도 조정 계산
   */
  private static calculateDifficultyAdjustment(
    behavior: PlayerBehaviorData,
    preferences: ReturnType<typeof PlayerBehaviorService.analyzePlayerPreferences>
  ): number {
    let adjustment = 0
    
    // 승률에 따른 조정
    if (behavior.combatPreference.winRate > 80) {
      adjustment += 0.3
    } else if (behavior.combatPreference.winRate < 50) {
      adjustment -= 0.3
    }
    
    // 플레이 스타일에 따른 조정
    if (preferences.playStyle === 'hardcore') {
      adjustment += 0.2
    } else if (preferences.playStyle === 'casual') {
      adjustment -= 0.2
    }
    
    // 선호 난이도에 따른 조정
    const difficultyMap = { easy: -0.5, normal: 0, hard: 0.3, expert: 0.5, legendary: 0.8 }
    adjustment += difficultyMap[preferences.recommendedDifficulty as keyof typeof difficultyMap] || 0
    
    return Math.max(-1, Math.min(1, adjustment))
  }

  /**
   * 보상 계산
   */
  private static calculateRewards(
    calculation: typeof DYNAMIC_QUEST_RULES[0]['template']['rewardCalculation'],
    level: number,
    objectives: number,
    difficultyAdjustment: number
  ): Quest['rewards'] {
    // 수식 평가를 위한 간단한 파서
    const evalFormula = (formula: string): number => {
      return Math.floor(
        formula
          .replace('level', level.toString())
          .replace('objectives', objectives.toString())
          .replace('streakDays', this.getLoginStreak('current').toString())
          .split('*')
          .reduce((acc, val) => acc * Number(val.trim()), 1)
      )
    }
    
    const baseExp = evalFormula(calculation.expFormula)
    const baseGold = evalFormula(calculation.goldFormula)
    
    // 난이도 조정 적용
    const multiplier = 1 + (difficultyAdjustment * 0.5)
    
    // 아이템 결정
    const items: { itemId: string; quantity: number }[] = []
    calculation.itemPools.forEach(pool => {
      if (Math.random() < pool.chance) {
        const itemId = this.getRandomElement(pool.items)
        items.push({ itemId, quantity: 1 })
      }
    })
    
    return {
      exp: Math.floor(baseExp * multiplier),
      gold: Math.floor(baseGold * multiplier),
      items
    }
  }

  /**
   * 플레이어 매칭 점수 계산
   */
  private static calculateMatchScore(
    rule: typeof DYNAMIC_QUEST_RULES[0],
    behavior: PlayerBehaviorData,
    preferences: ReturnType<typeof PlayerBehaviorService.analyzePlayerPreferences>
  ): number {
    let score = 50 // 기본 점수
    
    // 카테고리 매칭
    if (rule.template.categoryOptions.includes(preferences.primaryCategory as Quest['category'])) {
      score += 30
    } else if (rule.template.categoryOptions.includes(preferences.secondaryCategory as Quest['category'])) {
      score += 15
    }
    
    // 플레이 패턴 매칭
    if (rule.conditions.timeConditions) {
      const now = new Date()
      if (rule.conditions.timeConditions.hourOfDay?.includes(now.getHours())) {
        score += 10
      }
      if (rule.conditions.timeConditions.dayOfWeek?.includes(now.getDay())) {
        score += 10
      }
    }
    
    return Math.min(100, score)
  }

  // 헬퍼 메서드들
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private static getLoginStreak(userId: string): number {
    // 실제 구현에서는 로그인 기록을 확인
    return 1
  }

  // 저장 및 로드 메서드들
  private static getActiveDynamicQuests(userId: string): DynamicQuest[] {
    const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userId}`)
    if (stored) {
      const quests: DynamicQuest[] = JSON.parse(stored)
      // 만료된 퀘스트 필터링
      return quests.filter(q => new Date(q.expiresAt!) > new Date())
    }
    return []
  }

  private static saveDynamicQuests(userId: string, quests: DynamicQuest[]): void {
    const existing = this.getActiveDynamicQuests(userId)
    const combined = [...existing, ...quests]
    localStorage.setItem(`${this.STORAGE_KEY}-${userId}`, JSON.stringify(combined))
  }

  private static getLastGeneratedTime(userId: string, ruleId: string): number | null {
    const history = localStorage.getItem(`${this.HISTORY_KEY}-${userId}`)
    if (history) {
      const parsed = JSON.parse(history)
      return parsed[ruleId] || null
    }
    return null
  }

  private static recordQuestGeneration(userId: string, ruleId: string, questId: string): void {
    const historyKey = `${this.HISTORY_KEY}-${userId}`
    const history = JSON.parse(localStorage.getItem(historyKey) || '{}')
    history[ruleId] = Date.now()
    localStorage.setItem(historyKey, JSON.stringify(history))
    
    // 통계 업데이트
    this.updateStats(userId, 'generated', ruleId)
  }

  private static updateStats(
    userId: string, 
    action: 'generated' | 'completed',
    ruleId?: string
  ): void {
    const statsKey = `${this.STATS_KEY}-${userId}`
    const stats: DynamicQuestStats = JSON.parse(localStorage.getItem(statsKey) || JSON.stringify({
      totalGenerated: 0,
      totalCompleted: 0,
      averageCompletionTime: 0,
      popularCategories: [],
      rewardStats: { totalExp: 0, totalGold: 0, totalItems: 0 },
      generationHistory: []
    }))
    
    if (action === 'generated') {
      stats.totalGenerated++
      if (ruleId) {
        stats.generationHistory.push({
          ruleId,
          generatedAt: new Date().toISOString(),
          completed: false
        })
      }
    } else if (action === 'completed') {
      stats.totalCompleted++
    }
    
    localStorage.setItem(statsKey, JSON.stringify(stats))
  }

  /**
   * 동적 퀘스트 완료 처리
   */
  static completeDynamicQuest(userId: string, questId: string): void {
    const quests = this.getActiveDynamicQuests(userId)
    const questIndex = quests.findIndex(q => q.id === questId)
    
    if (questIndex !== -1) {
      const quest = quests[questIndex]
      quest.status = 'completed'
      quest.completedAt = new Date().toISOString()
      
      // 통계 업데이트
      this.updateStats(userId, 'completed', quest.generatedBy)
      
      // 행동 데이터 업데이트
      PlayerBehaviorService.updateProgression(userId, {
        questCompleted: true,
        exp: quest.rewards.exp
      })
      
      // 저장
      localStorage.setItem(`${this.STORAGE_KEY}-${userId}`, JSON.stringify(quests))
    }
  }

  /**
   * 동적 퀘스트 삭제
   */
  static removeDynamicQuest(userId: string, questId: string): void {
    const quests = this.getActiveDynamicQuests(userId)
    const filtered = quests.filter(q => q.id !== questId)
    localStorage.setItem(`${this.STORAGE_KEY}-${userId}`, JSON.stringify(filtered))
  }
}