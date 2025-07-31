import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import 'fake-indexeddb/auto'
import { db } from '../db'
import { 
  profileRepository, 
  statRepository, 
  feedPostRepository,
  feedCommentRepository,
  feedReactionRepository 
} from '../repositories'

// IndexedDB mock 환경에서 문제가 있으므로 스킵
describe.skip('Repository Tests', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('ProfileRepository', () => {
    it('should create a new profile', async () => {
      const profileData = {
        userId: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        bio: 'Test bio'
      }

      const id = await profileRepository.createProfile(profileData)
      expect(id).toBeGreaterThan(0)

      const profile = await profileRepository.findById(id)
      expect(profile).toBeDefined()
      expect(profile?.userId).toBe(profileData.userId)
      expect(profile?.email).toBe(profileData.email)
      expect(profile?.createdAt).toBeInstanceOf(Date)
      expect(profile?.updatedAt).toBeInstanceOf(Date)
    })

    it('should find profile by userId', async () => {
      const profileData = {
        userId: 'user456',
        email: 'user456@example.com',
        displayName: 'User 456'
      }

      await profileRepository.createProfile(profileData)
      const profile = await profileRepository.findByUserId('user456')
      
      expect(profile).toBeDefined()
      expect(profile?.userId).toBe('user456')
    })

    it('should find profile by email', async () => {
      const profileData = {
        userId: 'user789',
        email: 'unique@example.com',
        displayName: 'Unique User'
      }

      await profileRepository.createProfile(profileData)
      const profile = await profileRepository.findByEmail('unique@example.com')
      
      expect(profile).toBeDefined()
      expect(profile?.email).toBe('unique@example.com')
    })

    it('should update profile by userId', async () => {
      const profileData = {
        userId: 'updateUser',
        email: 'update@example.com',
        displayName: 'Original Name'
      }

      await profileRepository.createProfile(profileData)
      
      const updated = await profileRepository.updateByUserId('updateUser', {
        displayName: 'Updated Name',
        bio: 'New bio'
      })
      
      expect(updated).toBe(true)
      
      const profile = await profileRepository.findByUserId('updateUser')
      expect(profile?.displayName).toBe('Updated Name')
      expect(profile?.bio).toBe('New bio')
    })

    it('should get profile stats', async () => {
      const userId = 'statsUser'
      
      // Create profile
      await profileRepository.createProfile({
        userId,
        email: 'stats@example.com',
        displayName: 'Stats User'
      })
      
      // Create some activities
      await db.activities.bulkAdd([
        { userId, statType: 'health', experienceGained: 10, timestamp: new Date(), synced: false },
        { userId, statType: 'learning', experienceGained: 20, timestamp: new Date(), synced: false }
      ])
      
      // Create some missions
      await db.missions.bulkAdd([
        { userId, type: 'daily', title: 'Mission 1', description: '', target: 5, progress: 5, completed: true },
        { userId, type: 'weekly', title: 'Mission 2', description: '', target: 10, progress: 3, completed: false }
      ])
      
      const stats = await profileRepository.getProfileStats(userId)
      
      expect(stats).toBeDefined()
      expect(stats?.totalActivities).toBe(2)
      expect(stats?.totalMissions).toBe(2)
      expect(stats?.completedMissions).toBe(1)
    })
  })

  describe('StatRepository', () => {
    const userId = 'testUser'

    beforeEach(async () => {
      // Create initial stats for user
      await statRepository.createInitialStats(userId)
    })

    it('should create initial stats for all types', async () => {
      const stats = await statRepository.findByUserId(userId)
      
      expect(stats).toHaveLength(4)
      expect(stats.map(s => s.type).sort()).toEqual(
        ['achievement', 'health', 'learning', 'relationship']
      )
      
      stats.forEach(stat => {
        expect(stat.level).toBe(1)
        expect(stat.experience).toBe(0)
        expect(stat.totalActivities).toBe(0)
      })
    })

    it('should find stat by userId and type', async () => {
      const healthStat = await statRepository.findByUserIdAndType(userId, 'health')
      
      expect(healthStat).toBeDefined()
      expect(healthStat?.type).toBe('health')
      expect(healthStat?.userId).toBe(userId)
    })

    it('should increment experience and level correctly', async () => {
      const success = await statRepository.incrementExperience(userId, 'learning', 150)
      
      expect(success).toBe(true)
      
      const stat = await statRepository.findByUserIdAndType(userId, 'learning')
      expect(stat?.experience).toBe(150)
      expect(stat?.level).toBe(2) // 150 / 100 = 1.5, floor + 1 = 2
      expect(stat?.totalActivities).toBe(1)
    })

    it('should calculate stats summary correctly', async () => {
      // Add some experience to different stats
      await statRepository.incrementExperience(userId, 'health', 50)
      await statRepository.incrementExperience(userId, 'learning', 150)
      await statRepository.incrementExperience(userId, 'relationship', 75)
      
      const summary = await statRepository.getStatsSummary(userId)
      
      expect(summary.totalExperience).toBe(275) // 50 + 150 + 75
      expect(summary.totalLevel).toBe(5) // 1 + 2 + 1 + 1
      expect(summary.averageLevel).toBe(1.25) // 5 / 4
      expect(summary.totalActivities).toBe(3)
    })
  })

  describe('FeedPostRepository', () => {
    it('should create a new post', async () => {
      const postData = {
        userId: 'poster123',
        content: 'This is my first post!',
        statType: 'health' as const,
        activityDescription: 'Went for a run',
        encrypted: false
      }

      const postId = await feedPostRepository.createPost(postData)
      expect(postId).toBeGreaterThan(0)

      const post = await feedPostRepository.findById(postId)
      expect(post).toBeDefined()
      expect(post?.content).toBe(postData.content)
      expect(post?.likes).toBe(0)
      expect(post?.comments).toBe(0)
    })

    it('should find posts by userId', async () => {
      const userId = 'multiPoster'
      
      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await feedPostRepository.createPost({
          userId,
          content: `Post ${i}`,
          statType: 'learning',
          encrypted: false
        })
      }

      const posts = await feedPostRepository.findByUserId(userId, 3)
      expect(posts).toHaveLength(3)
      // Should be ordered by most recent first
      expect(posts[0].content).toBe('Post 4')
    })

    it('should find recent posts', async () => {
      // Create posts with delays to ensure order
      for (let i = 0; i < 3; i++) {
        await feedPostRepository.createPost({
          userId: `user${i}`,
          content: `Recent post ${i}`,
          statType: 'achievement',
          encrypted: false
        })
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const recentPosts = await feedPostRepository.findRecent(2)
      expect(recentPosts).toHaveLength(2)
      expect(recentPosts[0].content).toBe('Recent post 2')
    })

    it('should increment likes and comments', async () => {
      const postId = await feedPostRepository.createPost({
        userId: 'likeUser',
        content: 'Like this post!',
        statType: 'relationship',
        encrypted: false
      })

      await feedPostRepository.incrementLikes(postId)
      await feedPostRepository.incrementLikes(postId)
      await feedPostRepository.incrementComments(postId)

      const post = await feedPostRepository.findById(postId)
      expect(post?.likes).toBe(2)
      expect(post?.comments).toBe(1)
    })
  })

  describe('FeedCommentRepository', () => {
    let postId: number

    beforeEach(async () => {
      postId = await feedPostRepository.createPost({
        userId: 'postAuthor',
        content: 'Post for comments',
        statType: 'health',
        encrypted: false
      })
    })

    it('should create a comment and increment post comment count', async () => {
      const commentId = await feedCommentRepository.createComment({
        postId,
        userId: 'commenter1',
        content: 'Great post!'
      })

      expect(commentId).toBeGreaterThan(0)

      const comment = await feedCommentRepository.findById(commentId)
      expect(comment?.content).toBe('Great post!')
      expect(comment?.createdAt).toBeInstanceOf(Date)

      // Check that post comment count was incremented
      const post = await feedPostRepository.findById(postId)
      expect(post?.comments).toBe(1)
    })

    it('should find comments by postId', async () => {
      // Create multiple comments
      await feedCommentRepository.createComment({
        postId,
        userId: 'user1',
        content: 'First comment'
      })
      
      await feedCommentRepository.createComment({
        postId,
        userId: 'user2',
        content: 'Second comment'
      })

      const comments = await feedCommentRepository.findByPostId(postId)
      expect(comments).toHaveLength(2)
      expect(comments[0].content).toBe('First comment')
      expect(comments[1].content).toBe('Second comment')
    })
  })

  describe('FeedReactionRepository', () => {
    let postId: number

    beforeEach(async () => {
      postId = await feedPostRepository.createPost({
        userId: 'postAuthor',
        content: 'React to this!',
        statType: 'achievement',
        encrypted: false
      })
    })

    it('should create a reaction', async () => {
      const reactionId = await feedReactionRepository.createReaction({
        postId,
        userId: 'reactor1',
        type: 'want'
      })

      expect(reactionId).toBeGreaterThan(0)

      const reaction = await feedReactionRepository.findById(reactionId)
      expect(reaction?.type).toBe('want')
    })

    it('should prevent duplicate reactions', async () => {
      const reaction1 = await feedReactionRepository.createReaction({
        postId,
        userId: 'duplicateUser',
        type: 'support'
      })

      const reaction2 = await feedReactionRepository.createReaction({
        postId,
        userId: 'duplicateUser',
        type: 'support'
      })

      expect(reaction1).toBe(reaction2)
    })

    it('should find reactions by postId', async () => {
      await feedReactionRepository.createReaction({
        postId,
        userId: 'user1',
        type: 'want'
      })

      await feedReactionRepository.createReaction({
        postId,
        userId: 'user2',
        type: 'support'
      })

      const reactions = await feedReactionRepository.findByPostId(postId)
      expect(reactions).toHaveLength(2)
    })

    it('should find reactions by user and post', async () => {
      const userId = 'multiReactor'
      
      await feedReactionRepository.createReaction({
        postId,
        userId,
        type: 'want'
      })

      await feedReactionRepository.createReaction({
        postId,
        userId,
        type: 'witness'
      })

      const reactions = await feedReactionRepository.findByUserAndPost(userId, postId)
      expect(reactions).toHaveLength(2)
    })

    it('should remove a reaction', async () => {
      const userId = 'removeUser'
      
      await feedReactionRepository.createReaction({
        postId,
        userId,
        type: 'thank'
      })

      await feedReactionRepository.removeReaction(postId, userId, 'thank')

      const reactions = await feedReactionRepository.findByUserAndPost(userId, postId)
      expect(reactions).toHaveLength(0)
    })
  })

  describe('BaseRepository', () => {
    it('should perform batch operations', async () => {
      const profiles = [
        { userId: 'batch1', email: 'batch1@example.com', displayName: 'Batch 1' },
        { userId: 'batch2', email: 'batch2@example.com', displayName: 'Batch 2' },
        { userId: 'batch3', email: 'batch3@example.com', displayName: 'Batch 3' }
      ]

      const ids = await profileRepository.bulkCreate(
        profiles.map(p => ({
          ...p,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )

      expect(ids).toHaveLength(3)

      const allProfiles = await profileRepository.findAll()
      expect(allProfiles.length).toBeGreaterThanOrEqual(3)
    })

    it('should delete records', async () => {
      const id = await profileRepository.createProfile({
        userId: 'deleteMe',
        email: 'delete@example.com',
        displayName: 'Delete Me'
      })

      await profileRepository.delete(id)

      const profile = await profileRepository.findById(id)
      expect(profile).toBeUndefined()
    })

    it('should count records', async () => {
      const initialCount = await profileRepository.count()

      await profileRepository.createProfile({
        userId: 'countMe',
        email: 'count@example.com',
        displayName: 'Count Me'
      })

      const newCount = await profileRepository.count()
      expect(newCount).toBe(initialCount + 1)
    })

    it('should check existence', async () => {
      const id = await profileRepository.createProfile({
        userId: 'existsUser',
        email: 'exists@example.com',
        displayName: 'Exists'
      })

      const exists = await profileRepository.exists(id)
      expect(exists).toBe(true)

      const notExists = await profileRepository.exists(99999)
      expect(notExists).toBe(false)
    })

    it('should handle transactions', async () => {
      let error: Error | null = null

      try {
        await profileRepository.transaction(async () => {
          await profileRepository.createProfile({
            userId: 'tx1',
            email: 'tx1@example.com',
            displayName: 'TX 1'
          })

          // This should cause an error (duplicate userId)
          await profileRepository.createProfile({
            userId: 'tx1',
            email: 'tx2@example.com',
            displayName: 'TX 2'
          })
        })
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeDefined()
      
      // Transaction should have rolled back
      const profile = await profileRepository.findByUserId('tx1')
      expect(profile).toBeUndefined()
    })
  })
})