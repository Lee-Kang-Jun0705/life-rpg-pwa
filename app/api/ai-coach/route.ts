import { NextRequest, NextResponse } from 'next/server'
import { Stat } from '@/lib/types/dashboard'
import { GrowthAnalysis, ActivityPattern } from '@/lib/types/ai-coach'
import { AIMessage } from '@/types/ai'

// API 제공자 타입
type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'custom'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  endpoint?: string
}

// 환경변수에서 API 설정 읽기
function getAIConfig(): AIConfig | null {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER as AIProvider
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY
  
  if (!provider || !apiKey) {
    return null
  }

  const configs: Record<AIProvider, Partial<AIConfig>> = {
    openai: {
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-3.5-turbo',
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'claude-3-sonnet-20240229',
      endpoint: 'https://api.anthropic.com/v1/messages'
    },
    google: {
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-pro',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    groq: {
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'mixtral-8x7b-32768',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions'
    },
    custom: {
      model: process.env.NEXT_PUBLIC_AI_MODEL || '',
      endpoint: process.env.NEXT_PUBLIC_AI_ENDPOINT || ''
    }
  }

  return {
    provider,
    apiKey,
    ...configs[provider]
  } as AIConfig
}

export async function POST(request: NextRequest) {
  try {
    const { message, stats, growthAnalyses, activityPattern } = await request.json() as {
      message: string
      stats: Stat[]
      growthAnalyses: GrowthAnalysis[]
      activityPattern: ActivityPattern
    }
    
    const config = getAIConfig()
    
    // API 설정이 없으면 규칙 기반 응답
    if (!config) {
      return NextResponse.json({
        response: generateRuleBasedResponse(message),
        provider: 'rule-based'
      })
    }

    const systemPrompt = `당신은 Life RPG 앱의 개인 성장 AI 코치입니다. 
    사용자의 활동 데이터를 분석하여 구체적이고 실행 가능한 조언을 제공하세요.
    응답은 친근하고 격려하는 톤으로, 이모지를 적절히 사용하세요.`

    const userContext = `
    현재 사용자 상태:
    - 총 레벨: ${stats.reduce((sum, s) => sum + (s.level || 1), 0)}
    - 스탯별 레벨: ${stats.map(s => `${s.type} Lv.${s.level}`).join(', ')}
    - 활동 패턴: 일평균 ${activityPattern?.averageActivitiesPerDay.toFixed(1)}회, 연속 ${activityPattern?.streakDays}일
    - 성장 추세: ${growthAnalyses.map(g => `${g.statType}: ${g.trend}`).join(', ')}
    
    사용자 질문: ${message}
    `

    const messages: AIMessage[] = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContext }
    ]

    let aiResponse: string

    // 제공자별 API 호출
    switch (config.provider) {
      case 'openai':
        aiResponse = await callOpenAI(config, messages)
        break
      case 'anthropic':
        aiResponse = await callAnthropic(config, messages)
        break
      case 'google':
        aiResponse = await callGoogle(config, messages)
        break
      case 'groq':
        aiResponse = await callGroq(config, messages)
        break
      case 'custom':
        aiResponse = await callCustomAPI(config, messages)
        break
      default:
        aiResponse = generateRuleBasedResponse(message)
    }

    return NextResponse.json({ 
      response: aiResponse,
      provider: config.provider,
      model: config.model 
    })
  } catch (error) {
    console.error('AI Coach API error:', error)
    
    // 에러 발생시 규칙 기반 폴백
    return NextResponse.json({
      response: generateRuleBasedResponse(''),
      provider: 'rule-based',
      error: true
    })
  }
}

// 각 제공자별 API 호출 함수
async function callOpenAI(config: AIConfig, messages: AIMessage[]) {
  const response = await fetch(config.endpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
  })

  const data = await response.json()
  return data.choices[0].message.content
}

async function callAnthropic(config: AIConfig, messages: AIMessage[]) {
  const response = await fetch(config.endpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || '',
      max_tokens: 500
    })
  })

  const data = await response.json()
  return data.content[0].text
}

async function callGoogle(config: AIConfig, messages: AIMessage[]) {
  const endpoint = `${config.endpoint}/${config.model}:generateContent?key=${config.apiKey}`
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    })
  })

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

async function callGroq(config: AIConfig, messages: AIMessage[]) {
  // Groq는 OpenAI 호환 API
  return callOpenAI(config, messages)
}

async function callCustomAPI(config: AIConfig, messages: AIMessage[]) {
  const response = await fetch(config.endpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      // 사용자가 정의한 추가 파라미터
      ...JSON.parse(process.env.NEXT_PUBLIC_AI_CUSTOM_PARAMS || '{}')
    })
  })

  const data = await response.json()
  // 응답 구조는 사용자 정의 API에 따라 다를 수 있음
  return data.response || data.choices?.[0]?.message?.content || data.content
}

// 규칙 기반 응답 생성
function generateRuleBasedResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // 감정 관련
  if (lowerMessage.includes('피곤') || lowerMessage.includes('힘들')) {
    return '피곤하시군요. 😔 충분한 휴식도 중요한 성장의 일부예요!\n\n💡 추천 활동:\n• 10분 명상하기 (🧘 건강 +10 EXP)\n• 좋아하는 음악 듣기 (🎵 건강 +5 EXP)\n• 일찍 잠들기 (😴 건강 +15 EXP)'
  }
  
  if (lowerMessage.includes('행복') || lowerMessage.includes('기뻐')) {
    return '행복하신 모습이 보기 좋네요! 😊\n\n이런 긍정적인 에너지를 활용해보는 건 어떨까요?\n• 감사 일기 쓰기 (📝 학습 +10 EXP)\n• 친구와 기쁨 나누기 (💬 관계 +15 EXP)\n• 새로운 도전하기 (🎯 성취 +20 EXP)'
  }

  // 활동 관련
  if (lowerMessage.includes('운동')) {
    return '운동을 하셨군요! 💪 훌륭해요!\n\n🏃 건강 스탯이 성장했어요! (+20 EXP)\n\n추가로 이런 활동도 좋을 것 같아요:\n• 운동 후 스트레칭 (건강 +5 EXP)\n• 운동 기록 작성 (학습 +10 EXP)\n• 운동 사진 공유 (관계 +10 EXP)'
  }

  // 기본 응답
  return '더 자세히 말씀해주시면 더 나은 조언을 드릴 수 있어요! 😊\n\n예를 들어:\n• "오늘 운동을 30분 했어요"\n• "공부가 잘 안돼요"\n• "친구와 시간을 보냈어요"\n\n어떤 이야기든 편하게 나눠주세요!'
}