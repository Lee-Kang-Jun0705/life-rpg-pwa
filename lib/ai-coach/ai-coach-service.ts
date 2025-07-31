import { Activity, Stat } from '@/lib/types/dashboard'
import { dbHelpers } from '@/lib/database/client'
import type { GrowthAnalysis, ActivityPattern, PersonalizedAdvice, ChartDataPoint } from './types'

export class AICoachService {
  // API 키는 서버 사이드에서만 사용

  // 성장 그래프 데이터 생성
  async getGrowthChartData(userId: string, days: number = 30): Promise<ChartDataPoint[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const activities = await dbHelpers.getActivitiesByDateRange(
      userId,
      startDate,
      endDate
    )

    // 일별 경험치 합계 계산
    const dailyData = new Map<string, { [key: string]: number }>()
    
    activities.forEach((activity) => {
      const dateKey = activity.timestamp.toISOString().split('T')[0]
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          health: 0,
          learning: 0,
          relationship: 0,
          achievement: 0
        })
      }
      const dayData = dailyData.get(dateKey)!
      dayData[activity.statType] += activity.experience
    })

    // 차트 데이터 형식으로 변환
    const chartData: ChartDataPoint[] = Array.from(dailyData.entries())
      .map(([date, stats]) => {
        const health = stats.health || 0
        const learning = stats.learning || 0
        const relationship = stats.relationship || 0
        const achievement = stats.achievement || 0
        return {
          date,
          health,
          learning,
          relationship,
          achievement,
          total: health + learning + relationship + achievement
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return chartData
  }

  // 스탯별 성장 분석
  async analyzeGrowth(userId: string, stats: Stat[]): Promise<GrowthAnalysis[]> {
    const activities = await dbHelpers.getActivitiesByDateRange(
      userId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 전
      new Date()
    )

    const analyses: GrowthAnalysis[] = []

    for (const stat of stats) {
      const statActivities = activities.filter((a) => a.statType === stat.type)
      const dailyGrowth = statActivities.length > 0 
        ? statActivities.reduce((sum, a) => sum + a.experience, 0) / 30
        : 0

      // 트렌드 분석 (최근 7일 vs 이전 7일)
      const recentActivities = statActivities.filter(
        (a) => a.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
      const previousActivities = statActivities.filter(
        (a) => a.timestamp > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
             a.timestamp <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )

      const recentExp = recentActivities.reduce((sum, a) => sum + a.experience, 0)
      const previousExp = previousActivities.reduce((sum, a) => sum + a.experience, 0)
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (recentExp > previousExp * 1.2) trend = 'improving'
      else if (recentExp < previousExp * 0.8) trend = 'declining'

      // 개선 제안 생성
      const suggestions = this.generateSuggestions(stat.type, dailyGrowth, trend, statActivities)

      analyses.push({
        statType: stat.type,
        growthRate: dailyGrowth,
        trend,
        lastActivityDate: statActivities.length > 0 
          ? statActivities[statActivities.length - 1].timestamp 
          : null,
        totalActivities: statActivities.length,
        suggestions
      })
    }

    return analyses
  }

  // 활동 패턴 분석
  async analyzeActivityPatterns(userId: string): Promise<ActivityPattern> {
    const activities = await dbHelpers.getActivitiesByDateRange(
      userId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    )

    // 시간대별 활동 분석
    const hourCounts = new Array(24).fill(0)
    activities.forEach((a) => {
      const hour = a.timestamp.getHours()
      hourCounts[hour]++
    })
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

    // 요일별 활동 분석
    const dayCounts = new Array(7).fill(0)
    activities.forEach((a) => {
      const day = a.timestamp.getDay()
      dayCounts[day]++
    })
    const weakDays = ['일', '월', '화', '수', '목', '금', '토']
      .filter((_, index) => dayCounts[index] < 2)

    // 연속 활동 일수 계산
    const activeDays = new Set(
      activities.map((a) => a.timestamp.toISOString().split('T')[0])
    )
    let streak = 0
    let currentDate = new Date()
    while (activeDays.has(currentDate.toISOString().split('T')[0])) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    // 가장 빈번한 활동
    const activityCounts = new Map<string, number>()
    activities.forEach((a) => {
      const count = activityCounts.get(a.activityName) || 0
      activityCounts.set(a.activityName, count + 1)
    })
    const mostFrequent = Array.from(activityCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '활동 없음'

    return {
      mostActiveTime: `${mostActiveHour}시~${mostActiveHour + 1}시`,
      averageActivitiesPerDay: activities.length / 30,
      streakDays: streak,
      mostFrequentActivity: mostFrequent,
      weakDays
    }
  }

  // AI를 통한 맞춤형 조언 생성
  async generatePersonalizedAdvice(
    userId: string,
    stats: Stat[],
    growthAnalyses: GrowthAnalysis[],
    activityPattern: ActivityPattern
  ): Promise<PersonalizedAdvice[]> {
    const advice: PersonalizedAdvice[] = []

    // 강점 분석
    const strongestStat = stats.reduce((max, stat) => 
      (stat.level || 1) > (max.level || 1) ? stat : max
    )
    advice.push({
      type: 'strength',
      title: `${this.getStatName(strongestStat.type)} 분야의 강점을 활용하세요`,
      description: `현재 가장 높은 레벨인 ${this.getStatName(strongestStat.type)} 분야에서 탁월한 성과를 보이고 있습니다.`,
      actionItems: [
        '이 분야의 전문성을 더욱 깊이있게 발전시켜보세요',
        '다른 사람들과 지식을 공유하며 멘토 역할을 해보세요',
        '더 도전적인 목표를 설정해보세요'
      ],
      priority: 'medium'
    })

    // 약점 분석
    const weakestStat = stats.reduce((min, stat) => 
      (stat.level || 1) < (min.level || 1) ? stat : min
    )
    const weakAnalysis = growthAnalyses.find(a => a.statType === weakestStat.type)
    if (weakAnalysis && weakAnalysis.growthRate < 10) {
      advice.push({
        type: 'weakness',
        title: `${this.getStatName(weakestStat.type)} 분야에 더 집중이 필요해요`,
        description: `${this.getStatName(weakestStat.type)} 분야의 성장이 더딘 편입니다. 균형잡힌 성장을 위해 이 부분에 주목해주세요.`,
        actionItems: weakAnalysis.suggestions,
        priority: 'high'
      })
    }

    // 습관 형성 조언
    if (activityPattern.streakDays >= 7) {
      advice.push({
        type: 'habit',
        title: `${activityPattern.streakDays}일 연속 활동 중! 훌륭해요`,
        description: '꾸준한 습관이 형성되고 있습니다. 이 모멘텀을 유지하세요.',
        actionItems: [
          '같은 시간대에 활동하여 루틴을 강화하세요',
          '활동 강도를 조금씩 높여보세요',
          '성취를 기록하고 자신에게 보상을 주세요'
        ],
        priority: 'medium'
      })
    } else {
      advice.push({
        type: 'habit',
        title: '일관된 활동 패턴을 만들어보세요',
        description: `현재 ${activityPattern.streakDays}일 연속 활동 중입니다. 매일 작은 활동이라도 꾸준히 해보세요.`,
        actionItems: [
          `매일 ${activityPattern.mostActiveTime}에 활동 알림을 설정하세요`,
          '하루 최소 1개의 작은 목표를 설정하세요',
          `${activityPattern.weakDays.join(', ')}요일에 특히 신경써주세요`
        ],
        priority: 'high'
      })
    }

    // 서버 API를 통한 추가 조언 (필요시 활성화)
    // const aiAdvice = await this.getAIAdviceFromServer(stats, growthAnalyses, activityPattern)
    // advice.push(...aiAdvice)

    return advice
  }

  // OpenAI API 호출 (실제 구현)
  private async getAIAdvice(
    stats: Stat[],
    growthAnalyses: GrowthAnalysis[],
    activityPattern: ActivityPattern
  ): Promise<PersonalizedAdvice[]> {
    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: '당신은 개인 성장을 돕는 전문 라이프 코치입니다. 사용자의 활동 데이터를 분석하여 구체적이고 실행 가능한 조언을 제공하세요.'
            },
            {
              role: 'user',
              content: `
                사용자 현황:
                - 총 레벨: ${stats.reduce((sum, s) => sum + (s.level || 1), 0)}
                - 일일 평균 활동: ${activityPattern.averageActivitiesPerDay.toFixed(1)}회
                - 연속 활동일: ${activityPattern.streakDays}일
                - 주요 활동 시간: ${activityPattern.mostActiveTime}
                
                성장 분석:
                ${growthAnalyses.map(a => `- ${this.getStatName(a.statType)}: ${a.trend === 'improving' ? '상승' : a.trend === 'declining' ? '하락' : '정체'} 추세`).join('\n')}
                
                이 데이터를 바탕으로 3가지 구체적인 성장 조언을 제공해주세요.
              `
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error('AI API 호출 실패')
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      // AI 응답을 PersonalizedAdvice 형식으로 파싱
      return this.parseAIResponse(aiResponse)
    } catch (error) {
      console.error('AI 조언 생성 실패:', error)
      return []
    }
  }

  private parseAIResponse(response: string): PersonalizedAdvice[] {
    // AI 응답을 구조화된 조언으로 변환하는 로직
    // 실제 구현 시 더 정교한 파싱 필요
    return []
  }

  private generateSuggestions(
    statType: string,
    growthRate: number,
    trend: 'improving' | 'stable' | 'declining',
    activities: Activity[]
  ): string[] {
    const suggestions: string[] = []

    if (growthRate < 5) {
      suggestions.push(`매일 ${this.getStatName(statType)} 관련 작은 활동을 1개씩 해보세요`)
    }

    if (trend === 'declining') {
      suggestions.push('최근 활동이 줄었네요. 작은 목표부터 다시 시작해보세요')
    }

    if (activities.length === 0) {
      suggestions.push(`${this.getStatName(statType)} 활동을 시작해보세요. 첫 걸음이 가장 중요해요!`)
    }

    // 스탯별 구체적 제안
    switch (statType) {
      case 'health':
        suggestions.push('매일 10분 산책부터 시작해보세요')
        if (growthRate < 10) suggestions.push('물 마시기 알림을 설정해보세요')
        break
      case 'learning':
        suggestions.push('하루 10페이지 독서 습관을 만들어보세요')
        if (trend === 'stable') suggestions.push('새로운 분야의 강의를 들어보세요')
        break
      case 'relationship':
        suggestions.push('하루 1명에게 안부 메시지를 보내보세요')
        break
      case 'achievement':
        suggestions.push('매일 할 일 목록을 작성하고 체크해보세요')
        break
    }

    return suggestions
  }

  private getStatName(statType: string): string {
    const names: { [key: string]: string } = {
      health: '건강',
      learning: '학습',
      relationship: '관계',
      achievement: '성취'
    }
    return names[statType] || statType
  }
}