import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 코치 - Life RPG',
  description: '데이터 기반 맞춤형 성장 코칭',
}

export default function AICoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}