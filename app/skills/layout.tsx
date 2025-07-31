import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skills | Life RPG',
  description: '스킬 관리 및 사용',
}

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}