import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { ChartDataPoint, GrowthAnalysis } from '@/lib/ai-coach/types'

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
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="health" 
                  stroke="#96CEB4" 
                  name="건강" 
                  strokeWidth={3} 
                />
                <Line 
                  type="monotone" 
                  dataKey="learning" 
                  stroke="#87CEEB" 
                  name="학습" 
                  strokeWidth={3} 
                />
                <Line 
                  type="monotone" 
                  dataKey="relationship" 
                  stroke="#FFB6C1" 
                  name="관계" 
                  strokeWidth={3} 
                />
                <Line 
                  type="monotone" 
                  dataKey="achievement" 
                  stroke="#FECA57" 
                  name="성취" 
                  strokeWidth={3} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              성장 데이터를 수집 중입니다...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 스탯별 성장 분석 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {growthAnalyses.map((analysis, index) => (
          <Card key={`growth-analysis-${analysis.statType}-${index}`}>
            <CardHeader>
              <CardTitle className="text-lg">
                {analysis.statType === 'health' ? '🏃 건강' :
                 analysis.statType === 'learning' ? '📚 학습' :
                 analysis.statType === 'relationship' ? '🤝 관계' : '🎯 성취'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">일일 성장률</span>
                  <span className="font-semibold">{analysis.growthRate.toFixed(1)} EXP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">추세</span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    analysis.trend === 'improving' ? 'text-green-500' :
                    analysis.trend === 'declining' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {analysis.trend === 'improving' ? '↗' :
                     analysis.trend === 'declining' ? '↘' : '→'}
                    {analysis.trend === 'improving' ? '상승' :
                     analysis.trend === 'declining' ? '하락' : '정체'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">총 활동</span>
                  <span className="font-semibold">{analysis.totalActivities}회</span>
                </div>
                {analysis.lastActivityDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">마지막 활동</span>
                    <span className="text-sm">
                      {new Date(analysis.lastActivityDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {analysis.suggestions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">추천사항</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.suggestions.slice(0, 2).map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}