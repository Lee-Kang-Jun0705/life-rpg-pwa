/**
 * GameStateManager - 게임 상태 관리 및 충돌 방지
 * 
 * 코딩 규칙:
 * - any 타입 금지
 * - 하드코딩 금지 - 상수로 관리
 * - 통일성 - 일관된 메서드 명명
 * - 기존 기능 보호 - 안전한 상태 전환
 */

export type GameState = 'idle' | 'battle' | 'shopping' | 'inventory' | 'skill_management' | 'dungeon_select'

interface StateTransition {
  from: GameState
  to: GameState
  allowed: boolean
  reason?: string
}

interface StateChangeListener {
  id: string
  callback: (newState: GameState, oldState: GameState) => void
}

export class GameStateManager {
  private static instance: GameStateManager | null = null
  private currentState: GameState = 'idle'
  private previousState: GameState = 'idle'
  private stateChangeListeners = new Map<string, StateChangeListener>()
  private stateHistory: Array<{ state: GameState; timestamp: number }> = []
  
  // 상태 전환 규칙 (코딩규칙: 하드코딩 금지)
  private readonly INVALID_TRANSITIONS: ReadonlyArray<[GameState, GameState]> = [
    ['battle', 'shopping'], // 전투 중 상점 불가
    ['shopping', 'battle'], // 구매 중 전투 불가
    ['battle', 'inventory'], // 전투 중 인벤토리 변경 불가
    ['battle', 'skill_management'], // 전투 중 스킬 변경 불가
  ] as const
  
  private readonly STATE_PRIORITIES: Record<GameState, number> = {
    idle: 0,
    dungeon_select: 1,
    inventory: 2,
    skill_management: 2,
    shopping: 3,
    battle: 4, // 가장 높은 우선순위
  } as const
  
  private constructor() {
    // 상태 히스토리 초기화
    this.stateHistory.push({
      state: 'idle',
      timestamp: Date.now()
    })
  }
  
  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager()
    }
    return GameStateManager.instance
  }
  
  /**
   * 현재 게임 상태 반환
   */
  getCurrentState(): GameState {
    return this.currentState
  }
  
  /**
   * 이전 게임 상태 반환
   */
  getPreviousState(): GameState {
    return this.previousState
  }
  
  /**
   * 상태 전환 가능 여부 확인
   */
  canTransition(from: GameState, to: GameState): boolean {
    // 같은 상태로의 전환은 항상 허용
    if (from === to) return true
    
    // 금지된 전환 확인
    const isInvalid = this.INVALID_TRANSITIONS.some(
      ([f, t]) => f === from && t === to
    )
    
    if (isInvalid) {
      console.warn(`[GameStateManager] Invalid transition: ${from} -> ${to}`)
      return false
    }
    
    // 우선순위 확인 - 낮은 우선순위에서 높은 우선순위로의 전환은 허용
    const fromPriority = this.STATE_PRIORITIES[from]
    const toPriority = this.STATE_PRIORITIES[to]
    
    // 전투 중일 때는 전투 종료만 허용
    if (from === 'battle' && to !== 'idle') {
      console.warn(`[GameStateManager] Cannot transition from battle to ${to}. Must end battle first.`)
      return false
    }
    
    return true
  }
  
  /**
   * 상태 전환 시도
   */
  async transitionTo(newState: GameState): Promise<boolean> {
    console.log(`[GameStateManager] Attempting transition: ${this.currentState} -> ${newState}`)
    
    // 전환 가능 여부 확인
    if (!this.canTransition(this.currentState, newState)) {
      return false
    }
    
    // 이전 상태 정리
    try {
      await this.cleanup(this.currentState)
    } catch (error) {
      console.error('[GameStateManager] Cleanup failed:', error)
      // 정리 실패해도 전환은 계속 진행 (게임이 멈추지 않도록)
    }
    
    // 상태 변경
    this.previousState = this.currentState
    this.currentState = newState
    
    // 히스토리 기록
    this.stateHistory.push({
      state: newState,
      timestamp: Date.now()
    })
    
    // 최대 100개까지만 히스토리 유지
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift()
    }
    
    // 리스너들에게 알림
    this.notifyStateChange(newState, this.previousState)
    
    // 새 상태 초기화
    try {
      await this.initialize(newState)
    } catch (error) {
      console.error('[GameStateManager] Initialization failed:', error)
      // 초기화 실패 시 이전 상태로 롤백
      await this.rollback()
      return false
    }
    
    console.log(`[GameStateManager] Transition successful: ${this.previousState} -> ${newState}`)
    return true
  }
  
  /**
   * 강제 상태 전환 (긴급 상황용)
   */
  async forceTransitionTo(newState: GameState): Promise<void> {
    console.warn(`[GameStateManager] Force transition to ${newState}`)
    
    this.previousState = this.currentState
    this.currentState = newState
    
    this.notifyStateChange(newState, this.previousState)
  }
  
  /**
   * 이전 상태로 롤백
   */
  private async rollback(): Promise<void> {
    console.warn(`[GameStateManager] Rolling back to ${this.previousState}`)
    
    const temp = this.currentState
    this.currentState = this.previousState
    this.previousState = temp
    
    this.notifyStateChange(this.currentState, this.previousState)
  }
  
  /**
   * 상태별 정리 작업
   */
  private async cleanup(state: GameState): Promise<void> {
    switch (state) {
      case 'battle':
        // 전투 종료 처리
        console.log('[GameStateManager] Cleaning up battle state')
        // AutoBattleManager 정지, 전투 데이터 저장 등
        window.dispatchEvent(new CustomEvent('battle-cleanup'))
        break
        
      case 'shopping':
        // 미완료 거래 처리
        console.log('[GameStateManager] Cleaning up shopping state')
        window.dispatchEvent(new CustomEvent('shopping-cleanup'))
        break
        
      case 'inventory':
        // 임시 변경사항 저장
        console.log('[GameStateManager] Cleaning up inventory state')
        window.dispatchEvent(new CustomEvent('inventory-cleanup'))
        break
        
      case 'skill_management':
        // 스킬 변경사항 저장
        console.log('[GameStateManager] Cleaning up skill management state')
        window.dispatchEvent(new CustomEvent('skill-cleanup'))
        break
    }
  }
  
  /**
   * 상태별 초기화 작업
   */
  private async initialize(state: GameState): Promise<void> {
    switch (state) {
      case 'battle':
        console.log('[GameStateManager] Initializing battle state')
        window.dispatchEvent(new CustomEvent('battle-init'))
        break
        
      case 'shopping':
        console.log('[GameStateManager] Initializing shopping state')
        window.dispatchEvent(new CustomEvent('shopping-init'))
        break
        
      case 'inventory':
        console.log('[GameStateManager] Initializing inventory state')
        window.dispatchEvent(new CustomEvent('inventory-init'))
        break
        
      case 'skill_management':
        console.log('[GameStateManager] Initializing skill management state')
        window.dispatchEvent(new CustomEvent('skill-init'))
        break
    }
  }
  
  /**
   * 상태 변경 리스너 등록
   */
  addStateChangeListener(id: string, callback: StateChangeListener['callback']): () => void {
    this.stateChangeListeners.set(id, { id, callback })
    
    // cleanup 함수 반환
    return () => {
      this.stateChangeListeners.delete(id)
    }
  }
  
  /**
   * 상태 변경 알림
   */
  private notifyStateChange(newState: GameState, oldState: GameState): void {
    // 모든 리스너에게 알림
    this.stateChangeListeners.forEach(listener => {
      try {
        listener.callback(newState, oldState)
      } catch (error) {
        console.error(`[GameStateManager] Listener ${listener.id} error:`, error)
      }
    })
    
    // 전역 이벤트 발생
    window.dispatchEvent(new CustomEvent('game-state-changed', {
      detail: { newState, oldState, timestamp: Date.now() }
    }))
  }
  
  /**
   * 특정 상태인지 확인
   */
  isInState(state: GameState): boolean {
    return this.currentState === state
  }
  
  /**
   * 여러 상태 중 하나인지 확인
   */
  isInAnyState(states: GameState[]): boolean {
    return states.includes(this.currentState)
  }
  
  /**
   * 상태 히스토리 조회
   */
  getStateHistory(limit = 10): Array<{ state: GameState; timestamp: number }> {
    return this.stateHistory.slice(-limit)
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[GameStateManager] Debug Info:')
    console.log('- Current State:', this.currentState)
    console.log('- Previous State:', this.previousState)
    console.log('- Listeners:', this.stateChangeListeners.size)
    console.log('- History (last 5):', this.getStateHistory(5))
  }
}

// 전역 인스턴스 export (편의를 위해)
export const gameStateManager = GameStateManager.getInstance()