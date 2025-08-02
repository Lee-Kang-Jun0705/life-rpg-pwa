import React from 'react'
import { motion } from 'framer-motion'
import { EnemyData, DamageDisplay, AnimationEffect, TurnType } from '@/lib/types/battle.types'
import { ElementDisplay } from './ElementDisplay'
import { AIPatternDisplay } from './AIPatternDisplay'

interface EnemyDisplayProps {
  enemyList: EnemyData[]
  enemyLevel: number
  currentTurn: TurnType
  showEffect: AnimationEffect
  targetedEnemy: number | null
  showDamage: DamageDisplay
}

export function EnemyDisplay({
  enemyList,
  enemyLevel,
  currentTurn,
  showEffect,
  targetedEnemy,
  showDamage
}: EnemyDisplayProps) {
  return (
    <div className="h-1/3 relative">
      <div className="absolute right-4 md:right-8 top-4 md:top-8 w-full max-w-2xl">
        <div className="flex gap-4 justify-end flex-wrap">
          {enemyList.map((enemy) => (
            <div key={enemy.id} className="relative">
              {/* 적 정보 박스 */}
              <div className="bg-white/90 rounded-lg p-2 shadow-lg mb-2 min-w-[140px]">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-800 text-sm">{enemy.name}</h3>
                  <span className="text-xs text-gray-600">Lv.{enemyLevel}</span>
                </div>
                
                {/* 속성 및 AI 표시 */}
                <div className="flex justify-between items-center mb-1">
                  <ElementDisplay element={enemy.element} size="sm" />
                  <AIPatternDisplay pattern={enemy.aiPattern} aiState={enemy.aiState} />
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      (enemy.hp / enemy.maxHp) > 0.5 ? 'bg-green-500' :
                        (enemy.hp / enemy.maxHp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-right mt-1">
                  {enemy.hp}/{enemy.maxHp} HP
                </p>
              </div>

              {/* 적 캐릭터 */}
              <motion.div
                className="text-center relative"
                animate={currentTurn === 'enemy' ? {
                  x: [-10, 0, -10],
                  transition: { duration: 0.3, repeat: 2 }
                } : {}}
              >
                <motion.div
                  className="text-5xl md:text-6xl inline-block"
                  animate={enemy.hp <= 0 ? {
                    rotate: 90,
                    opacity: 0.5,
                    y: 20
                  } : showEffect === 'playerAttack' && targetedEnemy === enemy.id ? {
                    x: [0, -5, 5, -5, 5, 0],
                    transition: { duration: 0.5 }
                  } : {}}
                >
                  {enemy.emoji}
                </motion.div>
                {showDamage.enemies.get(enemy.id) && (
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -30, opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-xl font-bold text-red-600"
                  >
                    -{showDamage.enemies.get(enemy.id)}
                  </motion.div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
