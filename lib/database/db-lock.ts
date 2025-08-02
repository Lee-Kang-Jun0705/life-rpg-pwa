// 데이터베이스 초기화 잠금 메커니즘
export class DatabaseLock {
  private static locks = new Map<string, Promise<unknown>>()

  static async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // 이미 실행 중인 작업이 있으면 대기
    const existing = this.locks.get(key)
    if (existing) {
      console.log(`🔒 Waiting for existing ${key} operation...`)
      await existing
    }

    // 새 작업 시작
    console.log(`🔓 Starting ${key} operation...`)
    const promise = fn().finally(() => {
      this.locks.delete(key)
      console.log(`✅ ${key} operation completed`)
    })

    this.locks.set(key, promise)
    return promise
  }
}
