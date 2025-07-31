// 성능 모니터링 및 최적화 유틸리티
export class PerformanceMonitor {
  private static timers = new Map<string, number>()
  private static intervals = new Map<string, number>()
  
  // 타이머 등록 및 추적
  static registerTimer(id: string, callback: () => void, delay: number): number {
    // 기존 타이머 정리
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!)
    }
    
    const timerId = typeof window !== 'undefined' 
      ? window.setTimeout(() => {
          this.timers.delete(id)
          callback()
        }, delay)
      : 0
    
    this.timers.set(id, timerId)
    return timerId
  }
  
  // 인터벌 등록 및 추적
  static registerInterval(id: string, callback: () => void, interval: number): number {
    // 기존 인터벌 정리
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id)!)
    }
    
    const intervalId = typeof window !== 'undefined'
      ? window.setInterval(callback, interval)
      : 0
    this.intervals.set(id, intervalId)
    return intervalId
  }
  
  // 모든 타이머/인터벌 정리
  static cleanup() {
    this.timers.forEach(timerId => clearTimeout(timerId))
    this.intervals.forEach(intervalId => clearInterval(intervalId))
    this.timers.clear()
    this.intervals.clear()
  }
  
  // 특정 컴포넌트의 타이머 정리
  static cleanupComponent(prefix: string) {
    this.timers.forEach((timerId, id) => {
      if (id.startsWith(prefix)) {
        clearTimeout(timerId)
        this.timers.delete(id)
      }
    })
    
    this.intervals.forEach((intervalId, id) => {
      if (id.startsWith(prefix)) {
        clearInterval(intervalId)
        this.intervals.delete(id)
      }
    })
  }
  
  // 활성 타이머/인터벌 수 확인
  static getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size
    }
  }
  
  // 배터리 최적화 모드
  static enableBatteryOptimization() {
    // 모든 인터벌을 더 긴 주기로 변경
    this.intervals.forEach((intervalId, id) => {
      clearInterval(intervalId)
      // 기본적으로 5배 느리게
      console.log(`Battery optimization: Slowing down interval ${id}`)
    })
  }
}

// 페이지 가시성 변경 감지
export class VisibilityManager {
  private static callbacks = new Map<string, () => void>()
  private static pausedCallbacks = new Map<string, () => void>()
  private static initialized = false
  
  private static initialize() {
    if (this.initialized || typeof document === 'undefined') {
      return
    }
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 백그라운드로 전환
        this.pausedCallbacks.forEach(callback => callback())
      } else {
        // 포그라운드로 전환
        this.callbacks.forEach(callback => callback())
      }
    })
    
    this.initialized = true
  }
  
  // 포그라운드 전환 시 콜백 등록
  static onVisible(id: string, callback: () => void) {
    this.initialize()
    this.callbacks.set(id, callback)
  }
  
  // 백그라운드 전환 시 콜백 등록
  static onHidden(id: string, callback: () => void) {
    this.initialize()
    this.pausedCallbacks.set(id, callback)
  }
  
  // 콜백 제거
  static remove(id: string) {
    this.callbacks.delete(id)
    this.pausedCallbacks.delete(id)
  }
}

// 스마트 업데이트 스케줄러
export class SmartUpdateScheduler {
  private static updateQueue = new Map<string, {
    callback: () => Promise<void>
    priority: number
    lastUpdate: number
    minInterval: number
  }>()
  
  // 업데이트 등록
  static register(
    id: string, 
    callback: () => Promise<void>, 
    options: {
      priority?: number
      minInterval?: number
    } = {}
  ) {
    this.updateQueue.set(id, {
      callback,
      priority: options.priority || 0,
      lastUpdate: 0,
      minInterval: options.minInterval || 60000 // 기본 1분
    })
  }
  
  // 사용자 상호작용 시 업데이트 트리거
  static async triggerUpdates(force = false) {
    const now = Date.now()
    const updates = Array.from(this.updateQueue.entries())
      .filter(([_, info]) => {
        return force || (now - info.lastUpdate) >= info.minInterval
      })
      .sort((a, b) => b[1].priority - a[1].priority)
    
    // 우선순위 순으로 업데이트 실행
    for (const [id, info] of updates) {
      try {
        await info.callback()
        info.lastUpdate = now
      } catch (error) {
        console.error(`Update failed for ${id}:`, error)
      }
    }
  }
  
  // 컴포넌트 언마운트 시 제거
  static unregister(id: string) {
    this.updateQueue.delete(id)
  }
}

// 사용 예시:
// SmartUpdateScheduler.register('energy-update', async () => {
//   await updateEnergyState()
// }, { priority: 10, minInterval: 300000 }) // 5분마다, 높은 우선순위

// 유저 클릭 시:
// document.addEventListener('click', () => {
//   SmartUpdateScheduler.triggerUpdates()
// })