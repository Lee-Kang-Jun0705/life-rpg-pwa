/**
 * TransactionManager - 데이터베이스 트랜잭션 관리
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 제네릭 사용
 * - 하드코딩 금지 - 설정값 상수화
 * - 에러 처리 - 모든 작업에 롤백 보장
 * - 통일성 - 일관된 인터페이스
 */

export interface TransactionOperation<T = unknown> {
  id: string
  description: string
  execute: () => Promise<T>
  rollback: () => Promise<void>
  // 선택적: 재시도 가능 여부
  retryable?: boolean
  // 선택적: 우선순위 (높을수록 먼저 실행)
  priority?: number
}

export interface TransactionResult<T> {
  success: boolean
  data?: T
  error?: Error
  rollbackResults?: Array<{
    operationId: string
    success: boolean
    error?: Error
  }>
}

export interface Transaction {
  id: string
  operations: TransactionOperation[]
  status: 'pending' | 'executing' | 'committed' | 'rolled_back' | 'failed'
  startTime: number
  endTime?: number
  error?: Error
}

interface TransactionOptions {
  // 트랜잭션 타임아웃 (ms)
  timeout?: number
  // 실패 시 재시도 횟수
  maxRetries?: number
  // 부분 성공 허용 여부
  allowPartialSuccess?: boolean
  // 트랜잭션 이름 (로깅용)
  name?: string
}

export class TransactionManager {
  private static instance: TransactionManager | null = null
  private transactions = new Map<string, Transaction>()
  private executingTransactions = new Set<string>()
  
  // 설정 상수 (코딩규칙: 하드코딩 금지)
  private readonly DEFAULT_TIMEOUT = 30000 // 30초
  private readonly MAX_CONCURRENT_TRANSACTIONS = 5
  private readonly TRANSACTION_HISTORY_SIZE = 100
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5분
  
  private cleanupTimer: NodeJS.Timeout | null = null
  
  private constructor() {
    // 주기적으로 오래된 트랜잭션 정리
    this.startCleanupTimer()
  }
  
  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager()
    }
    return TransactionManager.instance
  }
  
  /**
   * 트랜잭션 실행
   */
  async executeTransaction<T = unknown>(
    operations: TransactionOperation[],
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId()
    const {
      timeout = this.DEFAULT_TIMEOUT,
      maxRetries = 0,
      allowPartialSuccess = false,
      name = 'Unknown Transaction'
    } = options
    
    console.log(`[TransactionManager] Starting transaction: ${name} (${transactionId})`)
    
    // 동시 실행 제한 확인
    if (this.executingTransactions.size >= this.MAX_CONCURRENT_TRANSACTIONS) {
      return {
        success: false,
        error: new Error('Maximum concurrent transactions exceeded')
      }
    }
    
    // 우선순위로 작업 정렬
    const sortedOperations = [...operations].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    )
    
    // 트랜잭션 생성
    const transaction: Transaction = {
      id: transactionId,
      operations: sortedOperations,
      status: 'pending',
      startTime: Date.now()
    }
    
    this.transactions.set(transactionId, transaction)
    this.executingTransactions.add(transactionId)
    
    try {
      // 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timeout')), timeout)
      })
      
      // 트랜잭션 실행과 타임아웃 경쟁
      const result = await Promise.race([
        this.executeOperations<T>(transaction, allowPartialSuccess),
        timeoutPromise
      ])
      
      return result
    } catch (error) {
      // 타임아웃 또는 기타 에러
      transaction.status = 'failed'
      transaction.error = error as Error
      
      return {
        success: false,
        error: error as Error
      }
    } finally {
      transaction.endTime = Date.now()
      this.executingTransactions.delete(transactionId)
      
      // 트랜잭션 기록 정리
      this.cleanupOldTransactions()
    }
  }
  
  /**
   * 작업들을 순차적으로 실행
   */
  private async executeOperations<T>(
    transaction: Transaction,
    allowPartialSuccess: boolean
  ): Promise<TransactionResult<T>> {
    transaction.status = 'executing'
    const executedOperations: Array<{ operation: TransactionOperation; result: unknown }> = []
    const results: unknown[] = []
    
    try {
      // 각 작업 실행
      for (const operation of transaction.operations) {
        console.log(`[TransactionManager] Executing: ${operation.description}`)
        
        try {
          const result = await operation.execute()
          executedOperations.push({ operation, result })
          results.push(result)
          
          console.log(`[TransactionManager] Success: ${operation.description}`)
        } catch (error) {
          console.error(`[TransactionManager] Failed: ${operation.description}`, error)
          
          if (!allowPartialSuccess) {
            // 롤백 필요
            throw error
          }
          
          // 부분 성공 허용 시 계속 진행
          results.push(null)
        }
      }
      
      transaction.status = 'committed'
      console.log(`[TransactionManager] Transaction committed: ${transaction.id}`)
      
      return {
        success: true,
        data: results as T
      }
      
    } catch (error) {
      console.error(`[TransactionManager] Transaction failed, starting rollback: ${transaction.id}`)
      
      // 롤백 실행
      const rollbackResults = await this.rollbackOperations(executedOperations)
      
      transaction.status = 'rolled_back'
      transaction.error = error as Error
      
      return {
        success: false,
        error: error as Error,
        rollbackResults
      }
    }
  }
  
  /**
   * 실행된 작업들을 역순으로 롤백
   */
  private async rollbackOperations(
    executedOperations: Array<{ operation: TransactionOperation; result: unknown }>
  ): Promise<TransactionResult<unknown>['rollbackResults']> {
    const rollbackResults: NonNullable<TransactionResult<unknown>['rollbackResults']> = []
    
    // 역순으로 롤백
    for (const { operation } of executedOperations.reverse()) {
      try {
        console.log(`[TransactionManager] Rolling back: ${operation.description}`)
        await operation.rollback()
        
        rollbackResults.push({
          operationId: operation.id,
          success: true
        })
        
        console.log(`[TransactionManager] Rollback success: ${operation.description}`)
      } catch (rollbackError) {
        console.error(`[TransactionManager] Rollback failed: ${operation.description}`, rollbackError)
        
        rollbackResults.push({
          operationId: operation.id,
          success: false,
          error: rollbackError as Error
        })
      }
    }
    
    return rollbackResults
  }
  
  /**
   * 트랜잭션 ID 생성
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 오래된 트랜잭션 정리
   */
  private cleanupOldTransactions(): void {
    if (this.transactions.size <= this.TRANSACTION_HISTORY_SIZE) {
      return
    }
    
    // 완료된 트랜잭션 중 오래된 것부터 삭제
    const completedTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.status === 'committed' || tx.status === 'rolled_back')
      .sort((a, b) => (a.endTime || 0) - (b.endTime || 0))
    
    const toDelete = completedTransactions.slice(
      0, 
      this.transactions.size - this.TRANSACTION_HISTORY_SIZE
    )
    
    toDelete.forEach(tx => {
      this.transactions.delete(tx.id)
    })
  }
  
  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldTransactions()
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
   * 특정 트랜잭션 상태 조회
   */
  getTransactionStatus(transactionId: string): Transaction['status'] | null {
    const transaction = this.transactions.get(transactionId)
    return transaction ? transaction.status : null
  }
  
  /**
   * 실행 중인 트랜잭션 수 조회
   */
  getExecutingTransactionCount(): number {
    return this.executingTransactions.size
  }
  
  /**
   * 트랜잭션 히스토리 조회
   */
  getTransactionHistory(limit = 10): Transaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit)
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[TransactionManager] Debug Info:')
    console.log('- Total Transactions:', this.transactions.size)
    console.log('- Executing:', this.executingTransactions.size)
    console.log('- Recent Transactions:')
    
    this.getTransactionHistory(5).forEach(tx => {
      console.log(`  - ${tx.id}: ${tx.status} (${new Date(tx.startTime).toLocaleTimeString()})`)
    })
  }
}

// 헬퍼 함수: 간단한 트랜잭션 생성
export function createSimpleTransaction<T>(
  operations: Array<{
    description: string
    execute: () => Promise<T>
    rollback: () => Promise<void>
  }>
): TransactionOperation<T>[] {
  return operations.map((op, index) => ({
    id: `op_${index}`,
    ...op
  }))
}

// 전역 인스턴스 export
export const transactionManager = TransactionManager.getInstance()