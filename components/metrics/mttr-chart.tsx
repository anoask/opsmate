'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mttrTrendData } from '@/lib/mock-data'

export function MTTRChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Mean Time to Resolution (MTTR)</CardTitle>
        <CardDescription>Average incident resolution time trend (in minutes)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mttrTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value} min`, 'MTTR']}
            />
            <Legend wrapperStyle={{ color: 'var(--foreground)' }} />
            <Line
              type="monotone"
              dataKey="mttr"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--accent)', r: 5 }}
              activeDot={{ r: 7 }}
              name="MTTR (minutes)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
