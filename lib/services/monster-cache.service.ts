/**
 * MonsterCacheService - 몬스터 데이터 캐싱 및 성능 최적화
 * 
 * 코딩 규칙:
 * - any 타입 금지 - MonsterDefinition 타입 사용
 * - 하드코딩 금지 - 설정값 상수화
 * - 성능 최적화 - LRU 캐시 구현
 * - 메모리 관리 - 캐시 크기 제한
 */

import type { MonsterDefinition } from '@/lib/jrpg/types'
import { Difficulty } from '@/lib/jrpg/types'
import { MONSTER_DATABASE } from '@/lib/jrpg/monsters-database'
import { createScaledMonster } from '@/lib/jrpg/monster-scaling'

interface CacheEntry {
  data: MonsterDefinition
  timestamp: number
  hits: number
  size: number // 메모리 사용량 추정치 (bytes)
}

interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  currentSize: number
  itemCount: number
  evictionCount: number
  averageAccessTime: number
}

interface CacheOptions {
  maxSize?: number
  ttl?: number
  enableStats?: boolean
  onEvict?: (key: string, entry: CacheEntry) => void
}

export class MonsterCacheService {
  private static instance: MonsterCacheService | null = null
  private cache = new Map<string, CacheEntry>()
  private accessOrder: string[] = [] // LRU 추적용
  private stats: CacheStats = {
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
    currentSize: 0,
    itemCount: 0,
    evictionCount: 0,
    averageAccessTime: 0
  }
  private accessTimes: number[] = []
  
  // 설정 상수 (코딩규칙: 하드코딩 금지)
  private readonly MAX_CACHE_SIZE = 100 // 최대 아이템 수
  private readonly MAX_MEMORY_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1시간
  private readonly STATS_SAMPLE_SIZE = 1000
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5분
  
  private cleanupTimer: NodeJS.Timeout | null = null
  private options: Required<CacheOptions>
  
  private constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || this.MAX_CACHE_SIZE,
      ttl: options.ttl || this.CACHE_TTL,
      enableStats: options.enableStats !== false,
      onEvict: options.onEvict || (() => {})
    }
    
    // 주기적 정리 시작
    this.startCleanupTimer()
  }
  
  static getInstance(options?: CacheOptions): MonsterCacheService {
    if (!MonsterCacheService.instance) {
      MonsterCacheService.instance = new MonsterCacheService(options)
    }
    return MonsterCacheService.instance
  }
  
  /**
   * 몬스터 데이터 가져오기 (캐시 우선)
   */
  getMonster(
    dungeonId: string,
    floor: number,
    difficulty: Difficulty,
    dungeonLevel = 1
  ): MonsterDefinition {
    const startTime = performance.now()
    const key = this.generateKey(dungeonId, floor, difficulty)
    
    // 캐시 확인
    const cached = this.cache.get(key)
    
    if (cached && this.isValid(cached)) {
      // 캐시 히트
      this.handleCacheHit(key, cached)
      this.recordAccessTime(performance.now() - startTime)
      return cached.data
    }
    
    // 캐시 미스 - 생성
    this.stats.totalMisses++
    const monster = this.generateAndCache(dungeonId, floor, difficulty, dungeonLevel, key)
    this.recordAccessTime(performance.now() - startTime)
    
    return monster
  }
  
  /**
   * 특정 몬스터 ID로 직접 가져오기
   */
  getMonsterById(monsterId: string, level?: number): MonsterDefinition | null {
    const baseDef = MONSTER_DATABASE[monsterId]
    if (!baseDef) return null
    
    const key = `direct_${monsterId}_${level || baseDef.level}`
    const cached = this.cache.get(key)
    
    if (cached && this.isValid(cached)) {
      this.handleCacheHit(key, cached)
      return cached.data
    }
    
    // 레벨 조정이 필요한 경우
    if (level && level !== baseDef.level) {
      const scaledMonster = this.scaleMonsterToLevel(baseDef, level)
      this.addToCache(key, scaledMonster)
      return scaledMonster
    }
    
    // 기본 몬스터 반환
    this.addToCache(key, baseDef)
    return baseDef
  }
  
  /**
   * 캐시 히트 처리
   */
  private handleCacheHit(key: string, entry: CacheEntry): void {
    entry.hits++
    this.stats.totalHits++
    
    // LRU 업데이트
    this.updateAccessOrder(key)
    
    // 히트율 업데이트
    this.updateHitRate()
  }
  
  /**
   * 몬스터 생성 및 캐싱
   */
  private generateAndCache(
    dungeonId: string,
    floor: number,
    difficulty: Difficulty,
    dungeonLevel: number,
    key: string
  ): MonsterDefinition {
    // 스케일된 몬스터 생성
    const monster = createScaledMonster(
      dungeonId,
      dungeonLevel,
      floor,
      difficulty
    )
    
    if (!monster) {
      // 폴백: 기본 몬스터 반환
      console.warn(`[MonsterCache] Failed to create scaled monster for ${dungeonId}`)
      return MONSTER_DATABASE['monster_001'] // 기본 슬라임
    }
    
    // 캐시에 추가
    this.addToCache(key, monster)
    
    return monster
  }
  
  /**
   * 캐시에 추가
   */
  private addToCache(key: string, data: MonsterDefinition): void {
    const size = this.estimateSize(data)
    
    // 메모리 제한 확인
    while (
      (this.cache.size >= this.options.maxSize || 
       this.stats.currentSize + size > this.MAX_MEMORY_SIZE) &&
      this.accessOrder.length > 0
    ) {
      this.evictLRU()
    }
    
    // 캐시 엔트리 생성
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      hits: 0,
      size
    }
    
    this.cache.set(key, entry)
    this.updateAccessOrder(key)
    
    // 통계 업데이트
    this.stats.currentSize += size
    this.stats.itemCount = this.cache.size
  }
  
  /**
   * LRU 아이템 제거
   */
  private evictLRU(): void {
    const lruKey = this.accessOrder.shift()
    if (!lruKey) return
    
    const entry = this.cache.get(lruKey)
    if (entry) {
      this.cache.delete(lruKey)
      this.stats.currentSize -= entry.size
      this.stats.evictionCount++
      this.stats.itemCount = this.cache.size
      
      // 콜백 호출
      this.options.onEvict(lruKey, entry)
      
      console.log(`[MonsterCache] Evicted: ${lruKey} (hits: ${entry.hits})`)
    }
  }
  
  /**
   * 접근 순서 업데이트 (LRU)
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }
  
  /**
   * 캐시 엔트리 유효성 확인
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp
    return age < this.options.ttl
  }
  
  /**
   * 키 생성
   */
  private generateKey(
    dungeonId: string,
    floor: number,
    difficulty: Difficulty
  ): string {
    return `${dungeonId}_f${floor}_${difficulty}`
  }
  
  /**
   * 데이터 크기 추정 (bytes)
   */
  private estimateSize(data: MonsterDefinition): number {
    // JSON 문자열 크기로 추정
    try {
      return JSON.stringify(data).length * 2 // UTF-16
    } catch {
      return 1024 // 기본값 1KB
    }
  }
  
  /**
   * 몬스터 레벨 스케일링
   */
  private scaleMonsterToLevel(
    base: MonsterDefinition,
    targetLevel: number
  ): MonsterDefinition {
    const scaleFactor = targetLevel / base.level
    
    return {
      ...base,
      level: targetLevel,
      stats: {
        hp: Math.floor(base.stats.hp * scaleFactor),
        mp: Math.floor(base.stats.mp * scaleFactor),
        attack: Math.floor(base.stats.attack * scaleFactor),
        defense: Math.floor(base.stats.defense * scaleFactor),
        speed: Math.floor(base.stats.speed * scaleFactor),
        magicPower: Math.floor(base.stats.magicPower * scaleFactor),
        magicResist: Math.floor(base.stats.magicResist * scaleFactor)
      },
      dropTable: {
        ...base.dropTable,
        gold: {
          min: Math.floor(base.dropTable.gold.min * scaleFactor),
          max: Math.floor(base.dropTable.gold.max * scaleFactor)
        }
      }
    }
  }
  
  /**
   * 히트율 업데이트
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0
  }
  
  /**
   * 접근 시간 기록
   */
  private recordAccessTime(time: number): void {
    if (!this.options.enableStats) return
    
    this.accessTimes.push(time)
    
    if (this.accessTimes.length > this.STATS_SAMPLE_SIZE) {
      this.accessTimes.shift()
    }
    
    // 평균 계산
    const sum = this.accessTimes.reduce((acc, t) => acc + t, 0)
    this.stats.averageAccessTime = sum / this.accessTimes.length
  }
  
  /**
   * 만료된 엔트리 정리
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.currentSize -= entry.size
        
        // accessOrder에서도 제거
        const index = this.accessOrder.indexOf(key)
        if (index !== -1) {
          this.accessOrder.splice(index, 1)
        }
      }
    })
    
    this.stats.itemCount = this.cache.size
    
    if (toDelete.length > 0) {
      console.log(`[MonsterCache] Cleaned up ${toDelete.length} expired entries`)
    }
  }
  
  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.CLEANUP_INTERVAL)
  }
  
  /**
   * 정리 타이머 정지
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
  
  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats.currentSize = 0
    this.stats.itemCount = 0
  }
  
  /**
   * 특정 던전의 캐시 무효화
   */
  invalidateDungeon(dungeonId: string): void {
    const toDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${dungeonId}_`)) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.currentSize -= entry.size
        
        const index = this.accessOrder.indexOf(key)
        if (index !== -1) {
          this.accessOrder.splice(index, 1)
        }
      }
    })
    
    this.stats.itemCount = this.cache.size
  }
  
  /**
   * 캐시 통계 조회
   */
  getStats(): Readonly<CacheStats> {
    return { ...this.stats }
  }
  
  /**
   * 캐시 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      currentSize: this.stats.currentSize,
      itemCount: this.stats.itemCount,
      evictionCount: 0,
      averageAccessTime: 0
    }
    this.accessTimes = []
  }
  
  /**
   * 캐시 내용 조회 (디버그용)
   */
  getCacheContents(): Array<{ key: string; hits: number; age: number }> {
    const now = Date.now()
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Math.round((now - entry.timestamp) / 1000) // 초 단위
    }))
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[MonsterCache] Debug Info:')
    console.log('- Cache Size:', this.cache.size, '/', this.options.maxSize)
    console.log('- Memory Usage:', `${(this.stats.currentSize / 1024).toFixed(2)}KB`)
    console.log('- Hit Rate:', `${(this.stats.hitRate * 100).toFixed(2)}%`)
    console.log('- Average Access Time:', `${this.stats.averageAccessTime.toFixed(2)}ms`)
    console.log('- Evictions:', this.stats.evictionCount)
    
    // 상위 5개 아이템
    const topItems = this.getCacheContents()
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5)
    
    if (topItems.length > 0) {
      console.log('- Top Items:')
      topItems.forEach(item => {
        console.log(`  - ${item.key}: ${item.hits} hits, ${item.age}s old`)
      })
    }
  }
}

// 전역 인스턴스 export
export const monsterCache = MonsterCacheService.getInstance()