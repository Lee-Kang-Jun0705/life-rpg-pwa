import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Message, GrowthAnalysis, ActivityPattern, PersonalizedAdvice } from '@/lib/ai-coach/types'
import { Stat } from '@/lib/types/dashboard'
import { ConversationalAI } from './ConversationalAI'
import { useEmotion } from '@/contexts/EmotionContext'
import { SecureAIStorage } from '@/lib/ai-coach/secure-storage'
import { useRouter } from 'next/navigation'
import { LockClosed } from '@/components/ui/icons'

interface ChatTabProps {
  userStats: Stat[]
  growthAnalyses: GrowthAnalysis[]
  activityPattern: ActivityPattern | null
  personalizedAdvice: PersonalizedAdvice[]
}

export function ChatTab({ userStats, growthAnalyses, activityPattern, personalizedAdvice }: ChatTabProps) {
  const { currentEmotion, conversationHistory, addToHistory } = useEmotion()
  const router = useRouter()
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 저는 당신의 성장을 도와줄 AI 코치입니다. 🌟\n\n오늘 어떤 목표를 달성하고 싶으신가요?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // API 키 확인
  useEffect(() => {
    const checkApiKey = async() => {
      const config = await SecureAIStorage.getConfig()
      setHasApiKey(!!config?.apiKey)
    }
    checkApiKey()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateCoachingResponse = useCallback(async(userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase()

    // 감정 상태 고려
    const emotionContext = currentEmotion ?
      `(사용자 감정: ${currentEmotion})` : ''

    // AI API 호출 시도
    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          stats: userStats,
          growthAnalyses,
          activityPattern
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.response
      }
    } catch (error) {
      console.error('AI API 호출 실패:', error)
    }

    // 폴백: 로컬 응답 생성
    if (message.includes('분석')) {
      const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
      const avgGrowth = growthAnalyses.length > 0
        ? growthAnalyses.reduce((sum, g) => sum + g.growthRate, 0) / growthAnalyses.length
        : 0

      return `📊 종합 분석 결과:\n\n` +
        `총 레벨: ${totalLevel}\n` +
        `일일 평균 성장률: ${avgGrowth.toFixed(1)} EXP\n` +
        `연속 활동일: ${activityPattern?.streakDays || 0}일\n` +
        `가장 활발한 시간: ${activityPattern?.mostActiveTime || '데이터 부족'}\n\n` +
        `💡 추천사항:\n` +
        personalizedAdvice.slice(0, 2).map(a => `• ${a.title}`).join('\n')
    }

    if (message.includes('추천')) {
      return '오늘의 추천 활동:\n\n' +
        personalizedAdvice
          .filter(a => a.priority === 'high')
          .slice(0, 3)
          .map(a => `🎯 ${a.title}\n${a.actionItems[0]}`)
          .join('\n\n')
    }

    // 감정별 기본 응답
    if (currentEmotion) {
      const emotionResponses: Record<string, string> = {
        happy: '행복한 기분을 유지하면서 더 성장할 수 있는 방법을 알려드릴게요! 😊',
        sad: '괜찮아요. 함께 이야기하면서 기분을 전환해봐요. 🌈',
        anxious: '불안한 마음을 차분히 다독여드릴게요. 심호흡부터 함께해요. 🌿',
        tired: '충분한 휴식도 성장의 일부예요. 무리하지 마세요. 💤',
        stressed: '스트레스를 해소할 수 있는 활동을 추천해드릴게요. 🧘',
        angry: '화가 나셨군요. 감정을 건강하게 표현하는 방법을 함께 찾아봐요. 🌟',
        excited: '에너지가 넘치시네요! 그 에너지를 활용해 목표를 달성해봐요! 🚀',
        calm: '평온한 마음으로 하루를 시작하기 좋네요. ☁️'
      }
      if (emotionResponses[currentEmotion]) {
        return emotionResponses[currentEmotion]
      }
    }

    return '구체적인 질문을 해주시면 더 정확한 조언을 드릴 수 있어요! 😊\n\n' +
      '예시:\n' +
      '• "내 성장 분석해줘"\n' +
      '• "오늘의 추천 활동"\n' +
      '• "건강 레벨 올리는 방법"'
  }, [currentEmotion, userStats, growthAnalyses, activityPattern, personalizedAdvice])

  const handleSendMessage = useCallback(async() => {
    if (!input.trim() || isLoading) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 대화 기록에 추가
    addToHistory({
      id: userMessage.id,
      role: 'user' as const,
      content: userMessage.content,
      emotion: currentEmotion,
      timestamp: userMessage.timestamp
    })

    try {
      const aiResponse = await generateCoachingResponse(userMessage.content)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }])

      // AI 응답도 기록에 추가
      addToHistory({
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('응답 생성 실패:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, generateCoachingResponse, currentEmotion, addToHistory])

  const handleActionSuggestion = (action: string) => {
    console.log('Action suggestion:', action)
    // 실제 액션 처리
  }

  // API 키 로딩 중
  if (hasApiKey === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-candy-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">확인 중...</p>
        </div>
      </div>
    )
  }

  // API 키가 없는 경우
  if (!hasApiKey) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold mb-4">AI 대화 기능 잠김</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            AI와 대화하려면 API 키 설정이 필요합니다.
            설정 페이지에서 API 키를 입력해주세요.
          </p>
          <Button
            onClick={() => router.push('/settings')}
            className="bg-gradient-to-r from-candy-blue to-candy-purple"
          >
            <LockClosed className="w-4 h-4 mr-2" />
            API 키 설정하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 간단한 버전과 고급 버전 선택 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="text-2xl">💬</span>
          AI와 대화하기
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          성장에 대한 궁금한 점을 편하게 물어보세요!
        </p>
      </div>

      {/* 새로운 대화형 AI 컴포넌트 - 감정 상태 자동 연동 */}
      <ConversationalAI
        onActionSuggestion={handleActionSuggestion}
      />

      {/* 기존 채팅 인터페이스는 숨김 */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          고급 채팅 모드
        </summary>
        <div className="mt-4">
          <Card className="h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-[2rem] animate-bounce-in ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-candy-blue to-candy-purple text-white shadow-soft'
                        : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-3 rounded-[2rem] border-0
                       bg-gray-100 dark:bg-gray-800
                       focus:outline-none focus:ring-2 focus:ring-candy-blue"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-[2rem] px-6 bg-gradient-to-r from-candy-blue to-candy-purple"
                >
                  <span className="text-xl">💬</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* 빠른 질문 */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">💬 빠른 질문</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                '오늘의 추천 활동',
                '내 성장 분석해줘',
                '약점 개선 방법',
                '습관 만들기 팁'
              ].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </>
  )
}
