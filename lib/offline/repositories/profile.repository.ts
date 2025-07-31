import { dbHelpers } from '@/lib/database/client'
import type { UserProfile } from '@/lib/database/client'

export class ProfileRepository {
  async findOneByUserId(userId: string): Promise<UserProfile | undefined> {
    const profile = await dbHelpers.getProfile(userId)
    return profile || undefined
  }

  async findByEmail(email: string): Promise<UserProfile | undefined> {
    // For now, just use userId-based lookup
    const profile = await dbHelpers.getProfile('default-user')
    if (profile && profile.email === email) {
      return profile
    }
    return undefined
  }

  async updateByUserId(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const result = await dbHelpers.updateProfile(userId, updates)
    return result !== null
  }

  async create(data: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    await dbHelpers.initializeUserData(data.userId, data.email, data.name)
    const profile = await dbHelpers.getProfile(data.userId)
    return profile!
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return await dbHelpers.getProfile(userId)
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const result = await dbHelpers.updateProfile(userId, updates)
    return result !== null
  }
}

export const profileRepository = new ProfileRepository()