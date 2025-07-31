'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Send, Mic, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmotion } from '@/contexts/EmotionContext'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  emotion?: string
  suggestion?: {
    type: string
    action: string
  }
}

interface ConversationalAIProps {
  emotion?: string
  onActionSuggestion?: (action: string) => void
}

export function ConversationalAI({ emotion: propEmotion, onActionSuggestion }: ConversationalAIProps) {
  const { currentEmotion, emotionIntensity, conversationHistory, addToHistory } = useEmotion()
  const activeEmotion = propEmotion || currentEmotion
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: activeEmotion 
        ? `${activeEmotion === 'happy' ? '행복해 보이시네요! 😊' : 
           activeEmotion === 'tired' ? '피곤하신가요? 😴' :
           activeEmotion === 'stressed' ? '스트레스를 받고 계시는군요. 😰' :
           activeEmotion === 'sad' ? '우울하신가요? 😢' :
           activeEmotion === 'anxious' ? '불안하신가요? 😟' :
           activeEmotion === 'excited' ? '신나시는군요! 🤗' :
           activeEmotion === 'calm' ? '평온해 보이시네요. 😌' :
           activeEmotion === 'angry' ? '화가 나셨나요? 😤' :
           '안녕하세요!'} 무엇을 도와드릴까요?`
        : '안녕하세요! 오늘 하루는 어떠셨나요?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 감정별 응답 톤 정의
  const emotionTones = useMemo(() => ({
    happy: { prefix: '좋아요! ', suffix: ' 😊', tone: 'positive' },
    sad: { prefix: '괜찮아요, ', suffix: ' 💙', tone: 'comforting' },
    angry: { prefix: '이해해요, ', suffix: ' 🌟', tone: 'calming' },
    anxious: { prefix: '걱정 마세요, ', suffix: ' 🌿', tone: 'reassuring' },
    tired: { prefix: '수고하셨어요, ', suffix: ' 🌙', tone: 'gentle' },
    excited: { prefix: '와! ', suffix: ' 🎉', tone: 'energetic' },
    stressed: { prefix: '차근차근, ', suffix: ' 🧘', tone: 'soothing' },
    calm: { prefix: '좋네요, ', suffix: ' ☁️', tone: 'peaceful' }
  }), [])

  const generateAIResponse = useCallback((userMessage: string): string => {
    // 대화 맥락 고려
    const recentContext = conversationHistory.slice(-5).map(h => h.content).join(' ')
    const lowerMessage = userMessage.toLowerCase()
    const tone = activeEmotion ? emotionTones[activeEmotion as keyof typeof emotionTones] : null
    
    if (lowerMessage.includes('피곤') || lowerMessage.includes('힘들')) {
      return '충분한 휴식이 필요하신 것 같아요. 잠시 눈을 감고 심호흡을 해보시는 건 어떨까요? 🌿'
    } else if (lowerMessage.includes('운동') || lowerMessage.includes('건강')) {
      return '건강에 관심이 있으시군요! 가벼운 스트레칭부터 시작해보는 건 어떨까요? 💪'
    } else if (lowerMessage.includes('공부') || lowerMessage.includes('학습')) {
      return '학습 목표가 있으신가요? 작은 목표부터 차근차근 달성해나가면 좋을 것 같아요! 📚'
    } else if (lowerMessage.includes('친구') || lowerMessage.includes('관계')) {
      return '인간관계는 정말 중요하죠. 오늘 소중한 사람에게 안부 인사를 전해보는 건 어떨까요? 💝'
    } else if (lowerMessage.includes('목표') || lowerMessage.includes('성취')) {
      return '목표를 향해 나아가고 계시는군요! 오늘 할 수 있는 작은 한 걸음은 무엇일까요? 🎯'
    }
    
    // 감정 상태에 따른 기본 응답
    if (activeEmotion && emotionIntensity > 7) {
      return tone ? `${tone.prefix}그런 감정이 강하게 느껴지시는군요. 함께 이야기하면서 조금씩 나아질 거예요${tone.suffix}` :
        '더 자세히 말씀해주시면 더 나은 조언을 드릴 수 있어요.'
    }
    
    return tone ? 
      `${tone.prefix}더 자세히 말씀해주시면 더 나은 조언을 드릴 수 있어요${tone.suffix}` :
      '더 자세히 말씀해주시면 더 나은 조언을 드릴 수 있어요. 어떤 부분이 가장 고민이신가요?'
  }, [activeEmotion, emotionIntensity, conversationHistory, emotionTones])

  const handleSend = useCallback(() => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      emotion: activeEmotion || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // 대화 히스토리에 추가
    addToHistory({
      id: userMessage.id,
      role: 'user',
      content: userMessage.content,
      emotion: activeEmotion,
      timestamp: userMessage.timestamp
    })

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const response = generateAIResponse(input)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      
      // AI 응답도 히스토리에 추가
      addToHistory({
        id: aiResponse.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: aiResponse.timestamp
      })
    }, 1500)
  }, [input, activeEmotion, generateAIResponse, addToHistory])

  const handleVoiceInput = useCallback(() => {
    setIsRecording(!isRecording)
    // 실제 음성 인식 구현은 Web Speech API 사용
  }, [isRecording])

  return (
    <Card className="w-full max-w-md mx-auto h-[500px] flex flex-col">
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
                <div className="flex space-x-2">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border rounded-full bg-gray-50 dark:bg-gray-900 
              focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            className={`rounded-full ${isRecording ? 'bg-red-500 text-white' : ''}`}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}