'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { incidentVolumeData } from '@/lib/mock-data'
import { severityChartColors } from '@/lib/presentation'

export function IncidentVolumeChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Incident Volume by Severity</CardTitle>
        <CardDescription>Daily incident count breakdown by severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incidentVolumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend wrapperStyle={{ color: 'var(--foreground)' }} />
            <Bar dataKey="critical" stackId="a" fill={severityChartColors.critical} name="Critical" />
            <Bar dataKey="high" stackId="a" fill={severityChartColors.high} name="High" />
            <Bar dataKey="medium" stackId="a" fill={severityChartColors.medium} name="Medium" />
            <Bar dataKey="low" stackId="a" fill={severityChartColors.low} name="Low" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
