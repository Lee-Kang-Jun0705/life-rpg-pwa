'use client'

import React, { useEffect, useState } from 'react'
import { BATTLE_EFFECTS, ANIMATION_CLASSES } from '@/lib/constants/visual-effects'

interface BattleEffect {
  id: string
  emoji: string
  x: number
  y: number
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special'
}

interface BattleEffectsProps {
  effects: BattleEffect[]
}

export function BattleEffects({ effects }: BattleEffectsProps) {
  const [activeEffects, setActiveEffects] = useState<BattleEffect[]>([])

  useEffect(() => {
    setActiveEffects(effects)

    // 1초 후 자동으로 이펙트 제거
    const timer = setTimeout(() => {
      setActiveEffects([])
    }, 1000)

    return () => clearTimeout(timer)
  }, [effects])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {activeEffects.map((effect) => (
        <div
          key={effect.id}
          className={`absolute text-4xl ${
            effect.type === 'damage' ? 'animate-damage' :
              effect.type === 'heal' ? 'animate-bounce' :
                effect.type === 'buff' ? 'animate-slide-up' :
                  'animate-fade-in'
          }`}
          style={{
            left: `${effect.x}%`,
            top: `${effect.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {effect.emoji}
        </div>
      ))}
    </div>
  )
}

/**
 * 데미지 숫자 표시 컴포넌트
 */
export function DamageNumber({
  value,
  x,
  y,
  type = 'normal'
}: {
  value: number
  x: number
  y: number
  type?: 'normal' | 'critical' | 'heal' | 'miss'
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) {
    return null
  }

  const colorClass = {
    normal: 'text-red-500',
    critical: 'text-yellow-400',
    heal: 'text-green-500',
    miss: 'text-gray-400'
  }[type]

  return (
    <div
      className={`absolute font-bold text-2xl ${colorClass} animate-damage pointer-events-none`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}
    >
      {type === 'miss' ? 'MISS' : type === 'critical' ? `${value}!` : value}
    </div>
  )
}

/**
 * 간단한 스킬 이펙트 이모지
 */
export const SKILL_EFFECT_EMOJIS: Record<string, string> = {
  // 물리 스킬
  'slash': '⚔️',
  'double_strike': '⚔️⚔️',
  'whirlwind': '🌪️⚔️',
  'power_strike': '💪⚔️',

  // 마법 스킬
  'fireball': '🔥',
  'ice_shard': '❄️',
  'lightning_bolt': '⚡',
  'heal': '💚',
  'shield': '🛡️',

  // 버프/디버프
  'attack_up': '⬆️⚔️',
  'defense_up': '⬆️🛡️',
  'speed_up': '⬆️💨',
  'poison': '☠️',
  'stun': '💫',

  // 특수
  'critical': '💥',
  'dodge': '💨',
  'counter': '🔄'
}
