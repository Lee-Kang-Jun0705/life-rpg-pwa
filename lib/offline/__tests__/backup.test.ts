import { BackupManager } from '../backup'
import { db } from '../db'
import { CryptoUtil } from '../crypto'

// Mock dependencies
jest.mock('../db')
jest.mock('../crypto')

describe('BackupManager', () => {
  const mockDb = db as jest.Mocked<typeof db>
  const mockProfiles = { toArray: jest.fn() }
  const mockStats = { toArray: jest.fn() }
  const mockActivities = { toArray: jest.fn() }
  const mockCharacters = { toArray: jest.fn() }
  const mockSettings = { toArray: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup mock database tables
    mockDb.profiles = mockProfiles as unknown
    mockDb.stats = mockStats as unknown
    mockDb.activities = mockActivities as unknown
    mockDb.characters = mockCharacters as unknown
    mockDb.settings = mockSettings as unknown
  })

  describe('createBackup', () => {
    it('should create a backup without encryption', async () => {
      // Mock data
      const mockProfileData = [{ id: 1, userId: 'user1', displayName: 'Test User' }]
      const mockStatData = [{ id: 1, userId: 'user1', type: 'strength', value: 10 }]
      const mockActivityData = [{ id: 1, userId: 'user1', description: 'Test activity' }]
      const mockCharacterData = [{ id: 1, userId: 'user1', name: 'Hero' }]
      const mockSettingData = [{ id: 1, key: 'theme', value: 'dark' }]

      mockProfiles.toArray.mockResolvedValue(mockProfileData)
      mockStats.toArray.mockResolvedValue(mockStatData)
      mockActivities.toArray.mockResolvedValue(mockActivityData)
      mockCharacters.toArray.mockResolvedValue(mockCharacterData)
      mockSettings.toArray.mockResolvedValue(mockSettingData)

      // Create backup
      const backup = await BackupManager.createBackup()

      // Verify backup structure
      expect(backup).toHaveProperty('version', 1)
      expect(backup).toHaveProperty('metadata')
      expect(backup.metadata).toHaveProperty('createdAt')
      expect(backup.metadata).toHaveProperty('deviceInfo')
      expect(backup.metadata).toHaveProperty('checksum')
      
      // Verify data
      expect(backup.data.profiles).toEqual(mockProfileData)
      expect(backup.data.stats).toEqual(mockStatData)
      expect(backup.data.activities).toEqual(mockActivityData)
      expect(backup.data.characters).toEqual(mockCharacterData)
      expect(backup.data.settings).toEqual(mockSettingData)
    })

    it('should create an encrypted backup when password is provided', async () => {
      const password = 'test-password'
      const encryptedData = 'encrypted-data'
      
      // Mock encryption
      ;(CryptoUtil.encryptObject as jest.Mock).mockResolvedValue(encryptedData)

      // Mock data
      mockProfiles.toArray.mockResolvedValue([])
      mockStats.toArray.mockResolvedValue([])
      mockActivities.toArray.mockResolvedValue([])
      mockCharacters.toArray.mockResolvedValue([])
      mockSettings.toArray.mockResolvedValue([])

      // Create encrypted backup
      const result = await BackupManager.createBackup(password)

      // Verify encryption was called
      expect(CryptoUtil.encryptObject).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          metadata: expect.any(Object),
          data: expect.any(Object)
        }),
        password
      )

      // Verify result is encrypted string
      expect(result).toBe(encryptedData)
    })

    it('should handle errors during backup creation', async () => {
      // Mock error
      const error = new Error('Database error')
      mockProfiles.toArray.mockRejectedValue(error)

      // Attempt to create backup
      await expect(BackupManager.createBackup()).rejects.toThrow('백업 생성 실패')
    })
  })

  describe('restoreBackup', () => {
    it('should restore an unencrypted backup', async () => {
      const backup = {
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          deviceInfo: {},
          checksum: 'test-checksum'
        },
        data: {
          profiles: [{ id: 1, userId: 'user1', displayName: 'Test User' }],
          stats: [{ id: 1, userId: 'user1', type: 'strength', value: 10 }],
          activities: [],
          characters: [],
          settings: []
        }
      }

      // Mock validation
      jest.spyOn(BackupManager as unknown, 'validateBackup').mockReturnValue(true)
      
      // Mock database operations
      const mockTransaction = jest.fn((mode, ...args) => {
        const callback = args[args.length - 1]
        if (typeof callback === 'function') {
          return Promise.resolve(callback())
        }
        return Promise.resolve()
      })
      mockDb.transaction = mockTransaction

      const mockClear = jest.fn().mockResolvedValue(undefined)
      const mockBulkAdd = jest.fn().mockResolvedValue(undefined)
      
      mockProfiles.clear = mockClear
      mockProfiles.bulkAdd = mockBulkAdd
      mockStats.clear = mockClear
      mockStats.bulkAdd = mockBulkAdd

      // Restore backup
      await BackupManager.restoreBackup(backup)

      // Verify transaction was used
      expect(mockTransaction).toHaveBeenCalled()
      
      // Verify data was cleared and restored
      expect(mockClear).toHaveBeenCalledTimes(2)
      expect(mockBulkAdd).toHaveBeenCalledWith(backup.data.profiles)
      expect(mockBulkAdd).toHaveBeenCalledWith(backup.data.stats)
    })

    it('should restore an encrypted backup with correct password', async () => {
      const encryptedBackup = 'encrypted-backup-string'
      const password = 'test-password'
      const decryptedBackup = {
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          deviceInfo: {},
          checksum: 'test-checksum'
        },
        data: {
          profiles: [],
          stats: [],
          activities: [],
          characters: [],
          settings: []
        }
      }

      // Mock decryption
      ;(CryptoUtil.decryptObject as jest.Mock).mockResolvedValue(decryptedBackup)
      
      // Mock validation
      jest.spyOn(BackupManager as unknown, 'validateBackup').mockReturnValue(true)
      
      // Mock transaction
      mockDb.transaction = jest.fn().mockResolvedValue(undefined)

      // Restore encrypted backup
      await BackupManager.restoreBackup(encryptedBackup, password)

      // Verify decryption was called
      expect(CryptoUtil.decryptObject).toHaveBeenCalledWith(encryptedBackup, password)
    })

    it('should throw error for invalid backup format', async () => {
      const invalidBackup = { invalid: 'data' }

      await expect(BackupManager.restoreBackup(invalidBackup as unknown))
        .rejects.toThrow('유효하지 않은 백업 파일입니다')
    })

    it('should throw error when decryption fails', async () => {
      const encryptedBackup = 'encrypted-backup'
      const wrongPassword = 'wrong-password'

      ;(CryptoUtil.decryptObject as jest.Mock).mockRejectedValue(new Error('Decryption failed'))

      await expect(BackupManager.restoreBackup(encryptedBackup, wrongPassword))
        .rejects.toThrow('백업 복호화 실패')
    })
  })

  describe('exportToFile', () => {
    it('should create a downloadable backup file', async () => {
      const backup = { test: 'data' }
      
      // Mock DOM methods
      const mockCreateElement = jest.spyOn(document, 'createElement')
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation()
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation()
      
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      }
      mockCreateElement.mockReturnValue(mockAnchor as unknown)

      // Mock URL methods
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url')
      const mockRevokeObjectURL = jest.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      // Export to file
      BackupManager.exportToFile(backup)

      // Verify file download
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.download).toMatch(/life-rpg-backup-\d{4}-\d{2}-\d{2}\.json/)
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url')

      // Cleanup
      mockCreateElement.mockRestore()
      mockAppendChild.mockRestore()
      mockRemoveChild.mockRestore()
    })
  })

  describe('importFromFile', () => {
    it('should import backup from file', async () => {
      const fileContent = JSON.stringify({ test: 'data' })
      const file = new File([fileContent], 'backup.json', { type: 'application/json' })

      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as unknown,
        onerror: null as unknown
      }
      global.FileReader = jest.fn(() => mockFileReader) as unknown

      // Create promise and trigger file read
      const importPromise = BackupManager.importFromFile(file)
      
      // Simulate successful file read
      mockFileReader.onload({ target: { result: fileContent } } as unknown)

      const result = await importPromise

      expect(result).toEqual({ test: 'data' })
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file)
    })

    it('should handle file read errors', async () => {
      const file = new File([''], 'backup.json')

      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as unknown,
        onerror: null as unknown
      }
      global.FileReader = jest.fn(() => mockFileReader) as unknown

      // Create promise and trigger error
      const importPromise = BackupManager.importFromFile(file)
      
      // Simulate file read error
      mockFileReader.onerror(new Error('Read error'))

      await expect(importPromise).rejects.toThrow('파일 읽기 실패')
    })
  })

  describe('validateBackup', () => {
    it('should validate backup structure', () => {
      const validBackup = {
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          deviceInfo: {},
          checksum: 'test'
        },
        data: {
          profiles: [],
          stats: [],
          activities: [],
          characters: [],
          settings: []
        }
      }

      // Access private method through type assertion
      const isValid = (BackupManager as unknown).validateBackup(validBackup)
      expect(isValid).toBe(true)
    })

    it('should reject invalid backup structure', () => {
      const invalidBackups = [
        null,
        undefined,
        {},
        { version: 2 }, // Wrong version
        { version: 1, metadata: {} }, // Missing data
        { version: 1, data: {} }, // Missing metadata
        { version: 1, metadata: {}, data: {} } // Missing required data fields
      ]

      invalidBackups.forEach(backup => {
        const isValid = (BackupManager as unknown).validateBackup(backup)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('calculateChecksum', () => {
    it('should calculate checksum for backup data', async () => {
      const backup = {
        version: 1,
        metadata: { createdAt: '2024-01-01' },
        data: { profiles: [{ id: 1 }] }
      }

      // Mock crypto.subtle.digest
      const mockDigest = new Uint8Array([1, 2, 3, 4])
      global.crypto = {
        subtle: {
          digest: jest.fn().mockResolvedValue(mockDigest)
        }
      } as unknown

      const checksum = await (BackupManager as unknown).calculateChecksum(backup)

      expect(checksum).toBe('01020304')
      expect(crypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      )
    })
  })
})