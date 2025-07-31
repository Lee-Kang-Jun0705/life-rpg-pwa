import { useEffect, useState } from 'react'
import { initializeDatabase } from '@/lib/db/init'

export function useDatabase() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const success = await initializeDatabase()
      if (isMounted) {
        setIsReady(success)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  return isReady
}