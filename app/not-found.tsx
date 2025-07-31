import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center px-6">
        <h1 className="text-9xl font-black text-gray-300 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          모험을 계속하려면 홈으로 돌아가세요.
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-full hover:from-blue-700 hover:to-blue-900 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            🏠 홈으로 돌아가기
          </Link>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              또는 대시보드로 이동 →
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-6xl animate-bounce">
          💀
        </div>
      </div>
    </div>
  )
}
