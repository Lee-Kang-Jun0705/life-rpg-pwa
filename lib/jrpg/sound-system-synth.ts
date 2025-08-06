// Web Audio API를 사용한 신스 사운드 시스템
export class SynthSoundSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private currentBGMInterval: number | null = null
  private isInitialized = false
  private isMuted = false
  
  constructor() {
    if (typeof window !== 'undefined') {
      // 즉시 초기화하지 않고 사용자 인터랙션 대기
      // console.log('[SynthSound] Constructor called, waiting for user interaction')
    }
  }
  
  private initAudioContext() {
    if (this.isInitialized) return
    
    try {
      // AudioContext 생성 (브라우저 호환성)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()
      
      // console.log('[SynthSound] AudioContext created, state:', this.audioContext.state)
      
      // 마스터 볼륨
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 1.0
      this.masterGain.connect(this.audioContext.destination)
      
      // BGM 볼륨
      this.bgmGain = this.audioContext.createGain()
      this.bgmGain.gain.value = 0.3
      this.bgmGain.connect(this.masterGain)
      
      // SFX 볼륨
      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = 0.5
      this.sfxGain.connect(this.masterGain)
      
      this.isInitialized = true
      // console.log('[SynthSound] Audio system initialized successfully')
    } catch (error) {
      console.error('[SynthSound] Failed to initialize audio context:', error)
    }
  }
  
  // 사용자 인터랙션 후 오디오 컨텍스트 활성화
  async resumeContext() {
    // 오디오 컨텍스트가 없으면 초기화
    if (!this.audioContext && typeof window !== 'undefined' && window.AudioContext) {
      this.initAudioContext()
    }
    
    if (this.audioContext?.state === 'suspended') {
      // console.log('[SynthSound] Resuming audio context...')
      await this.audioContext.resume()
      // console.log('[SynthSound] Audio context resumed:', this.audioContext.state)
    }
    
    // 테스트용 비프음 재생
    if (this.audioContext && this.audioContext.state === 'running') {
      // console.log('[SynthSound] Playing test beep to confirm audio works')
      this.playBeep(880, 0.1, this.sfxGain!)
    }
  }
  
  // 비프음 생성
  private playBeep(frequency: number, duration: number, gain: GainNode) {
    if (!this.audioContext) {
      // console.log('[SynthSound] playBeep: No audio context')
      return
    }
    
    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.frequency.value = frequency
      oscillator.type = 'square'
      
      // 볼륨 설정 (더 크게)
      gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
      
      oscillator.connect(gainNode)
      gainNode.connect(gain)
      
      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + duration)
      
      // console.log(`[SynthSound] Playing beep: ${frequency}Hz for ${duration}s`)
    } catch (error) {
      console.error('[SynthSound] Error playing beep:', error)
    }
  }
  
  // 멜로디 재생
  private playMelody(notes: number[], duration: number, gain: GainNode) {
    if (!this.audioContext) return
    
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playBeep(frequency, duration, gain)
      }, index * duration * 1000)
    })
  }
  
  // 노이즈 생성 (공격음 등)
  private playNoise(duration: number, gain: GainNode) {
    if (!this.audioContext) return
    
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const noise = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    
    noise.buffer = buffer
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(gain)
    
    noise.start()
  }
  
  // SFX 재생
  async playSFX(sfxId: string) {
    // console.log('[SynthSound] playSFX called:', sfxId)
    
    if (this.isMuted) {
      // console.log('[SynthSound] Sound is muted')
      return
    }
    
    if (!this.audioContext || !this.sfxGain) {
      // console.log('[SynthSound] No audio context or sfxGain, trying to initialize...')
      this.initAudioContext()
      if (!this.audioContext || !this.sfxGain) {
        // console.log('[SynthSound] Failed to initialize audio context')
        return
      }
    }
    
    await this.resumeContext()
    
    switch (sfxId) {
      case 'menu_select':
      case 'menu_confirm':
        this.playBeep(880, 0.1, this.sfxGain)
        break
        
      case 'menu_cancel':
        this.playBeep(440, 0.1, this.sfxGain)
        break
        
      case 'attack':
        this.playNoise(0.2, this.sfxGain)
        break
        
      case 'critical':
        this.playNoise(0.3, this.sfxGain)
        setTimeout(() => {
          this.playBeep(1760, 0.2, this.sfxGain)
        }, 100)
        break
        
      case 'defend':
        this.playBeep(220, 0.3, this.sfxGain)
        break
        
      case 'item_get':
      case 'gold_get':
        this.playMelody([523, 659, 784, 1047], 0.1, this.sfxGain)
        break
        
      case 'levelup':
      case 'quest_complete':
        this.playMelody([523, 587, 659, 784, 880, 1047], 0.15, this.sfxGain)
        break
        
      case 'skill_fire':
        this.playNoise(0.5, this.sfxGain)
        this.playMelody([440, 554, 659], 0.2, this.sfxGain)
        break
        
      case 'skill_ice':
        this.playMelody([1760, 1568, 1397, 1175], 0.1, this.sfxGain)
        break
        
      case 'skill_thunder':
        this.playNoise(0.1, this.sfxGain)
        setTimeout(() => {
          this.playBeep(110, 0.5, this.sfxGain)
        }, 100)
        break
        
      case 'skill_heal':
        this.playMelody([659, 784, 880, 784, 659], 0.15, this.sfxGain)
        break
        
      case 'enhance_success':
        this.playMelody([523, 659, 784, 1047, 1319], 0.12, this.sfxGain)
        break
        
      case 'enhance_fail':
        this.playMelody([440, 392, 349, 294], 0.1, this.sfxGain)
        break
        
      case 'enhance_destroy':
        this.playNoise(0.5, this.sfxGain)
        this.playMelody([220, 196, 175, 147], 0.2, this.sfxGain)
        break
    }
  }
  
  // BGM 재생
  async playBGM(bgmId: string) {
    // console.log('[SynthSound] playBGM called:', bgmId)
    if (!this.audioContext || !this.bgmGain) {
      // console.log('[SynthSound] No audio context or bgmGain, trying to initialize...')
      this.initAudioContext()
      if (!this.audioContext || !this.bgmGain) {
        // console.log('[SynthSound] Failed to initialize audio context')
        return
      }
    }
    
    await this.resumeContext()
    
    // 기존 BGM 정지
    this.stopBGM()
    
    // BGM 패턴 정의 - 탭별로 다양한 BGM 추가
    const bgmPatterns: Record<string, { notes: number[], tempo: number }> = {
      // 타운 - 평화로운 느낌
      town: {
        notes: [523, 587, 659, 587, 523, 523, 523, 0, 587, 587, 587, 0, 523, 659, 659, 0],
        tempo: 200
      },
      // 던전 - 어둡고 긴장감 있는 느낌
      dungeon: {
        notes: [220, 0, 220, 0, 247, 0, 220, 0, 196, 0, 196, 0, 220, 0, 220, 0],
        tempo: 150
      },
      // 전투 - 빠르고 긴박한 느낌
      battle: {
        notes: [440, 440, 0, 440, 0, 440, 523, 0, 392, 392, 0, 392, 0, 392, 440, 0],
        tempo: 120
      },
      // 보스 - 웅장하고 무거운 느낌
      boss: {
        notes: [110, 110, 131, 110, 147, 110, 131, 110, 98, 98, 110, 98, 131, 98, 110, 98],
        tempo: 100
      },
      // 승리 - 밝고 축하하는 느낌
      victory: {
        notes: [523, 0, 523, 0, 587, 0, 659, 0, 784, 0, 880, 0, 1047, 0, 0, 0],
        tempo: 150
      },
      // 패배 - 슬프고 우울한 느낌
      defeat: {
        notes: [440, 0, 392, 0, 349, 0, 330, 0, 294, 0, 262, 0, 220, 0, 0, 0],
        tempo: 200
      },
      // 인벤토리 - 가볍고 상쾌한 느낌
      inventory: {
        notes: [784, 0, 659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 587, 0, 523, 0],
        tempo: 180
      },
      // 스킬 - 신비로운 느낌
      skills: {
        notes: [659, 784, 880, 784, 659, 587, 523, 0, 587, 659, 784, 659, 587, 523, 440, 0],
        tempo: 160
      },
      // 상점 - 활기차고 상업적인 느낌
      shop: {
        notes: [523, 659, 523, 659, 784, 0, 784, 0, 659, 784, 659, 784, 880, 0, 880, 0],
        tempo: 140
      },
      // 도전과제 - 성취감 있는 느낌
      achievement: {
        notes: [523, 0, 659, 0, 784, 0, 1047, 0, 880, 0, 784, 0, 659, 0, 523, 0],
        tempo: 170
      },
      // 컴패니언 - 귀엽고 따뜻한 느낌
      companion: {
        notes: [880, 784, 659, 784, 880, 0, 659, 0, 784, 659, 523, 659, 784, 0, 523, 0],
        tempo: 190
      }
    }
    
    const pattern = bgmPatterns[bgmId]
    if (!pattern) return
    
    let noteIndex = 0
    this.currentBGMInterval = window.setInterval(() => {
      const frequency = pattern.notes[noteIndex]
      if (frequency > 0) {
        this.playBeep(frequency, pattern.tempo / 1000 * 0.8, this.bgmGain)
      }
      noteIndex = (noteIndex + 1) % pattern.notes.length
    }, pattern.tempo)
  }
  
  // BGM 정지
  stopBGM() {
    if (this.currentBGMInterval) {
      clearInterval(this.currentBGMInterval)
      this.currentBGMInterval = null
    }
  }
  
  // 볼륨 설정
  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume
    }
  }
  
  setBGMVolume(volume: number) {
    if (this.bgmGain) {
      this.bgmGain.gain.value = volume * 0.3
    }
  }
  
  setSFXVolume(volume: number) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = volume * 0.5
    }
  }
  
  // 음소거
  setMute(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1
    }
    // console.log('[SynthSound] Mute set to:', muted)
  }
  
  cleanup() {
    this.stopBGM()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// 전역 인스턴스
export const synthSound = new SynthSoundSystem()