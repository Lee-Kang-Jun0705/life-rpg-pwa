/**
 * SoundManager - 사운드 시스템 관리자
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 에러 방지 - 로딩 실패 대응
 * - 성능 최적화 - 사운드 풀링
 */

import { STORAGE_KEYS } from '@/lib/config/game-constants'
import { AUDIO_CONSTANTS } from '@/lib/constants/audio'

// 환경별 로깅 설정
const isDevelopment = process.env.NODE_ENV === 'development'
const log = isDevelopment ? console.log.bind(console) : () => {}
const error = isDevelopment ? console.error.bind(console) : () => {}
const warn = isDevelopment ? console.warn.bind(console) : () => {}

// 사운드 타입
export type SoundType = 'bgm' | 'sfx' | 'voice'

// 사운드 카테고리
export type SoundCategory = 
  | 'battle' 
  | 'shop' 
  | 'dungeon' 
  | 'dungeon_1'
  | 'dungeon_2'
  | 'dungeon_3'
  | 'dungeon_4'
  | 'dungeon_5'
  | 'menu' 
  | 'success' 
  | 'error' 
  | 'click'

// 사운드 정의
export interface SoundDefinition {
  id: string
  type: SoundType
  category: SoundCategory
  url: string
  volume: number
  loop: boolean
  fadeIn?: number
  fadeOut?: number
}

// 사운드 설정
export interface SoundSettings {
  masterVolume: number
  bgmVolume: number
  sfxVolume: number
  voiceVolume: number
  muted: boolean
}

// 오디오 인스턴스
interface AudioInstance {
  id: string
  audio: HTMLAudioElement
  soundId: string
  type: SoundType
  startTime: number
  fadeTimer?: NodeJS.Timeout
}

// 설정 상수 (AUDIO_CONSTANTS에서 가져옴)
const CONFIG = AUDIO_CONSTANTS

// 비트음 생성기
class BitSoundGenerator {
  private audioContext: AudioContext | null = null
  
  constructor() {
    // AudioContext는 사용자 상호작용 후에 생성하도록 지연
    this.audioContext = null
  }
  
  private initAudioContext(): boolean {
    if (this.audioContext) return true
    
    try {
      // 사용자 상호작용 체크
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (typeof window !== 'undefined' && !AudioContextClass) {
        error('[BitSoundGenerator] AudioContext not supported in this browser')
        return false
      }
      
      this.audioContext = new AudioContextClass!()
      log('[BitSoundGenerator] AudioContext created, state:', this.audioContext.state)
      
      // 오디오 컨텍스트가 suspended 상태면 resume
      if (this.audioContext.state === 'suspended') {
        void this.audioContext.resume().then(() => {
          log('[BitSoundGenerator] AudioContext resumed')
        })
      }
      return true
    } catch (error) {
      error('[BitSoundGenerator] Failed to create AudioContext:', error)
      return false
    }
  }
  
  /**
   * 8비트 스타일 BGM 생성
   */
  generateBGM(category: SoundCategory, duration: number = AUDIO_CONSTANTS.BGM_DURATION): string | null {
    if (!this.initAudioContext()) return null
    
    try {
      const sampleRate = this.audioContext.sampleRate
      const length = sampleRate * duration
      const buffer = this.audioContext.createBuffer(2, length, sampleRate)
      
      // 카테고리별 템포와 패턴
      const patterns = AUDIO_CONSTANTS.BGM_PATTERNS
      
      const pattern = patterns[category] || patterns.menu
      const beatLength = Math.floor(sampleRate * 60 / pattern.tempo / 4)
      
      // 채널별로 멜로디 생성
      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel)
        
        for (let i = 0; i < length; i++) {
          const beat = Math.floor(i / beatLength)
          const noteIndex = beat % pattern.notes.length
          const frequency = pattern.notes[noteIndex]
          
          // 8비트 스타일 사각파 생성
          const t = i / sampleRate
          let sample = 0
          
          // 메인 멜로디
          if (channel === 0) {
            sample += this.squareWave(t, frequency) * 0.2
            sample += this.squareWave(t, frequency * 2) * 0.1 // 하모닉
          }
          // 베이스 라인
          else {
            sample += this.squareWave(t, frequency / 2) * 0.15
            sample += this.triangleWave(t, frequency / 4) * 0.1
          }
          
          // 엔벨로프 적용
          const envelope = this.getEnvelope(i % beatLength, beatLength)
          channelData[i] = sample * envelope
        }
      }
      
      // AudioBuffer를 blob URL로 변환
      return this.bufferToDataURL(buffer)
      
    } catch (error) {
      error('[BitSoundGenerator] Failed to generate BGM:', error)
      return null
    }
  }
  
  /**
   * 8비트 스타일 효과음 생성
   */
  generateSFX(type: string): string | null {
    if (!this.initAudioContext()) return null
    
    try {
      const sampleRate = this.audioContext.sampleRate
      const duration = 0.2 // 200ms
      const length = sampleRate * duration
      const buffer = this.audioContext.createBuffer(1, length, sampleRate)
      const channelData = buffer.getChannelData(0)
      
      switch (type) {
        case 'button_click':
          // 짧은 상승음
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const frequency = AUDIO_CONSTANTS.BIT_SOUND.FREQUENCIES.ATTACK_BASE + (i / length) * 400
            channelData[i] = this.squareWave(t, frequency) * 0.3 * (1 - i / length)
          }
          break
          
        case 'button_hover':
          // 부드러운 톤
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const frequency = AUDIO_CONSTANTS.BIT_SOUND.FREQUENCIES.SHOP_TONE
            channelData[i] = this.sineWave(t, frequency) * 0.2 * (1 - i / length)
          }
          break
          
        case 'success':
          // 상승하는 3음
          const successNotes = [523, 659, 784] // C, E, G
          const noteLength = Math.floor(length / 3)
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const noteIndex = Math.floor(i / noteLength)
            if (noteIndex < successNotes.length) {
              const frequency = successNotes[noteIndex]
              channelData[i] = this.squareWave(t, frequency) * 0.4 * (1 - (i % noteLength) / noteLength)
            }
          }
          break
          
        case 'error':
          // 불협화음
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            channelData[i] = (
              this.squareWave(t, 200) * 0.2 +
              this.squareWave(t, 210) * 0.2
            ) * (1 - i / length)
          }
          break
          
        case 'attack':
          // 펀치 소리
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const frequency = 100 - (i / length) * 80
            channelData[i] = (
              this.noise() * 0.3 +
              this.sineWave(t, frequency) * 0.4
            ) * (1 - i / length)
          }
          break
          
        case 'skill':
          // 마법 소리
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const frequency = 1000 + Math.sin(t * 20) * 200
            channelData[i] = this.triangleWave(t, frequency) * 0.3 * (1 - i / length)
          }
          break
          
        case 'item':
          // 아이템 획득
          for (let i = 0; i < length * 0.5; i++) {
            const t = i / sampleRate
            const frequency = 880 + (i / (length * 0.5)) * 220
            channelData[i] = this.sineWave(t, frequency) * 0.3
          }
          break
          
        case 'coin':
          // 코인 소리
          const coinLength = Math.floor(length * 0.1)
          for (let i = 0; i < coinLength; i++) {
            const t = i / sampleRate
            channelData[i] = this.triangleWave(t, 2000) * 0.4 * (1 - i / coinLength)
          }
          break
          
        default:
          // 기본 클릭음
          for (let i = 0; i < length * 0.1; i++) {
            const t = i / sampleRate
            channelData[i] = this.squareWave(t, 1000) * 0.3
          }
      }
      
      return this.bufferToDataURL(buffer)
      
    } catch (error) {
      error('[BitSoundGenerator] Failed to generate SFX:', error)
      return null
    }
  }
  
  // 파형 생성 함수들
  private squareWave(t: number, frequency: number): number {
    return Math.sign(Math.sin(2 * Math.PI * frequency * t))
  }
  
  private sineWave(t: number, frequency: number): number {
    return Math.sin(2 * Math.PI * frequency * t)
  }
  
  private triangleWave(t: number, frequency: number): number {
    const period = 1 / frequency
    const phase = (t % period) / period
    return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
  }
  
  private noise(): number {
    return Math.random() * 2 - 1
  }
  
  private getEnvelope(position: number, length: number): number {
    const attackTime = 0.1
    const decayTime = 0.2
    const sustainLevel = 0.7
    const releaseTime = 0.3
    
    const normalizedPosition = position / length
    
    if (normalizedPosition < attackTime) {
      return normalizedPosition / attackTime
    } else if (normalizedPosition < attackTime + decayTime) {
      const decayProgress = (normalizedPosition - attackTime) / decayTime
      return 1 - decayProgress * (1 - sustainLevel)
    } else if (normalizedPosition < 1 - releaseTime) {
      return sustainLevel
    } else {
      const releaseProgress = (normalizedPosition - (1 - releaseTime)) / releaseTime
      return sustainLevel * (1 - releaseProgress)
    }
  }
  
  private bufferToDataURL(buffer: AudioBuffer): string {
    // 간단한 WAV 포맷 생성
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV 헤더
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)
    
    // 오디오 데이터
    const channelData = buffer.getChannelData(0)
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample * 0x7FFF, true)
      offset += 2
    }
    
    // Blob 생성 및 URL 반환
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
    return URL.createObjectURL(blob)
  }
}

export class SoundManager {
  private static instance: SoundManager | null = null
  private soundDatabase = new Map<string, SoundDefinition>()
  private audioPool: HTMLAudioElement[] = []
  private activeInstances = new Map<string, AudioInstance>()
  private currentBGM: AudioInstance | null = null
  private settings: SoundSettings
  private bitGenerator = new BitSoundGenerator()
  private loadedSounds = new Set<string>()
  
  // 통계
  private stats = {
    totalPlayed: 0,
    totalErrors: 0,
    soundsLoaded: 0,
    soundsFailed: 0,
    playsByCategory: new Map<SoundCategory, number>()
  }
  
  private constructor() {
    this.settings = this.loadSettings()
    this.initializeAudioPool()
    this.initializeSounds()
  }
  
  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }
  
  /**
   * 설정 로드
   */
  private loadSettings(): SoundSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIO_SETTINGS)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      error('[SoundManager] Failed to load settings:', error)
    }
    
    return { ...CONFIG.DEFAULT_SETTINGS }
  }
  
  /**
   * 오디오 풀 초기화
   */
  private initializeAudioPool(): void {
    for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
      const audio = new Audio()
      audio.addEventListener('error', (e) => {
        const audioElement = e.target as HTMLAudioElement
        // src가 빈 문자열이거나 현재 페이지 URL인 경우 무시
        if (!audioElement?.src || 
            audioElement.src === '' || 
            audioElement.src === window.location.href ||
            audioElement.src.includes('/dungeon')) {
          return
        }
        
        error('[SoundManager] Audio error:', {
          src: audioElement?.src,
          networkState: audioElement?.networkState,
          readyState: audioElement?.readyState,
          errorCode: audioElement?.error?.code,
          errorMessage: audioElement?.error?.message
        })
        this.stats.totalErrors++
      })
      this.audioPool.push(audio)
    }
  }
  
  /**
   * 사운드 초기화
   */
  private initializeSounds(): void {
    // BGM 정의
    const bgms: Array<Omit<SoundDefinition, 'url'> & { generate: boolean }> = [
      {
        id: 'bgm_battle',
        type: 'bgm',
        category: 'battle',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      },
      {
        id: 'bgm_shop',
        type: 'bgm',
        category: 'shop',
        volume: 0.4,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.QUICK_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.QUICK_FADE_OUT,
        generate: true
      },
      // 던전 BGM 5개
      {
        id: 'bgm_dungeon_1',
        type: 'bgm',
        category: 'dungeon',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      },
      {
        id: 'bgm_dungeon_2',
        type: 'bgm',
        category: 'dungeon',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      },
      {
        id: 'bgm_dungeon_3',
        type: 'bgm',
        category: 'dungeon',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      },
      {
        id: 'bgm_dungeon_4',
        type: 'bgm',
        category: 'dungeon',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      },
      {
        id: 'bgm_dungeon_5',
        type: 'bgm',
        category: 'dungeon',
        volume: 0.5,
        loop: true,
        fadeIn: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_IN,
        fadeOut: AUDIO_CONSTANTS.DEFAULT_BGM_FADE_OUT,
        generate: true
      }
    ]
    
    // SFX 정의
    const sfxs: Array<{ id: string; type: SoundType; category: SoundCategory; volume: number; generateType: string }> = [
      { id: 'sfx_button_click', type: 'sfx', category: 'click', volume: 0.6, generateType: 'button_click' },
      { id: 'sfx_button_hover', type: 'sfx', category: 'click', volume: 0.3, generateType: 'button_hover' },
      { id: 'sfx_success', type: 'sfx', category: 'success', volume: 0.7, generateType: 'success' },
      { id: 'sfx_error', type: 'sfx', category: 'error', volume: 0.7, generateType: 'error' },
      { id: 'sfx_attack', type: 'sfx', category: 'battle', volume: 0.8, generateType: 'attack' },
      { id: 'sfx_skill', type: 'sfx', category: 'battle', volume: 0.8, generateType: 'skill' },
      { id: 'sfx_item', type: 'sfx', category: 'menu', volume: 0.6, generateType: 'item' },
      { id: 'sfx_coin', type: 'sfx', category: 'shop', volume: 0.7, generateType: 'coin' },
      // 타격음 효과음 추가 (기존 attack 효과음 재사용)
      { id: 'sfx_hit', type: 'sfx', category: 'battle', volume: 0.7, generateType: 'attack' },
      { id: 'sfx_critical', type: 'sfx', category: 'battle', volume: 0.8, generateType: 'attack' },
      // 승리/패배 효과음 추가
      { id: 'sfx_victory', type: 'sfx', category: 'success', volume: 0.8, generateType: 'success' },
      { id: 'sfx_defeat', type: 'sfx', category: 'error', volume: 0.7, generateType: 'error' }
    ]
    
    // BGM 생성 및 등록
    bgms.forEach(bgm => {
      if (bgm.generate) {
        // 던전 BGM은 각각 다른 패턴 사용
        let category = bgm.category
        if (bgm.id.includes('dungeon_')) {
          const dungeonNumber = bgm.id.split('_')[2]
          category = `dungeon_${dungeonNumber}` as SoundCategory
        }
        
        const url = this.bitGenerator.generateBGM(category, 60) // 1분
        if (url) {
          log(`[SoundManager] Generated BGM for ${bgm.id}`)
          this.soundDatabase.set(bgm.id, {
            ...bgm,
            url,
            loop: bgm.loop
          })
        } else {
          warn(`[SoundManager] Failed to generate BGM for: ${bgm.id}`)
          // 무음 데이터 URL 설정 (1초 무음)
          const silentDataURL = AUDIO_CONSTANTS.SILENT_DATA_URL
          this.soundDatabase.set(bgm.id, {
            ...bgm,
            url: silentDataURL,
            loop: bgm.loop
          })
        }
      }
    })
    
    // SFX 생성 및 등록
    sfxs.forEach(sfx => {
      const url = this.bitGenerator.generateSFX(sfx.generateType)
      if (url) {
        this.soundDatabase.set(sfx.id, {
          id: sfx.id,
          type: sfx.type,
          category: sfx.category,
          url,
          volume: sfx.volume,
          loop: false
        })
      }
    })
    
    log(`[SoundManager] Initialized ${this.soundDatabase.size} sounds`)
  }
  
  /**
   * 사운드 재생
   */
  async playSound(
    soundId: string,
    options: { volume?: number; loop?: boolean; fadeIn?: boolean } = {}
  ): Promise<string | null> {
    if (this.settings.muted) return null
    
    const sound = this.soundDatabase.get(soundId)
    if (!sound) {
      error(`[SoundManager] Sound not found: ${soundId}`)
      return null
    }
    
    // URL 검증을 먼저 수행
    if (!sound.url || sound.url === '') {
      warn('[SoundManager] Invalid sound URL for:', soundId)
      return null
    }
    
    try {
      // BGM인 경우 기존 BGM 정지
      if (sound.type === 'bgm') {
        await this.stopBGM()
      }
      
      // 오디오 인스턴스 가져오기
      const audio = this.getAudioInstance()
      if (!audio) {
        error('[SoundManager] No available audio instance')
        return null
      }
      
      // 인스턴스 ID 미리 생성
      const instanceId = this.generateInstanceId()
      
      audio.src = sound.url
      audio.loop = options.loop ?? sound.loop
      
      // 볼륨 계산
      const typeVolume = this.getTypeVolume(sound.type)
      const finalVolume = this.settings.masterVolume * typeVolume * (options.volume ?? sound.volume)
      
      // 페이드인 처리
      if (options.fadeIn || sound.fadeIn) {
        audio.volume = 0
        this.fadeVolume(audio, 0, finalVolume, sound.fadeIn || CONFIG.DEFAULT_FADE_DURATION)
      } else {
        audio.volume = finalVolume
      }
      
      // 재생 (에러 처리 강화)
      try {
        await audio.play()
      } catch (playError) {
        // 자동재생 정책 등으로 실패한 경우
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          log('[SoundManager] Autoplay blocked, user interaction required')
        } else {
          error('[SoundManager] Play error:', playError)
        }
        // 오디오 엘리먼트 정리
        audio.src = ''
        return null
      }
      
      // 인스턴스 관리
      const instance: AudioInstance = {
        id: instanceId,
        audio,
        soundId,
        type: sound.type,
        startTime: Date.now()
      }
      
      this.activeInstances.set(instanceId, instance)
      
      // BGM 추적
      if (sound.type === 'bgm') {
        this.currentBGM = instance
      }
      
      // 종료 시 정리
      audio.addEventListener('ended', () => {
        if (!audio.loop) {
          this.releaseInstance(instanceId)
        }
      }, { once: true })
      
      // 통계 업데이트
      this.stats.totalPlayed++
      this.stats.playsByCategory.set(
        sound.category,
        (this.stats.playsByCategory.get(sound.category) || 0) + 1
      )
      
      return instanceId
      
    } catch (error) {
      error('[SoundManager] Failed to play sound:', error)
      this.stats.totalErrors++
      return null
    }
  }
  
  /**
   * BGM 재생
   */
  async playBGM(category: SoundCategory): Promise<void> {
    let bgmId = `bgm_${category}`
    
    // 던전 BGM은 랜덤 선택
    if (category === 'dungeon') {
      const dungeonBgmNumber = Math.floor(Math.random() * 5) + 1
      bgmId = `bgm_dungeon_${dungeonBgmNumber}`
      log(`[SoundManager] Selected dungeon BGM: ${bgmId}`)
    }
    
    // 이미 같은 BGM이 재생 중이면 건너뛰기
    if (this.currentBGM && 
        this.currentBGM.soundId === bgmId && 
        this.currentBGM.audio && 
        !this.currentBGM.audio.paused) {
      log(`[SoundManager] BGM already playing: ${bgmId}`)
      return
    }
    
    // 현재 BGM 정지
    if (this.currentBGM) {
      await this.stopBGM(true)
    }
    
    log(`[SoundManager] Attempting to play BGM: ${bgmId}`)
    const result = await this.playSound(bgmId, { fadeIn: true })
    if (!result) {
      error(`[SoundManager] Failed to play BGM: ${bgmId}`)
    } else {
      log(`[SoundManager] BGM started successfully: ${bgmId}`)
    }
  }
  
  /**
   * BGM 정지
   */
  async stopBGM(fadeOut = true): Promise<void> {
    if (!this.currentBGM) return
    
    const instance = this.currentBGM
    const sound = this.soundDatabase.get(instance.soundId)
    
    if (fadeOut && sound?.fadeOut) {
      await this.fadeVolume(
        instance.audio,
        instance.audio.volume,
        0,
        sound.fadeOut
      )
    }
    
    instance.audio.pause()
    this.releaseInstance(instance.id)
    this.currentBGM = null
  }
  
  /**
   * 효과음 재생
   */
  playSFX(type: string, volume = 1): void {
    const sfxId = `sfx_${type}`
    this.playSound(sfxId, { volume })
  }
  
  /**
   * 사운드 정지
   */
  stopSound(instanceId: string, fadeOut = false): void {
    const instance = this.activeInstances.get(instanceId)
    if (!instance) return
    
    if (fadeOut) {
      this.fadeVolume(instance.audio, instance.audio.volume, 0, 300).then(() => {
        instance.audio.pause()
        this.releaseInstance(instanceId)
      })
    } else {
      instance.audio.pause()
      this.releaseInstance(instanceId)
    }
  }
  
  /**
   * 모든 사운드 정지
   */
  stopAllSounds(): void {
    this.activeInstances.forEach(instance => {
      instance.audio.pause()
    })
    this.activeInstances.clear()
    this.currentBGM = null
  }
  
  /**
   * 볼륨 페이드
   */
  private fadeVolume(
    audio: HTMLAudioElement,
    from: number,
    to: number,
    duration: number
  ): Promise<void> {
    return new Promise(resolve => {
      const steps = Math.ceil(duration / CONFIG.FADE_INTERVAL)
      const delta = (to - from) / steps
      let currentStep = 0
      
      const timer = setInterval(() => {
        currentStep++
        
        if (currentStep >= steps) {
          audio.volume = to
          clearInterval(timer)
          resolve()
        } else {
          audio.volume = Math.max(0, Math.min(1, from + delta * currentStep))
        }
      }, CONFIG.FADE_INTERVAL)
    })
  }
  
  /**
   * 오디오 인스턴스 가져오기
   */
  private getAudioInstance(): HTMLAudioElement | null {
    // 사용 가능한 인스턴스 찾기
    for (const audio of this.audioPool) {
      if (audio.paused && !audio.src.startsWith('blob:') && !audio.src.includes('.mp3')) {
        return audio
      }
    }
    
    // 재사용 가능한 인스턴스 찾기
    for (const audio of this.audioPool) {
      if (audio.paused) {
        return audio
      }
    }
    
    return null
  }
  
  /**
   * 인스턴스 해제
   */
  private releaseInstance(instanceId: string): void {
    const instance = this.activeInstances.get(instanceId)
    if (!instance) return
    
    // src를 빈 문자열로 설정하지 않음 (오디오 에러 방지)
    instance.audio.pause()
    instance.audio.currentTime = 0
    this.activeInstances.delete(instanceId)
  }
  
  /**
   * 타입별 볼륨 가져오기
   */
  private getTypeVolume(type: SoundType): number {
    switch (type) {
      case 'bgm':
        return this.settings.bgmVolume
      case 'sfx':
        return this.settings.sfxVolume
      case 'voice':
        return this.settings.voiceVolume
      default:
        return 1
    }
  }
  
  /**
   * 인스턴스 ID 생성
   */
  private generateInstanceId(): string {
    return `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 설정 저장
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_SETTINGS, JSON.stringify(this.settings))
    } catch (error) {
      error('[SoundManager] Failed to save settings:', error)
    }
  }
  
  // 공개 메서드들
  
  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
    this.saveSettings()
  }
  
  /**
   * BGM 볼륨 설정
   */
  setBGMVolume(volume: number): void {
    this.settings.bgmVolume = Math.max(0, Math.min(1, volume))
    this.updateBGMVolume()
    this.saveSettings()
  }
  
  /**
   * SFX 볼륨 설정
   */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }
  
  /**
   * 타격음 재생
   */
  playHit(type: 'normal' | 'critical' = 'normal'): void {
    const sfxId = type === 'critical' ? 'sfx_critical' : 'sfx_hit'
    this.playSound(sfxId)
  }
  
  /**
   * 승리 효과음 재생
   */
  playVictory(): void {
    this.playSound('sfx_victory')
  }
  
  /**
   * 패배 효과음 재생
   */
  playDefeat(): void {
    this.playSound('sfx_defeat')
  }
  
  /**
   * 아이템 획득 효과음 재생
   */
  playItemDrop(): void {
    this.playSound('sfx_item')
  }
  
  /**
   * 음소거 토글
   */
  toggleMute(): void {
    this.settings.muted = !this.settings.muted
    
    if (this.settings.muted) {
      this.stopAllSounds()
    }
    
    this.saveSettings()
  }
  
  /**
   * 모든 볼륨 업데이트
   */
  private updateAllVolumes(): void {
    this.activeInstances.forEach(instance => {
      const sound = this.soundDatabase.get(instance.soundId)
      if (sound) {
        const typeVolume = this.getTypeVolume(sound.type)
        instance.audio.volume = this.settings.masterVolume * typeVolume * sound.volume
      }
    })
  }
  
  /**
   * BGM 볼륨 업데이트
   */
  private updateBGMVolume(): void {
    if (this.currentBGM) {
      const sound = this.soundDatabase.get(this.currentBGM.soundId)
      if (sound) {
        this.currentBGM.audio.volume = this.settings.masterVolume * this.settings.bgmVolume * sound.volume
      }
    }
  }
  
  /**
   * 설정 가져오기
   */
  getSettings(): Readonly<SoundSettings> {
    return { ...this.settings }
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return {
      ...this.stats,
      playsByCategory: new Map(this.stats.playsByCategory)
    }
  }
  
  /**
   * 디버그 정보
   */
  debug(): void {
    log('[SoundManager] Debug Info:')
    log('- Settings:', this.settings)
    log('- Active Instances:', this.activeInstances.size)
    log('- Current BGM:', this.currentBGM?.soundId)
    log('- Stats:', this.stats)
  }
}

// 전역 인스턴스 export
export const soundManager = SoundManager.getInstance()