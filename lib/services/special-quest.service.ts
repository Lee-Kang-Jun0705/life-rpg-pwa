/**
 * 특별 퀘스트/던전 서비스
 * 특별한 조건과 보상을 가진 퀘스트 관리
 */

import type {
  SpecialQuest,
  SpecialQuestType,
  SpecialQuestProgress,
  SpecialQuestRecord,
  SpecialQuestFilter,
  EventQuest,
  HiddenQuest,
  CollectionQuest,
  SpecialQuestItem,
  HiddenQuestTrigger
} from '@/lib/types/special-quest'
import { itemGenerationService } from './item-generation.service'
import { dungeonCombatService } from './dungeon-combat.service'
import { dbHelpers } from '@/lib/database/client'
import type { Character } from '@/lib/types/game-core'

// 특별 퀘스트 데이터 (실제로는 DB에서 가져와야 함)
const SPECIAL_QUESTS_DATA: SpecialQuest[] = [
  {
    id: 'event_lunar_festival_2024',
    name: '달빛 축제의 비밀',
    description: '신비로운 달빛 축제에서 일어난 이상한 사건을 조사하세요.',
    type: 'event',
    icon: '🌙',
    requirements: [
      { type: 'level', value: 10, description: '레벨 10 이상' }
    ],
    rewards: {
      gold: 5000,
      items: [],
      guaranteedItems: [
        {
          id: 'lunar_sword',
          name: '달빛 검',
          type: 'equipment',
          rarity: 'epic',
          icon: '🗡️',
          quantity: 1,
          dropRate: 100,
          isExclusive: true,
          enhancedStats: true,
          description: '달빛 축제에서만 얻을 수 있는 특별한 검'
        }
      ]
    },
    _difficulty: 'hard',
    stages: 5,
    estimatedTime: 30,
    maxAttempts: 3,
    remainingAttempts: 3,
    availableFrom: new Date('2024-01-01'),
    availableUntil: new Date('2024-02-01'),
    specialRules: ['보스가 매 스테이지마다 등장', '부활 불가능'],
    status: 'available'
  },
  {
    id: 'hidden_dragon_lair',
    name: '잊혀진 용의 둥지',
    description: '전설 속 용의 둥지가 발견되었습니다. 강력한 보물이 숨겨져 있다고 합니다.',
    type: 'hidden',
    icon: '🐉',
    requirements: [
      { type: 'achievement', value: 'dragon_slayer', description: '드래곤 슬레이어 업적 달성' },
      { type: 'item', value: 'dragon_key', description: '용의 열쇠 보유' }
    ],
    rewards: {
      gold: 20000,
      items: [],
      guaranteedItems: [
        {
          id: 'dragon_scale_armor',
          name: '용린 갑옷',
          type: 'equipment',
          rarity: 'legendary',
          icon: '🛡️',
          quantity: 1,
          dropRate: 100,
          isExclusive: true,
          setBonus: 'dragon_set',
          description: '용의 비늘로 만든 전설의 갑옷'
        }
      ],
      achievementPoints: 100
    },
    _difficulty: 'legendary',
    stages: 10,
    estimatedTime: 60,
    maxAttempts: 1,
    remainingAttempts: 1,
    specialRules: ['용의 저주: 매 턴 최대 HP 5% 감소', '용의 가호: 치명타 확률 +50%'],
    status: 'locked'
  },
  {
    id: 'collection_ancient_artifacts',
    name: '고대 유물 수집가',
    description: '흩어진 고대 유물을 모두 수집하면 특별한 보상이 기다립니다.',
    type: 'collection',
    icon: '🏺',
    requirements: [
      { type: 'collection', value: 5, description: '고대 유물 5개 수집' }
    ],
    rewards: {
      gold: 10000,
      items: [],
      guaranteedItems: [
        {
          id: 'artifact_amulet',
          name: '고대의 부적',
          type: 'equipment',
          rarity: 'epic',
          icon: '🔮',
          quantity: 1,
          dropRate: 100,
          isExclusive: true,
          description: '고대 유물의 힘이 깃든 부적'
        }
      ]
    },
    _difficulty: 'normal',
    stages: 3,
    estimatedTime: 20,
    status: 'available'
  },
  {
    id: 'challenge_no_damage',
    name: '완벽한 전사',
    description: '단 한 번의 피해도 받지 않고 던전을 클리어하세요.',
    type: 'challenge',
    icon: '⚔️',
    requirements: [
      { type: 'level', value: 20, description: '레벨 20 이상' }
    ],
    rewards: {
      gold: 15000,
      items: [],
      guaranteedItems: [
        {
          id: 'perfect_warrior_badge',
          name: '완벽한 전사의 증표',
          type: 'equipment',
          rarity: 'epic',
          icon: '🎖️',
          quantity: 1,
          dropRate: 100,
          isExclusive: true,
          enhancedStats: true,
          description: '진정한 전사만이 가질 수 있는 증표'
        }
      ],
      achievementPoints: 50
    },
    _difficulty: 'extreme',
    stages: 5,
    estimatedTime: 25,
    specialRules: ['단 한 번이라도 피해를 받으면 실패', '회복 아이템 사용 불가'],
    cooldownHours: 24,
    status: 'available'
  }
]

export class SpecialQuestService {
  private static instance: SpecialQuestService
  private quests: Map<string, SpecialQuest> = new Map()
  private userProgress: Map<string, SpecialQuestProgress[]> = new Map()
  private questRecords: Map<string, SpecialQuestRecord[]> = new Map()

  static getInstance(): SpecialQuestService {
    if (!this.instance) {
      this.instance = new SpecialQuestService()
    }
    return this.instance
  }

  constructor() {
    this.initializeQuests()
  }

  private initializeQuests() {
    // 특별 퀘스트 데이터 초기화
    SPECIAL_QUESTS_DATA.forEach(quest => {
      this.quests.set(quest.id, { ...quest })
    })
  }

  /**
   * 특별 퀘스트 목록 조회
   */
  async getSpecialQuests(
    _userId: string,
    filter?: SpecialQuestFilter
  ): Promise<SpecialQuest[]> {
    let quests = Array.from(this.quests.values())

    // 사용자별 상태 업데이트
    for (const quest of quests) {
      await this.updateQuestStatus(userId, quest)
    }

    // 필터 적용
    if (filter) {
      if (filter.type) {
        quests = quests.filter(q => q.type === filter.type)
      }
      if (filter.status) {
        quests = quests.filter(q => q.status === filter.status)
      }
      if (filter.difficulty) {
        quests = quests.filter(q => q.difficulty === filter.difficulty)
      }
      if (filter.hasExclusiveRewards) {
        quests = quests.filter(q =>
          q.rewards.items.some(item => item.isExclusive) ||
          q.rewards.guaranteedItems?.some(item => item.isExclusive)
        )
      }
    }

    return quests
  }

  /**
   * 특정 퀘스트 조회
   */
  async getSpecialQuest(_questId: string): Promise<SpecialQuest | null> {
    return this.quests.get(questId) || null
  }

  /**
   * 퀘스트 상태 업데이트
   */
  private async updateQuestStatus(_userId: string, quest: SpecialQuest): Promise<void> {
    const now = new Date()

    // 시간 제한 체크
    if (quest.availableFrom && now < quest.availableFrom) {
      quest.status = 'locked'
      return
    }
    if (quest.availableUntil && now > quest.availableUntil) {
      quest.status = 'expired'
      return
    }

    // 완료 여부 체크
    const records = this.questRecords.get(userId) || []
    const completed = records.some(r => r.questId === quest.id)
    if (completed) {
      quest.status = 'completed'
      return
    }

    // 입장 조건 체크
    const canEnter = await this.checkRequirements(userId, quest.requirements)
    quest.status = canEnter ? 'available' : 'locked'

    // 쿨다운 체크
    if (quest.cooldownHours && quest.lastAttemptAt) {
      const cooldownEnd = new Date(quest.lastAttemptAt)
      cooldownEnd.setHours(cooldownEnd.getHours() + quest.cooldownHours)
      if (now < cooldownEnd) {
        quest.status = 'locked'
      }
    }
  }

  /**
   * 입장 조건 확인
   */
  private async checkRequirements(
    _userId: string,
    requirements: SpecialQuest['requirements']
  ): Promise<boolean> {
    try {
      for (const req of requirements) {
        switch (req.type) {
          case 'level':
            const character = await this.getCharacter(userId)
            if (!character || character.level < (req.value as number)) {
              return false
            }
            break

          case 'item':
            // TODO: 인벤토리 서비스와 연동
            const hasItem = await this.checkUserHasItem(userId, req.value as string)
            if (!hasItem) {
              return false
            }
            break

          case 'achievement':
            // TODO: 업적 서비스와 연동
            const hasAchievement = await this.checkUserHasAchievement(userId, req.value as string)
            if (!hasAchievement) {
              return false
            }
            break

          case 'collection':
            // TODO: 컬렉션 서비스와 연동
            const collectionCount = await this.getUserCollectionCount(userId, 'ancient_artifacts')
            if (collectionCount < (req.value as number)) {
              return false
            }
            break

          case 'quest':
            const records = this.questRecords.get(userId) || []
            const hasCompletedQuest = records.some(r => r.questId === req.value)
            if (!hasCompletedQuest) {
              return false
            }
            break
        }
      }

      return true
    } catch (error) {
      console.error('Failed to check requirements:', error)
      return false
    }
  }

  /**
   * 특별 퀘스트 시작
   */
  async startSpecialQuest(
    _userId: string,
    _questId: string
  ): Promise<{ success: boolean; progress?: SpecialQuestProgress; error?: string }> {
    const quest = this.quests.get(questId)
    if (!quest) {
      return { success: false, error: '퀘스트를 찾을 수 없습니다.' }
    }

    // 상태 확인
    if (quest.status !== 'available') {
      return { success: false, error: '현재 시작할 수 없는 퀘스트입니다.' }
    }

    // 도전 횟수 확인
    if (quest.maxAttempts && quest.remainingAttempts !== undefined) {
      if (quest.remainingAttempts <= 0) {
        return { success: false, error: '도전 횟수를 모두 소진했습니다.' }
      }
    }

    // 입장 조건 재확인
    const canEnter = await this.checkRequirements(userId, quest.requirements)
    if (!canEnter) {
      return { success: false, error: '입장 조건을 만족하지 않습니다.' }
    }

    // 진행 상황 생성
    const progress: SpecialQuestProgress = {
      questId,
      userId,
      status: 'in_progress',
      startTime: new Date(),
      currentStage: 1,
      totalStages: quest.stages,
      completedObjectives: [],
      earnedGold: 0,
      earnedItems: [],
      attempts: 1,
      deaths: 0,
      revivals: 0,
      specialObjectives: this.generateSpecialObjectives(quest)
    }

    // 사용자 진행 상황 저장
    const userProgressList = this.userProgress.get(userId) || []
    userProgressList.push(progress)
    this.userProgress.set(userId, userProgressList)

    // 도전 횟수 차감
    if (quest.maxAttempts && quest.remainingAttempts !== undefined) {
      quest.remainingAttempts--
      quest.lastAttemptAt = new Date()
    }

    return { success: true, progress }
  }

  /**
   * 특별 목표 생성
   */
  private generateSpecialObjectives(quest: SpecialQuest): SpecialQuestProgress['specialObjectives'] {
    const objectives = []

    // 퀘스트 타입별 특별 목표
    switch (quest.type) {
      case 'challenge':
        if (quest.id === 'challenge_no_damage') {
          objectives.push({
            id: 'no_damage_taken',
            name: '무피해 클리어',
            completed: false,
            reward: {
              id: 'flawless_gem',
              name: '완벽한 보석',
              type: 'material',
              rarity: 'rare',
              icon: '💎',
              quantity: 1,
              dropRate: 100,
              description: '완벽한 전투의 증표'
            }
          })
        }
        break

      case 'event':
        objectives.push({
          id: 'speed_clear',
          name: `${quest.estimatedTime}분 내 클리어`,
          completed: false,
          reward: {
            id: 'speed_bonus_chest',
            name: '스피드 보너스 상자',
            type: 'consumable',
            rarity: 'rare',
            icon: '📦',
            quantity: 1,
            dropRate: 100,
            description: '빠른 클리어 보상'
          }
        })
        break
    }

    // 공통 목표
    objectives.push({
      id: 'no_revival',
      name: '부활 없이 클리어',
      completed: false,
      reward: {
        id: 'revival_token',
        name: '부활의 토큰',
        type: 'consumable',
        rarity: 'uncommon',
        icon: '🔄',
        quantity: 1,
        dropRate: 100,
        description: '다음 도전에서 사용 가능'
      }
    })

    return objectives
  }

  /**
   * 퀘스트 진행 업데이트
   */
  async updateQuestProgress(
    _userId: string,
    _questId: string,
    updates: Partial<SpecialQuestProgress>
  ): Promise<SpecialQuestProgress | null> {
    const userProgressList = this.userProgress.get(userId) || []
    const progress = userProgressList.find(p => p.questId === questId && p.status === 'in_progress')

    if (!progress) {
      return null
    }

    Object.assign(progress, updates)
    return progress
  }

  /**
   * 특별 퀘스트 완료
   */
  async completeSpecialQuest(
    _userId: string,
    _questId: string
  ): Promise<{ success: boolean; record?: SpecialQuestRecord; error?: string }> {
    const quest = this.quests.get(questId)
    const userProgressList = this.userProgress.get(userId) || []
    const progress = userProgressList.find(p => p.questId === questId && p.status === 'in_progress')

    if (!quest || !progress) {
      return { success: false, error: '진행 중인 퀘스트를 찾을 수 없습니다.' }
    }

    const now = new Date()
    const clearTime = now.getTime() - progress.startTime.getTime()

    // 특별 목표 체크
    this.checkSpecialObjectives(progress, clearTime)

    // 보상 계산
    const rewards = await this.calculateRewards(quest, progress)

    // 완료 기록 생성
    const record: SpecialQuestRecord = {
      questId,
      userId,
      completedAt: now,
      _clearTime: Math.floor(clearTime / 1000), // 초 단위
      attempts: progress.attempts,
      rewards,
      achievedObjectives: progress.specialObjectives
        .filter(obj => obj.completed)
        .map(obj => obj.id),
      perfectClear: progress.specialObjectives.every(obj => obj.completed)
    }

    // 기록 저장
    const userRecords = this.questRecords.get(userId) || []
    userRecords.push(record)
    this.questRecords.set(userId, userRecords)

    // 진행 상황 제거
    const updatedProgressList = userProgressList.filter(p => p !== progress)
    this.userProgress.set(userId, updatedProgressList)

    // 퀘스트 상태 업데이트
    quest.status = 'completed'
    quest.completedAt = now
    if (!quest.bestClearTime || clearTime < quest.bestClearTime) {
      quest.bestClearTime = clearTime
    }

    // 보상 지급
    await this.grantRewards(userId, rewards)

    return { success: true, record }
  }

  /**
   * 특별 목표 달성 체크
   */
  private checkSpecialObjectives(progress: SpecialQuestProgress, _clearTime: number): void {
    // 무피해 클리어
    const noDamageObj = progress.specialObjectives.find(obj => obj.id === 'no_damage_taken')
    if (noDamageObj && progress.deaths === 0) {
      noDamageObj.completed = true
    }

    // 스피드 클리어
    const speedObj = progress.specialObjectives.find(obj => obj.id === 'speed_clear')
    if (speedObj) {
      const quest = this.quests.get(progress.questId)
      if (quest && clearTime < quest.estimatedTime * 60 * 1000) {
        speedObj.completed = true
      }
    }

    // 부활 없이 클리어
    const noRevivalObj = progress.specialObjectives.find(obj => obj.id === 'no_revival')
    if (noRevivalObj && progress.revivals === 0) {
      noRevivalObj.completed = true
    }
  }

  /**
   * 보상 계산
   */
  private async calculateRewards(
    quest: SpecialQuest,
    progress: SpecialQuestProgress
  ): Promise<SpecialQuestRecord['rewards']> {
    const rewards = {
      gold: quest.rewards.gold + progress.earnedGold,
      items: [...progress.earnedItems],
      achievementPoints: quest.rewards.achievementPoints
    }

    // 확정 보상 추가
    if (quest.rewards.guaranteedItems) {
      rewards.items.push(...quest.rewards.guaranteedItems)
    }

    // 특별 목표 보상 추가
    for (const objective of progress.specialObjectives) {
      if (objective.completed && objective.reward) {
        rewards.items.push(objective.reward)
      }
    }

    // 랜덤 보상 생성
    for (const baseItem of quest.rewards.items) {
      const generatedItem = await this.generateSpecialItem(baseItem, quest.difficulty)
      if (generatedItem) {
        rewards.items.push(generatedItem)
      }
    }

    return rewards
  }

  /**
   * 특별 아이템 생성
   */
  private async generateSpecialItem(
    baseItem: SpecialQuestItem,
    _difficulty: string
  ): Promise<SpecialQuestItem | null> {
    // 드롭 확률 체크
    if (Math.random() * 100 > baseItem.dropRate) {
      return null
    }

    // 난이도에 따른 레벨 설정
    const levelMap = {
      easy: 10,
      normal: 20,
      hard: 30,
      extreme: 40,
      legendary: 50
    }
    const level = levelMap[difficulty as keyof typeof levelMap] || 20

    // 아이템 생성
    const result = itemGenerationService.generateItem({
      baseItemId: baseItem.id,
      level,
      rarity: baseItem.rarity || 'rare'
    })

    if (!result.success || !result.item) {
      return null
    }

    // 특별 속성 적용
    const specialItem: SpecialQuestItem = {
      ...result.item,
      isExclusive: baseItem.isExclusive,
      enhancedStats: baseItem.enhancedStats,
      setBonus: baseItem.setBonus
    }

    // 향상된 스탯 적용
    if (baseItem.enhancedStats) {
      // 모든 스탯 20% 증가
      for (const [stat, value] of Object.entries(specialItem.baseStats)) {
        if (typeof value === 'number') {
          (specialItem.baseStats as unknown)[stat] = Math.floor(value * 1.2)
        }
      }
    }

    return specialItem
  }

  /**
   * 보상 지급
   */
  private async grantRewards(
    _userId: string,
    rewards: SpecialQuestRecord['rewards']
  ): Promise<void> {
    try {
      // 골드 지급
      if (rewards.gold > 0) {
        const { characterIntegrationService } = await import('./character-integration.service')
        await characterIntegrationService.addGold(userId, rewards.gold)
      }

      // 아이템 지급
      if (rewards.items.length > 0) {
        const { inventoryService } = await import('./inventory.service')
        for (const item of rewards.items) {
          inventoryService.addItem(item, item.quantity || 1)
        }
      }

      // 업적 포인트 지급
      if (rewards.achievementPoints) {
        // TODO: 업적 서비스와 연동
        console.log(`업적 포인트 ${rewards.achievementPoints} 지급`)
      }
    } catch (error) {
      console.error('Failed to grant rewards:', error)
    }
  }

  /**
   * 히든 퀘스트 트리거 확인
   */
  async checkHiddenQuestTriggers(
    _userId: string,
    trigger: HiddenQuestTrigger
  ): Promise<HiddenQuest[]> {
    const triggeredQuests: HiddenQuest[] = []

    for (const [questId, quest] of this.quests) {
      if (quest.type !== 'hidden') {
        continue
      }

      const hiddenQuest = quest as HiddenQuest
      if (hiddenQuest.discovered) {
        continue
      }

      // 트리거 조건 확인
      const matchingTrigger = hiddenQuest.triggers.find(t =>
        t.type === trigger.type &&
        t.condition === trigger.condition &&
        t.value === trigger.value
      )

      if (matchingTrigger) {
        hiddenQuest.discovered = true
        hiddenQuest.discoveredAt = new Date()
        triggeredQuests.push(hiddenQuest)
      }
    }

    return triggeredQuests
  }

  /**
   * 헬퍼 메서드들
   */
  private async getCharacter(_userId: string): Promise<Character | null> {
    const { characterIntegrationService } = await import('./character-integration.service')
    return characterIntegrationService.getCharacter(userId)
  }

  private async checkUserHasItem(_userId: string, _itemId: string): Promise<boolean> {
    // TODO: 인벤토리 서비스와 연동
    return true // 임시
  }

  private async checkUserHasAchievement(_userId: string, _achievementId: string): Promise<boolean> {
    // TODO: 업적 서비스와 연동
    return true // 임시
  }

  private async getUserCollectionCount(_userId: string, _collectionType: string): Promise<number> {
    // TODO: 컬렉션 서비스와 연동
    return 0 // 임시
  }

  /**
   * 이벤트 퀘스트 등록
   */
  async registerEventQuest(eventQuest: EventQuest): Promise<void> {
    this.quests.set(eventQuest.id, eventQuest)
  }

  /**
   * 특별 퀘스트 통계
   */
  async getQuestStats(_userId: string): Promise<{
    totalCompleted: number
    perfectClears: number
    exclusiveItemsCollected: number
    totalGoldEarned: number
    byType: Record<SpecialQuestType, number>
  }> {
    const records = this.questRecords.get(userId) || []

    const stats = {
      totalCompleted: records.length,
      perfectClears: records.filter(r => r.perfectClear).length,
      exclusiveItemsCollected: 0,
      totalGoldEarned: 0,
      byType: {
        event: 0,
        achievement: 0,
        collection: 0,
        challenge: 0,
        story: 0,
        hidden: 0
      } as Record<SpecialQuestType, number>
    }

    for (const record of records) {
      const quest = this.quests.get(record.questId)
      if (quest) {
        stats.byType[quest.type]++
        stats.totalGoldEarned += record.rewards.gold
        stats.exclusiveItemsCollected += record.rewards.items.filter(i => i.isExclusive).length
      }
    }

    return stats
  }
}

// 싱글톤 인스턴스 export
export const specialQuestService = SpecialQuestService.getInstance()
