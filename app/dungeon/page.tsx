import { Metadata } from 'next'
import DungeonClient from './DungeonClient'

export const metadata: Metadata = {
  title: '던전 | Life RPG',
  description: '몬스터를 물리치고 아이템을 획득하세요'
}

export default function DungeonPage() {
  return <DungeonClient />
}