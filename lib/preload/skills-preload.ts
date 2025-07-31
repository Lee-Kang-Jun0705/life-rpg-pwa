// Skills 페이지 데이터 프리로드
import { dbHelpers } from '@/lib/database/client'

export async function preloadSkillsData(userId: string) {
  if (!userId || typeof window === 'undefined') return

  try {
    // 이미 캐시가 있으면 스킵
    const cached = sessionStorage.getItem(`skills-${userId}`)
    if (cached) return

    // 백그라운드에서 데이터 프리로드
    Promise.all([
      dbHelpers.getProfile(userId),
      dbHelpers.getPlayerData('learnedSkills'),
      dbHelpers.getPlayerData('quickSlots'),
      dbHelpers.getPlayerData('skillPoints')
    ]).then(([profileData, skillsData, slotsData, pointsData]) => {
      // 캐시 저장
      sessionStorage.setItem(`skills-${userId}`, JSON.stringify({
        profile: profileData,
        learnedSkills: skillsData?.data || [],
        quickSlots: slotsData?.data || {},
        skillPoints: pointsData?.data || 0,
        timestamp: Date.now()
      }))

      console.log('✅ Skills data preloaded')
    }).catch(error => {
      console.warn('Skills preload failed:', error)
    })
  } catch (error) {
    console.warn('Skills preload error:', error)
  }
}