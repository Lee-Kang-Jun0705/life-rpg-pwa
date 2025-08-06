/**
 * useCleanupManager - 리소스 정리를 위한 React Hook
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 메모리 누수 방지 - 모든 리소스 정리
 * - 성능 최적화 - 불필요한 정리 작업 방지
 */

import { useEffect, useRef, useCallback } from 'react'

// 정리 작업 타입
export type CleanupFunction = () => void | Promise<void>

// 정리 작업 카테고리
export type CleanupCategory = 
  | 'event-listener'
  | 'timer'
  | 'subscription'
  | 'async-task'
  | 'resource'
  | 'custom'

// 정리 작업 엔트리
interface CleanupEntry {
  id: string
  category: CleanupCategory
  cleanup: CleanupFunction
  description?: string
  priority?: number // 높을수록 먼저 정리
}

// Hook 옵션
interface CleanupManagerOptions {
  // 디버그 모드
  debug?: boolean
  // 정리 순서 (기본: priority 순)
  cleanupOrder?: 'fifo' | 'lifo' | 'priority'
  // 비동기 정리 타임아웃 (ms)
  asyncTimeout?: number
  // 에러 발생 시 계속 진행 여부
  continueOnError?: boolean
}

// 통계 정보
interface CleanupStats {
  totalRegistered: number
  totalCleaned: number
  failedCleanups: number
  averageCleanupTime: number
  categoryCounts: Record<CleanupCategory, number>
}

// 설정 상수 (코딩규칙: 하드코딩 금지)
const CONFIG = {
  DEFAULT_ASYNC_TIMEOUT: 5000,    // 5초
  MAX_CLEANUP_ENTRIES: 100,       // 최대 정리 작업 수
  DEFAULT_PRIORITY: 0,
  CLEANUP_BATCH_SIZE: 10          // 배치 정리 크기
} as const

export function useCleanupManager(options: CleanupManagerOptions = {}) {
  const {
    debug = false,
    cleanupOrder = 'priority',
    asyncTimeout = CONFIG.DEFAULT_ASYNC_TIMEOUT,
    continueOnError = true
  } = options

  // 정리 작업 맵
  const cleanupMapRef = useRef<Map<string, CleanupEntry>>(new Map())
  
  // 정리 중 플래그
  const isCleaningRef = useRef(false)
  
  // 컴포넌트 마운트 상태
  const isMountedRef = useRef(true)
  
  // 통계
  const statsRef = useRef<CleanupStats>({
    totalRegistered: 0,
    totalCleaned: 0,
    failedCleanups: 0,
    averageCleanupTime: 0,
    categoryCounts: {
      'event-listener': 0,
      'timer': 0,
      'subscription': 0,
      'async-task': 0,
      'resource': 0,
      'custom': 0
    }
  })
  
  // 정리 시간 기록
  const cleanupTimesRef = useRef<number[]>([])

  /**
   * 정리 작업 등록
   */
  const register = useCallback((
    category: CleanupCategory,
    cleanup: CleanupFunction,
    description?: string,
    priority = CONFIG.DEFAULT_PRIORITY
  ): string => {
    const id = generateId()
    const entry: CleanupEntry = {
      id,
      category,
      cleanup,
      description,
      priority
    }
    
    // 최대 수 확인
    if (cleanupMapRef.current.size >= CONFIG.MAX_CLEANUP_ENTRIES) {
      console.warn('[CleanupManager] Maximum cleanup entries reached')
      return id
    }
    
    cleanupMapRef.current.set(id, entry)
    statsRef.current.totalRegistered++
    statsRef.current.categoryCounts[category]++
    
    if (debug) {
      console.log(`[CleanupManager] Registered: ${category} - ${description || id}`)
    }
    
    return id
  }, [debug])

  /**
   * 특정 정리 작업 해제
   */
  const unregister = useCallback((id: string): boolean => {
    const entry = cleanupMapRef.current.get(id)
    if (!entry) return false
    
    cleanupMapRef.current.delete(id)
    statsRef.current.categoryCounts[entry.category]--
    
    if (debug) {
      console.log(`[CleanupManager] Unregistered: ${id}`)
    }
    
    return true
  }, [debug])

  /**
   * 이벤트 리스너 등록 헬퍼
   */
  const registerEventListener = useCallback(<K extends keyof WindowEventMap>(
    target: EventTarget,
    event: K | string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): string => {
    // 이벤트 리스너 추가
    target.addEventListener(event as string, handler, options)
    
    // 정리 함수 등록
    return register(
      'event-listener',
      () => target.removeEventListener(event as string, handler, options),
      `Event: ${event as string}`,
      10 // 이벤트 리스너는 높은 우선순위
    )
  }, [register])

  /**
   * 타이머 등록 헬퍼
   */
  const registerTimer = useCallback((
    type: 'timeout' | 'interval',
    callback: () => void,
    delay: number
  ): string => {
    let timerId: NodeJS.Timeout
    
    if (type === 'timeout') {
      timerId = setTimeout(callback, delay)
    } else {
      timerId = setInterval(callback, delay)
    }
    
    // 정리 함수 등록
    return register(
      'timer',
      () => {
        if (type === 'timeout') {
          clearTimeout(timerId)
        } else {
          clearInterval(timerId)
        }
      },
      `${type}: ${delay}ms`,
      5 // 타이머는 중간 우선순위
    )
  }, [register])

  /**
   * 구독 등록 헬퍼
   */
  const registerSubscription = useCallback((
    unsubscribe: () => void,
    description?: string
  ): string => {
    return register(
      'subscription',
      unsubscribe,
      description || 'Subscription',
      8 // 구독은 높은 우선순위
    )
  }, [register])

  /**
   * 비동기 작업 등록 헬퍼
   */
  const registerAsyncTask = useCallback((
    abortController: AbortController,
    description?: string
  ): string => {
    return register(
      'async-task',
      () => {
        if (!abortController.signal.aborted) {
          abortController.abort()
        }
      },
      description || 'Async task',
      9 // 비동기 작업은 매우 높은 우선순위
    )
  }, [register])

  /**
   * 모든 정리 작업 실행
   */
  const cleanupAll = useCallback(async (): Promise<void> => {
    if (isCleaningRef.current) {
      console.warn('[CleanupManager] Cleanup already in progress')
      return
    }
    
    isCleaningRef.current = true
    const startTime = performance.now()
    
    if (debug) {
      console.log('[CleanupManager] Starting cleanup...')
    }
    
    try {
      // 정리 순서에 따라 정렬
      const entries = Array.from(cleanupMapRef.current.values())
      const sortedEntries = sortCleanupEntries(entries, cleanupOrder)
      
      // 배치로 나누어 처리
      for (let i = 0; i < sortedEntries.length; i += CONFIG.CLEANUP_BATCH_SIZE) {
        const batch = sortedEntries.slice(i, i + CONFIG.CLEANUP_BATCH_SIZE)
        
        await Promise.all(
          batch.map(entry => executeCleanup(entry, asyncTimeout, continueOnError, debug))
        )
        
        // 다음 배치 전 짧은 지연
        if (i + CONFIG.CLEANUP_BATCH_SIZE < sortedEntries.length) {
          await delay(10)
        }
      }
      
      // 통계 업데이트
      const cleanupTime = performance.now() - startTime
      updateCleanupStats(cleanupTime)
      
      if (debug) {
        console.log(`[CleanupManager] Cleanup completed in ${cleanupTime.toFixed(2)}ms`)
      }
      
    } finally {
      isCleaningRef.current = false
      cleanupMapRef.current.clear()
    }
  }, [cleanupOrder, asyncTimeout, continueOnError, debug])

  /**
   * 카테고리별 정리
   */
  const cleanupByCategory = useCallback(async (
    category: CleanupCategory
  ): Promise<void> => {
    const entries = Array.from(cleanupMapRef.current.values())
      .filter(entry => entry.category === category)
    
    if (debug) {
      console.log(`[CleanupManager] Cleaning up ${category}: ${entries.length} items`)
    }
    
    for (const entry of entries) {
      await executeCleanup(entry, asyncTimeout, continueOnError, debug)
      cleanupMapRef.current.delete(entry.id)
    }
  }, [asyncTimeout, continueOnError, debug])

  /**
   * 단일 정리 작업 실행
   */
  async function executeCleanup(
    entry: CleanupEntry,
    timeout: number,
    continueOnError: boolean,
    debug: boolean
  ): Promise<void> {
    try {
      const cleanupPromise = Promise.resolve(entry.cleanup())
      
      // 타임아웃 적용
      await Promise.race([
        cleanupPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Cleanup timeout')), timeout)
        )
      ])
      
      statsRef.current.totalCleaned++
      
      if (debug) {
        console.log(`[CleanupManager] Cleaned: ${entry.description || entry.id}`)
      }
      
    } catch (error) {
      statsRef.current.failedCleanups++
      
      console.error(`[CleanupManager] Cleanup failed: ${entry.description || entry.id}`, error)
      
      if (!continueOnError) {
        throw error
      }
    }
  }

  /**
   * 정리 작업 정렬
   */
  function sortCleanupEntries(
    entries: CleanupEntry[],
    order: CleanupManagerOptions['cleanupOrder']
  ): CleanupEntry[] {
    switch (order) {
      case 'fifo':
        return entries // 등록 순서 그대로
        
      case 'lifo':
        return entries.reverse() // 역순
        
      case 'priority':
      default:
        return entries.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    }
  }

  /**
   * 통계 업데이트
   */
  function updateCleanupStats(cleanupTime: number): void {
    cleanupTimesRef.current.push(cleanupTime)
    
    // 최대 100개 유지
    if (cleanupTimesRef.current.length > 100) {
      cleanupTimesRef.current.shift()
    }
    
    // 평균 계산
    const sum = cleanupTimesRef.current.reduce((acc, time) => acc + time, 0)
    statsRef.current.averageCleanupTime = sum / cleanupTimesRef.current.length
  }

  /**
   * 통계 조회
   */
  const getStats = useCallback((): CleanupStats => {
    return { ...statsRef.current }
  }, [])

  /**
   * 현재 등록된 정리 작업 수
   */
  const getRegisteredCount = useCallback((): number => {
    return cleanupMapRef.current.size
  }, [])

  /**
   * 디버그 정보 출력
   */
  const debugInfo = useCallback((): void => {
    console.log('[CleanupManager] Debug Info:')
    console.log('- Registered:', cleanupMapRef.current.size)
    console.log('- Stats:', statsRef.current)
    console.log('- Entries by category:')
    
    const byCategory = new Map<CleanupCategory, string[]>()
    cleanupMapRef.current.forEach(entry => {
      const list = byCategory.get(entry.category) || []
      list.push(entry.description || entry.id)
      byCategory.set(entry.category, list)
    })
    
    byCategory.forEach((items, category) => {
      console.log(`  - ${category}: ${items.length} items`)
      items.forEach(item => console.log(`    - ${item}`))
    })
  }, [])

  // 컴포넌트 언마운트 시 자동 정리
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      cleanupAll()
    }
  }, []) // cleanupAll은 의존성에 넣지 않음 (무한 루프 방지)

  return {
    // 기본 등록/해제
    register,
    unregister,
    
    // 헬퍼 함수들
    registerEventListener,
    registerTimer,
    registerSubscription,
    registerAsyncTask,
    
    // 정리 함수들
    cleanupAll,
    cleanupByCategory,
    
    // 유틸리티
    getStats,
    getRegisteredCount,
    debugInfo,
    
    // 상태
    isCleaning: isCleaningRef.current,
    isMounted: isMountedRef.current
  }
}

// 유틸리티 함수들

/**
 * ID 생성
 */
function generateId(): string {
  return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 지연
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 타입 export
export type { CleanupManagerOptions, CleanupStats }