'use client'

import React from 'react'
import { SaveManagement } from '@/components/SaveManagement'
import { GameLayout } from '@/components/GameLayout'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Settings } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <GameLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                data-testid="close-settings"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-8 h-8 text-purple-500" />
                설정
              </h1>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 space-y-6">
            {/* 개인화 설정 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">AI 코치 개인화</h2>
              <p className="text-gray-400 mb-4">
                AI 코치의 개인화 수준을 선택하여 더 나은 경험을 만들어보세요.
              </p>
              <button
                onClick={() => router.push('/settings/personalization')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                개인화 설정
              </button>
            </div>

            {/* 저장 관리 */}
            <SaveManagement />
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
