'use client'

import { useState, lazy, Suspense } from 'react'
import { FloatingAssistant } from '@/components/ai-coach/FloatingAssistant'
import { TabLayout } from '@/components/ai-coach/TabLayout'
import { useAICoach } from '@/lib/ai-coach/useAICoach'
import { useRouter } from 'next/navigation'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'

// Lazy loading으로 성능 최적화
const InsightsTab = lazy(() => import('@/components/ai-coach/InsightsTab').then(m => ({ default: m.InsightsTab })).catch(() => ({ default: () => <div>인사이트 탭을 로드할 수 없습니다.</div> })))
const ChatTab = lazy(() => import('@/components/ai-coach/ChatTab').then(m => ({ default: m.ChatTab })).catch(() => ({ default: () => <div>채팅 탭을 로드할 수 없습니다.</div> })))
const GoalsTab = lazy(() => import('@/components/ai-coach/GoalsTab').then(m => ({ default: m.GoalsTab })).catch(() => ({ default: () => <div>목표 탭을 로드할 수 없습니다.</div> })))
const AnalysisTab = lazy(() => import('@/components/ai-coach/AnalysisTab').then(m => ({ default: m.AnalysisTab })).catch(() => ({ default: () => <div>분석 탭을 로드할 수 없습니다.</div> })))
const GrowthTab = lazy(() => import('@/components/ai-coach/GrowthTab').then(m => ({ default: m.GrowthTab })).catch(() => ({ default: () => <div>성장 탭을 로드할 수 없습니다.</div> })))
const AdviceTab = lazy(() => import('@/components/ai-coach/AdviceTab').then(m => ({ default: m.AdviceTab })).catch(() => ({ default: () => <div>조언 탭을 로드할 수 없습니다.</div> })))
const ActivityAnalysisTab = lazy(() => import('@/components/ai-coach/ActivityAnalysisTab').then(m => ({ default: m.ActivityAnalysisTab })).catch(() => ({ default: () => <div>활동 분석 탭을 로드할 수 없습니다.</div> })))

// 로딩 컴포넌트
const TabLoading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-4 border-candy-blue border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
    </div>
  </div>
)

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState('insights')
  const router = useRouter()
  const {
    userStats,
    growthData,
    growthAnalyses,
    activityPattern,
    personalizedAdvice,
    isLoading,
    error
  } = useAICoach()

  // 탭 정의
  const tabs = [
    { id: 'insights', label: '한눈에 보기', emoji: '✨' },
    { id: 'goals', label: '목표 설정', emoji: '🎯' },
    { id: 'chat', label: 'AI 대화', emoji: '💬' },
    { id: 'analysis', label: '상세 분석', emoji: '📊' },
    { id: 'activity', label: '활동 분석', emoji: '📅' },
    { id: 'growth', label: '성장 추이', emoji: '📈' },
    { id: 'advice', label: '맞춤 조언', emoji: '💡' }
  ]

  // 플로팅 어시스턴트 빠른 액션 핸들러
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'record':
        router.push('/dashboard')
        break
      case 'analyze':
        setActiveTab('analysis')
        break
      case 'goal':
        setActiveTab('advice')
        break
      case 'chat':
        setActiveTab('chat')
        break
    }
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">🤖 AI 코치</h1>
            <p className="text-gray-600 dark:text-gray-400">
              데이터 기반 맞춤형 성장 코칭
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">AI 코치가 데이터를 분석 중입니다...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-candy-blue/10 to-candy-purple/10 py-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2">
            <span className="text-3xl">🤖</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-candy-blue to-candy-purple bg-clip-text text-transparent">
              AI 코치
            </h1>
          </div>
        </div>
      </div>

      {/* 탭 레이아웃 */}
      <TabLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <SectionErrorBoundary sectionName="인사이트 탭">
          <Suspense fallback={<TabLoading />}>
            <InsightsTab
              userStats={userStats}
              growthAnalyses={growthAnalyses}
              activityPattern={activityPattern}
              personalizedAdvice={personalizedAdvice}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="목표 탭">
          <Suspense fallback={<TabLoading />}>
            <GoalsTab />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="채팅 탭">
          <Suspense fallback={<TabLoading />}>
            <ChatTab
              userStats={userStats}
              growthAnalyses={growthAnalyses}
              activityPattern={activityPattern}
              personalizedAdvice={personalizedAdvice}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="분석 탭">
          <Suspense fallback={<TabLoading />}>
            <AnalysisTab
              userStats={userStats}
              activityPattern={activityPattern}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="활동 분석 탭">
          <Suspense fallback={<TabLoading />}>
            <ActivityAnalysisTab
              userStats={userStats}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="성장 탭">
          <Suspense fallback={<TabLoading />}>
            <GrowthTab
              growthData={growthData}
              growthAnalyses={growthAnalyses}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="조언 탭">
          <Suspense fallback={<TabLoading />}>
            <AdviceTab personalizedAdvice={personalizedAdvice} />
          </Suspense>
        </SectionErrorBoundary>
      </TabLayout>

      {/* 플로팅 AI 어시스턴트 */}
      <FloatingAssistant onQuickAction={handleQuickAction} />
    </>
  )
}
