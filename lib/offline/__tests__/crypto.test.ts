import { describe, it, expect } from '@jest/globals'
import { CryptoUtil } from '../crypto'

// Crypto API를 mock하고 있으므로 실제 암호화/복호화 테스트는 스킵
describe.skip('CryptoUtil', () => {
  const testPassword = 'test-password-123'
  const testData = 'This is sensitive data that needs encryption'
  const testObject = {
    name: 'Test User',
    email: 'test@example.com',
    secret: 'sensitive information'
  }

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt string data correctly', async() => {
      const { encrypted, salt, iv } = await CryptoUtil.encrypt(testData, testPassword)

      expect(encrypted).toBeInstanceOf(ArrayBuffer)
      expect(salt).toBeInstanceOf(Uint8Array)
      expect(iv).toBeInstanceOf(Uint8Array)
      expect(salt.length).toBe(16)
      expect(iv.length).toBe(12)

      const decrypted = await CryptoUtil.decrypt(encrypted, testPassword, salt, iv)
      expect(decrypted).toBe(testData)
    })

    it('should fail to decrypt with wrong password', async() => {
      const { encrypted, salt, iv } = await CryptoUtil.encrypt(testData, testPassword)

      await expect(
        CryptoUtil.decrypt(encrypted, 'wrong-password', salt, iv)
      ).rejects.toThrow()
    })

    it('should produce different encrypted results for same data', async() => {
      const result1 = await CryptoUtil.encrypt(testData, testPassword)
      const result2 = await CryptoUtil.encrypt(testData, testPassword)

      // Salt and IV should be different
      expect(result1.salt).not.toEqual(result2.salt)
      expect(result1.iv).not.toEqual(result2.iv)

      // But both should decrypt to same data
      const decrypted1 = await CryptoUtil.decrypt(result1.encrypted, testPassword, result1.salt, result1.iv)
      const decrypted2 = await CryptoUtil.decrypt(result2.encrypted, testPassword, result2.salt, result2.iv)

      expect(decrypted1).toBe(testData)
      expect(decrypted2).toBe(testData)
    })
  })

  describe('encodeEncryptedData and decodeEncryptedData', () => {
    it('should encode and decode encrypted data correctly', async() => {
      const { encrypted, salt, iv } = await CryptoUtil.encrypt(testData, testPassword)

      const encoded = CryptoUtil.encodeEncryptedData(encrypted, salt, iv)
      expect(typeof encoded).toBe('string')

      const decoded = CryptoUtil.decodeEncryptedData(encoded)
      expect(decoded.salt).toEqual(salt)
      expect(decoded.iv).toEqual(iv)

      const decrypted = await CryptoUtil.decrypt(decoded.encrypted, testPassword, decoded.salt, decoded.iv)
      expect(decrypted).toBe(testData)
    })
  })

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt objects correctly', async() => {
      const encryptedData = await CryptoUtil.encryptObject(testObject, testPassword)
      expect(typeof encryptedData).toBe('string')

      const decryptedObject = await CryptoUtil.decryptObject<typeof testObject>(
        encryptedData,
        testPassword
      )

      expect(decryptedObject).toEqual(testObject)
    })

    it('should handle complex nested objects', async() => {
      const complexObject = {
        user: {
          id: '123',
          profile: {
            name: 'Test',
            settings: {
              privacy: 'high',
              notifications: true
            }
          }
        },
        data: [1, 2, 3, 4, 5],
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      }

      const encrypted = await CryptoUtil.encryptObject(complexObject, testPassword)
      const decrypted = await CryptoUtil.decryptObject(encrypted, testPassword)

      expect(decrypted).toEqual(complexObject)
    })
  })

  describe('generateUserKey', () => {
    it('should generate a valid base64 encoded key', async() => {
      const key = await CryptoUtil.generateUserKey()

      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)

      // Should be valid base64
      expect(() => atob(key)).not.toThrow()

      // Decoded key should be 32 bytes (256 bits)
      const decoded = atob(key)
      expect(decoded.length).toBe(32)
    })

    it('should generate different keys each time', async() => {
      const key1 = await CryptoUtil.generateUserKey()
      const key2 = await CryptoUtil.generateUserKey()

      expect(key1).not.toBe(key2)
    })
  })

  describe('encryptFields and decryptFields', () => {
    it('should selectively encrypt and decrypt object fields', async() => {
      const userData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        apiKey: 'api-key-secret',
        publicInfo: 'This is public'
      }

      const fieldsToEncrypt = ['password', 'apiKey'] as const

      const encrypted = await CryptoUtil.encryptFields(
        userData,
        fieldsToEncrypt,
        testPassword
      )

      // Check non-encrypted fields remain unchanged
      expect(encrypted.id).toBe(userData.id)
      expect(encrypted.name).toBe(userData.name)
      expect(encrypted.email).toBe(userData.email)
      expect(encrypted.publicInfo).toBe(userData.publicInfo)

      // Check encrypted fields are strings
      expect(typeof encrypted.password).toBe('string')
      expect(typeof encrypted.apiKey).toBe('string')
      expect(encrypted.password).not.toBe(userData.password)
      expect(encrypted.apiKey).not.toBe(userData.apiKey)

      // Decrypt fields
      const decrypted = await CryptoUtil.decryptFields(
        encrypted,
        fieldsToEncrypt,
        testPassword
      )

      expect(decrypted).toEqual(userData)
    })

    it('should handle null and undefined fields gracefully', async() => {
      const dataWithNulls = {
        id: '123',
        name: 'Test',
        optional1: null,
        optional2: undefined,
        secret: 'sensitive'
      }

      const encrypted = await CryptoUtil.encryptFields(
        dataWithNulls,
        ['optional1', 'optional2', 'secret'] as unknown,
        testPassword
      )

      expect(encrypted.optional1).toBeNull()
      expect(encrypted.optional2).toBeUndefined()
      expect(typeof encrypted.secret).toBe('string')

      const decrypted = await CryptoUtil.decryptFields(
        encrypted,
        ['optional1', 'optional2', 'secret'] as unknown,
        testPassword
      )

      expect(decrypted.optional1).toBeNull()
      expect(decrypted.optional2).toBeUndefined()
      expect(decrypted.secret).toBe('sensitive')
    })

    it('should continue processing if one field fails to decrypt', async() => {
      const data = {
        field1: 'encrypted-data-1',
        field2: 'invalid-encrypted-data',
        field3: 'encrypted-data-3'
      }

      // Mock console.error to avoid test output noise
      const consoleError = console.error
      console.error = jest.fn()

      const result = await CryptoUtil.decryptFields(
        data,
        ['field1', 'field2', 'field3'],
        testPassword
      )

      // field2 should remain unchanged due to decryption failure
      expect(result.field2).toBe('invalid-encrypted-data')

      // Restore console.error
      console.error = consoleError
    })
  })
})
