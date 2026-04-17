'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'

interface ProfitabilitySummaryProps {
  revenue: number
  profit: number
  cost: number
  margin: number
  description?: string
}

export function ProfitabilitySummary({ revenue, profit, cost, margin, description }: ProfitabilitySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profitability Summary</CardTitle>
        <CardDescription>{description ?? 'Key profitability metrics for the selected period'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(cost)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Gross Profit</p>
            <p className="text-2xl font-bold">{formatCurrency(profit)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className="text-2xl font-bold">{margin.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
