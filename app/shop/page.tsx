import dynamic from 'next/dynamic'
import { ShopSkeleton } from '@/components/LoadingSkeletons'

const ShopContent = dynamic(
  () => import('./components/ShopContent'),
  {
    loading: () => <ShopSkeleton />
  }
)

export default function ShopPage() {
  return <ShopContent />
}