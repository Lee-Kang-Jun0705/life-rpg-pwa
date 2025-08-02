'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface EmotionContextType {
  currentEmotion: string | null
  emotionIntensity: number
  setEmotion: (emotion: string | null, intensity?: number) => void
  clearEmotion: () => void
  conversationHistory: ConversationEntry[]
  addToHistory: (entry: ConversationEntry) => void
  clearHistory: () => void
}

export interface ConversationEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  emotion?: string | null
  timestamp: Date
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined)

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [emotionIntensity, setEmotionIntensity] = useState(5)
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([])

  const setEmotion = useCallback((emotion: string | null, intensity = 5) => {
    setCurrentEmotion(emotion)
    setEmotionIntensity(intensity)
  }, [])

  const clearEmotion = useCallback(() => {
    setCurrentEmotion(null)
    setEmotionIntensity(5)
  }, [])

  const addToHistory = useCallback((entry: ConversationEntry) => {
    setConversationHistory(prev => [...prev.slice(-20), entry]) // 최근 20개만 유지
  }, [])

  const clearHistory = useCallback(() => {
    setConversationHistory([])
  }, [])

  return (
    <EmotionContext.Provider value={{
      currentEmotion,
      emotionIntensity,
      setEmotion,
      clearEmotion,
      conversationHistory,
      addToHistory,
      clearHistory
    }}>
      {children}
    </EmotionContext.Provider>
  )
}

export function useEmotion() {
  const context = useContext(EmotionContext)
  if (context === undefined) {
    throw new Error('useEmotion must be used within an EmotionProvider')
  }
  return context
}
