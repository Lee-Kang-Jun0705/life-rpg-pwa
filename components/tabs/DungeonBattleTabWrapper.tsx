'use client'

import dynamic from 'next/dynamic'
import { useFeatureFlag } from '@/lib/feature-flags/FeatureFlagProvider'
import { createComponentSafeGuard } from '@/lib/refactoring/safe-guard'

// 동적 임포트로 코드 분할
const DungeonBattleTab = dynamic(() => import('./DungeonBattleTab').then(mod => ({ default: mod.DungeonBattleTab })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">로딩 중...</div>
})

const DungeonBattleTabV2 = dynamic(() => import('./DungeonBattleTabV2').then(mod => ({ default: mod.DungeonBattleTabV2 })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">로딩 중...</div>
})

/**
 * DungeonBattleTab 래퍼 컴포넌트
 * Feature Flag를 통해 기존 버전과 새 버전을 안전하게 전환
 */
export function DungeonBattleTabWrapper() {
  const { isEnabled } = useFeatureFlag()
  const useNewVersion = isEnabled('use-new-dungeon-ui')
  
  // Safe Guard 패턴 적용
  const SafeDungeonBattleTab = createComponentSafeGuard(
    DungeonBattleTabV2,
    DungeonBattleTab,
    'use-new-dungeon-ui'
  )
  
  // Feature Flag 디버그 정보 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[DungeonBattleTabWrapper] Feature Flag 상태:', {
      flagKey: 'use-new-dungeon-ui',
      isEnabled: useNewVersion,
      component: useNewVersion ? 'DungeonBattleTabV2' : 'DungeonBattleTab'
    })
  }
  
  return <SafeDungeonBattleTab />
}