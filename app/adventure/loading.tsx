import { DungeonSkeleton } from '@/components/LoadingSkeletons'

export default function Loading() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-6 w-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <DungeonSkeleton />
      </div>
    </div>
  )
}