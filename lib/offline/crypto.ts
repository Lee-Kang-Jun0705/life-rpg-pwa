/**
 * 브라우저의 Web Crypto API를 사용한 AES-GCM 암호화/복호화 유틸리티
 */

export class CryptoUtil {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12 // 96 bits for GCM
  private static readonly SALT_LENGTH = 16 // 128 bits
  private static readonly TAG_LENGTH = 16 // 128 bits

  /**
   * 비밀번호로부터 암호화 키 생성
   */
  private static async deriveKey(
    _password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    // 비밀번호를 키로 변환
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // PBKDF2를 사용하여 키 유도
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * 데이터 암호화
   */
  static async encrypt(
    _data: string,
    _password: string
  ): Promise<{
    _encrypted: ArrayBuffer
    salt: Uint8Array
    iv: Uint8Array
  }> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    // 랜덤 salt와 IV 생성
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))

    // 키 유도
    const key = await this.deriveKey(password, salt)

    // 데이터 암호화
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
        tagLength: this.TAG_LENGTH * 8
      },
      key,
      dataBuffer
    )

    return { encrypted, salt, iv }
  }

  /**
   * 데이터 복호화
   */
  static async decrypt(
    _encrypted: ArrayBuffer,
    _password: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    // 키 유도
    const key = await this.deriveKey(password, salt)

    // 데이터 복호화
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
        tagLength: this.TAG_LENGTH * 8
      },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * 암호화된 데이터를 Base64로 인코딩
   */
  static encodeEncryptedData(
    _encrypted: ArrayBuffer,
    salt: Uint8Array,
    iv: Uint8Array
  ): string {
    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedArray.length
    )

    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(encryptedArray, salt.length + iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  /**
   * Base64로 인코딩된 데이터를 디코딩
   */
  static decodeEncryptedData(_encodedData: string): {
    _encrypted: ArrayBuffer
    salt: Uint8Array
    iv: Uint8Array
  } {
    const combined = Uint8Array.from(atob(encodedData), c => c.charCodeAt(0))

    const salt = combined.slice(0, this.SALT_LENGTH)
    const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH)
    const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH)

    return {
      _encrypted: encrypted.buffer,
      salt,
      iv
    }
  }

  /**
   * 객체를 암호화
   */
  static async encryptObject<T>(
    obj: T,
    _password: string
  ): Promise<string> {
    const jsonString = JSON.stringify(obj)
    const { encrypted, salt, iv } = await this.encrypt(jsonString, password)
    return this.encodeEncryptedData(encrypted, salt, iv)
  }

  /**
   * 암호화된 객체를 복호화
   */
  static async decryptObject<T>(
    _encryptedData: string,
    _password: string
  ): Promise<T> {
    const { encrypted, salt, iv } = this.decodeEncryptedData(encryptedData)
    const jsonString = await this.decrypt(encrypted, password, salt, iv)
    return JSON.parse(jsonString)
  }

  /**
   * 사용자별 암호화 키 생성 (디바이스에 저장)
   */
  static async generateUserKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )

    const exported = await crypto.subtle.exportKey('raw', key)
    const keyArray = new Uint8Array(exported)
    return btoa(String.fromCharCode(...keyArray))
  }

  /**
   * 필드 레벨 암호화 (민감한 데이터만 선택적으로 암호화)
   */
  static async encryptFields<T extends Record<string, unknown>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[],
    _password: string
  ): Promise<T> {
    const result = { ...obj }

    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const encrypted = await this.encryptObject(obj[field], password)
        result[field] = encrypted as T[keyof T]
      }
    }

    return result
  }

  /**
   * 필드 레벨 복호화
   */
  static async decryptFields<T extends Record<string, unknown>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
    _password: string
  ): Promise<T> {
    const result = { ...obj }

    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          const decrypted = await this.decryptObject(obj[field] as string, password)
          result[field] = decrypted as T[keyof T]
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error)
          // 복호화 실패 시 원본 값 유지
        }
      }
    }

    return result
  }
}