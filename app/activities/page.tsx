import { Metadata } from 'next'
import ActivitiesClient from './ActivitiesClient'

export const metadata: Metadata = {
  title: '활동 히스토리 | Life RPG',
  description: '나의 모든 활동 기록을 확인하세요'
}

export default function ActivitiesPage() {
  return <ActivitiesClient />
}
