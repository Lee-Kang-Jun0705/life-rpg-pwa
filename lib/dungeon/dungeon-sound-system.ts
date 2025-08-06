/**
 * 던전 전용 사운드 시스템
 * 던전 페이지에서만 작동하는 독립적인 사운드 매니저
 * 5개의 BGM (각 1분) + 효과음
 */

export class DungeonSoundSystem {
  private static instance: DungeonSoundSystem | null = null
  private audioContext: AudioContext | null = null
  private isInitialized: boolean = false
  private currentBgmIndex: number = 0
  private bgmSource: AudioBufferSourceNode | null = null
  private bgmGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private bgmBuffers: AudioBuffer[] = []
  private isPlayingBgm: boolean = false
  
  private constructor() {}
  
  static getInstance(): DungeonSoundSystem {
    if (!DungeonSoundSystem.instance) {
      DungeonSoundSystem.instance = new DungeonSoundSystem()
    }
    return DungeonSoundSystem.instance
  }
  
  /**
   * 던전 진입 시 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      // AudioContext 생성
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass({
        latencyHint: 'playback',
        sampleRate: 22050
      })
      
      // 마스터 게인 설정 - 전체 볼륨 증가 (0.4 → 0.6)
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.6
      this.masterGain.connect(this.audioContext.destination)
      
      // 버퍼 초기화 후 생성
      this.bgmBuffers = []
      
      // 5개의 BGM 버퍼 생성 (각 1분)
      this.createBgmBuffers()
      
      this.isInitialized = true
      console.log('[DungeonSoundSystem] Initialized successfully')
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to initialize:', error)
    }
  }
  
  /**
   * 5개의 BGM 버퍼 생성 (각 1분)
   */
  private createBgmBuffers(): void {
    if (!this.audioContext) {
      console.error('[DungeonSoundSystem] AudioContext not available for buffer creation')
      return
    }
    
    const sampleRate = this.audioContext.sampleRate
    const duration = 10 // 10초로 줄여서 테스트
    
    // 5개 BGM 패턴 정의
    const bgmPatterns = [
      // BGM 1: 모험적인 느낌
      { 
        melody: [261.63, 329.63, 392.00, 329.63, 261.63, 196.00, 261.63, 329.63],
        bass: [130.81, 130.81, 196.00, 196.00, 130.81, 98.00, 130.81, 130.81],
        tempo: 120
      },
      // BGM 2: 긴장감 있는 느낌
      { 
        melody: [293.66, 349.23, 440.00, 349.23, 293.66, 261.63, 293.66, 349.23],
        bass: [146.83, 146.83, 220.00, 220.00, 146.83, 130.81, 146.83, 146.83],
        tempo: 130
      },
      // BGM 3: 신비로운 느낌
      { 
        melody: [329.63, 392.00, 493.88, 392.00, 329.63, 293.66, 329.63, 392.00],
        bass: [164.81, 164.81, 246.94, 246.94, 164.81, 146.83, 164.81, 164.81],
        tempo: 110
      },
      // BGM 4: 전투적인 느낌
      { 
        melody: [349.23, 440.00, 523.25, 440.00, 349.23, 329.63, 349.23, 440.00],
        bass: [174.61, 174.61, 261.63, 261.63, 174.61, 164.81, 174.61, 174.61],
        tempo: 140
      },
      // BGM 5: 승리의 느낌
      { 
        melody: [392.00, 493.88, 587.33, 493.88, 392.00, 349.23, 392.00, 493.88],
        bass: [196.00, 196.00, 293.66, 293.66, 196.00, 174.61, 196.00, 196.00],
        tempo: 125
      }
    ]
    
    // 각 BGM 버퍼 생성
    bgmPatterns.forEach((pattern, index) => {
      const buffer = this.audioContext!.createBuffer(2, sampleRate * duration, sampleRate)
      const leftChannel = buffer.getChannelData(0)
      const rightChannel = buffer.getChannelData(1)
      
      const beatLength = Math.floor(sampleRate * 60 / pattern.tempo / 4)
      
      for (let i = 0; i < buffer.length; i++) {
        const beat = Math.floor(i / beatLength)
        const melodyIndex = beat % pattern.melody.length
        const bassIndex = beat % pattern.bass.length
        const t = i / sampleRate
        
        // 멜로디 (왼쪽 채널) - 볼륨 증가 (0.08 → 0.15)
        const melodyFreq = pattern.melody[melodyIndex]
        leftChannel[i] = this.generateSquareWave(t, melodyFreq) * 0.15
        
        // 베이스 (오른쪽 채널) - 볼륨 증가 (0.05 → 0.10)
        const bassFreq = pattern.bass[bassIndex]
        rightChannel[i] = this.generateSquareWave(t, bassFreq) * 0.10
        
        // 엔벨로프 적용
        const envelope = this.getEnvelope(i % beatLength, beatLength)
        leftChannel[i] *= envelope
        rightChannel[i] *= envelope
      }
      
      this.bgmBuffers.push(buffer)
      console.log(`[DungeonSoundSystem] BGM ${index + 1} buffer created`)
    })
  }
  
  /**
   * 8비트 사각파 생성
   */
  private generateSquareWave(t: number, frequency: number): number {
    return Math.sign(Math.sin(2 * Math.PI * frequency * t))
  }
  
  /**
   * 엔벨로프 생성
   */
  private getEnvelope(position: number, length: number): number {
    const normalized = position / length
    if (normalized < 0.1) return normalized / 0.1
    if (normalized < 0.3) return 1
    if (normalized < 0.9) return 0.7
    return (1 - normalized) / 0.1
  }
  
  /**
   * 테스트용 간단한 BGM 재생
   */
  async playTestBGM(): Promise<void> {
    console.log('[DungeonSoundSystem] Playing test BGM')
    
    if (!this.audioContext) {
      console.log('[DungeonSoundSystem] Creating AudioContext for test')
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    }
    
    if (!this.masterGain) {
      console.log('[DungeonSoundSystem] Creating master gain for test')
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.3
      this.masterGain.connect(this.audioContext.destination)
    }
    
    // AudioContext resume
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    // 간단한 테스트 소리 생성
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    
    osc.type = 'sine'
    osc.frequency.value = 440 // A4 음
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1)
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.9)
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1)
    
    osc.start()
    osc.stop(this.audioContext.currentTime + 1)
    
    console.log('[DungeonSoundSystem] Test BGM played successfully')
  }
  
  /**
   * BGM 재생 (순환 또는 랜덤 선택)
   */
  async playBGM(useRandom: boolean = true): Promise<void> {
    console.log('[DungeonSoundSystem] playBGM called', {
      hasAudioContext: !!this.audioContext,
      hasMasterGain: !!this.masterGain,
      isPlayingBgm: this.isPlayingBgm,
      buffersCount: this.bgmBuffers.length
    })
    
    if (!this.audioContext || !this.masterGain) {
      console.error('[DungeonSoundSystem] AudioContext or MasterGain not initialized')
      return
    }
    
    // 이미 재생 중이면 그냥 리턴 (토글은 DungeonClient에서 처리)
    if (this.isPlayingBgm) {
      console.log('[DungeonSoundSystem] BGM already playing')
      return
    }
    
    // AudioContext resume
    if (this.audioContext.state === 'suspended') {
      console.log('[DungeonSoundSystem] Resuming suspended AudioContext')
      await this.audioContext.resume()
    }
    
    // BGM 선택 (랜덤 또는 순환)
    if (useRandom) {
      this.currentBgmIndex = Math.floor(Math.random() * 5)
    } else {
      this.currentBgmIndex = (this.currentBgmIndex + 1) % 5
    }
    
    if (this.bgmBuffers.length === 0) {
      console.error('[DungeonSoundSystem] No BGM buffers available')
      return
    }
    
    const buffer = this.bgmBuffers[this.currentBgmIndex]
    
    if (!buffer) {
      console.error('[DungeonSoundSystem] BGM buffer not found at index:', this.currentBgmIndex)
      return
    }
    
    try {
      // BGM 소스 생성
      this.bgmSource = this.audioContext.createBufferSource()
      this.bgmGain = this.audioContext.createGain()
      
      this.bgmSource.buffer = buffer
      this.bgmSource.loop = false // 루프 해제하여 종료 이벤트 발생 가능하게 함
      
      // 연결
      this.bgmSource.connect(this.bgmGain)
      this.bgmGain.connect(this.masterGain)
      
      // 페이드인 - 타겟 볼륨 증가 (0.2 → 0.4)
      this.bgmGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.bgmGain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 1)
      
      // 재생
      this.bgmSource.start(0)
      this.isPlayingBgm = true
      
      console.log(`[DungeonSoundSystem] Playing BGM ${this.currentBgmIndex + 1}`)
      
      // BGM 종료 시 자동으로 다음 BGM으로 전환
      this.bgmSource.onended = () => {
        if (this.isPlayingBgm) {
          console.log('[DungeonSoundSystem] BGM ended, playing next...')
          this.bgmSource = null
          this.bgmGain = null
          this.isPlayingBgm = false
          // 다음 BGM 자동 재생
          setTimeout(() => {
            if (!this.bgmSource) { // 수동으로 정지하지 않았다면
              this.playBGM(true)
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play BGM:', error)
    }
  }
  
  /**
   * BGM 정지
   */
  stopBGM(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop()
      } catch (e) {
        // 이미 정지된 경우 무시
      }
      this.bgmSource.disconnect()
      this.bgmSource = null
    }
    
    if (this.bgmGain) {
      this.bgmGain.disconnect()
      this.bgmGain = null
    }
    
    this.isPlayingBgm = false
  }
  
  /**
   * 플레이어 공격 효과음
   */
  playAttack(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(500, this.audioContext.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15)
      
      gain.gain.setValueAtTime(0.6, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)
      
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.15)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play attack sound:', error)
    }
  }
  
  /**
   * 몬스터 공격 효과음
   */
  playMonsterAttack(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      // 노이즈 기반 몬스터 공격음
      const duration = 0.2
      const bufferSize = this.audioContext.sampleRate * duration
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const channel = buffer.getChannelData(0)
      
      // 노이즈 + 낮은 주파수 조합
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.audioContext.sampleRate
        const noise = (Math.random() * 2 - 1) * 0.3
        const lowFreq = Math.sin(2 * Math.PI * 80 * t) * 0.4
        channel[i] = (noise + lowFreq) * (1 - i / bufferSize)
      }
      
      const source = this.audioContext.createBufferSource()
      const filter = this.audioContext.createBiquadFilter()
      const gain = this.audioContext.createGain()
      
      source.buffer = buffer
      filter.type = 'lowpass'
      filter.frequency.value = 600
      
      source.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)
      
      gain.gain.value = 0.7
      
      source.start()
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play monster attack sound:', error)
    }
  }
  
  /**
   * 타격 효과음 (일반/크리티컬)
   */
  playHit(critical: boolean = false): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      if (critical) {
        // 크리티컬 히트: 강한 타격음 + 반짝임
        const osc1 = this.audioContext.createOscillator()
        const osc2 = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        
        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(this.masterGain)
        
        osc1.type = 'square'
        osc2.type = 'sawtooth'
        
        osc1.frequency.setValueAtTime(150, this.audioContext.currentTime)
        osc2.frequency.setValueAtTime(2000, this.audioContext.currentTime)
        osc2.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)
        
        gain.gain.setValueAtTime(0.7, this.audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
        
        osc1.start()
        osc2.start()
        osc1.stop(this.audioContext.currentTime + 0.1)
        osc2.stop(this.audioContext.currentTime + 0.2)
      } else {
        // 일반 타격: 펀치 소리
        const duration = 0.08
        const bufferSize = this.audioContext.sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
        const channel = buffer.getChannelData(0)
        
        // 노이즈 + 임팩트
        for (let i = 0; i < bufferSize; i++) {
          const t = i / this.audioContext.sampleRate
          const noise = (Math.random() * 2 - 1) * 0.5
          const impact = Math.sin(2 * Math.PI * 60 * t) * 0.5
          channel[i] = (noise + impact) * (1 - i / bufferSize)
        }
        
        const source = this.audioContext.createBufferSource()
        const filter = this.audioContext.createBiquadFilter()
        const gain = this.audioContext.createGain()
        
        source.buffer = buffer
        filter.type = 'lowpass'
        filter.frequency.value = 800
        
        source.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain)
        
        gain.gain.value = 0.5
        
        source.start()
      }
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play hit sound:', error)
    }
  }
  
  /**
   * 미스 효과음
   */
  playMiss(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, this.audioContext.currentTime)
      osc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.1)
      
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
      
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.1)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play miss sound:', error)
    }
  }
  
  /**
   * 몬스터 처치 승리 효과음 (팡파레)
   */
  playVictory(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      // 승리 팡파레 음계
      const notes = [
        { freq: 523.25, time: 0 },      // C5
        { freq: 523.25, time: 0.1 },    // C5
        { freq: 523.25, time: 0.2 },    // C5
        { freq: 659.25, time: 0.3 },    // E5
        { freq: 783.99, time: 0.5 },    // G5
        { freq: 1046.50, time: 0.7 }    // C6
      ]
      
      notes.forEach(note => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        
        osc.connect(gain)
        gain.connect(this.masterGain!)
        
        osc.frequency.value = note.freq
        osc.type = 'square'
        
        const startTime = this.audioContext!.currentTime + note.time
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02)
        gain.gain.setValueAtTime(0.4, startTime + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)
        
        osc.start(startTime)
        osc.stop(startTime + 0.15)
      })
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play victory sound:', error)
    }
  }
  
  /**
   * 게임 오버 효과음
   */
  playGameOver(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      // 하강하는 음계로 게임 오버 표현
      const notes = [
        { freq: 440, time: 0 },      // A4
        { freq: 392, time: 0.2 },    // G4
        { freq: 329.63, time: 0.4 }, // E4
        { freq: 261.63, time: 0.6 }  // C4
      ]
      
      notes.forEach(note => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        
        osc.connect(gain)
        gain.connect(this.masterGain!)
        
        osc.frequency.value = note.freq
        osc.type = 'triangle'
        
        const startTime = this.audioContext!.currentTime + note.time
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
        
        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play game over sound:', error)
    }
  }
  
  /**
   * 레벨업 효과음
   */
  playLevelUp(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      // 상승하는 글리산도 효과
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(261.63, this.audioContext.currentTime) // C4
      osc.frequency.exponentialRampToValueAtTime(1046.50, this.audioContext.currentTime + 0.5) // C6
      
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + 0.4)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
      
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play level up sound:', error)
    }
  }
  
  /**
   * 아이템 드롭 효과음
   */
  playItemDrop(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, this.audioContext.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.1)
      
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
      
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.2)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play item drop sound:', error)
    }
  }
  
  /**
   * 스킬 사용 효과음
   */
  playSkill(skillType: string = 'default'): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      const osc1 = this.audioContext.createOscillator()
      const osc2 = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.masterGain)
      
      // 마법 시전 소리
      osc1.type = 'sine'
      osc2.type = 'triangle'
      
      osc1.frequency.setValueAtTime(440, this.audioContext.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2)
      
      osc2.frequency.setValueAtTime(660, this.audioContext.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.2)
      
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
      
      osc1.start()
      osc2.start()
      osc1.stop(this.audioContext.currentTime + 0.3)
      osc2.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play skill sound:', error)
    }
  }
  
  /**
   * 보스 등장 효과음
   */
  playBossAppear(): void {
    if (!this.audioContext || !this.masterGain) return
    
    try {
      // 낮고 웅장한 소리
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)
      
      osc.type = 'sawtooth'
      filter.type = 'lowpass'
      filter.frequency.value = 200
      filter.Q.value = 10
      
      osc.frequency.setValueAtTime(30, this.audioContext.currentTime)
      osc.frequency.linearRampToValueAtTime(60, this.audioContext.currentTime + 1)
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.5)
      gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.7)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1)
      
      osc.start()
      osc.stop(this.audioContext.currentTime + 1)
    } catch (error) {
      console.error('[DungeonSoundSystem] Failed to play boss appear sound:', error)
    }
  }
  
  /**
   * 배속에 따른 효과음 재생
   */
  playWithSpeed(soundType: 'attack' | 'hit' | 'victory' | 'item' | 'skill' | 'monsterAttack', speed: number = 1): void {
    // 배속에 따라 볼륨 조정
    const originalVolume = this.masterGain?.gain.value || 0.3
    if (this.masterGain) {
      this.masterGain.gain.value = originalVolume * (1 / Math.sqrt(speed))
    }
    
    switch (soundType) {
      case 'attack':
        this.playAttack()
        break
      case 'hit':
        this.playHit()
        break
      case 'victory':
        this.playVictory()
        break
      case 'item':
        this.playItemDrop()
        break
      case 'skill':
        this.playSkill()
        break
      case 'monsterAttack':
        this.playMonsterAttack()
        break
    }
    
    // 볼륨 복원
    setTimeout(() => {
      if (this.masterGain) {
        this.masterGain.gain.value = originalVolume
      }
    }, 200)
  }
  
  /**
   * 던전 나가기 - 모든 사운드 정리
   */
  cleanup(): void {
    console.log('[DungeonSoundSystem] Cleaning up...')
    
    // BGM 정지
    this.stopBGM()
    
    // AudioContext 정리
    if (this.audioContext) {
      if (this.audioContext.state === 'running') {
        this.audioContext.suspend()
      }
    }
    
    // 버퍼 정리
    this.bgmBuffers = []
    
    // 상태 초기화
    this.isInitialized = false
    this.isPlayingBgm = false
    
    console.log('[DungeonSoundSystem] Cleanup complete')
  }
  
  /**
   * 사운드 활성화 상태
   */
  isActive(): boolean {
    return this.isInitialized && this.audioContext !== null
  }
}

// 싱글톤 인스턴스
export const dungeonSoundSystem = DungeonSoundSystem.getInstance()