/**
 * AsyncMutex - 비동기 작업의 동시성 제어
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 통일성 - 일관된 인터페이스
 * - 성능 최적화 - 우선순위 큐 사용
 */

interface QueueItem {
  resolve: (release: () => void) => void
  priority: number
  timestamp: number
  timeout?: NodeJS.Timeout
}

interface MutexOptions {
  // 획득 시도 타임아웃 (ms)
  timeout?: number
  // 우선순위 (높을수록 먼저 처리)
  priority?: number
  // 디버그 로깅 활성화
  debug?: boolean
}

interface MutexStats {
  totalAcquisitions: number
  totalReleases: number
  totalTimeouts: number
  averageWaitTime: number
  currentQueueSize: number
  isLocked: boolean
}

export class AsyncMutex {
  private queue: QueueItem[] = []
  private locked = false
  private lockHolder: string | null = null
  private stats: MutexStats = {
    totalAcquisitions: 0,
    totalReleases: 0,
    totalTimeouts: 0,
    averageWaitTime: 0,
    currentQueueSize: 0,
    isLocked: false
  }
  private waitTimes: number[] = []
  
  // 설정 상수 (코딩규칙: 하드코딩 금지)
  private readonly DEFAULT_TIMEOUT = 30000 // 30초
  private readonly MAX_WAIT_TIME_RECORDS = 100
  private readonly DEFAULT_PRIORITY = 0
  
  constructor(private name = 'default') {}
  
  /**
   * 뮤텍스 획득
   */
  async acquire(options: MutexOptions = {}): Promise<() => void> {
    const {
      timeout = this.DEFAULT_TIMEOUT,
      priority = this.DEFAULT_PRIORITY,
      debug = false
    } = options
    
    const startTime = Date.now()
    
    if (debug) {
      console.log(`[AsyncMutex:${this.name}] Acquisition requested, priority: ${priority}`)
    }
    
    return new Promise<() => void>((resolve, reject) => {
      const queueItem: QueueItem = {
        resolve,
        priority,
        timestamp: startTime,
        timeout: undefined
      }
      
      // 타임아웃 설정
      if (timeout > 0) {
        queueItem.timeout = setTimeout(() => {
          // 큐에서 제거
          const index = this.queue.indexOf(queueItem)
          if (index !== -1) {
            this.queue.splice(index, 1)
            this.stats.totalTimeouts++
            this.stats.currentQueueSize = this.queue.length
            
            reject(new Error(`Mutex acquisition timeout after ${timeout}ms`))
          }
        }, timeout)
      }
      
      // 큐에 추가
      this.queue.push(queueItem)
      this.stats.currentQueueSize = this.queue.length
      
      // 우선순위로 정렬 (높은 우선순위가 앞으로)
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        // 같은 우선순위면 먼저 온 것이 우선
        return a.timestamp - b.timestamp
      })
      
      // 즉시 처리 시도
      this.dispatch()
    })
  }
  
  /**
   * 큐 처리
   */
  private dispatch(): void {
    if (this.locked || this.queue.length === 0) {
      return
    }
    
    this.locked = true
    this.stats.isLocked = true
    
    const queueItem = this.queue.shift()!
    this.stats.currentQueueSize = this.queue.length
    
    // 타임아웃 해제
    if (queueItem.timeout) {
      clearTimeout(queueItem.timeout)
    }
    
    // 대기 시간 기록
    const waitTime = Date.now() - queueItem.timestamp
    this.recordWaitTime(waitTime)
    
    this.stats.totalAcquisitions++
    
    // 락 홀더 ID 생성
    this.lockHolder = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const currentHolder = this.lockHolder
    
    // release 함수 생성
    let released = false
    const release = () => {
      if (released) {
        console.warn(`[AsyncMutex:${this.name}] Release called multiple times`)
        return
      }
      
      if (this.lockHolder !== currentHolder) {
        console.error(`[AsyncMutex:${this.name}] Invalid release attempt`)
        return
      }
      
      released = true
      this.locked = false
      this.stats.isLocked = false
      this.lockHolder = null
      this.stats.totalReleases++
      
      // 다음 대기자 처리
      this.dispatch()
    }
    
    queueItem.resolve(release)
  }
  
  /**
   * 대기 시간 기록
   */
  private recordWaitTime(waitTime: number): void {
    this.waitTimes.push(waitTime)
    
    // 최대 기록 수 유지
    if (this.waitTimes.length > this.MAX_WAIT_TIME_RECORDS) {
      this.waitTimes.shift()
    }
    
    // 평균 계산
    const sum = this.waitTimes.reduce((acc, time) => acc + time, 0)
    this.stats.averageWaitTime = Math.round(sum / this.waitTimes.length)
  }
  
  /**
   * 뮤텍스가 잠겨있는지 확인
   */
  isLocked(): boolean {
    return this.locked
  }
  
  /**
   * 대기 중인 요청 수 확인
   */
  getQueueSize(): number {
    return this.queue.length
  }
  
  /**
   * 통계 정보 조회
   */
  getStats(): Readonly<MutexStats> {
    return { ...this.stats }
  }
  
  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalTimeouts: 0,
      averageWaitTime: 0,
      currentQueueSize: this.queue.length,
      isLocked: this.locked
    }
    this.waitTimes = []
  }
  
  /**
   * 큐 강제 초기화 (비상용)
   */
  forceRelease(): void {
    console.warn(`[AsyncMutex:${this.name}] Force release called`)
    
    // 모든 대기자에게 에러 전달
    this.queue.forEach(item => {
      if (item.timeout) {
        clearTimeout(item.timeout)
      }
    })
    
    this.queue = []
    this.locked = false
    this.lockHolder = null
    this.stats.currentQueueSize = 0
    this.stats.isLocked = false
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log(`[AsyncMutex:${this.name}] Debug Info:`)
    console.log('- Locked:', this.locked)
    console.log('- Queue Size:', this.queue.length)
    console.log('- Stats:', this.stats)
    if (this.queue.length > 0) {
      console.log('- Queue Priorities:', this.queue.map(item => item.priority))
    }
  }
}

/**
 * 뮤텍스를 사용한 안전한 실행 헬퍼
 */
export async function withMutex<T>(
  mutex: AsyncMutex,
  fn: () => Promise<T>,
  options: MutexOptions = {}
): Promise<T> {
  const release = await mutex.acquire(options)
  
  try {
    return await fn()
  } finally {
    release()
  }
}

/**
 * 여러 뮤텍스를 동시에 획득하는 헬퍼 (데드락 방지)
 */
export async function withMultipleMutexes<T>(
  mutexes: AsyncMutex[],
  fn: () => Promise<T>,
  options: MutexOptions = {}
): Promise<T> {
  // 뮤텍스를 이름순으로 정렬하여 데드락 방지
  const sortedMutexes = [...mutexes].sort((a, b) => {
    const aName = (a as any).name || ''
    const bName = (b as any).name || ''
    return aName.localeCompare(bName)
  })
  
  const releases: Array<() => void> = []
  
  try {
    // 순서대로 획득
    for (const mutex of sortedMutexes) {
      const release = await mutex.acquire(options)
      releases.push(release)
    }
    
    return await fn()
  } finally {
    // 역순으로 해제
    for (const release of releases.reverse()) {
      release()
    }
  }
}

/**
 * 글로벌 뮤텍스 레지스트리
 */
class MutexRegistry {
  private static instance: MutexRegistry | null = null
  private mutexes = new Map<string, AsyncMutex>()
  
  static getInstance(): MutexRegistry {
    if (!MutexRegistry.instance) {
      MutexRegistry.instance = new MutexRegistry()
    }
    return MutexRegistry.instance
  }
  
  /**
   * 뮤텍스 가져오기 (없으면 생성)
   */
  getMutex(name: string): AsyncMutex {
    if (!this.mutexes.has(name)) {
      this.mutexes.set(name, new AsyncMutex(name))
    }
    return this.mutexes.get(name)!
  }
  
  /**
   * 모든 뮤텍스 상태 조회
   */
  getAllStats(): Record<string, MutexStats> {
    const stats: Record<string, MutexStats> = {}
    
    this.mutexes.forEach((mutex, name) => {
      stats[name] = mutex.getStats()
    })
    
    return stats
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[MutexRegistry] Debug Info:')
    console.log('- Total Mutexes:', this.mutexes.size)
    
    this.mutexes.forEach((mutex, name) => {
      const stats = mutex.getStats()
      console.log(`- ${name}: Locked=${stats.isLocked}, Queue=${stats.currentQueueSize}`)
    })
  }
}

// 전역 레지스트리 export
export const mutexRegistry = MutexRegistry.getInstance()

// 사전 정의된 뮤텍스들
export const PREDEFINED_MUTEXES = {
  inventory: mutexRegistry.getMutex('inventory'),
  skill: mutexRegistry.getMutex('skill'),
  shop: mutexRegistry.getMutex('shop'),
  battle: mutexRegistry.getMutex('battle'),
  save: mutexRegistry.getMutex('save')
} as const