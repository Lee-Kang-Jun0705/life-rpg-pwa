import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory | Life RPG',
  description: '인벤토리 관리',
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}