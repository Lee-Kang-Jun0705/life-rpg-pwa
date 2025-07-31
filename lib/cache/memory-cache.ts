/**
 * 메모리 캐시 유틸리티
 * 자주 사용되는 데이터를 메모리에 캐싱하여 성능 향상
 */

// 캐시 설정 상수
const CACHE_CONFIG = {
  MAX_SIZE: 100, // 최대 캐시 항목 수
  CLEANUP_INTERVAL: 60000, // 1분마다 정리
  DEFAULT_TTL: 300000, // 기본 TTL 5분
} as const

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<unknown>> = new Map()
  private maxSize: number = CACHE_CONFIG.MAX_SIZE
  private cleanupInterval: number = CACHE_CONFIG.CLEANUP_INTERVAL

  constructor() {
    // 주기적으로 만료된 캐시 정리
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval)
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거
      const oldestKey = this.findOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 만료 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 캐시에서 데이터 제거
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 패턴에 맞는 모든 캐시 제거
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 전체 캐시 비우기
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 만료된 캐시 정리
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 가장 오래된 캐시 키 찾기
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * 캐시 통계 정보
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Date.now() - item.timestamp,
        ttl: item.ttl
      }))
    }
  }
}

// 싱글톤 인스턴스
export const memoryCache = new MemoryCache()

// 캐시 데코레이터
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 300000
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    // 캐시에서 확인
    const cached = memoryCache.get(key)
    if (cached !== null) {
      return cached
    }

    // 함수 실행
    const result = fn(...args)

    // Promise인 경우
    if (result instanceof Promise) {
      return result.then(data => {
        memoryCache.set(key, data, ttl)
        return data
      })
    }

    // 동기 결과
    memoryCache.set(key, result, ttl)
    return result
  }) as T
}