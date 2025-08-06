/**
 * 던전 전용 사운드 매니저
 * 던전 페이지에서만 작동하는 사운드 시스템
 */

import { soundManager } from '@/lib/dungeon/sound-manager'

export class DungeonSoundManager {
  private static instance: DungeonSoundManager | null = null
  private isEnabled: boolean = false
  private currentBgmId: string | null = null
  private hasPlayedBgm: boolean = false
  private bgmInterval: NodeJS.Timeout | null = null
  private audioContext: AudioContext | null = null
  private bgmOscillator: OscillatorNode | null = null
  private bgmGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  
  private constructor() {}
  
  static getInstance(): DungeonSoundManager {
    if (!DungeonSoundManager.instance) {
      DungeonSoundManager.instance = new DungeonSoundManager()
    }
    return DungeonSoundManager.instance
  }
  
  /**
   * 던전 진입 시 초기화
   */
  initialize(): void {
    this.isEnabled = true
    this.hasPlayedBgm = false
    
    // Web Audio API 초기화 (성능 최적화)
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.audioContext = new AudioContextClass({
          latencyHint: 'playback', // 재생 최적화
          sampleRate: 22050 // 낮은 샘플레이트로 성능 향상
        })
        
        // 마스터 게인과 컴프레서 설정 (오디오 품질 향상)
        this.masterGain = this.audioContext.createGain()
        this.compressor = this.audioContext.createDynamicsCompressor()
        
        this.masterGain.gain.value = 0.5 // 전체 볼륨 조절
        this.compressor.threshold.value = -24
        this.compressor.knee.value = 30
        this.compressor.ratio.value = 12
        this.compressor.attack.value = 0.003
        this.compressor.release.value = 0.25
        
        // 연결: source -> masterGain -> compressor -> destination
        this.masterGain.connect(this.compressor)
        this.compressor.connect(this.audioContext.destination)
        
        console.log('[DungeonSoundManager] AudioContext initialized with optimization')
      } catch (error) {
        console.error('[DungeonSoundManager] Failed to initialize AudioContext:', error)
        this.isEnabled = false
      }
    }
    
    console.log('[DungeonSoundManager] Initialized')
  }
  
  /**
   * 던전 BGM 재생 (5개 중 랜덤)
   * 사용자 상호작용 후 지연 실행으로 최적화
   */
  playBGM(): void {
    if (!this.isEnabled || this.hasPlayedBgm || !this.audioContext) return
    
    // 짧은 지연 후 BGM 재생 (페이지 로딩 부담 감소)
    setTimeout(() => {
      if (!this.isEnabled || !this.audioContext) return
      
      // 이전 BGM 정지
      this.stopBGM()
      
      // 5개 BGM 중 랜덤 선택
      const bgmIndex = Math.floor(Math.random() * 5) + 1
      this.currentBgmId = `bgm_dungeon_${bgmIndex}`
      
      console.log(`[DungeonSoundManager] Playing BGM: ${this.currentBgmId}`)
      
      try {
        // AudioContext resume (사용자 상호작용 후 필요)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
        
        // BGM 생성 (간단한 8비트 스타일 음악)
        this.bgmOscillator = this.audioContext.createOscillator()
        this.bgmGain = this.audioContext.createGain()
        
        this.bgmOscillator.connect(this.bgmGain)
        this.bgmGain.connect(this.masterGain || this.audioContext.destination)
        
        // BGM 타입별 다른 주파수 패턴 설정
        const patterns = [
          [261.63, 329.63, 392.00, 329.63], // C-E-G-E
          [293.66, 349.23, 440.00, 349.23], // D-F-A-F
          [329.63, 392.00, 493.88, 392.00], // E-G-B-G
          [349.23, 440.00, 523.25, 440.00], // F-A-C-A
          [392.00, 493.88, 587.33, 493.88]  // G-B-D-B
        ]
        
        const pattern = patterns[bgmIndex - 1]
        let noteIndex = 0
        
        // 주기적으로 노트 변경
        this.bgmInterval = setInterval(() => {
          if (this.bgmOscillator && this.audioContext) {
            this.bgmOscillator.frequency.setValueAtTime(
              pattern[noteIndex % pattern.length],
              this.audioContext.currentTime
            )
            noteIndex++
          }
        }, 250) // 250ms마다 노트 변경
        
        this.bgmOscillator.type = 'square' // 8비트 스타일
        this.bgmOscillator.frequency.value = pattern[0]
        this.bgmGain.gain.value = 0.08 // 낮은 볼륨으로 배경음악 (성능 최적화)
        
        this.bgmOscillator.start()
        this.hasPlayedBgm = true
        
      } catch (error) {
        console.error('[DungeonSoundManager] Failed to play BGM:', error)
      }
    }, 500) // 500ms 지연
  }
  
  /**
   * BGM 정지
   */
  stopBGM(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval)
      this.bgmInterval = null
    }
    
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop()
      } catch (error) {
        // 이미 정지된 경우 무시
      }
      this.bgmOscillator = null
    }
    
    if (this.bgmGain) {
      this.bgmGain.disconnect()
      this.bgmGain = null
    }
    
    if (this.currentBgmId) {
      console.log(`[DungeonSoundManager] Stopped BGM: ${this.currentBgmId}`)
      this.currentBgmId = null
    }
  }
  
  /**
   * 타격 효과음 재생
   */
  playHit(type: 'normal' | 'critical' = 'normal'): void {
    if (!this.isEnabled) return
    
    console.log(`[DungeonSoundManager] Playing hit sound: ${type}`)
    soundManager.playHit()
  }
  
  /**
   * 공격 효과음 재생
   */
  playAttack(): void {
    if (!this.isEnabled) return
    
    console.log('[DungeonSoundManager] Playing attack sound')
    soundManager.playAttack()
  }
  
  /**
   * 승리 효과음 재생
   */
  playVictory(): void {
    if (!this.isEnabled) return
    
    console.log('[DungeonSoundManager] Playing victory sound')
    soundManager.playVictory()
  }
  
  /**
   * 아이템 드롭 효과음 재생
   */
  playItemDrop(): void {
    if (!this.isEnabled) return
    
    console.log('[DungeonSoundManager] Playing item drop sound')
    soundManager.playItemDrop()
  }
  
  /**
   * 배속에 따른 효과음 재생
   */
  playWithSpeed(soundType: 'attack' | 'hit' | 'victory' | 'item', speed: number = 1): void {
    if (!this.isEnabled) return
    
    console.log(`[DungeonSoundManager] Playing ${soundType} at ${speed}x speed`)
    soundManager.playWithSpeed(soundType, speed)
  }
  
  /**
   * 던전 나가기 - 모든 사운드 정리
   */
  cleanup(): void {
    console.log('[DungeonSoundManager] Cleaning up all sounds')
    this.stopBGM()
    soundManager.cleanup()
    
    // 오디오 노드 정리
    if (this.masterGain) {
      this.masterGain.disconnect()
      this.masterGain = null
    }
    
    if (this.compressor) {
      this.compressor.disconnect()
      this.compressor = null
    }
    
    // AudioContext 정리 (suspend로 리소스 절약)
    if (this.audioContext) {
      if (this.audioContext.state === 'running') {
        this.audioContext.suspend() // close 대신 suspend로 빠른 재시작 가능
      }
    }
    
    this.isEnabled = false
    this.hasPlayedBgm = false
    this.currentBgmId = null
  }
  
  /**
   * 사운드 활성화 상태 확인
   */
  isActive(): boolean {
    return this.isEnabled
  }
}

// 싱글톤 인스턴스
export const dungeonSoundManager = DungeonSoundManager.getInstance()