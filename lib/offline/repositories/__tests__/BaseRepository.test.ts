import Dexie from 'dexie'
import { BaseRepository } from '../base.repository'

// 테스트용 인터페이스
interface TestEntity {
  id?: string
  userId: string
  name: string
  value: number
  createdAt: Date
  updatedAt: Date
}

// 테스트용 데이터베이스
class TestDatabase extends Dexie {
  testEntities!: Dexie.Table<TestEntity, string>

  constructor() {
    super('TestDatabase')
    this.version(1).stores({
      testEntities: '++id, userId, name'
    })
  }
}

// 테스트용 Repository
class TestRepository extends BaseRepository<TestEntity> {
  constructor(db: TestDatabase) {
    super(db.testEntities)
  }
}

describe('BaseRepository', () => {
  let db: TestDatabase
  let repository: TestRepository
  const testUserId = 'test-user-123'

  beforeEach(async () => {
    // 새로운 데이터베이스 인스턴스 생성
    db = new TestDatabase()
    await db.open()
    repository = new TestRepository(db)
  })

  afterEach(async () => {
    // 데이터베이스 정리
    await db.delete()
  })

  describe('create', () => {
    it('새로운 엔티티를 생성해야 함', async () => {
      const testData: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: testUserId,
        name: 'Test Entity',
        value: 100
      }

      const result = await repository.create(testData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.userId).toBe(testUserId)
      expect(result.name).toBe('Test Entity')
      expect(result.value).toBe(100)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('ID가 제공된 경우 사용해야 함', async () => {
      const customId = 'custom-id-123'
      const testData: Partial<TestEntity> = {
        id: customId,
        userId: testUserId,
        name: 'Test Entity',
        value: 100
      }

      const result = await repository.create(testData)

      expect(result.id).toBe(customId)
    })
  })

  describe('findById', () => {
    it('ID로 엔티티를 찾아야 함', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Test Entity',
        value: 100
      })

      const found = await repository.findById(created.id!)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Test Entity')
    })

    it('존재하지 않는 ID에 대해 undefined를 반환해야 함', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeUndefined()
    })
  })

  describe('findByUserId', () => {
    it('userId로 모든 엔티티를 찾아야 함', async () => {
      // 여러 엔티티 생성
      await repository.create({ userId: testUserId, name: 'Entity 1', value: 100 })
      await repository.create({ userId: testUserId, name: 'Entity 2', value: 200 })
      await repository.create({ userId: 'other-user', name: 'Entity 3', value: 300 })

      const results = await repository.findByUserId(testUserId)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.userId === testUserId)).toBe(true)
      expect(results.map(r => r.name)).toContain('Entity 1')
      expect(results.map(r => r.name)).toContain('Entity 2')
    })

    it('엔티티가 없는 경우 빈 배열을 반환해야 함', async () => {
      const results = await repository.findByUserId('non-existent-user')

      expect(results).toEqual([])
    })
  })

  describe('update', () => {
    it('엔티티를 업데이트해야 함', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Original Name',
        value: 100
      })

      const originalCreatedAt = created.createdAt

      // 잠시 대기하여 updatedAt이 다르도록 함
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await repository.update(created.id!, {
        name: 'Updated Name',
        value: 200
      })

      expect(updated.id).toBe(created.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.value).toBe(200)
      expect(updated.createdAt).toEqual(originalCreatedAt)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime())
    })

    it('존재하지 않는 ID에 대해 에러를 던져야 함', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('엔티티를 삭제해야 함', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'To Delete',
        value: 100
      })

      await repository.delete(created.id!)

      const found = await repository.findById(created.id!)
      expect(found).toBeUndefined()
    })

    it('존재하지 않는 ID 삭제 시 에러를 던지지 않아야 함', async () => {
      await expect(
        repository.delete('non-existent-id')
      ).resolves.not.toThrow()
    })
  })

  describe('findAll', () => {
    it('모든 엔티티를 반환해야 함', async () => {
      await repository.create({ userId: 'user1', name: 'Entity 1', value: 100 })
      await repository.create({ userId: 'user2', name: 'Entity 2', value: 200 })
      await repository.create({ userId: 'user3', name: 'Entity 3', value: 300 })

      const results = await repository.findAll()

      expect(results).toHaveLength(3)
      expect(results.map(r => r.name)).toContain('Entity 1')
      expect(results.map(r => r.name)).toContain('Entity 2')
      expect(results.map(r => r.name)).toContain('Entity 3')
    })
  })

  describe('deleteByUserId', () => {
    it('특정 userId의 모든 엔티티를 삭제해야 함', async () => {
      await repository.create({ userId: testUserId, name: 'Entity 1', value: 100 })
      await repository.create({ userId: testUserId, name: 'Entity 2', value: 200 })
      await repository.create({ userId: 'other-user', name: 'Entity 3', value: 300 })

      await repository.deleteByUserId(testUserId)

      const testUserEntities = await repository.findByUserId(testUserId)
      const otherUserEntities = await repository.findByUserId('other-user')

      expect(testUserEntities).toHaveLength(0)
      expect(otherUserEntities).toHaveLength(1)
    })
  })

  describe('count', () => {
    it('전체 엔티티 수를 반환해야 함', async () => {
      await repository.create({ userId: 'user1', name: 'Entity 1', value: 100 })
      await repository.create({ userId: 'user2', name: 'Entity 2', value: 200 })
      await repository.create({ userId: 'user3', name: 'Entity 3', value: 300 })

      const count = await repository.count()

      expect(count).toBe(3)
    })

    it('빈 테이블에서 0을 반환해야 함', async () => {
      const count = await repository.count()

      expect(count).toBe(0)
    })
  })

  describe('exists', () => {
    it('엔티티가 존재하는 경우 true를 반환해야 함', async () => {
      const created = await repository.create({
        userId: testUserId,
        name: 'Test Entity',
        value: 100
      })

      const exists = await repository.exists(created.id!)

      expect(exists).toBe(true)
    })

    it('엔티티가 존재하지 않는 경우 false를 반환해야 함', async () => {
      const exists = await repository.exists('non-existent-id')

      expect(exists).toBe(false)
    })
  })

  describe('Transaction 처리', () => {
    it('트랜잭션 내에서 여러 작업을 수행해야 함', async () => {
      const results = await db.transaction('rw', db.testEntities, async () => {
        const entity1 = await repository.create({
          userId: testUserId,
          name: 'Transaction Entity 1',
          value: 100
        })

        const entity2 = await repository.create({
          userId: testUserId,
          name: 'Transaction Entity 2',
          value: 200
        })

        return [entity1, entity2]
      })

      expect(results).toHaveLength(2)
      
      const allEntities = await repository.findByUserId(testUserId)
      expect(allEntities).toHaveLength(2)
    })
  })
})