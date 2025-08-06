import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '던전 - Life RPG',
  description: '던전 탐험과 전투',
}

export default function DungeonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}