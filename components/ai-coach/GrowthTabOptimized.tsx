'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ChartDataPoint, GrowthAnalysis } from '@/lib/ai-coach/types'

// 차트 컴포넌트를 동적으로 로드
const ChartComponent = dynamic(
  () => import('./GrowthChart').then(mod => mod.GrowthChart),
  {
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />
    ),
    ssr: false
  }
)

interface GrowthTabProps {
  growthData: ChartDataPoint[]
  growthAnalyses: GrowthAnalysis[]
}

export function GrowthTab({ growthData, growthAnalyses }: GrowthTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>30일 성장 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {growthData.length > 0 ? (
            <ChartComponent data={growthData} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              아직 성장 데이터가 충분하지 않습니다. 
              더 많은 활동을 기록해보세요!
            </p>
          )}
        </CardContent>
      </Card>

      {/* 성장 분석 섹션 */}
      {growthAnalyses.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>AI 성장 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {growthAnalyses.map((analysis, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{analysis.category}</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">트렌드:</span> {analysis.trend}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">패턴:</span> {analysis.patterns.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">추천:</span> {analysis.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}