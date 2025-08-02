'use client'

import React from 'react'
import { InventoryScreen } from '@/components/inventory/InventoryScreen'
import { GameLayout } from '@/components/GameLayout'
import { useRouter } from 'next/navigation'

export default function InventoryPage() {
  const router = useRouter()

  return (
    <GameLayout>
      <InventoryScreen
        onClose={() => router.back()}
      />
    </GameLayout>
  )
}
