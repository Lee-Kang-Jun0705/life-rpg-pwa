/**
 * 사운드 시스템 서비스
 * Web Audio API를 활용한 효과음 및 배경음악 관리
 */

interface SoundConfig {
  volume: number
  loop: boolean
  fadeIn?: number
  fadeOut?: number
}

interface Sound {
  id: string
  audio: HTMLAudioElement
  context?: AudioContext
  gainNode?: GainNode
  source?: MediaElementAudioSourceNode
  isPlaying: boolean
  config: SoundConfig
}

export class SoundService {
  private static instance: SoundService
  private audioContext: AudioContext | null = null
  private masterVolume = 0.5
  private effectVolume = 0.5
  private musicVolume = 0.5
  private enabled = true
  private sounds: Map<string, Sound> = new Map()

  // 간단한 비프음 설정 (Web Audio API - 0KB 용량)
  private readonly soundConfigs = {
    // 전투 효과음
    sword_hit: { freq: 200, duration: 0.1, type: 'square' as OscillatorType },
    critical_hit: { freq: 400, duration: 0.2, type: 'sawtooth' as OscillatorType },
    shield_block: { freq: 150, duration: 0.15, type: 'square' as OscillatorType },
    miss: { freq: 100, duration: 0.1, type: 'sine' as OscillatorType },
    hit: { freq: 180, duration: 0.12, type: 'square' as OscillatorType },
    defend: { freq: 130, duration: 0.2, type: 'triangle' as OscillatorType },
    skill_use: { freq: 350, duration: 0.25, type: 'sawtooth' as OscillatorType },

    // 마법/치유
    heal_cast: { freq: 440, duration: 0.3, type: 'sine' as OscillatorType },
    buff: { freq: 520, duration: 0.2, type: 'sine' as OscillatorType },
    fire_cast: { freq: 300, duration: 0.15, type: 'sawtooth' as OscillatorType },
    ice_cast: { freq: 600, duration: 0.2, type: 'sine' as OscillatorType },

    // UI 효과음
    button_click: { freq: 250, duration: 0.05, type: 'square' as OscillatorType },
    item_pickup: { freq: 600, duration: 0.1, type: 'square' as OscillatorType },
    level_up: { freq: 800, duration: 0.5, type: 'sine' as OscillatorType },
    quest_complete: { freq: 660, duration: 0.4, type: 'sine' as OscillatorType },
    victory: { freq: 700, duration: 0.6, type: 'sine' as OscillatorType },
    defeat: { freq: 80, duration: 0.8, type: 'triangle' as OscillatorType },

    // 음악은 제거 (용량 절약)
    menu_bgm: null,
    battle_bgm: null,
    dungeon_bgm: null,
    victory_bgm: null,
    boss_bgm: null
  }

  static getInstance(): SoundService {
    if (!this.instance) {
      this.instance = new SoundService()
    }
    return this.instance
  }

  constructor() {
    // Web Audio API 지원 체크
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext()
    }

    // 설정 로드
    this.loadSettings()

    // 사운드 프리로드 (임시 - 실제로는 파일이 없으므로 주석 처리)
    // this.preloadSounds()
  }

  /**
   * 효과음 재생 (Web Audio API 비프음)
   */
  playEffect(soundId: string, volume = 1): void {
    if (!this.enabled || !this.audioContext) {
      return
    }

    const config = this.soundConfigs[soundId as keyof typeof this.soundConfigs]
    if (!config || config === null) {
      return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(config.freq, this.audioContext.currentTime)

      // 볼륨 설정
      gainNode.gain.setValueAtTime(
        this.masterVolume * volume * 0.1,
        this.audioContext.currentTime
      )
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + config.duration
      )

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + config.duration)
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  /**
   * 배경음악 (용량 절약을 위해 제거)
   */
  playMusic(musicId: string): void {
    // 의도적으로 비워둠
    // 필요시 간단한 멜로디만 사용
  }

  /**
   * Web Audio API로 재생
   */
  private async playWithWebAudio(
    id: string,
    src: string,
    config: SoundConfig
  ): Promise<void> {
    if (!this.audioContext) {
      return
    }

    const audio = new Audio(src)
    audio.loop = config.loop

    const source = this.audioContext.createMediaElementSource(audio)
    const gainNode = this.audioContext.createGain()

    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 초기 볼륨 설정
    gainNode.gain.value = config.fadeIn ? 0 : config.volume

    const sound: Sound = {
      id,
      audio,
      context: this.audioContext,
      gainNode,
      source,
      isPlaying: false,
      config
    }

    this.sounds.set(id, sound)

    // 재생 시작
    await audio.play()
    sound.isPlaying = true

    // 페이드 인
    if (config.fadeIn) {
      this.fadeIn(sound, config.volume, config.fadeIn)
    }

    // 종료 이벤트
    audio.addEventListener('ended', () => {
      if (!config.loop) {
        this.sounds.delete(id)
      }
    })
  }

  /**
   * HTML5 Audio로 재생 (폴백)
   */
  private async playWithHtmlAudio(
    id: string,
    src: string,
    config: SoundConfig
  ): Promise<void> {
    const audio = new Audio(src)
    audio.loop = config.loop
    audio.volume = config.volume

    const sound: Sound = {
      id,
      audio,
      isPlaying: false,
      config
    }

    this.sounds.set(id, sound)

    await audio.play()
    sound.isPlaying = true

    audio.addEventListener('ended', () => {
      if (!config.loop) {
        this.sounds.delete(id)
      }
    })
  }

  /**
   * 사운드 중지
   */
  stop(soundId: string): void {
    const sound = this.sounds.get(soundId)
    if (!sound) {
      return
    }

    if (sound.config.fadeOut && sound.gainNode) {
      this.fadeOut(sound, sound.config.fadeOut, () => {
        sound.audio.pause()
        sound.audio.currentTime = 0
        sound.isPlaying = false
        this.sounds.delete(soundId)
      })
    } else {
      sound.audio.pause()
      sound.audio.currentTime = 0
      sound.isPlaying = false
      this.sounds.delete(soundId)
    }
  }

  /**
   * 모든 사운드 중지
   */
  stopAll(): void {
    this.sounds.forEach((_, id) => this.stop(id))
  }

  /**
   * 모든 음악 페이드 아웃
   */
  private async fadeOutAllMusic(): Promise<void> {
    const musicSounds = Array.from(this.sounds.values()).filter(s => s.config.loop)

    await Promise.all(
      musicSounds.map(sound =>
        new Promise<void>(resolve => {
          if (sound.config.fadeOut && sound.gainNode) {
            this.fadeOut(sound, sound.config.fadeOut, () => {
              this.stop(sound.id)
              resolve()
            })
          } else {
            this.stop(sound.id)
            resolve()
          }
        })
      )
    )
  }

  /**
   * 페이드 인
   */
  private fadeIn(sound: Sound, targetVolume: number, duration: number): void {
    if (!sound.gainNode) {
      return
    }

    const startTime = this.audioContext!.currentTime
    sound.gainNode.gain.setValueAtTime(0, startTime)
    sound.gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + duration / 1000)
  }

  /**
   * 페이드 아웃
   */
  private fadeOut(sound: Sound, duration: number, callback?: () => void): void {
    if (!sound.gainNode) {
      callback?.()
      return
    }

    const startTime = this.audioContext!.currentTime
    const currentVolume = sound.gainNode.gain.value

    sound.gainNode.gain.setValueAtTime(currentVolume, startTime)
    sound.gainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000)

    if (callback) {
      setTimeout(callback, duration)
    }
  }

  /**
   * 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  setEffectVolume(volume: number): void {
    this.effectVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  /**
   * 모든 사운드 볼륨 업데이트
   */
  private updateAllVolumes(): void {
    this.sounds.forEach(sound => {
      const isMusic = sound.config.loop
      const categoryVolume = isMusic ? this.musicVolume : this.effectVolume
      const newVolume = sound.config.volume * categoryVolume * this.masterVolume

      if (sound.gainNode) {
        sound.gainNode.gain.value = newVolume
      } else {
        sound.audio.volume = newVolume
      }
    })
  }

  /**
   * 사운드 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
    this.saveSettings()
  }

  /**
   * 설정 저장
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') {
      return
    }

    const settings = {
      enabled: this.enabled,
      masterVolume: this.masterVolume,
      effectVolume: this.effectVolume,
      musicVolume: this.musicVolume
    }

    localStorage.setItem('soundSettings', JSON.stringify(settings))
  }

  /**
   * 설정 로드
   */
  private loadSettings(): void {
    if (typeof window === 'undefined') {
      return
    }

    const saved = localStorage.getItem('soundSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        this.enabled = settings.enabled ?? true
        this.masterVolume = settings.masterVolume ?? 1
        this.effectVolume = settings.effectVolume ?? 1
        this.musicVolume = settings.musicVolume ?? 1
      } catch (error) {
        console.error('Failed to load sound settings:', error)
      }
    }
  }

  /**
   * 진동 효과 (모바일)
   */
  vibrate(pattern: number | number[]): void {
    if (!this.enabled) {
      return
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  /**
   * 레벨업 멜로디 (간단한 비프음 시퀀스)
   */
  playLevelUpMelody(): void {
    if (!this.enabled || !this.audioContext) {
      return
    }

    const notes = [440, 554, 659, 880] // A4, C#5, E5, A5
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.1)
      }, index * 100)
    })
  }

  private playTone(frequency: number, duration: number): void {
    if (!this.audioContext) {
      return
    }

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    gainNode.gain.setValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  /**
   * 최소한의 사운드 시스템
   */
}

// 싱글톤 인스턴스 export
export const soundService = SoundService.getInstance()

// 전역 사운드 헬퍼 함수
export const playSound = (soundId: string) => soundService.playEffect(soundId)
export const playMusic = (musicId: string) => soundService.playMusic(musicId)
export const stopSound = (soundId: string) => soundService.stop(soundId)
export const stopAllSounds = () => soundService.stopAll()
