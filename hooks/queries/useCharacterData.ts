import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dbHelpers } from '@/lib/database/client'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { EquipmentStatsService } from '@/lib/services/equipment-stats.service'
import { calculateCombatPower, calculateBaseCombatPower } from '@/lib/utils/combat-power'
import { useUserStore } from '@/lib/stores/userStore'
import { useEffect } from 'react'

interface CharacterData {
  profile: {
    name: string
    email: string
  } | null
  level: number
  combatPower: number
}

export function useCharacterData(userId: string) {
  const queryClient = useQueryClient()
  
  const query = useQuery<CharacterData>({
    queryKey: ['character', userId],
    queryFn: async () => {
      // Promise.allSettled로 부분 실패 허용
      const results = await Promise.allSettled([
        dbHelpers.getProfile(userId),
        dbHelpers.getStats(userId)
      ])

      let profile = null
      let level = 0
      let combatPower = 0

      // 프로필 처리
      if (results[0].status === 'fulfilled' && results[0].value) {
        profile = results[0].value
      }

      // 스탯 처리
      if (results[1].status === 'fulfilled' && results[1].value && results[1].value.length > 0) {
        const stats = results[1].value
        level = calculateCharacterLevel(stats)
        
        // 장비 스탯 포함한 전투력 계산
        try {
          const equipmentStats = EquipmentStatsService.calculateEquipmentStats(userId)
          combatPower = calculateCombatPower(level, equipmentStats)
        } catch (equipError) {
          // 장비 스탯 없이 기본 전투력만 계산
          combatPower = calculateBaseCombatPower(level)
        }
      }

      return {
        profile: profile ? { name: profile.name, email: profile.email } : null,
        level,
        combatPower
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })

  // 유저 레벨 동기화
  useEffect(() => {
    if (query.data && query.data.level > 0) {
      useUserStore.getState().updateUser({ level: query.data.level })
    }
  }, [query.data])

  // 이벤트 리스너로 데이터 갱신
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['character', userId] })
    }

    const events = [
      'profile-updated',
      'equipment-changed',
      'stats-updated',
      'activity-added'
    ]

    events.forEach(event => {
      window.addEventListener(event, handleUpdate)
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUpdate)
      })
    }
  }, [userId, queryClient])

  return query
}