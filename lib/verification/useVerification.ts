import { useState, useCallback } from 'react'
import { useDatabase } from '../hooks/useDatabase'
import { VerificationService, VerificationResult } from './verification-service'

export interface UseVerificationReturn {
  verifyActivity: (
    activityType: string,
    activityData: Record<string, unknown>
  ) => Promise<VerificationResult>
  isVerifying: boolean
  lastVerificationResult: VerificationResult | null
}

export function useVerification(): UseVerificationReturn {
  const { user } = useDatabase()
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastVerificationResult, setLastVerificationResult] = useState<VerificationResult | null>(null)

  const verifyActivity = useCallback(async(
    activityType: string,
    activityData: Record<string, unknown>
  ): Promise<VerificationResult> => {
    if (!user?.id) {
      return { isValid: false, reason: 'User not logged in' }
    }

    setIsVerifying(true)
    try {
      const service = VerificationService.getInstance()
      const result = await service.verifyActivity(user.id, activityType, activityData)
      setLastVerificationResult(result)
      return result
    } catch (error) {
      console.error('Verification error:', error)
      const errorResult = { isValid: false, reason: 'Verification failed' }
      setLastVerificationResult(errorResult)
      return errorResult
    } finally {
      setIsVerifying(false)
    }
  }, [user])

  return {
    verifyActivity,
    isVerifying,
    lastVerificationResult
  }
}
