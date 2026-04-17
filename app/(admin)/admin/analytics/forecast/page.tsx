'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiFetch } from '@/lib/api-client'
import { usePagination } from '@/hooks/use-pagination'
import { TablePagination } from '@/components/shared/table-pagination'
import {
  AlertTriangle,
  Clock,
  ShoppingCart,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

interface StockForecastItem {
  id: string
  name: string
  currentStock: number
  avgDailySales: number
  daysUntilStockout: number
  reorderPoint: number
  inventoryTurnover: number
  needsReorder: boolean
  status: 'critical' | 'warning' | 'healthy'
}

export default function ForecastPage() {
  const [stockForecast, setStockForecast] = useState<StockForecastItem[]>([])
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForecast = async () => {
      setIsLoading(true)
      setAnalyticsError(null)
      try {
        const result = await apiFetch<{
          stockForecast: StockForecastItem[]
        }>('/api/analytics/forecast.php')

        setStockForecast(result.stockForecast)
      } catch (error) {
        console.error('Failed to load forecast analytics:', error)
        setAnalyticsError(error instanceof Error ? error.message : 'Unable to load forecast analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForecast()
  }, [])

  const needsReorder = stockForecast.filter(item => item.needsReorder).length
  const averageStockDays = stockForecast.length > 0
    ? stockForecast.reduce((sum, item) => sum + item.daysUntilStockout, 0) / stockForecast.length
    : 0

  const pagination = usePagination(stockForecast, { itemsPerPage: 8 })
  const displayedForecastItems = pagination.paginatedItems

  if (isLoading) {
    return (
      <DashboardShell
        title="Inventory Forecast"
        description="Predicts when products will run out of stock based on current sales patterns"
        allowedRoles={['admin', 'stockman']}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading forecast data...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (analyticsError) {
    return (
      <DashboardShell
        title="Inventory Forecast"
        description="Predicts when products will run out of stock based on current sales patterns"
        allowedRoles={['admin', 'stockman']}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="size-8 mx-auto mb-2" />
              <p className="font-medium">Error loading forecast data</p>
              <p className="text-sm text-muted-foreground mt-1">{analyticsError}</p>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Inventory Forecast"
      description="Predicts when products will run out of stock based on current sales patterns"
      allowedRoles={['admin', 'stockman']}
    >
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
                <ShoppingCart className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Needing Reorder</p>
                <p className="text-xl font-bold">{needsReorder}</p>
                <p className="text-xs text-muted-foreground">Below reorder point</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Days Until Stockout</p>
                <p className="text-xl font-bold">{averageStockDays.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Across all products</p>
              </div>
              <Clock className="size-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-bold">{stockForecast.length}</p>
                <p className="text-xs text-muted-foreground">In inventory forecast</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Depletion Forecast</CardTitle>
          <CardDescription>
            Shows how many days until each product runs out based on current sales velocity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedForecastItems.map((item, index) => (
              <div key={`${item.id}-${pagination.startIndex + index}`} className="rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge
                        variant={
                          item.status === 'critical' ? 'destructive' :
                          item.status === 'warning' ? 'secondary' :
                          'default'
                        }
                      >
                        {item.status === 'critical' ? 'Critical' :
                         item.status === 'warning' ? 'Low' :
                         'Healthy'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Current: {item.currentStock} units | Sells ~{item.avgDailySales}/day
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      item.status === 'critical' ? 'text-red-600' :
                      item.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {item.daysUntilStockout} days
                    </p>
                    <p className="text-xs text-muted-foreground">until stockout</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stock Level</span>
                    <span>{item.currentStock} / {item.reorderPoint * 3} (max)</span>
                  </div>
                  <Progress
                    value={Math.min((item.currentStock / (item.reorderPoint * 3)) * 100, 100)}
                    className={`h-2 ${
                      item.status === 'critical' ? '[&>div]:bg-red-500' :
                      item.status === 'warning' ? '[&>div]:bg-yellow-500' :
                      ''
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Inventory Turnover</span>
                    <span>{item.inventoryTurnover.toFixed(2)}x</span>
                  </div>
                </div>
                {item.needsReorder && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-orange-600">
                    <AlertTriangle className="size-4" />
                    <span>Below reorder point ({item.reorderPoint} units)</span>
                    <ArrowRight className="size-4 ml-auto" />
                    <span className="font-medium">Order Now</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.goToPage}
            onPrevPage={pagination.goToPrevPage}
            onNextPage={pagination.goToNextPage}
            onItemsPerPageChange={pagination.setItemsPerPage}
          />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
