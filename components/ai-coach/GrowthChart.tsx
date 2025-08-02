'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { ChartDataPoint } from '@/lib/ai-coach/types'

interface GrowthChartProps {
  data: ChartDataPoint[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
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
  )
}
