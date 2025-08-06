import { QUEST_DATABASE, type JRPGQuest, type QuestProgress } from './quests-database'
import { jrpgDbHelpers } from './database-helpers'
import { MONSTER_DATABASE } from './monsters-database'
import { ITEM_DATABASE } from './items-database'
import { soundManager } from './sound-system'

export class JRPGQuestManager {
  private userId: string
  private questProgress: Map<string, QuestProgress> = new Map()
  private characterLevel: number = 1
  
  constructor(userId: string, characterLevel: number) {
    this.userId = userId
    this.characterLevel = characterLevel
  }
  
  // 퀘스트 진행 상황 로드
  async loadProgress(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress) {
        // 기존 진행 상황 복원
        if (progress.questProgress) {
          Object.entries(progress.questProgress).forEach(([questId, questProg]) => {
            this.questProgress.set(questId, questProg as QuestProgress)
          })
        }
        
        // 일일 퀘스트 리셋 확인
        await this.checkDailyQuestReset()
      }
    } catch (error) {
      console.error('Failed to load quest progress:', error)
    }
  }
  
  // 사용 가능한 퀘스트 목록 가져오기
  getAvailableQuests(): JRPGQuest[] {
    const available: JRPGQuest[] = []
    
    Object.values(QUEST_DATABASE).forEach(quest => {
      const progress = this.questProgress.get(quest.id)
      
      // 이미 진행 중이거나 완료된 퀘스트 제외
      if (progress && (progress.status === 'active' || progress.status === 'claimed')) {
        // 반복 가능한 퀘스트는 쿨다운 확인
        if (quest.isRepeatable && progress.status === 'claimed') {
          if (this.isQuestOnCooldown(quest.id)) {
            return
          }
        } else {
          return
        }
      }
      
      // 요구 사항 확인
      if (!this.checkRequirements(quest)) {
        return
      }
      
      // 이벤트 퀘스트 만료 확인
      if (quest.expiresAt && new Date() > quest.expiresAt) {
        return
      }
      
      available.push(quest)
    })
    
    return available
  }
  
  // 진행 중인 퀘스트 목록
  getActiveQuests(): Array<{ quest: JRPGQuest; progress: QuestProgress }> {
    const active: Array<{ quest: JRPGQuest; progress: QuestProgress }> = []
    
    this.questProgress.forEach((progress, questId) => {
      if (progress.status === 'active') {
        const quest = QUEST_DATABASE[questId]
        if (quest) {
          active.push({ quest, progress })
        }
      }
    })
    
    return active
  }
  
  // 완료된 퀘스트 목록
  getCompletedQuests(): Array<{ quest: JRPGQuest; progress: QuestProgress }> {
    const completed: Array<{ quest: JRPGQuest; progress: QuestProgress }> = []
    
    this.questProgress.forEach((progress, questId) => {
      if (progress.status === 'completed') {
        const quest = QUEST_DATABASE[questId]
        if (quest) {
          completed.push({ quest, progress })
        }
      }
    })
    
    return completed
  }
  
  // 퀘스트 요구사항 확인
  private checkRequirements(quest: JRPGQuest): boolean {
    const req = quest.requirements
    
    // 레벨 확인
    if (req.level && this.characterLevel < req.level) {
      return false
    }
    
    // 선행 퀘스트 확인
    if (req.questIds) {
      for (const questId of req.questIds) {
        const progress = this.questProgress.get(questId)
        if (!progress || progress.status !== 'claimed') {
          return false
        }
      }
    }
    
    // 아이템 확인 (인벤토리 연동 필요)
    if (req.items) {
      // TODO: 인벤토리 확인 로직
      return true
    }
    
    return true
  }
  
  // 퀘스트 시작
  async acceptQuest(questId: string): Promise<boolean> {
    const quest = QUEST_DATABASE[questId]
    if (!quest) return false
    
    // 이미 진행 중인지 확인
    const existing = this.questProgress.get(questId)
    if (existing && existing.status === 'active') {
      return false
    }
    
    // 요구사항 재확인
    if (!this.checkRequirements(quest)) {
      return false
    }
    
    // 퀘스트 진행 상황 생성
    const progress: QuestProgress = {
      questId,
      status: 'active',
      startedAt: new Date(),
      objectives: quest.objectives.map(obj => ({
        id: obj.id,
        current: 0,
        completed: false
      }))
    }
    
    this.questProgress.set(questId, progress)
    await this.saveProgress()
    
    return true
  }
  
  // 퀘스트 진행 업데이트
  async updateQuestProgress(
    type: 'defeat' | 'collect' | 'talk' | 'explore' | 'deliver',
    target: string,
    quantity: number = 1
  ): Promise<void> {
    let updated = false
    
    // 진행 중인 모든 퀘스트 확인
    for (const [questId, progress] of this.questProgress) {
      if (progress.status !== 'active') continue
      
      const quest = QUEST_DATABASE[questId]
      if (!quest) continue
      
      // 각 목표 확인
      quest.objectives.forEach((objective, index) => {
        if (objective.type === type && 
            (!objective.target || objective.target === target) &&
            !progress.objectives[index].completed) {
          
          progress.objectives[index].current += quantity
          
          // 목표 달성 확인
          if (objective.quantity && progress.objectives[index].current >= objective.quantity) {
            progress.objectives[index].current = objective.quantity
            progress.objectives[index].completed = true
          }
          
          updated = true
        }
      })
      
      // 퀘스트 완료 확인
      if (progress.objectives.every(obj => obj.completed)) {
        progress.status = 'completed'
        progress.completedAt = new Date()
        soundManager.playSFX('quest_complete')
        
        // 퀘스트 완료 이벤트 발송
        window.dispatchEvent(new CustomEvent('quest-completed', { 
          detail: { 
            questId: questId,
            questName: quest.name,
            category: quest.category
          } 
        }))
      }
    }
    
    if (updated) {
      await this.saveProgress()
    }
  }
  
  // 퀘스트 보상 수령
  async claimRewards(questId: string): Promise<JRPGQuest['rewards'] | null> {
    const progress = this.questProgress.get(questId)
    if (!progress || progress.status !== 'completed') {
      return null
    }
    
    const quest = QUEST_DATABASE[questId]
    if (!quest) return null
    
    // 보상 지급
    const rewards = quest.rewards
    
    // 아이템 지급
    if (rewards.items) {
      for (const item of rewards.items) {
        await jrpgDbHelpers.addItemToInventory(
          this.userId,
          item.itemId,
          item.quantity
        )
      }
    }
    
    // 스킬 해금
    if (rewards.skills) {
      const skills = await jrpgDbHelpers.getJRPGSkills(this.userId)
      if (skills) {
        for (const skillId of rewards.skills) {
          if (!skills.learned.find(s => s.skillId === skillId)) {
            skills.learned.push({
              id: `skill_${Date.now()}_${Math.random()}`,
              skillId,
              level: 1,
              experience: 0
            })
          }
        }
        await jrpgDbHelpers.saveJRPGSkills(this.userId, skills)
      }
    }
    
    // 진행 상황 업데이트
    progress.status = 'claimed'
    
    // 반복 가능한 퀘스트는 쿨다운 설정
    if (quest.isRepeatable) {
      progress.lastCooldownReset = new Date()
    }
    
    await this.saveProgress()
    
    return rewards
  }
  
  // 일일 퀘스트 리셋
  private async checkDailyQuestReset(): Promise<void> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let hasChanges = false
    
    this.questProgress.forEach((progress, questId) => {
      const quest = QUEST_DATABASE[questId]
      if (!quest || quest.category !== 'daily') return
      
      if (progress.status === 'claimed' && progress.lastCooldownReset) {
        const lastReset = new Date(progress.lastCooldownReset)
        const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate())
        
        // 날짜가 바뀌었으면 리셋
        if (today > lastResetDay) {
          this.questProgress.delete(questId)
          hasChanges = true
        }
      }
    })
    
    if (hasChanges) {
      await this.saveProgress()
    }
  }
  
  // 퀘스트 쿨다운 확인
  private isQuestOnCooldown(questId: string): boolean {
    const progress = this.questProgress.get(questId)
    const quest = QUEST_DATABASE[questId]
    
    if (!progress || !quest || !quest.cooldownHours || !progress.lastCooldownReset) {
      return false
    }
    
    const now = new Date()
    const cooldownEnd = new Date(progress.lastCooldownReset)
    cooldownEnd.setHours(cooldownEnd.getHours() + quest.cooldownHours)
    
    return now < cooldownEnd
  }
  
  // 진행 상황 저장
  private async saveProgress(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress) {
        // Map을 객체로 변환
        const questProgress: Record<string, QuestProgress> = {}
        this.questProgress.forEach((value, key) => {
          questProgress[key] = value
        })
        
        progress.questProgress = questProgress
        await jrpgDbHelpers.saveJRPGProgress(this.userId, progress)
      }
    } catch (error) {
      console.error('Failed to save quest progress:', error)
    }
  }
  
  // 퀘스트별 진행률 계산
  getQuestCompletionPercentage(questId: string): number {
    const progress = this.questProgress.get(questId)
    const quest = QUEST_DATABASE[questId]
    
    if (!progress || !quest) return 0
    
    const completedObjectives = progress.objectives.filter(obj => obj.completed).length
    return Math.round((completedObjectives / quest.objectives.length) * 100)
  }
  
  // 특정 카테고리의 퀘스트 수 반환
  getQuestCountByCategory(category: JRPGQuest['category']): {
    available: number
    active: number
    completed: number
  } {
    let available = 0
    let active = 0
    let completed = 0
    
    Object.values(QUEST_DATABASE).forEach(quest => {
      if (quest.category !== category) return
      
      const progress = this.questProgress.get(quest.id)
      
      if (!progress || progress.status === 'available') {
        if (this.checkRequirements(quest)) {
          available++
        }
      } else if (progress.status === 'active') {
        active++
      } else if (progress.status === 'completed' || progress.status === 'claimed') {
        completed++
      }
    })
    
    return { available, active, completed }
  }
}