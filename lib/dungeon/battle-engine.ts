import type { 
  CharacterBattleStats, 
  Monster, 
  BattleState, 
  BattleLogEntry,
  DamageResult 
} from '@/lib/types/dungeon'
import { calculateDamage, calculateLifeSteal, calculateAttackInterval } from './stat-calculator'
import { dungeonSoundSystem } from './dungeon-sound-system'
import { DUNGEON_CONFIG } from '@/lib/constants/dungeon'
import { battleLogger } from '@/lib/utils/logger'

export class BattleEngine {
  private playerTimer: NodeJS.Timeout | null = null
  private monsterTimer: NodeJS.Timeout | null = null
  private battleState: BattleState
  private onStateUpdate: (state: BattleState) => void
  private onBattleEnd: (victory: boolean, defeatedMonster?: Monster) => void
  
  constructor(
    initialState: BattleState,
    onStateUpdate: (state: BattleState) => void,
    onBattleEnd: (victory: boolean, defeatedMonster?: Monster) => void
  ) {
    this.battleState = initialState
    this.onStateUpdate = onStateUpdate
    this.onBattleEnd = onBattleEnd
  }
  
  /**
   * 전투 시작
   */
  start() {
    if (!this.battleState.currentMonster || !this.battleState.isActive) {
      battleLogger.warn('Cannot start battle: no monster or battle inactive')
      return
    }
    
    battleLogger.info('Battle started', {
      monster: this.battleState.currentMonster.name,
      stage: this.battleState.stage
    })
    
    this.battleState.isPaused = false
    this.updateState()
    
    // 플레이어 공격 타이머
    const playerInterval = calculateAttackInterval(
      DUNGEON_CONFIG.BASE_ATTACK_INTERVAL, 
      this.battleState.playerStats.attackSpeed
    )
    this.playerTimer = setInterval(() => {
      if (!this.battleState.isPaused) {
        this.playerAttack()
      }
    }, playerInterval / this.battleState.speed)
    
    // 몬스터 공격 타이머
    const monsterInterval = calculateAttackInterval(
      DUNGEON_CONFIG.BASE_ATTACK_INTERVAL, 
      this.battleState.currentMonster.attackSpeed
    )
    this.monsterTimer = setInterval(() => {
      if (!this.battleState.isPaused) {
        this.monsterAttack()
      }
    }, monsterInterval / this.battleState.speed)
  }
  
  /**
   * 전투 일시정지
   */
  pause() {
    this.battleState.isPaused = true
    this.updateState()
  }
  
  /**
   * 전투 재개
   */
  resume() {
    this.battleState.isPaused = false
    this.updateState()
  }
  
  /**
   * 전투 중지
   */
  stop() {
    this.clearTimers()
    this.battleState.isActive = false
    this.battleState.isPaused = false
    this.updateState()
  }
  
  /**
   * 배속 변경
   */
  setSpeed(speed: 1 | 2 | 3) {
    this.battleState.speed = speed
    // 타이머 재시작
    this.clearTimers()
    this.start()
  }
  
  /**
   * 플레이어 공격
   */
  private playerAttack() {
    if (!this.battleState.currentMonster) return
    
    // 공격 효과음 재생
    // 플레이어 공격 효과음
    dungeonSoundSystem.playAttack()
    
    const result = calculateDamage(
      this.battleState.playerStats,
      this.battleState.currentMonster
    )
    
    if (!result.isEvaded) {
      // 데미지 적용
      this.battleState.currentMonster.health -= result.actualDamage
      
      // 흡혈 처리
      if (this.battleState.playerStats.lifeSteal > 0) {
        const healAmount = calculateLifeSteal(result.actualDamage, this.battleState.playerStats.lifeSteal)
        this.battleState.playerStats.health = Math.min(
          this.battleState.playerStats.health + healAmount,
          this.battleState.playerStats.maxHealth
        )
      }
      
      // 로그 추가
      this.addBattleLog({
        type: result.isCritical ? 'critical' : 'attack',
        attacker: 'player',
        damage: result.actualDamage,
        message: result.isCritical 
          ? `치명타! ${result.actualDamage} 데미지!`
          : `${result.actualDamage} 데미지를 입혔습니다.`
      })
      
      // 효과음 재생
      // 타격 효과음 (크리티컬 여부에 따라)
      dungeonSoundSystem.playHit(result.isCritical)
    } else {
      // 회피 로그
      this.addBattleLog({
        type: 'evade',
        attacker: 'player',
        message: '몬스터가 공격을 회피했습니다!'
      })
      
      // 미스 효과음
      dungeonSoundSystem.playMiss()
    }
    
    // 몬스터 사망 체크
    if (this.battleState.currentMonster.health <= 0) {
      this.handleMonsterDefeat()
    }
    
    this.updateState()
  }
  
  /**
   * 몬스터 공격
   */
  private monsterAttack() {
    if (!this.battleState.currentMonster) return
    
    // 몬스터 공격 효과음
    dungeonSoundSystem.playMonsterAttack()
    
    const result = calculateDamage(
      this.battleState.currentMonster,
      this.battleState.playerStats
    )
    
    if (!result.isEvaded) {
      // 데미지 적용
      this.battleState.playerStats.health -= result.actualDamage
      
      // 로그 추가
      this.addBattleLog({
        type: result.isCritical ? 'critical' : 'attack',
        attacker: 'monster',
        damage: result.actualDamage,
        message: result.isCritical 
          ? `몬스터 치명타! ${result.actualDamage} 데미지!`
          : `몬스터가 ${result.actualDamage} 데미지를 입혔습니다.`
      })
      
      // 효과음 재생  
      // 타격 효과음 (크리티컬 여부에 따라)
      dungeonSoundSystem.playHit(result.isCritical)
    } else {
      // 회피 로그
      this.addBattleLog({
        type: 'evade',
        attacker: 'monster',
        message: '공격을 회피했습니다!'
      })
      
      // 미스 효과음
      dungeonSoundSystem.playMiss()
    }
    
    // 플레이어 사망 체크
    if (this.battleState.playerStats.health <= 0) {
      this.handlePlayerDefeat()
    }
    
    this.updateState()
  }
  
  /**
   * 몬스터 처치
   */
  private handleMonsterDefeat() {
    if (!this.battleState.currentMonster) return
    
    battleLogger.info('몬스터 처치됨:', this.battleState.currentMonster.name)
    
    // 몬스터 정보를 저장 (null로 설정하기 전에)
    const defeatedMonster = this.battleState.currentMonster
    
    // 보상 획득
    this.battleState.totalGold += defeatedMonster.goldReward
    
    // 로그 추가
    this.addBattleLog({
      type: 'victory',
      attacker: 'player',
      message: `${defeatedMonster.name}을(를) 처치했습니다!`
    })
    
    this.addBattleLog({
      type: 'gold',
      attacker: 'player',
      message: `${defeatedMonster.goldReward} 골드를 획득했습니다!`
    })
    
    // 승리 효과음
    // 승리 효과음 (몬스터 처치 팡파레)
    dungeonSoundSystem.playVictory()
    
    // 전투 종료
    this.clearTimers()
    this.battleState.currentMonster = null
    this.updateState()
    
    // 승리 콜백
    const victoryDelay = DUNGEON_CONFIG.STAGE_TRANSITION_DELAY / this.battleState.speed
    battleLogger.debug(`Victory callback scheduled in ${victoryDelay}ms`)
    setTimeout(() => {
      battleLogger.debug('Victory callback executed')
      this.onBattleEnd(true, defeatedMonster)
    }, victoryDelay)
  }
  
  /**
   * 플레이어 패배
   */
  private handlePlayerDefeat() {
    // 로그 추가
    this.addBattleLog({
      type: 'defeat',
      attacker: 'monster',
      message: '전투에서 패배했습니다...'
    })
    
    // 게임 오버 효과음
    dungeonSoundSystem.playGameOver()
    
    // 전투 종료
    this.clearTimers()
    this.battleState.isActive = false
    this.updateState()
    
    // 패배 콜백
    this.onBattleEnd(false, undefined)
  }
  
  /**
   * 전투 로그 추가
   */
  private addBattleLog(entry: Omit<BattleLogEntry, 'timestamp'>) {
    const logEntry: BattleLogEntry = {
      ...entry,
      timestamp: Date.now()
    }
    
    // 새로운 배열로 생성하여 React가 변경을 감지할 수 있도록 함
    const newBattleLog = [...this.battleState.battleLog, logEntry]
    
    // 로그 최대 20개 유지
    if (newBattleLog.length > 20) {
      newBattleLog.shift()
    }
    
    // battleLog 업데이트
    this.battleState.battleLog = newBattleLog
    
    // 상태 업데이트 호출
    this.updateState()
  }
  
  /**
   * 상태 업데이트
   */
  private updateState() {
    this.onStateUpdate({ 
      ...this.battleState,
      battleLog: [...this.battleState.battleLog] // 배열 새로 생성
    })
  }
  
  /**
   * 타이머 정리
   */
  private clearTimers() {
    if (this.playerTimer) {
      clearInterval(this.playerTimer)
      this.playerTimer = null
    }
    
    if (this.monsterTimer) {
      clearInterval(this.monsterTimer)
      this.monsterTimer = null
    }
  }
  
  /**
   * 정리
   */
  cleanup() {
    this.clearTimers()
  }
}