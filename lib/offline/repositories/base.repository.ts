import { Table } from 'dexie'
import { IdGenerators } from '@/lib/utils/id-generator'

interface BaseEntity {
  id?: string | number
  userId: string
  createdAt?: Date
  updatedAt: Date
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected table: Table<T>

  constructor(table: Table<T>) {
    this.table = table
  }

  async create(data: T): Promise<T> {
    if (typeof window === 'undefined' || !this.table) {
      const now = new Date()
      return {
        ...data,
        id: data.id || this.generateId(),
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now
      } as T
    }

    const now = new Date()
    const entityToCreate = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    } as T

    await this.table.add(entityToCreate)
    return entityToCreate
  }

  async findById(id: string | number): Promise<T | undefined> {
    if (typeof window === 'undefined' || !this.table) {
      return undefined
    }
    return await this.table.get(id as unknown)
  }

  async findByUserId(userId: string): Promise<T[]> {
    if (typeof window === 'undefined' || !this.table) {
      return []
    }
    return await this.table.where('userId').equals(userId).toArray()
  }

  async findAll(): Promise<T[]> {
    if (typeof window === 'undefined' || !this.table) {
      return []
    }
    return await this.table.toArray()
  }

  async update(id: string | number, updates: Partial<T>): Promise<T> {
    if (typeof window === 'undefined' || !this.table) {
      return { id, ...updates, updatedAt: new Date() } as T
    }

    const entity = await this.findById(id)
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`)
    }

    const updatedFields = {
      ...updates,
      updatedAt: new Date()
    }

    await this.table.update(id as unknown, updatedFields as unknown)

    const updatedEntity = {
      ...entity,
      ...updatedFields
    } as T

    return updatedEntity
  }

  async delete(id: string | number): Promise<void> {
    if (typeof window === 'undefined' || !this.table) {
      return
    }
    await this.table.delete(id as unknown)
  }

  async deleteMany(ids: (string | number)[]): Promise<void> {
    if (typeof window === 'undefined' || !this.table) {
      return
    }
    await this.table.bulkDelete(ids as unknown)
  }

  async deleteByUserId(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !this.table) {
      return
    }
    const entities = await this.findByUserId(userId)
    const ids = entities.map(e => e.id!).filter(Boolean)
    if (ids.length > 0) {
      await this.deleteMany(ids)
    }
  }

  async count(): Promise<number> {
    if (typeof window === 'undefined' || !this.table) {
      return 0
    }
    return await this.table.count()
  }

  async exists(id: string | number): Promise<boolean> {
    if (typeof window === 'undefined' || !this.table) {
      return false
    }
    const entity = await this.findById(id)
    return entity !== undefined
  }

  protected generateId(): string {
    return IdGenerators.timestamp()
  }
}
