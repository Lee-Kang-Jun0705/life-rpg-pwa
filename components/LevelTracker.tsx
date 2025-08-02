'use client'

import { useEffect } from 'react'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { levelTrackingService } from '@/lib/services/level-tracking.service'

export function LevelTracker() {
  useEffect(() => {
    // 레벨 트래킹 서비스 초기화
    levelTrackingService.initialize(GAME_CONFIG.DEFAULT_USER_ID)
    
    // 레벨업 이벤트 리스너
    const handleLevelUp = (event: CustomEvent) => {
      const { oldLevel, newLevel, levelUps } = event.detail
      console.log(`레벨업 감지: ${oldLevel} → ${newLevel} (+${levelUps})`)
    }
    
    window.addEventListener('level-up', handleLevelUp as EventListener)
    
    return () => {
      window.removeEventListener('level-up', handleLevelUp as EventListener)
    }
  }, [])
  
  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}