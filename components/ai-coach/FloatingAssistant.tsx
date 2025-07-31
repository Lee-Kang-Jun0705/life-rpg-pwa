'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, Send, Sparkles } from 'lucide-react'
import type { QuickActionType, QuickAction } from '@/lib/ai-coach/types/actions'

interface FloatingAssistantProps {
  onQuickAction?: (action: QuickActionType) => void
}

export function FloatingAssistant({ onQuickAction }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mounted, setMounted] = useState(false)
  const assistantRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // 시간대별 인사말
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '☀️ 좋은 아침이에요!'
    if (hour < 18) return '🌤️ 오후도 힘차게!'
    return '🌙 오늘 하루 어떠셨나요?'
  }

  // 빠른 액션 제안
  const quickActions: QuickAction[] = [
    { id: 'record', label: '활동 기록하기', emoji: '✏️' },
    { id: 'analyze', label: '오늘 분석 보기', emoji: '📊' },
    { id: 'goal', label: '목표 확인하기', emoji: '🎯' },
    { id: 'chat', label: 'AI 코치와 대화', emoji: '💬' }
  ]

  const handleQuickAction = (actionId: QuickActionType) => {
    if (onQuickAction) {
      onQuickAction(actionId)
    }
    setIsOpen(false)
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    setIsTyping(true)
    // 실제 메시지 처리 로직
    setTimeout(() => {
      setIsTyping(false)
      setMessage('')
    }, 1500)
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* 플로팅 버튼 */}
      <div
        className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-candy-blue to-candy-purple shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-candy-blue/50"
          aria-label="AI 코치 열기"
          aria-expanded={isOpen}
          aria-controls="floating-assistant-dialog"
        >
          <span className="text-2xl animate-pulse" aria-hidden="true">🤖</span>
        </Button>
        
        {/* 툴팁 - 스크린 리더 사용자를 위한 개선 */}
        {!isOpen && (
          <div 
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity"
            role="tooltip"
            aria-hidden="true"
          >
            AI 코치와 대화하기
          </div>
        )}
      </div>

      {/* 확장된 어시스턴트 */}
      {isOpen && (
        <div
          ref={assistantRef}
          id="floating-assistant-dialog"
          role="dialog"
          aria-label="AI 코치 대화창"
          aria-modal="true"
          className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 transition-all duration-300 ${
            isMinimized ? 'w-80' : 'w-96'
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false)
            }
          }}
        >
          <Card className="shadow-2xl overflow-hidden animate-bounce-in">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-candy-blue to-candy-purple text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-float">🤖</span>
                <div>
                  <h3 className="font-bold">AI 코치</h3>
                  <p className="text-xs opacity-90">{getGreeting()}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 빠른 액션 */}
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-candy-yellow" />
                무엇을 도와드릴까요?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.id)}
                    className="justify-start gap-2 hover:bg-gradient-to-r hover:from-candy-blue/10 hover:to-candy-purple/10 hover:border-candy-blue transition-all"
                  >
                    <span className="text-lg">{action.emoji}</span>
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* 채팅 입력 */}
            <div className="border-t p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="질문이나 목표를 입력하세요..."
                  className="flex-1 px-3 py-2 text-sm rounded-full border-0 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-candy-blue"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="rounded-full bg-gradient-to-r from-candy-blue to-candy-purple"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {isTyping && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  AI 코치가 답변 중...
                </div>
              )}
            </div>

            {/* 미니 상태 표시 */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t">
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                <span>오늘의 활동: 3회</span>
                <span className="text-candy-orange font-semibold">🔥 7일 연속!</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>,
    document.body
  )
}