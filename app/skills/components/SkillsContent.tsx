'use client'

import React from 'react'
import { SkillScreen } from '@/components/skills/SkillScreen'
import { GameLayout } from '@/components/GameLayout'
import { useRouter } from 'next/navigation'

export default function SkillsContent() {
  const router = useRouter()
  
  return (
    <GameLayout>
      <SkillScreen 
        onClose={() => router.back()}
      />
    </GameLayout>
  )
}