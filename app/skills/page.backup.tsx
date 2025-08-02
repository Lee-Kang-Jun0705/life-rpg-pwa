import dynamic from 'next/dynamic'

const SkillsContent = dynamic(
  () => import('./components/SkillsContent'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }
)

export default function SkillsPage() {
  return <SkillsContent />
}
