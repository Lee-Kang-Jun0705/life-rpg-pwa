'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CharacterAppearance } from './types'
import { safeLocalStorage, safeJSONParse } from '@/lib/utils/ssr'

interface CharacterContextType {
  currentAppearance: CharacterAppearance
  updateAppearance: (appearance: CharacterAppearance) => void
  isLoading: boolean
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined)

const DEFAULT_APPEARANCE: CharacterAppearance = {
  style: 'emoji',
  color: '#6366F1'
}

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [currentAppearance, setCurrentAppearance] = useState<CharacterAppearance>(DEFAULT_APPEARANCE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load character appearance from localStorage
    const savedAppearance = safeLocalStorage.getItem('characterAppearance')
    const parsed = safeJSONParse<CharacterAppearance | null>(savedAppearance, null)

    if (parsed) {
      setCurrentAppearance(parsed)
    }

    setIsLoading(false)
  }, [])

  const updateAppearance = (appearance: CharacterAppearance) => {
    setCurrentAppearance(appearance)
    safeLocalStorage.setItem('characterAppearance', JSON.stringify(appearance))
  }

  return (
    <CharacterContext.Provider value={{ currentAppearance, updateAppearance, isLoading }}>
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const context = useContext(CharacterContext)
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}
