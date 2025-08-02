import React from 'react'
import { motion } from 'framer-motion'
import { DamageDisplay, AnimationEffect, TurnType } from '@/lib/types/battle.types'
import { ElementDisplay } from './ElementDisplay'
import { ElementType } from '@/lib/types/element-system'

interface PlayerDisplayProps {
  playerHp: number
  maxPlayerHp: number
  playerMp: number
  maxPlayerMp: number
  playerLevel: number
  playerElement?: ElementType
  currentTurn: TurnType
  showEffect: AnimationEffect
  showDamage: DamageDisplay
}

export function PlayerDisplay({
  playerHp,
  maxPlayerHp,
  playerMp,
  maxPlayerMp,
  playerLevel,
  playerElement = 'normal', // 기본 속성은 무속성
  currentTurn,
  showEffect,
  showDamage
}: PlayerDisplayProps) {
  return (
    <div className="h-1/3 relative">
      <div className="absolute left-4 md:left-8 bottom-4 md:bottom-8">
        {/* 플레이어 정보 박스 */}
        <div className="bg-white/90 rounded-lg p-3 shadow-lg mb-2 min-w-[160px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-gray-800">플레이어</h3>
            <span className="text-sm text-gray-600">Lv.{playerLevel}</span>
          </div>
          
          {/* 속성 표시 */}
          <div className="mb-2">
            <ElementDisplay element={playerElement} size="sm" showName />
          </div>
          
          {/* HP 바 */}
          <div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full ${
                  (playerHp / maxPlayerHp) > 0.5 ? 'bg-green-500' :
                    (playerHp / maxPlayerHp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                animate={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1">
              HP: {playerHp}/{maxPlayerHp}
            </p>
          </div>
          
          {/* MP 바 */}
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                animate={{ width: `${(playerMp / maxPlayerMp) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1">
              MP: {playerMp}/{maxPlayerMp}
            </p>
          </div>
        </div>

        {/* 플레이어 캐릭터 */}
        <motion.div
          className="text-center"
          animate={currentTurn === 'player' ? {
            x: [0, 10, 0],
            transition: { duration: 0.3, repeat: 2 }
          } : {}}
        >
          <motion.div
            className="text-6xl md:text-7xl inline-block"
            animate={showEffect === 'enemyAttack' ? {
              x: [0, -5, 5, -5, 5, 0],
              transition: { duration: 0.5 }
            } : {}}
          >
            🧙‍♂️
          </motion.div>
          {showDamage.player && (
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -30, opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-xl font-bold text-red-600"
            >
              -{showDamage.player}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}