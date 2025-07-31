'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Brain, Target, Users } from 'lucide-react'

interface MagicButtonProps {
  emotion: string
  intensity: number
  onAction: (action: string) => void
}

const EMOTION_ACTIONS: Record<string, Array<{
  id: string
  label: string
  icon: React.ReactNode
  color: string
  statType: 'health' | 'learning' | 'relationship' | 'achievement'
}>> = {
  happy: [
    { id: 'share-joy', label: '기쁨 나누기', icon: <Heart className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'relationship' },
    { id: 'creative-work', label: '창의적 활동', icon: <Brain className="w-5 h-5" />, color: 'from-purple-400 to-purple-500', statType: 'learning' },
    { id: 'exercise', label: '운동하기', icon: <Target className="w-5 h-5" />, color: 'from-green-400 to-green-500', statType: 'health' }
  ],
  excited: [
    { id: 'start-project', label: '새 프로젝트', icon: <Target className="w-5 h-5" />, color: 'from-orange-400 to-orange-500', statType: 'achievement' },
    { id: 'learn-new', label: '새로운 학습', icon: <Brain className="w-5 h-5" />, color: 'from-blue-400 to-blue-500', statType: 'learning' },
    { id: 'social-activity', label: '사교 활동', icon: <Users className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'relationship' }
  ],
  calm: [
    { id: 'meditation', label: '명상하기', icon: <Brain className="w-5 h-5" />, color: 'from-indigo-400 to-indigo-500', statType: 'health' },
    { id: 'deep-work', label: '집중 작업', icon: <Target className="w-5 h-5" />, color: 'from-blue-400 to-blue-500', statType: 'achievement' },
    { id: 'reading', label: '독서하기', icon: <Brain className="w-5 h-5" />, color: 'from-green-400 to-green-500', statType: 'learning' }
  ],
  tired: [
    { id: 'rest', label: '휴식하기', icon: <Heart className="w-5 h-5" />, color: 'from-blue-400 to-blue-500', statType: 'health' },
    { id: 'light-walk', label: '가벼운 산책', icon: <Target className="w-5 h-5" />, color: 'from-green-400 to-green-500', statType: 'health' },
    { id: 'call-friend', label: '친구와 통화', icon: <Users className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'relationship' }
  ],
  stressed: [
    { id: 'breathing', label: '호흡 운동', icon: <Heart className="w-5 h-5" />, color: 'from-cyan-400 to-cyan-500', statType: 'health' },
    { id: 'journal', label: '일기 쓰기', icon: <Brain className="w-5 h-5" />, color: 'from-purple-400 to-purple-500', statType: 'learning' },
    { id: 'talk-someone', label: '대화하기', icon: <Users className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'relationship' }
  ],
  sad: [
    { id: 'self-care', label: '셀프케어', icon: <Heart className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'health' },
    { id: 'creative-express', label: '창작 활동', icon: <Brain className="w-5 h-5" />, color: 'from-purple-400 to-purple-500', statType: 'learning' },
    { id: 'reach-out', label: '연락하기', icon: <Users className="w-5 h-5" />, color: 'from-blue-400 to-blue-500', statType: 'relationship' }
  ],
  anxious: [
    { id: 'grounding', label: '그라운딩', icon: <Heart className="w-5 h-5" />, color: 'from-green-400 to-green-500', statType: 'health' },
    { id: 'organize', label: '정리하기', icon: <Target className="w-5 h-5" />, color: 'from-blue-400 to-blue-500', statType: 'achievement' },
    { id: 'support-group', label: '지원 요청', icon: <Users className="w-5 h-5" />, color: 'from-purple-400 to-purple-500', statType: 'relationship' }
  ],
  angry: [
    { id: 'physical-activity', label: '신체 활동', icon: <Target className="w-5 h-5" />, color: 'from-red-400 to-red-500', statType: 'health' },
    { id: 'problem-solve', label: '문제 해결', icon: <Brain className="w-5 h-5" />, color: 'from-orange-400 to-orange-500', statType: 'achievement' },
    { id: 'express-feelings', label: '감정 표현', icon: <Heart className="w-5 h-5" />, color: 'from-pink-400 to-pink-500', statType: 'relationship' }
  ]
}

export function MagicButton({ emotion, intensity, onAction }: MagicButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  
  const actions = EMOTION_ACTIONS[emotion] || EMOTION_ACTIONS.happy

  // 강도에 따라 추천 액션 조정
  const recommendedActions = intensity > 7 
    ? actions 
    : actions.slice(0, 2)

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setIsOpen(false)
    onAction(actionId)
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 
          rounded-full shadow-lg hover:shadow-xl transition-all duration-300
          flex items-center justify-center text-white overflow-hidden group"
      >
        <Sparkles className="w-8 h-8 relative z-10" />
        
        {/* 애니메이션 효과 */}
        <motion.div
          className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* 반짝임 효과 */}
        <motion.div
          className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 
              bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 
              min-w-[280px] z-50"
          >
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
              지금 하면 좋을 활동
            </h4>
            <div className="space-y-2">
              {recommendedActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleActionSelect(action.id)}
                  className={`w-full p-3 rounded-xl bg-gradient-to-r ${action.color}
                    text-white flex items-center gap-3 transform transition-all
                    hover:scale-105 active:scale-95`}
                >
                  {action.icon}
                  <span className="font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}