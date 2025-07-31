'use client'

import { lazy, Suspense } from 'react'

// 성능 최적화된 Equipment Screen을 사용
const EquipmentScreen = lazy(() => 
  import('@/components/equipment/EquipmentScreen').then(m => ({ default: m.EquipmentScreen }))
)

// 로딩 컴포넌트
const EquipmentLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-400">장비 정보를 불러오는 중...</p>
    </div>
  </div>
)

export function EquipmentTab() {
  return (
    <Suspense fallback={<EquipmentLoading />}>
      <EquipmentScreen />
    </Suspense>
  )
}