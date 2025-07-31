import { db } from '@/lib/database/client'

// Web Crypto API를 사용한 암호화/복호화
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16

class CryptoManager {
  private static instance: CryptoManager
  private cryptoKey: CryptoKey | null = null

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager()
    }
    return CryptoManager.instance
  }

  private async getOrCreateKey(): Promise<CryptoKey> {
    if (this.cryptoKey) return this.cryptoKey

    // 브라우저 환경 체크
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not available')
    }

    // localStorage에서 키 체크
    const storedKey = localStorage.getItem('life-rpg-crypto-key')
    
    if (storedKey) {
      const keyData = JSON.parse(storedKey)
      const keyBuffer = this.base64ToArrayBuffer(keyData.key)
      this.cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      )
    } else {
      // 새 키 생성
      this.cryptoKey = await crypto.subtle.generateKey(
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      )
      
      // 키 저장
      const exportedKey = await crypto.subtle.exportKey('raw', this.cryptoKey)
      const keyData = {
        key: this.arrayBufferToBase64(exportedKey),
        created: new Date().toISOString()
      }
      localStorage.setItem('life-rpg-crypto-key', JSON.stringify(keyData))
    }

    return this.cryptoKey
  }

  async encrypt(text: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey()
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      
      // IV 생성
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
      
      // 암호화
      const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        data
      )
      
      // IV와 암호화된 데이터를 결합
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encrypted), iv.length)
      
      return this.arrayBufferToBase64(combined.buffer)
    } catch (error) {
      console.error('Encryption error:', error)
      // 폴백: base64 인코딩 (개발 환경용)
      return btoa(encodeURIComponent(text))
    }
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey()
      const combined = this.base64ToArrayBuffer(encryptedText)
      
      // IV와 암호화된 데이터 분리
      const iv = combined.slice(0, IV_LENGTH)
      const encrypted = combined.slice(IV_LENGTH)
      
      // 복호화
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        encrypted
      )
      
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      // 폴백: base64 디코딩 시도
      try {
        return decodeURIComponent(atob(encryptedText))
      } catch {
        return ''
      }
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

const cryptoManager = CryptoManager.getInstance()

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  endpoint?: string
}

export class SecureAIStorage {
  static async saveConfig(_config: AIConfig): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    const encrypted = {
      ...config,
      apiKey: await cryptoManager.encrypt(config.apiKey)
    }

    await db.settings.put({
      key: 'ai_config',
      value: JSON.stringify(encrypted),
      updatedAt: new Date()
    })
  }

  static async getConfig(): Promise<AIConfig | null> {
    try {
      if (!db) {
        return null
      }
      
      const setting = await db.settings.where('key').equals('ai_config').first()
      if (!setting?.value) return null

      const encrypted = JSON.parse(setting.value)
      return {
        ...encrypted,
        apiKey: await cryptoManager.decrypt(encrypted.apiKey)
      }
    } catch {
      return null
    }
  }

  static async clearConfig(): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    const setting = await db.settings.where('key').equals('ai_config').first()
    if (setting?.id) {
      await db.settings.delete(setting.id)
    }
  }
}