import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import type { Stat } from '@/lib/types/dashboard'
import type { GrowthAnalysis, ActivityPattern } from '@/lib/ai-coach/types'
import { useEffect, useState } from 'react'

interface TimelineAnalysisProps {
  userStats: Stat[]
  growthAnalyses: GrowthAnalysis[]
  activityPattern: ActivityPattern | null
}

interface TimelinePoint {
  label: string
  value: string
  description: string
  icon: string
}

export function TimelineAnalysis({ userStats, growthAnalyses, activityPattern }: TimelineAnalysisProps) {
  const [animateTimeline, setAnimateTimeline] = useState(false)

  useEffect(() => {
    setAnimateTimeline(true)
  }, [])

  // 과거 분석 - 시작점과 성장
  const calculatePastMetrics = () => {
    const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
    const totalExp = userStats.reduce((sum, stat) => sum + (stat.experience || 0), 0)
    const avgGrowthRate = growthAnalyses.length > 0
      ? growthAnalyses.reduce((sum, g) => sum + g.growthRate, 0) / growthAnalyses.length
      : 0

    // 예상 시작 레벨 (30일 전 기준)
    const estimatedStartLevel = Math.max(4, totalLevel - Math.floor(avgGrowthRate * 30 / 100))

    return {
      startLevel: estimatedStartLevel,
      currentLevel: totalLevel,
      totalExp,
      growthRate: avgGrowthRate,
      strongestStat: userStats.reduce((max, stat) =>
        (stat.level || 0) > (max.level || 0) ? stat : max
      ),
      weakestStat: userStats.reduce((min, stat) =>
        (stat.level || 0) < (min.level || 0) ? stat : min
      )
    }
  }

  // 현재 상태 분석
  const analyzeCurrentState = () => {
    const metrics = calculatePastMetrics()
    const balance = Math.abs((metrics.strongestStat.level || 0) - (metrics.weakestStat.level || 0))
    const isBalanced = balance <= 2

    return {
      totalLevel: metrics.currentLevel,
      balance: isBalanced ? '균형잡힌' : '불균형',
      streak: activityPattern?.streakDays || 0,
      momentum: metrics.growthRate > 50 ? '상승세' : metrics.growthRate > 20 ? '안정적' : '정체',
      activeTime: activityPattern?.mostActiveTime || '데이터 부족'
    }
  }

  // 미래 예측
  const predictFuture = () => {
    const metrics = calculatePastMetrics()
    const current = analyzeCurrentState()

    // 현재 성장률 기반 예측
    const daysTo100 = Math.ceil((100 - metrics.currentLevel) / (metrics.growthRate / 100))
    const nextMilestone = Math.ceil(metrics.currentLevel / 10) * 10
    const daysToMilestone = Math.ceil((nextMilestone - metrics.currentLevel) / (metrics.growthRate / 100))

    // 개선 가능성
    const potentialGrowthRate = metrics.growthRate * (current.balance === '균형잡힌' ? 1.2 : 1.5)
    const acceleratedDaysTo100 = Math.ceil((100 - metrics.currentLevel) / (potentialGrowthRate / 100))

    return {
      nextMilestone,
      daysToMilestone,
      level100Days: daysTo100,
      acceleratedDays: acceleratedDaysTo100,
      potentialSaving: daysTo100 - acceleratedDaysTo100
    }
  }

  const past = calculatePastMetrics()
  const present = analyzeCurrentState()
  const future = predictFuture()

  const timelineData: TimelinePoint[] = [
    {
      label: '과거',
      value: `Lv.${past.startLevel} → Lv.${past.currentLevel}`,
      description: `${past.currentLevel - past.startLevel}레벨 성장 달성`,
      icon: '🌱'
    },
    {
      label: '현재',
      value: `${present.momentum} (${present.streak}일 연속)`,
      description: `${present.balance} 성장 중`,
      icon: '🌿'
    },
    {
      label: '미래',
      value: `Lv.${future.nextMilestone} (${future.daysToMilestone}일)`,
      description: `목표 달성 시 ${future.potentialSaving}일 단축 가능`,
      icon: '🌳'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          나의 성장 타임라인
        </h3>

        {/* 타임라인 비주얼 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="relative">
            {/* 타임라인 라인 */}
            <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300" />

            {/* 타임라인 포인트들 */}
            <div className="space-y-8">
              {timelineData.map((point, index) => (
                <motion.div
                  key={point.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={animateTimeline ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-start gap-4"
                >
                  {/* 포인트 */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <span className="text-2xl">{point.icon}</span>
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 pt-2">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{point.label}</h4>
                    <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {point.value}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {point.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 상세 분석 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 과거 성과 */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <span>🏆</span> 주요 성과
          </h4>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• 총 {past.totalExp.toLocaleString()} EXP 획득</li>
            <li>• 일일 평균 {past.growthRate.toFixed(1)} EXP 성장</li>
            <li>• 최고 스탯: {getStatName(past.strongestStat.type)} Lv.{past.strongestStat.level}</li>
          </ul>
        </Card>

        {/* 현재 상태 */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <span>📊</span> 현재 상태
          </h4>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• {present.balance} 성장 패턴</li>
            <li>• {present.momentum} 성장 곡선</li>
            <li>• 주 활동 시간: {present.activeTime}</li>
          </ul>
        </Card>

        {/* 미래 예측 */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <span>🚀</span> 성장 가속화
          </h4>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Lv.100까지 {future.level100Days}일 예상</li>
            <li>• 최적화 시 {future.acceleratedDays}일로 단축</li>
            <li>• {future.potentialSaving}일 절약 가능</li>
          </ul>
        </Card>
      </div>

      {/* 액션 플랜 */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span> 성장 가속화 전략
        </h4>
        <div className="space-y-2">
          {past.weakestStat.level < past.strongestStat.level - 2 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <p className="font-medium">{getStatName(past.weakestStat.type)} 집중 강화</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  가장 낮은 스탯을 올려 균형잡힌 성장 달성
                </p>
              </div>
            </div>
          )}
          {present.streak < 7 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <p className="font-medium">연속 활동 기록 늘리기</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  매일 최소 1개 활동으로 습관 형성
                </p>
              </div>
            </div>
          )}
          {past.growthRate < 50 && (
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <div>
                <p className="font-medium">활동량 증가</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  하루 3-5개 활동으로 성장률 2배 향상
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// 스탯 이름 변환 헬퍼
function getStatName(type: string): string {
  const names: Record<string, string> = {
    health: '건강',
    learning: '학습',
    relationship: '관계',
    achievement: '성취'
  }
  return names[type] || type
}
