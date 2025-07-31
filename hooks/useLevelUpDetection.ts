import { useState, useCallback } from 'react'
import { Stat } from '@/lib/types/dashboard'
import { useToast, toastHelpers } from '@/components/ui/Toast'

interface LevelUpData {
  show: boolean
  level: number
  statType: string
}

export function useLevelUpDetection(stats: Stat[]) {
  const [levelUpData, setLevelUpData] = useState<LevelUpData>({ 
    show: false, 
    level: 1,
    statType: ''
  })
  const { toast } = useToast()

  const detectLevelUp = useCallback((
    statType: string, 
    beforeAction: () => Promise<void>
  ) => {
    return async () => {
      const currentStat = stats.find(s => s.type === statType)
      const currentLevel = currentStat?.level || 1
      
      // 원래 액션 실행
      await beforeAction()
      
      // 레벨업 체크 (100 EXP마다 레벨업)
      setTimeout(() => {
        const updatedStat = stats.find(s => s.type === statType)
        const newLevel = updatedStat?.level || 1
        
        if (newLevel > currentLevel) {
          setLevelUpData({
            show: true,
            level: newLevel,
            statType
          })
          
          // Toast 알림
          const statNames = {
            health: '건강',
            learning: '학습',
            relationship: '관계',
            achievement: '성취'
          }
          
          toast(toastHelpers.success(
            '레벨 업!',
            `${statNames[statType as keyof typeof statNames] || statType} 레벨이 ${newLevel}로 상승했습니다!`,
            { 
              duration: 5000,
              action: {
                label: '상세 보기',
                onClick: () => {
                  // 스탯 상세 페이지로 이동 또는 모달 열기
                  console.log('Navigate to stat details')
                }
              }
            }
          ))
        }
      }, 500) // 상태 업데이트를 위한 약간의 지연
    }
  }, [stats, toast])

  const clearLevelUpAnimation = useCallback(() => {
    setLevelUpData(prev => ({ ...prev, show: false }))
  }, [])

  return {
    levelUpData,
    detectLevelUp,
    clearLevelUpAnimation
  }
}