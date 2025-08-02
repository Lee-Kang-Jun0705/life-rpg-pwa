import { Activity } from '../types'
import { LightModeData, ProModeData, PersonalizationMode } from './types'
import { PersonalizationService } from './personalization-service'
import { db } from '../database'

export class AdaptiveDataCollector {
  private static instance: AdaptiveDataCollector
  private personalizationService: PersonalizationService

  private constructor() {
    this.personalizationService = PersonalizationService.getInstance()
  }

  static getInstance(): AdaptiveDataCollector {
    if (!AdaptiveDataCollector.instance) {
      AdaptiveDataCollector.instance = new AdaptiveDataCollector()
    }
    return AdaptiveDataCollector.instance
  }

  /**
   * 활동 데이터 수집 (모드에 따라 다른 수준)
   */
  async collectActivityData(
    userId: string,
    activity: Activity,
    additionalData?: Record<string, unknown>
  ): Promise<LightModeData | ProModeData> {
    const settings = await this.personalizationService.getSettings(userId)

    if (settings.mode === 'light') {
      return this.collectLightModeData(activity)
    } else {
      return this.collectProModeData(activity, additionalData)
    }
  }

  /**
   * 라이트 모드 데이터 수집 - 최소한의 정보만
   */
  private collectLightModeData(activity: Activity): LightModeData {
    const timestamp = new Date(activity.timestamp)

    return {
      timestamp,
      type: activity.statType,
      quality: activity.quality,
      completed: true, // Activity 인터페이스에 없으면 기본값
      context: {
        hour: timestamp.getHours(),
        dayOfWeek: timestamp.getDay()
      }
    }
  }

  /**
   * 프로 모드 데이터 수집 - 상세 정보 포함
   */
  private collectProModeData(
    activity: Activity,
    additionalData?: Record<string, unknown>
  ): ProModeData {
    const lightData = this.collectLightModeData(activity)

    // 상세 컨텍스트 수집
    const detailedContext = {
      weather: this.getCurrentWeather(),
      previousActivity: this.getPreviousActivityType(),
      energyLevel: this.estimateEnergyLevel(),
      mood: additionalData?.mood || 'neutral',
      socialContext: additionalData?.socialContext || 'alone',
      deviceInfo: this.getDeviceInfo()
    }

    // 프로 모드 데이터
    const proData: ProModeData = {
      ...lightData,
      fullDescription: activity.description || activity.activityName,
      duration: activity.duration,
      location: activity.location,
      tags: activity.tags,
      detailedContext,
      media: additionalData?.media,
      metrics: additionalData?.metrics
    }

    return proData
  }

  /**
   * AI 상호작용 데이터 수집
   */
  async collectInteractionData(
    userId: string,
    _interaction: {
      input: string
      response: string
      helpful?: boolean
      context?: Record<string, unknown>
    }
  ): Promise<void> {
    const settings = await this.personalizationService.getSettings(userId)

    const data = settings.mode === 'light'
      ? this.collectLightInteraction(interaction)
      : this.collectProInteraction(interaction)

    // DB에 저장
    await this.saveInteractionData(userId, data)
  }

  private collectLightInteraction(_interaction: {
    input: string
    response: string
    helpful?: boolean
    context?: Record<string, unknown>
  }) {
    return {
      timestamp: new Date(),
      helpful: interaction.helpful || null,
      category: this.categorizeInteraction(interaction.input)
    }
  }

  private collectProInteraction(_interaction: {
    input: string
    response: string
    helpful?: boolean
    context?: Record<string, unknown>
  }) {
    return {
      timestamp: new Date(),
      input: interaction.input,
      response: interaction.response,
      helpful: interaction.helpful || null,
      context: interaction.context,
      sentiment: this.analyzeSentiment(interaction.input),
      topics: this.extractTopics(interaction.input),
      responseLength: interaction.response.length,
      responseTime: interaction.context?.responseTime || null
    }
  }

  /**
   * 헬퍼 메서드들
   */
  private getCurrentWeather(): string {
    // 실제로는 날씨 API를 호출하거나 브라우저 API 사용
    // 여기서는 간단히 구현
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy']
    return conditions[Math.floor(Math.random() * conditions.length)]
  }

  private getPreviousActivityType(): string {
    // 실제로는 DB에서 이전 활동 조회
    return 'unknown'
  }

  private estimateEnergyLevel(): number {
    // 시간대와 최근 활동을 기반으로 에너지 레벨 추정
    const hour = new Date().getHours()
    if (hour >= 6 && hour <= 10) {
      return 8
    }
    if (hour >= 11 && hour <= 14) {
      return 6
    }
    if (hour >= 15 && hour <= 18) {
      return 7
    }
    if (hour >= 19 && hour <= 22) {
      return 5
    }
    return 3
  }

  private getDeviceInfo(): string {
    return navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
  }

  private categorizeInteraction(input: string): string {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('운동') || lowerInput.includes('exercise')) {
      return 'fitness'
    }
    if (lowerInput.includes('공부') || lowerInput.includes('study')) {
      return 'learning'
    }
    if (lowerInput.includes('식단') || lowerInput.includes('diet')) {
      return 'nutrition'
    }

    return 'general'
  }

  private analyzeSentiment(_text: string): string {
    // 간단한 감정 분석 (실제로는 더 정교한 분석 필요)
    const positiveWords = ['좋', '잘', '성공', '행복', '기쁨']
    const negativeWords = ['힘들', '실패', '어려', '피곤', '스트레스']

    let score = 0
    positiveWords.forEach(word => {
      if (text.includes(word)) {
        score++
      }
    })
    negativeWords.forEach(word => {
      if (text.includes(word)) {
        score--
      }
    })

    if (score > 0) {
      return 'positive'
    }
    if (score < 0) {
      return 'negative'
    }
    return 'neutral'
  }

  private extractTopics(_text: string): string[] {
    // 간단한 토픽 추출
    const topics = []
    const topicKeywords = {
      health: ['건강', '운동', '체력', 'health', 'exercise'],
      learning: ['공부', '학습', '독서', 'study', 'learn'],
      relationship: ['관계', '친구', '가족', 'friend', 'family'],
      achievement: ['성취', '목표', '달성', 'goal', 'achieve']
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic)
      }
    }

    return topics
  }

  private async saveInteractionData(userId: string, _data: Record<string, unknown>): Promise<void> {
    // DB에 상호작용 데이터 저장
    const key = `ai_interaction_${userId}_${Date.now()}`

    try {
      await db.metadata.put({
        id: Date.now(),
        key,
        _data: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to save interaction _data:', error)
    }
  }
}
