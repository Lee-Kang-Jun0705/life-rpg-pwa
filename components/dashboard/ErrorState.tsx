import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-4">
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-200">
            오류가 발생했습니다
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <Button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700"
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
