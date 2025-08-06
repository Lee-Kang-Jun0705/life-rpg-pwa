import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '대시보드 - Life RPG',
  description: '나의 성장 대시보드',
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
