import { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | Life RPG',
  description: '당신의 성장을 게임처럼 관리하세요',
}

export default function DashboardPage() {
  return <DashboardClient />
}