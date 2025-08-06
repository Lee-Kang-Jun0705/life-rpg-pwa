import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프로필 - Life RPG',
  description: '나의 성장 프로필',
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}