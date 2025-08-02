import { useState, useEffect } from 'react'
import type { GrowthAnalysis, ActivityPattern, PersonalizedAdvice } from '@/lib/ai-coach/types'
import { Stat } from '@/lib/types/dashboard'
import type { TimeOfDay, TimeTheme, StreakEffect } from '@/lib/ai-coach/types/actions'
import { WelcomeCard } from './insights/WelcomeCard'
import { InsightGrid } from './insights/InsightGrid'
import { FAQSection } from './insights/FAQSection'
import { TipsCard } from './insights/TipsCard'
import { TimelineAnalysis } from './insights/TimelineAnalysis'
import { EmotionCheckIn } from './EmotionCheckIn'
import { MagicButton } from './MagicButton'
import { motion, AnimatePresence } from 'framer-motion'

interface InsightsTabProps {
  userStats: Stat[]
  growthAnalyses: GrowthAnalysis[]
  activityPattern: ActivityPattern | null
  personalizedAdvice: PersonalizedAdvice[]
}

export function InsightsTab({ userStats, growthAnalyses, activityPattern, personalizedAdvice }: InsightsTabProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [animateProgress, setAnimateProgress] = useState(false)
  const [showEmotionCheckIn, setShowEmotionCheckIn] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<{ emotion: string; intensity: number } | null>(null)
  const [showMagicButton, setShowMagicButton] = useState(false)

  // 시간대 감지 및 감정 체크인 확인
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setTimeOfDay('morning')
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay('afternoon')
    } else if (hour >= 18 && hour < 22) {
      setTimeOfDay('evening')
    } else {
      setTimeOfDay('night')
    }

    // 진행률 애니메이션 트리거
    setAnimateProgress(true)

    // 감정 체크인 필요 여부 확인
    const lastCheckIn = localStorage.getItem('lastEmotionCheckIn')
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60)

      // 4시간이 지났거나 날짜가 바뀌었으면 다시 표시
      if (hoursDiff >= 4 || now.toDateString() !== lastCheckInDate.toDateString()) {
        setShowEmotionCheckIn(true)
      }
    } else {
      // 첫 방문자는 감정 체크인 표시
      setShowEmotionCheckIn(true)
    }
  }, [])

  // 총 레벨과 경험치 계산
  const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
  const totalExp = userStats.reduce((sum, stat) => sum + (stat.experience || 0), 0)

  // 다음 레벨까지 필요한 경험치 (레벨당 100 exp 기준)
  const currentLevelExp = totalExp % 100
  const nextLevelExp = 100
  const progressPercentage = (currentLevelExp / nextLevelExp) * 100

  // 가장 높은/낮은 스탯 찾기
  const highestStat = userStats.reduce((max, stat) =>
    (stat.level || 0) > (max.level || 0) ? stat : max
  )
  const lowestStat = userStats.reduce((min, stat) =>
    (stat.level || 0) < (min.level || 0) ? stat : min
  )

  // 스탯 이름 변환
  const getStatName = (type: string) => {
    const names: { [key: string]: string } = {
      health: '건강',
      learning: '학습',
      relationship: '관계',
      achievement: '성취'
    }
    return names[type] || type
  }

  // 시간대별 테마와 메시지
  const timeThemes: Record<TimeOfDay, TimeTheme> = {
    morning: {
      gradient: 'from-yellow-200 to-orange-200',
      emoji: '☀️',
      message: '새로운 하루의 시작! 오늘은 어떤 성장을 이루실 건가요?'
    },
    afternoon: {
      gradient: 'from-blue-200 to-green-200',
      emoji: '🌤️',
      message: '오후도 활기차게! 잠시 휴식도 중요해요.'
    },
    evening: {
      gradient: 'from-purple-200 to-pink-200',
      emoji: '🌅',
      message: '하루를 마무리하며 오늘의 성과를 기록해보세요.'
    },
    night: {
      gradient: 'from-indigo-300 to-purple-300',
      emoji: '🌙',
      message: '오늘 하루도 수고하셨어요. 푹 쉬세요!'
    }
  }

  const currentTheme = timeThemes[timeOfDay]

  // 연속 일수에 따른 특별 효과
  const getStreakEffect = (days: number): StreakEffect => {
    if (days >= 30) {
      return { emoji: '👑', title: '레전드', color: 'text-yellow-500' }
    }
    if (days >= 14) {
      return { emoji: '💎', title: '다이아몬드', color: 'text-cyan-500' }
    }
    if (days >= 7) {
      return { emoji: '🔥', title: '불타는', color: 'text-orange-500' }
    }
    if (days >= 3) {
      return { emoji: '🌿', title: '성장하는', color: 'text-green-500' }
    }
    return { emoji: '🌱', title: '새싹', color: 'text-gray-500' }
  }

  const streakEffect = getStreakEffect(activityPattern?.streakDays || 0)

  // 감정 체크인 완료 핸들러
  const handleEmotionComplete = (emotion: string, intensity: number) => {
    setCurrentEmotion({ emotion, intensity })
    setShowEmotionCheckIn(false)
    setShowMagicButton(true)
    // 마지막 체크인 시간 저장
    localStorage.setItem('lastEmotionCheckIn', new Date().toISOString())
  }

  // 감정 체크인 건너뛰기 핸들러
  const handleEmotionSkip = () => {
    setShowEmotionCheckIn(false)
    // 건너뛴 시간도 저장하되, 더 짧은 간격(1시간)으로 다시 물어봄
    const skipTime = new Date()
    skipTime.setHours(skipTime.getHours() - 3) // 1시간 후 다시 표시되도록
    localStorage.setItem('lastEmotionCheckIn', skipTime.toISOString())
  }

  // 매직 버튼 액션 핸들러
  const handleMagicAction = (action: string) => {
    console.log('Magic action:', action)
    // 여기서 실제 액션 처리
  }

  // 인사이트 카드 데이터
  const insightCards = [
    {
      id: 'level-status',
      emoji: '🏆',
      title: '나의 현재 레벨',
      mainValue: `Lv.${totalLevel}`,
      subValue: `총 ${totalExp.toLocaleString()} EXP`,
      color: 'from-candy-yellow to-candy-orange',
      details: `평균 레벨: ${(totalLevel / 4).toFixed(1)}`
    },
    {
      id: 'streak',
      emoji: '🔥',
      title: '연속 활동',
      mainValue: `${activityPattern?.streakDays || 0}일`,
      subValue: activityPattern && activityPattern.streakDays >= 7 ? '훌륭해요! 🎉' : '꾸준히 도전해보세요!',
      color: 'from-candy-pink to-candy-red',
      details: `일일 평균: ${activityPattern?.averageActivitiesPerDay.toFixed(1) || 0}회`
    },
    {
      id: 'balance',
      emoji: '⚖️',
      title: '균형 상태',
      mainValue: highestStat.level === lowestStat.level ? '완벽한 균형!' : '불균형',
      subValue: highestStat.level === lowestStat.level
        ? '모든 스탯이 동일해요'
        : `${getStatName(highestStat.type)} Lv.${highestStat.level} vs ${getStatName(lowestStat.type)} Lv.${lowestStat.level}`,
      color: 'from-candy-blue to-candy-purple',
      details: `레벨 차이: ${(highestStat.level || 0) - (lowestStat.level || 0)}`
    },
    {
      id: 'best-time',
      emoji: '⏰',
      title: '황금 시간대',
      mainValue: activityPattern?.mostActiveTime || '데이터 부족',
      subValue: '가장 활발한 시간',
      color: 'from-candy-green to-candy-mint',
      details: activityPattern?.mostFrequentActivity
        ? `주요 활동: ${activityPattern.mostFrequentActivity}`
        : '더 많은 활동이 필요해요'
    },
    {
      id: 'weakness',
      emoji: '💪',
      title: '집중 필요 분야',
      mainValue: getStatName(lowestStat.type),
      subValue: `현재 Lv.${lowestStat.level}`,
      color: 'from-candy-purple to-candy-pink',
      details: growthAnalyses.find(g => g.statType === lowestStat.type)?.suggestions[0] || '작은 목표부터 시작해보세요'
    },
    {
      id: 'next-goal',
      emoji: '🎯',
      title: '다음 목표',
      mainValue: `총 레벨 ${Math.ceil(totalLevel / 10) * 10}`,
      subValue: `${Math.ceil(totalLevel / 10) * 10 - totalLevel}레벨 남음`,
      color: 'from-candy-orange to-candy-yellow',
      details: '하루 1레벨씩 올려보세요!'
    }
  ]

  // FAQ 데이터
  const faqs = [
    {
      q: '레벨은 어떻게 올리나요?',
      a: '각 스탯 카드를 클릭하거나 음성으로 활동을 기록하면 경험치를 얻고 레벨이 올라갑니다.'
    },
    {
      q: '하루에 몇 번 활동할 수 있나요?',
      a: '제한은 없어요! 실제로 한 활동만큼 기록하면 됩니다.'
    },
    {
      q: '연속 활동일은 어떻게 계산되나요?',
      a: '매일 최소 1개 이상의 활동을 기록하면 연속일이 늘어납니다.'
    },
    {
      q: '가장 효과적인 성장 방법은?',
      a: '4가지 스탯을 균형있게 성장시키고, 매일 꾸준히 활동을 기록하는 것이 가장 좋습니다.'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 감정 체크인 */}
      <AnimatePresence>
        {showEmotionCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <EmotionCheckIn onComplete={handleEmotionComplete} onSkip={handleEmotionSkip} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 시간대별 웰컴 메시지 */}
      <WelcomeCard
        theme={currentTheme}
        totalLevel={totalLevel}
        progressPercentage={progressPercentage}
        animateProgress={animateProgress}
        activityPattern={activityPattern}
        streakEffect={streakEffect}
      />

      {/* 한눈에 보는 인사이트 - 카드 그리드 */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl animate-wiggle">📊</span>
          한눈에 보는 나의 상태
        </h3>
        <InsightGrid cards={insightCards} />
      </div>

      {/* 과거-현재-미래 분석 */}
      <TimelineAnalysis
        userStats={userStats}
        growthAnalyses={growthAnalyses}
        activityPattern={activityPattern}
      />

      {/* 자주 묻는 질문 */}
      <FAQSection faqs={faqs} />

      {/* 오늘의 팁 */}
      <TipsCard advice={personalizedAdvice} />

      {/* Magic Button */}
      {showMagicButton && currentEmotion && (
        <div className="fixed bottom-24 right-6 z-50">
          <MagicButton
            emotion={currentEmotion.emotion}
            intensity={currentEmotion.intensity}
            onAction={handleMagicAction}
          />
        </div>
      )}
    </div>
  )
}
