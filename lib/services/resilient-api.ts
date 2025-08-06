/**
 * ResilientAPI - 복원력 있는 API 호출 서비스
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 제네릭과 명확한 타입 사용
 * - 하드코딩 금지 - 설정값 상수화
 * - 에러 처리 - 모든 실패 케이스 대응
 * - 성능 최적화 - 지수 백오프, 회로 차단기 패턴
 */

import { PREDEFINED_MUTEXES } from '@/lib/utils/async-mutex'

// API 요청 옵션
export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  retries?: number
  retryDelay?: number
  cache?: RequestCache
  credentials?: RequestCredentials
  priority?: 'high' | 'normal' | 'low'
}

// API 응답 타입
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: APIError
  metadata: {
    attempts: number
    totalTime: number
    cached: boolean
    circuitBreakerStatus: CircuitState
  }
}

// API 에러 타입
export interface APIError {
  code: string
  message: string
  details?: unknown
  retryable: boolean
  timestamp: number
}

// 회로 차단기 상태
export type CircuitState = 'closed' | 'open' | 'half-open'

// 재시도 전략
export interface RetryStrategy {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryableErrors: string[]
}

// 회로 차단기 설정
interface CircuitBreakerConfig {
  failureThreshold: number      // 실패 임계값
  resetTimeout: number          // 리셋 타임아웃 (ms)
  halfOpenRequests: number      // Half-open 상태에서 허용할 요청 수
  windowSize: number            // 실패율 계산 윈도우 (ms)
}

// 설정 상수 (코딩규칙: 하드코딩 금지)
const CONFIG = {
  // 기본 요청 설정
  DEFAULT_TIMEOUT: 30000,       // 30초
  DEFAULT_RETRIES: 3,
  DEFAULT_RETRY_DELAY: 1000,    // 1초
  
  // 재시도 전략
  RETRY_STRATEGY: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'TOO_MANY_REQUESTS'
    ]
  },
  
  // 회로 차단기 설정
  CIRCUIT_BREAKER: {
    failureThreshold: 5,        // 5번 실패 시 열림
    resetTimeout: 60000,        // 60초 후 half-open
    halfOpenRequests: 3,        // half-open에서 3번 시도
    windowSize: 60000           // 60초 윈도우
  },
  
  // 우선순위별 큐 크기
  QUEUE_SIZES: {
    high: 10,
    normal: 50,
    low: 20
  },
  
  // 캐시 설정
  CACHE_TTL: 5 * 60 * 1000,     // 5분
  MAX_CACHE_SIZE: 100
} as const

// 요청 큐 아이템
interface QueueItem<T> {
  url: string
  options: APIRequestOptions
  resolve: (value: APIResponse<T>) => void
  reject: (error: Error) => void
  timestamp: number
  priority: APIRequestOptions['priority']
}

export class ResilientAPI {
  private static instance: ResilientAPI | null = null
  
  // 회로 차단기
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  // 요청 큐
  private requestQueues = {
    high: [] as QueueItem<unknown>[],
    normal: [] as QueueItem<unknown>[],
    low: [] as QueueItem<unknown>[]
  }
  
  // 응답 캐시
  private responseCache = new Map<string, CacheEntry>()
  
  // 통계
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    cachedResponses: 0,
    circuitBreakerTrips: 0,
    averageResponseTime: 0,
    responseTimes: [] as number[]
  }
  
  private isProcessing = false
  
  private constructor() {
    // 주기적으로 큐 처리
    setInterval(() => this.processQueues(), 100)
    
    // 캐시 정리
    setInterval(() => this.cleanupCache(), CONFIG.CACHE_TTL)
  }
  
  static getInstance(): ResilientAPI {
    if (!ResilientAPI.instance) {
      ResilientAPI.instance = new ResilientAPI()
    }
    return ResilientAPI.instance
  }
  
  /**
   * API 요청 실행
   */
  async request<T = unknown>(
    url: string,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now()
    this.stats.totalRequests++
    
    // 캐시 확인
    if (options.method === 'GET' && options.cache !== 'no-store') {
      const cached = this.getFromCache(url)
      if (cached) {
        this.stats.cachedResponses++
        return {
          success: true,
          data: cached as T,
          metadata: {
            attempts: 0,
            totalTime: 0,
            cached: true,
            circuitBreakerStatus: 'closed'
          }
        }
      }
    }
    
    // 회로 차단기 확인
    const circuitBreaker = this.getCircuitBreaker(url)
    if (!circuitBreaker.allowRequest()) {
      return {
        success: false,
        error: {
          code: 'CIRCUIT_OPEN',
          message: 'Circuit breaker is open',
          retryable: false,
          timestamp: Date.now()
        },
        metadata: {
          attempts: 0,
          totalTime: Date.now() - startTime,
          cached: false,
          circuitBreakerStatus: circuitBreaker.getState()
        }
      }
    }
    
    // 우선순위 큐에 추가
    if (options.priority && this.shouldQueue(options.priority)) {
      return this.enqueue(url, options)
    }
    
    // 직접 실행
    return this.executeWithRetry(url, options, startTime)
  }
  
  /**
   * 재시도와 함께 요청 실행
   */
  private async executeWithRetry<T>(
    url: string,
    options: APIRequestOptions,
    startTime: number
  ): Promise<APIResponse<T>> {
    const maxAttempts = options.retries ?? CONFIG.DEFAULT_RETRIES
    const circuitBreaker = this.getCircuitBreaker(url)
    let lastError: APIError | null = null
    let attempts = 0
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attempts = attempt
      
      try {
        // 요청 실행
        const response = await this.executeRequest<T>(url, options)
        
        // 성공
        circuitBreaker.recordSuccess()
        this.stats.successfulRequests++
        
        // 캐시 저장
        if (options.method === 'GET' && response.data) {
          this.saveToCache(url, response.data)
        }
        
        const totalTime = Date.now() - startTime
        this.recordResponseTime(totalTime)
        
        return {
          success: true,
          data: response.data,
          metadata: {
            attempts,
            totalTime,
            cached: false,
            circuitBreakerStatus: circuitBreaker.getState()
          }
        }
        
      } catch (error) {
        lastError = this.createAPIError(error)
        
        // 회로 차단기에 실패 기록
        circuitBreaker.recordFailure()
        
        // 재시도 가능한 에러인지 확인
        if (!this.isRetryable(lastError) || attempt === maxAttempts) {
          break
        }
        
        // 재시도 지연
        const delay = this.calculateRetryDelay(attempt)
        await this.delay(delay)
        
        this.stats.retriedRequests++
        console.log(`[ResilientAPI] Retrying request (${attempt}/${maxAttempts}): ${url}`)
      }
    }
    
    // 모든 시도 실패
    this.stats.failedRequests++
    
    return {
      success: false,
      error: lastError!,
      metadata: {
        attempts,
        totalTime: Date.now() - startTime,
        cached: false,
        circuitBreakerStatus: circuitBreaker.getState()
      }
    }
  }
  
  /**
   * 실제 HTTP 요청 실행
   */
  private async executeRequest<T>(
    url: string,
    options: APIRequestOptions
  ): Promise<{ data: T }> {
    const controller = new AbortController()
    const timeout = options.timeout ?? CONFIG.DEFAULT_TIMEOUT
    
    // 타임아웃 설정
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        cache: options.cache,
        credentials: options.credentials ?? 'same-origin'
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return { data: data as T }
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }
  
  /**
   * 큐에 요청 추가
   */
  private enqueue<T>(
    url: string,
    options: APIRequestOptions
  ): Promise<APIResponse<T>> {
    return new Promise((resolve, reject) => {
      const priority = options.priority ?? 'normal'
      const queue = this.requestQueues[priority]
      
      // 큐 크기 확인
      if (queue.length >= CONFIG.QUEUE_SIZES[priority]) {
        reject(new Error('Request queue is full'))
        return
      }
      
      queue.push({
        url,
        options,
        resolve: resolve as (value: APIResponse<unknown>) => void,
        reject,
        timestamp: Date.now(),
        priority
      })
      
      console.log(`[ResilientAPI] Request queued (${priority}): ${url}`)
    })
  }
  
  /**
   * 큐 처리
   */
  private async processQueues(): Promise<void> {
    if (this.isProcessing) return
    
    this.isProcessing = true
    
    try {
      // 우선순위 순서로 처리
      for (const priority of ['high', 'normal', 'low'] as const) {
        const queue = this.requestQueues[priority]
        
        while (queue.length > 0) {
          const item = queue.shift()!
          
          try {
            const response = await this.executeWithRetry(
              item.url,
              item.options,
              item.timestamp
            )
            item.resolve(response)
          } catch (error) {
            item.reject(error as Error)
          }
          
          // 우선순위별 처리 간격
          await this.delay(priority === 'high' ? 10 : priority === 'normal' ? 50 : 100)
        }
      }
    } finally {
      this.isProcessing = false
    }
  }
  
  /**
   * 회로 차단기 가져오기
   */
  private getCircuitBreaker(url: string): CircuitBreaker {
    const host = new URL(url).host
    
    if (!this.circuitBreakers.has(host)) {
      this.circuitBreakers.set(host, new CircuitBreaker(
        CONFIG.CIRCUIT_BREAKER,
        () => this.stats.circuitBreakerTrips++
      ))
    }
    
    return this.circuitBreakers.get(host)!
  }
  
  /**
   * 캐시에서 가져오기
   */
  private getFromCache(url: string): unknown | null {
    const entry = this.responseCache.get(url)
    
    if (entry && Date.now() - entry.timestamp < CONFIG.CACHE_TTL) {
      return entry.data
    }
    
    return null
  }
  
  /**
   * 캐시에 저장
   */
  private saveToCache(url: string, data: unknown): void {
    // 캐시 크기 제한
    if (this.responseCache.size >= CONFIG.MAX_CACHE_SIZE) {
      const firstKey = this.responseCache.keys().next().value
      this.responseCache.delete(firstKey)
    }
    
    this.responseCache.set(url, {
      data,
      timestamp: Date.now()
    })
  }
  
  /**
   * 캐시 정리
   */
  private cleanupCache(): void {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.responseCache.forEach((entry, key) => {
      if (now - entry.timestamp > CONFIG.CACHE_TTL) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => this.responseCache.delete(key))
  }
  
  /**
   * API 에러 생성
   */
  private createAPIError(error: unknown): APIError {
    if (error instanceof Error) {
      const retryable = error.message.includes('timeout') ||
                       error.message.includes('network') ||
                       error.message.includes('503') ||
                       error.message.includes('429')
      
      return {
        code: this.getErrorCode(error.message),
        message: error.message,
        retryable,
        timestamp: Date.now()
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      retryable: false,
      timestamp: Date.now()
    }
  }
  
  /**
   * 에러 코드 추출
   */
  private getErrorCode(message: string): string {
    if (message.includes('timeout')) return 'TIMEOUT'
    if (message.includes('network')) return 'NETWORK_ERROR'
    if (message.includes('503')) return 'SERVICE_UNAVAILABLE'
    if (message.includes('429')) return 'TOO_MANY_REQUESTS'
    if (message.includes('401')) return 'UNAUTHORIZED'
    if (message.includes('403')) return 'FORBIDDEN'
    if (message.includes('404')) return 'NOT_FOUND'
    return 'HTTP_ERROR'
  }
  
  /**
   * 재시도 가능 여부 확인
   */
  private isRetryable(error: APIError): boolean {
    return error.retryable && 
           CONFIG.RETRY_STRATEGY.retryableErrors.includes(error.code)
  }
  
  /**
   * 재시도 지연 시간 계산
   */
  private calculateRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay, backoffMultiplier, jitter } = CONFIG.RETRY_STRATEGY
    
    // 지수 백오프
    let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay)
    
    // 지터 추가
    if (jitter) {
      delay += Math.random() * delay * 0.1 // ±10% 지터
    }
    
    return delay
  }
  
  /**
   * 큐잉 필요 여부 확인
   */
  private shouldQueue(priority: APIRequestOptions['priority']): boolean {
    // 현재 처리 중인 요청이 많으면 큐잉
    return this.isProcessing
  }
  
  /**
   * 응답 시간 기록
   */
  private recordResponseTime(time: number): void {
    this.stats.responseTimes.push(time)
    
    // 최대 1000개 유지
    if (this.stats.responseTimes.length > 1000) {
      this.stats.responseTimes.shift()
    }
    
    // 평균 계산
    const sum = this.stats.responseTimes.reduce((acc, t) => acc + t, 0)
    this.stats.averageResponseTime = sum / this.stats.responseTimes.length
  }
  
  /**
   * 지연
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return { ...this.stats }
  }
  
  /**
   * 회로 차단기 상태 조회
   */
  getCircuitBreakerStates(): Record<string, CircuitState> {
    const states: Record<string, CircuitState> = {}
    
    this.circuitBreakers.forEach((breaker, host) => {
      states[host] = breaker.getState()
    })
    
    return states
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.responseCache.clear()
    console.log('[ResilientAPI] Cache cleared')
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[ResilientAPI] Debug Info:')
    console.log('- Stats:', this.stats)
    console.log('- Circuit Breakers:', this.getCircuitBreakerStates())
    console.log('- Cache Size:', this.responseCache.size)
    console.log('- Queue Sizes:', {
      high: this.requestQueues.high.length,
      normal: this.requestQueues.normal.length,
      low: this.requestQueues.low.length
    })
  }
}

/**
 * 회로 차단기 구현
 */
class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failures = 0
  private successCount = 0
  private lastFailureTime = 0
  private halfOpenRequests = 0
  
  constructor(
    private config: CircuitBreakerConfig,
    private onTrip: () => void
  ) {}
  
  allowRequest(): boolean {
    switch (this.state) {
      case 'closed':
        return true
        
      case 'open':
        // 타임아웃 확인
        if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
          this.state = 'half-open'
          this.halfOpenRequests = 0
          console.log('[CircuitBreaker] Transitioning to half-open')
          return true
        }
        return false
        
      case 'half-open':
        // Half-open 상태에서 제한된 요청만 허용
        if (this.halfOpenRequests < this.config.halfOpenRequests) {
          this.halfOpenRequests++
          return true
        }
        return false
    }
  }
  
  recordSuccess(): void {
    switch (this.state) {
      case 'closed':
        this.failures = 0
        break
        
      case 'half-open':
        this.successCount++
        // 충분한 성공 시 회로 닫기
        if (this.successCount >= this.config.halfOpenRequests) {
          this.state = 'closed'
          this.failures = 0
          this.successCount = 0
          console.log('[CircuitBreaker] Circuit closed')
        }
        break
    }
  }
  
  recordFailure(): void {
    this.lastFailureTime = Date.now()
    
    switch (this.state) {
      case 'closed':
        this.failures++
        // 임계값 도달 시 회로 열기
        if (this.failures >= this.config.failureThreshold) {
          this.state = 'open'
          this.onTrip()
          console.log('[CircuitBreaker] Circuit opened')
        }
        break
        
      case 'half-open':
        // Half-open에서 실패 시 다시 열기
        this.state = 'open'
        this.successCount = 0
        console.log('[CircuitBreaker] Circuit re-opened')
        break
    }
  }
  
  getState(): CircuitState {
    return this.state
  }
}

// 캐시 엔트리
interface CacheEntry {
  data: unknown
  timestamp: number
}

// 전역 인스턴스 export
export const resilientAPI = ResilientAPI.getInstance()