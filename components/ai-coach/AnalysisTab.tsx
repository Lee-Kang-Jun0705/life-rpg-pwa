import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ActivityPattern } from '@/lib/ai-coach/types'
import { Stat } from '@/lib/types/dashboard'
import { SimpleStatDisplay } from './SimpleStatDisplay'

interface AnalysisTabProps {
  userStats: Stat[]
  activityPattern: ActivityPattern | null
}

export function AnalysisTab({ userStats, activityPattern }: AnalysisTabProps) {
  return (
    <div className="space-y-6">
      {/* 스탯 레벨 표시 - 새로운 디자인 */}
      <SimpleStatDisplay userStats={userStats} />

      {/* 활동 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 패턴 분석</CardTitle>
        </CardHeader>
        <CardContent>
          {activityPattern ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-candy-blue/30 to-candy-blue/10 rounded-[1.5rem] shadow-soft min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-sm font-semibold">활발한 시간</div>
                <div className="text-base font-bold text-candy-blue">{activityPattern.mostActiveTime}</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-candy-green/30 to-candy-green/10 rounded-[1.5rem] shadow-soft min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-sm font-semibold">일일 평균</div>
                <div className="text-base font-bold text-candy-green">{activityPattern.averageActivitiesPerDay.toFixed(1)}회</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-candy-purple/30 to-candy-purple/10 rounded-[1.5rem] shadow-soft min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-sm font-semibold">연속 일수</div>
                <div className="text-base font-bold text-candy-purple">{activityPattern.streakDays}일</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-candy-orange/30 to-candy-orange/10 rounded-[1.5rem] shadow-soft min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-sm font-semibold">주요 활동</div>
                <div className="text-base font-bold text-candy-orange">{activityPattern.mostFrequentActivity}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              활동 데이터를 수집 중입니다...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 약한 요일 분석 */}
      {activityPattern && activityPattern.weakDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>개선이 필요한 요일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activityPattern.weakDays.map(day => (
                <span
                  key={day}
                  className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-sm"
                >
                  {day}요일
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              이 요일들에는 활동이 적은 편이에요. 작은 목표라도 설정해보세요!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
