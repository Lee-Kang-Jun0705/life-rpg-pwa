/**
 * DynamicContentManager - 동적 콘텐츠 관리자
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 성능 최적화 - 지연 로딩 및 캐싱
 * - 확장성 - 새로운 콘텐츠 타입 쉽게 추가
 */

import { levelSyncService } from './level-sync.service'
import { monsterCache } from './monster-cache.service'
import { transactionManager } from './transaction-manager'
import type { DungeonDefinition } from '@/lib/jrpg/types'
import { Difficulty } from '@/lib/jrpg/types'

// 콘텐츠 타입
export type ContentType = 'dungeon' | 'monster' | 'item' | 'skill' | 'quest'

// 콘텐츠 필터
export interface ContentFilter {
  minLevel?: number
  maxLevel?: number
  difficulty?: Difficulty
  tags?: string[]
  excludeTags?: string[]
  limit?: number
}

// 동적 콘텐츠 인터페이스
export interface DynamicContent<T = unknown> {
  id: string
  type: ContentType
  data: T
  levelRequirement: number
  unlockConditions?: UnlockCondition[]
  priority: number
  tags: string[]
}

// 잠금 해제 조건
export interface UnlockCondition {
  type: 'level' | 'item' | 'quest' | 'achievement' | 'custom'
  requirement: string | number
  description: string
}

// 콘텐츠 로더 인터페이스
export interface ContentLoader<T> {
  load(filter: ContentFilter): Promise<T[]>
  getById(id: string): Promise<T | null>
  preload(ids: string[]): Promise<void>
}

// 던전 관련 타입
export interface DungeonContent extends DynamicContent<DungeonDefinition> {
  type: 'dungeon'
  recommendedLevel: number
  maxLevel: number
  monsterPool: string[]
  bossId?: string
}

// 설정 상수 (코딩규칙: 하드코딩 금지)
const CONFIG = {
  // 레벨별 콘텐츠 범위
  LEVEL_RANGE_BUFFER: 5, // 플레이어 레벨 ±5
  // 최대 동시 로딩 수
  MAX_CONCURRENT_LOADS: 3,
  // 프리로드 설정
  PRELOAD_AHEAD: 2, // 다음 2개 콘텐츠 미리 로드
  // 캐시 TTL
  CACHE_TTL: 30 * 60 * 1000, // 30분
  // 우선순위
  PRIORITY_WEIGHTS: {
    levelMatch: 3,    // 레벨이 정확히 맞을 때
    newContent: 2,    // 처음 보는 콘텐츠
    progression: 1    // 진행도에 따른 가중치
  }
} as const

export class DynamicContentManager {
  private static instance: DynamicContentManager | null = null
  private contentLoaders = new Map<ContentType, ContentLoader<unknown>>()
  private contentCache = new Map<string, DynamicContent>()
  private loadingPromises = new Map<string, Promise<unknown>>()
  private playerProgress = new Map<string, number>() // 콘텐츠별 진행도
  
  // 통계
  private stats = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    preloadedContent: 0,
    failedLoads: 0
  }
  
  private constructor() {
    this.initializeLoaders()
    this.setupEventListeners()
  }
  
  static getInstance(): DynamicContentManager {
    if (!DynamicContentManager.instance) {
      DynamicContentManager.instance = new DynamicContentManager()
    }
    return DynamicContentManager.instance
  }
  
  /**
   * 로더 초기화
   */
  private initializeLoaders(): void {
    // 던전 로더
    this.registerLoader('dungeon', new DungeonLoader())
    
    // 추후 다른 로더들 추가
    // this.registerLoader('monster', new MonsterLoader())
    // this.registerLoader('item', new ItemLoader())
    // this.registerLoader('skill', new SkillLoader())
  }
  
  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 레벨 변경 시 콘텐츠 재평가
    levelSyncService.subscribe(async (event) => {
      console.log(`[DynamicContentManager] Level changed to ${event.newLevel}, re-evaluating content`)
      await this.preloadRelevantContent(event.newLevel)
    })
  }
  
  /**
   * 콘텐츠 로더 등록
   */
  registerLoader<T>(type: ContentType, loader: ContentLoader<T>): void {
    this.contentLoaders.set(type, loader as ContentLoader<unknown>)
    console.log(`[DynamicContentManager] Registered loader for ${type}`)
  }
  
  /**
   * 현재 레벨에 맞는 콘텐츠 가져오기
   */
  async getRelevantContent<T = unknown>(
    type: ContentType,
    filter: ContentFilter = {}
  ): Promise<DynamicContent<T>[]> {
    const playerLevel = levelSyncService.getLevel()
    
    // 기본 필터 설정
    const defaultFilter: ContentFilter = {
      minLevel: Math.max(1, playerLevel - CONFIG.LEVEL_RANGE_BUFFER),
      maxLevel: playerLevel + CONFIG.LEVEL_RANGE_BUFFER,
      ...filter
    }
    
    console.log(`[DynamicContentManager] Getting ${type} content for level ${playerLevel}`)
    
    // 로더 확인
    const loader = this.contentLoaders.get(type)
    if (!loader) {
      console.error(`[DynamicContentManager] No loader registered for ${type}`)
      return []
    }
    
    try {
      // 콘텐츠 로드
      const rawContent = await loader.load(defaultFilter)
      
      // DynamicContent로 변환 및 필터링
      const dynamicContent = rawContent
        .map(data => this.wrapContent(type, data))
        .filter(content => this.isContentAvailable(content, playerLevel))
        .sort((a, b) => this.calculatePriority(b, playerLevel) - this.calculatePriority(a, playerLevel))
      
      // 캐시 업데이트
      dynamicContent.forEach(content => {
        const cacheKey = `${type}_${content.id}`
        this.contentCache.set(cacheKey, content)
      })
      
      this.stats.totalLoads++
      
      return dynamicContent as DynamicContent<T>[]
      
    } catch (error) {
      console.error(`[DynamicContentManager] Failed to load ${type} content:`, error)
      this.stats.failedLoads++
      return []
    }
  }
  
  /**
   * 특정 콘텐츠 가져오기
   */
  async getContent<T = unknown>(
    type: ContentType,
    id: string
  ): Promise<DynamicContent<T> | null> {
    const cacheKey = `${type}_${id}`
    
    // 캐시 확인
    const cached = this.contentCache.get(cacheKey)
    if (cached && this.isCacheValid(cached)) {
      this.stats.cacheHits++
      return cached as DynamicContent<T>
    }
    
    this.stats.cacheMisses++
    
    // 로더에서 가져오기
    const loader = this.contentLoaders.get(type)
    if (!loader) {
      console.error(`[DynamicContentManager] No loader registered for ${type}`)
      return null
    }
    
    try {
      const data = await loader.getById(id)
      if (!data) return null
      
      const content = this.wrapContent(type, data)
      this.contentCache.set(cacheKey, content)
      
      return content as DynamicContent<T>
      
    } catch (error) {
      console.error(`[DynamicContentManager] Failed to load ${type}:${id}:`, error)
      return null
    }
  }
  
  /**
   * 콘텐츠를 DynamicContent로 래핑
   */
  private wrapContent(type: ContentType, data: unknown): DynamicContent {
    // 타입별 처리
    switch (type) {
      case 'dungeon':
        const dungeonData = data as DungeonDefinition
        return {
          id: dungeonData.id,
          type: 'dungeon',
          data: dungeonData,
          levelRequirement: dungeonData.recommendedLevel || 1,
          priority: dungeonData.tier || 1,
          tags: dungeonData.tags || []
        }
      
      default:
        // 기본 래핑
        const baseData = data as any
        return {
          id: baseData.id || 'unknown',
          type,
          data,
          levelRequirement: baseData.levelRequirement || 1,
          priority: 1,
          tags: []
        }
    }
  }
  
  /**
   * 콘텐츠 사용 가능 여부 확인
   */
  private isContentAvailable(content: DynamicContent, playerLevel: number): boolean {
    // 레벨 요구사항 확인
    if (content.levelRequirement > playerLevel) {
      return false
    }
    
    // 잠금 해제 조건 확인
    if (content.unlockConditions) {
      for (const condition of content.unlockConditions) {
        if (!this.checkUnlockCondition(condition)) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * 잠금 해제 조건 확인
   */
  private checkUnlockCondition(condition: UnlockCondition): boolean {
    switch (condition.type) {
      case 'level':
        return levelSyncService.getLevel() >= (condition.requirement as number)
      
      case 'item':
        // TODO: 인벤토리 확인
        return true
      
      case 'quest':
        // TODO: 퀘스트 완료 확인
        return true
      
      case 'achievement':
        // TODO: 업적 확인
        return true
      
      case 'custom':
        // 커스텀 조건은 항상 true (실제 구현 시 수정)
        return true
      
      default:
        return true
    }
  }
  
  /**
   * 콘텐츠 우선순위 계산
   */
  private calculatePriority(content: DynamicContent, playerLevel: number): number {
    let priority = content.priority
    
    // 레벨 매칭 가중치
    const levelDiff = Math.abs(content.levelRequirement - playerLevel)
    if (levelDiff === 0) {
      priority += CONFIG.PRIORITY_WEIGHTS.levelMatch
    } else {
      priority -= levelDiff * 0.1
    }
    
    // 새 콘텐츠 가중치
    const contentKey = `${content.type}_${content.id}`
    if (!this.playerProgress.has(contentKey)) {
      priority += CONFIG.PRIORITY_WEIGHTS.newContent
    }
    
    // 진행도 가중치
    const progress = this.playerProgress.get(contentKey) || 0
    if (progress < 100) {
      priority += CONFIG.PRIORITY_WEIGHTS.progression * (1 - progress / 100)
    }
    
    return priority
  }
  
  /**
   * 관련 콘텐츠 프리로드
   */
  private async preloadRelevantContent(playerLevel: number): Promise<void> {
    console.log(`[DynamicContentManager] Preloading content for level ${playerLevel}`)
    
    const types: ContentType[] = ['dungeon'] // 추후 다른 타입 추가
    const preloadPromises: Promise<void>[] = []
    
    for (const type of types) {
      const promise = this.getRelevantContent(type, {
        minLevel: playerLevel,
        maxLevel: playerLevel + CONFIG.PRELOAD_AHEAD,
        limit: CONFIG.PRELOAD_AHEAD
      }).then(contents => {
        this.stats.preloadedContent += contents.length
        console.log(`[DynamicContentManager] Preloaded ${contents.length} ${type} contents`)
      })
      
      preloadPromises.push(promise)
    }
    
    await Promise.all(preloadPromises)
  }
  
  /**
   * 캐시 유효성 확인
   */
  private isCacheValid(content: DynamicContent): boolean {
    // 임시로 항상 유효하다고 가정
    // 실제로는 타임스탬프 확인 필요
    return true
  }
  
  /**
   * 콘텐츠 진행도 업데이트
   */
  updateProgress(type: ContentType, id: string, progress: number): void {
    const key = `${type}_${id}`
    this.playerProgress.set(key, Math.min(100, Math.max(0, progress)))
    
    console.log(`[DynamicContentManager] Updated progress for ${key}: ${progress}%`)
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return { ...this.stats }
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.contentCache.clear()
    console.log('[DynamicContentManager] Cache cleared')
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[DynamicContentManager] Debug Info:')
    console.log('- Registered Loaders:', Array.from(this.contentLoaders.keys()))
    console.log('- Cache Size:', this.contentCache.size)
    console.log('- Player Progress:', this.playerProgress.size)
    console.log('- Stats:', this.stats)
  }
}

/**
 * 던전 로더 구현
 */
class DungeonLoader implements ContentLoader<DungeonDefinition> {
  async load(filter: ContentFilter): Promise<DungeonDefinition[]> {
    // 실제로는 데이터베이스나 파일에서 로드
    // 여기서는 임시 데이터 반환
    const allDungeons: DungeonDefinition[] = [
      {
        id: 'dungeon_forest',
        name: '초보자의 숲',
        description: '평화로운 숲이지만 슬라임들이 출몰합니다.',
        recommendedLevel: 1,
        maxFloors: 5,
        tier: 1,
        tags: ['forest', 'beginner']
      },
      {
        id: 'dungeon_cave',
        name: '어둠의 동굴',
        description: '박쥐와 거미가 서식하는 어두운 동굴입니다.',
        recommendedLevel: 5,
        maxFloors: 10,
        tier: 2,
        tags: ['cave', 'dark']
      },
      {
        id: 'dungeon_ruins',
        name: '고대 유적',
        description: '고대 문명의 흔적이 남아있는 위험한 장소입니다.',
        recommendedLevel: 10,
        maxFloors: 15,
        tier: 3,
        tags: ['ruins', 'ancient']
      }
    ]
    
    // 필터 적용
    return allDungeons.filter(dungeon => {
      if (filter.minLevel && dungeon.recommendedLevel < filter.minLevel) return false
      if (filter.maxLevel && dungeon.recommendedLevel > filter.maxLevel) return false
      if (filter.tags && !filter.tags.some(tag => dungeon.tags?.includes(tag))) return false
      return true
    })
  }
  
  async getById(id: string): Promise<DungeonDefinition | null> {
    const all = await this.load({})
    return all.find(d => d.id === id) || null
  }
  
  async preload(ids: string[]): Promise<void> {
    // 프리로드 구현
    console.log(`[DungeonLoader] Preloading dungeons: ${ids.join(', ')}`)
  }
}

// 전역 인스턴스 export
export const dynamicContentManager = DynamicContentManager.getInstance()