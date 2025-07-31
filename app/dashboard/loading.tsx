export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-candy-yellow/20 via-candy-pink/20 to-candy-blue/20 p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}