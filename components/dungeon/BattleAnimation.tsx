import React, { useEffect, useRef, useState } from 'react'
import type { BattleLogEntry, Monster } from '@/lib/types/dungeon'

interface BattleAnimationProps {
  battleLog: BattleLogEntry[]
  isPaused: boolean
  currentMonster?: Monster | null
  playerLevel?: number
}

interface AnimationState {
  playerAttacking: boolean  // 플레이어가 공격 중
  monsterAttacking: boolean // 몬스터가 공격 중
  playerHit: boolean       // 플레이어가 피격당함
  monsterHit: boolean      // 몬스터가 피격당함
  showDamage: { damage: number; x: number; y: number; isCritical: boolean } | null
  showHitEffect: { x: number; y: number; type: 'slash' | 'impact' } | null
}

export default function BattleAnimation({ battleLog, isPaused, currentMonster, playerLevel = 1 }: BattleAnimationProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [showAttackEffect, setShowAttackEffect] = useState(false)
  const [animation, setAnimation] = useState<AnimationState>({
    playerAttacking: false,
    monsterAttacking: false,
    playerHit: false,
    monsterHit: false,
    showDamage: null,
    showHitEffect: null
  })

  // 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [battleLog])

  // 공격 애니메이션 처리
  useEffect(() => {
    const lastLog = battleLog[battleLog.length - 1]
    if (!lastLog) return

    console.log('[BattleAnimation] Last log:', lastLog) // 디버그 로그

    if (lastLog.type === 'attack' || lastLog.type === 'critical') {
      const isPlayerAttack = lastLog.attacker === 'player'
      const damage = lastLog.damage || 0
      
      console.log('[BattleAnimation] Attack animation triggered:', {
        isPlayerAttack,
        damage,
        type: lastLog.type,
        attacker: lastLog.attacker,
        animationState: {
          playerAttacking: isPlayerAttack,
          monsterAttacking: !isPlayerAttack,
          monsterHit: isPlayerAttack,
          playerHit: !isPlayerAttack
        }
      })
      
      // 공격 모션
      setAnimation(prev => ({
        ...prev,
        // 공격자와 피격자 설정
        playerAttacking: isPlayerAttack,
        monsterAttacking: !isPlayerAttack,
        monsterHit: isPlayerAttack,  // 플레이어가 공격하면 몬스터가 피격
        playerHit: !isPlayerAttack,  // 몬스터가 공격하면 플레이어가 피격
        showDamage: {
          damage,
          x: isPlayerAttack ? 70 : 30,
          y: 50,
          isCritical: lastLog.type === 'critical'
        },
        showHitEffect: {
          x: isPlayerAttack ? 65 : 35,
          y: 50,
          type: lastLog.type === 'critical' ? 'impact' : 'slash'
        }
      }))

      // 애니메이션 초기화 (시간 늘림)
      setTimeout(() => {
        setAnimation(prev => ({
          ...prev,
          playerAttacking: false,
          monsterAttacking: false,
          playerHit: false,
          monsterHit: false
        }))
      }, 600) // 300ms → 600ms로 증가

      // 데미지 숫자 제거
      setTimeout(() => {
        setAnimation(prev => ({
          ...prev,
          showDamage: null,
          showHitEffect: null
        }))
      }, 1000)
    }
  }, [battleLog])

  // 최근 5개 로그만 표시
  const recentLogs = battleLog.slice(-5)

  // 몬스터 이모지 추출
  const getMonsterEmoji = (name: string) => {
    const match = name.match(/^(.*?) /)
    return match ? match[1] : '👾'
  }

  return (
    <div className="my-2 sm:my-6">
      {/* 전투 영역 */}
      <div className="relative h-32 sm:h-48 mb-2 sm:mb-4 overflow-hidden">
        {isPaused ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-yellow-400 text-lg font-semibold animate-pulse">
              전투 일시정지
            </div>
          </div>
        ) : currentMonster ? (
          <div className="relative flex items-center justify-between h-full px-2 sm:px-8">
            {/* 플레이어 */}
            <div className={`text-center transition-all duration-500 ${
              animation.playerAttacking ? 'translate-x-4 sm:translate-x-8' : ''  // 공격 시 앞으로 이동
            } ${animation.playerHit ? 'animate-shake' : ''}`}>   {/* 피격 시 흔들림 */}
              <div className={`text-5xl sm:text-8xl transition-transform duration-500 ${
                animation.playerAttacking ? 'scale-110 sm:scale-125 rotate-6 sm:rotate-12' : ''  // 공격 시 확대 및 회전
              } ${animation.playerHit ? 'scale-90' : ''}`}>  {/* 피격 시 축소 */}
                🦸‍♂️
              </div>
              <p className="text-white text-xs sm:text-base mt-1 sm:mt-2">Lv.{playerLevel}</p>
            </div>

            {/* VS 표시 */}
            <div className="text-center">
              <div className="text-xl sm:text-3xl text-gray-400">VS</div>
            </div>

            {/* 몬스터 */}
            <div className={`text-center transition-all duration-500 ${
              animation.monsterAttacking ? '-translate-x-4 sm:-translate-x-8' : ''  // 공격 시 앞으로 이동
            } ${animation.monsterHit ? 'animate-shake' : ''}`}>   {/* 피격 시 흔들림 */}
              <div className={`text-5xl sm:text-8xl transition-transform duration-500 ${
                animation.monsterAttacking ? 'scale-110 sm:scale-125 -rotate-6 sm:-rotate-12' : ''  // 공격 시 확대 및 회전
              } ${animation.monsterHit ? 'scale-75' : ''}`}>  {/* 피격 시 축소 (더 작게) */}
                {getMonsterEmoji(currentMonster.name)}
              </div>
              <p className="text-white text-xs sm:text-base mt-1 sm:mt-2">{currentMonster.name.replace(/^.*? /, '')}</p>
            </div>

            {/* 데미지 숫자 */}
            {animation.showDamage && (
              <div 
                className={`absolute text-2xl sm:text-4xl font-bold animate-damage-float ${
                  animation.showDamage.isCritical ? 'text-yellow-400' : 'text-red-400'
                }`}
                style={{
                  left: `${animation.showDamage.x}%`,
                  top: `${animation.showDamage.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {animation.showDamage.damage}
                {animation.showDamage.isCritical && <span className="text-lg sm:text-2xl ml-1">!</span>}
              </div>
            )}

            {/* 타격 이펙트 */}
            {animation.showHitEffect && (
              <div 
                className="absolute animate-hit-effect"
                style={{
                  left: `${animation.showHitEffect.x}%`,
                  top: `${animation.showHitEffect.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {animation.showHitEffect.type === 'slash' ? (
                  <div className="text-3xl sm:text-6xl">⚔️</div>
                ) : (
                  <div className="text-4xl sm:text-8xl">💥</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">다음 몬스터 준비 중...</div>
          </div>
        )}
      </div>

      {/* 전투 로그 */}
      <div 
        ref={logContainerRef}
        className="bg-black/20 rounded-lg p-2 sm:p-3 h-24 sm:h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent"
      >
        {recentLogs.map((log, index) => (
          <div 
            key={`${log.timestamp}-${index}`}
            className={`text-xs sm:text-sm mb-1 animate-fadeIn ${
              log.type === 'critical' ? 'text-yellow-400 font-semibold' :
              log.type === 'evade' ? 'text-gray-400' :
              log.type === 'victory' ? 'text-green-400 font-semibold' :
              log.type === 'defeat' ? 'text-red-400 font-semibold' :
              log.type === 'gold' ? 'text-yellow-300' :
              log.type === 'item' ? 'text-purple-400' :
              log.attacker === 'player' ? 'text-blue-300' : 'text-red-300'
            }`}
          >
            {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}