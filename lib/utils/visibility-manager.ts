// 페이지 가시성 관리자
// 페이지가 비활성 상태일 때 타이머/인터벌을 자동으로 일시정지

type TimerInfo = {
  id: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>
  type: 'interval' | 'timeout'
  callback: () => void
  delay: number
  createdAt: number
  remainingTime?: number
}

class VisibilityManager {
  private static instance: VisibilityManager
  private activeTimers: Map<string, TimerInfo> = new Map()
  private pausedTimers: Map<string, TimerInfo> = new Map()
  private isPageVisible = true
  private listeners: Set<(visible: boolean) => void> = new Set()

  private isInitialized = false

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupVisibilityHandling()
    }
  }

  static getInstance(): VisibilityManager {
    if (!VisibilityManager.instance) {
      VisibilityManager.instance = new VisibilityManager()
    }
    return VisibilityManager.instance
  }

  private setupVisibilityHandling() {
    // SSR 환경 체크
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    
    // 이미 초기화되었으면 스킵
    if (this.isInitialized) {
      return
    }
    this.isInitialized = true

    // Page Visibility API 사용
    document.addEventListener('visibilitychange', () => {
      const wasVisible = this.isPageVisible
      this.isPageVisible = !document.hidden

      if (wasVisible && !this.isPageVisible) {
        // 페이지가 숨겨짐 - 모든 타이머 일시정지
        this.pauseAllTimers()
      } else if (!wasVisible && this.isPageVisible) {
        // 페이지가 다시 보임 - 타이머 재시작
        this.resumeAllTimers()
      }

      // 리스너들에게 알림
      this.listeners.forEach(listener => listener(this.isPageVisible))
    })

    // 창 포커스/블러 이벤트도 처리
    window.addEventListener('blur', () => {
      if (this.isPageVisible) {
        this.onPageBlur()
      }
    })

    window.addEventListener('focus', () => {
      if (this.isPageVisible) {
        this.onPageFocus()
      }
    })
  }

  private pauseAllTimers() {
    console.log('[VisibilityManager] 페이지 비활성화 - 타이머 일시정지')

    this.activeTimers.forEach((timer, key) => {
      if (timer.type === 'interval') {
        clearInterval(timer.id)
      } else {
        // 타임아웃의 경우 남은 시간 계산
        const elapsed = Date.now() - timer.createdAt
        timer.remainingTime = Math.max(0, timer.delay - elapsed)
        clearTimeout(timer.id)
      }

      this.pausedTimers.set(key, timer)
    })

    this.activeTimers.clear()
  }

  private resumeAllTimers() {
    console.log('[VisibilityManager] 페이지 활성화 - 타이머 재시작')

    this.pausedTimers.forEach((timer, key) => {
      if (timer.type === 'interval') {
        // 인터벌은 즉시 재시작
        const newId = setInterval(timer.callback, timer.delay)
        this.activeTimers.set(key, { ...timer, id: newId })
      } else if (timer.remainingTime && timer.remainingTime > 0) {
        // 타임아웃은 남은 시간만큼 재설정
        const newId = setTimeout(timer.callback, timer.remainingTime)
        this.activeTimers.set(key, {
          ...timer,
          id: newId,
          createdAt: Date.now()
        })
      }
    })

    this.pausedTimers.clear()
  }

  private onPageBlur() {
    console.log('[VisibilityManager] 페이지 포커스 잃음')
    // 필요시 추가 처리
  }

  private onPageFocus() {
    console.log('[VisibilityManager] 페이지 포커스 획득')
    // 필요시 추가 처리
  }

  // 타이머 등록
  registerInterval(key: string, callback: () => void, delay: number): ReturnType<typeof setInterval> {
    if (!this.isPageVisible) {
      // 페이지가 비활성 상태면 일시정지 목록에 추가
      this.pausedTimers.set(key, {
        id: -1 as unknown as ReturnType<typeof setInterval>,
        type: 'interval',
        callback,
        delay,
        createdAt: Date.now()
      })
      return -1 as unknown as ReturnType<typeof setInterval>
    }

    const id = setInterval(callback, delay)
    this.activeTimers.set(key, {
      id,
      type: 'interval',
      callback,
      delay,
      createdAt: Date.now()
    })

    return id
  }

  registerTimeout(key: string, callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    if (!this.isPageVisible) {
      // 페이지가 비활성 상태면 일시정지 목록에 추가
      this.pausedTimers.set(key, {
        id: -1 as unknown as ReturnType<typeof setTimeout>,
        type: 'timeout',
        callback,
        delay,
        createdAt: Date.now(),
        remainingTime: delay
      })
      return -1 as unknown as ReturnType<typeof setTimeout>
    }

    const id = setTimeout(callback, delay)
    this.activeTimers.set(key, {
      id,
      type: 'timeout',
      callback,
      delay,
      createdAt: Date.now()
    })

    return id
  }

  // 타이머 해제
  clearInterval(key: string) {
    const timer = this.activeTimers.get(key) || this.pausedTimers.get(key)
    if (timer && timer.type === 'interval') {
      clearInterval(timer.id)
      this.activeTimers.delete(key)
      this.pausedTimers.delete(key)
    }
  }

  clearTimeout(key: string) {
    const timer = this.activeTimers.get(key) || this.pausedTimers.get(key)
    if (timer && timer.type === 'timeout') {
      clearTimeout(timer.id)
      this.activeTimers.delete(key)
      this.pausedTimers.delete(key)
    }
  }

  // 가시성 변경 리스너 추가
  addVisibilityListener(listener: (visible: boolean) => void) {
    this.listeners.add(listener)
  }

  removeVisibilityListener(listener: (visible: boolean) => void) {
    this.listeners.delete(listener)
  }

  // 현재 가시성 상태
  get isVisible(): boolean {
    return this.isPageVisible
  }

  // 활성 타이머 수
  get activeTimerCount(): number {
    return this.activeTimers.size
  }

  // 일시정지된 타이머 수
  get pausedTimerCount(): number {
    return this.pausedTimers.size
  }

  // 디버깅용 정보
  getDebugInfo() {
    return {
      isVisible: this.isPageVisible,
      activeTimers: this.activeTimers.size,
      pausedTimers: this.pausedTimers.size,
      timers: Array.from(this.activeTimers.entries()).map(([key, timer]) => ({
        key,
        type: timer.type,
        delay: timer.delay
      }))
    }
  }
}

// SSR 안전한 export
export const visibilityManager = typeof window !== 'undefined'
  ? VisibilityManager.getInstance()
  : null as unknown as VisibilityManager

// React Hook
export function useVisibilityManager() {
  const manager = VisibilityManager.getInstance()

  return {
    registerInterval: (key: string, callback: () => void, delay: number) =>
      manager.registerInterval(key, callback, delay),
    registerTimeout: (key: string, callback: () => void, delay: number) =>
      manager.registerTimeout(key, callback, delay),
    clearInterval: (key: string) => manager.clearInterval(key),
    clearTimeout: (key: string) => manager.clearTimeout(key),
    isVisible: manager.isVisible,
    addListener: (listener: (visible: boolean) => void) =>
      manager.addVisibilityListener(listener),
    removeListener: (listener: (visible: boolean) => void) =>
      manager.removeVisibilityListener(listener)
  }
}
