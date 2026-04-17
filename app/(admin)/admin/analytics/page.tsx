'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatCard } from '@/components/shared/stat-card'
import { DatePickerWithRange } from '@/components/shared/date-range-picker'
import { formatCurrency, formatPesoShort } from '@/lib/utils/currency'
import { apiFetch } from '@/lib/api-client'
import type { DateRange } from 'react-day-picker'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Zap,
  Award,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'

const PROFIT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const COST_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16']

interface ProfitabilityMetrics {
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number
}

interface CategoryProfitability {
  category: string
  revenue: number
  profit: number
  margin: number
  percentage: number
}

interface ProductProfitability {
  productId: string
  name: string
  revenue: number
  profit: number
  margin: number
  quantity: number
  trend: number
}

interface TimeSeriesData {
  date: string
  revenue: number
  profit: number
  margin: number
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export default function ProfitabilityAnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '14' | '30' | '90' | 'custom'>('30')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [metrics, setMetrics] = useState<ProfitabilityMetrics | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryProfitability[]>([])
  const [productData, setProductData] = useState<ProductProfitability[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<ProfitabilityMetrics | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const days = period === 'custom' && dateRange?.from && dateRange?.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : parseInt(period === 'custom' ? '30' : period)

  const fetchProfitabilityData = async () => {
    setIsLoading(true)
    setAnalyticsError(null)
    try {
      const params = new URLSearchParams()
      params.set('period', period)

      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'))
        params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'))
      }

      const result = await apiFetch<{
        metrics: ProfitabilityMetrics
        categoryData: CategoryProfitability[]
        productData: ProductProfitability[]
        timeSeriesData: TimeSeriesData[]
        previousPeriodMetrics: ProfitabilityMetrics
      }>(`analytics/profitability.php?${params.toString()}`)

      setMetrics(result.metrics)
      setCategoryData(result.categoryData)
      setProductData(result.productData)
      setTimeSeriesData(result.timeSeriesData)
      setPreviousPeriodMetrics(result.previousPeriodMetrics)
    } catch (error) {
      console.error('Failed to load profitability analytics:', error)
      setAnalyticsError(error instanceof Error ? error.message : 'Unable to load profitability analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfitabilityData()
  }, [period, dateRange])

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const profitGrowth = metrics && previousPeriodMetrics
    ? calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit)
    : 0

  const marginGrowth = metrics && previousPeriodMetrics
    ? calculateGrowth(metrics.profitMargin, previousPeriodMetrics.profitMargin)
    : 0

  const handleExportReport = () => {
    if (!metrics) return

    const startDate = period === 'custom' && dateRange?.from
      ? dateRange.from
      : subDays(new Date(), days - 1)
    const endDate = period === 'custom' && dateRange?.to
      ? dateRange.to
      : new Date()

    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')

    const rows: Array<Array<string | number>> = [
      ['KAKAI\'S KUTKUTIN PROFITABILITY REPORT'],
      ['Period', `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`],
      ['Generated On', format(new Date(), 'MMMM d, yyyy h:mm a')],
      [''],
      ['SUMMARY METRICS'],
      ['Total Sales', formatCurrency(metrics.totalRevenue)],
      ['Gross Profit', formatCurrency(metrics.grossProfit)],
      ['Profit Margin', `${metrics.profitMargin.toFixed(2)}%`],
      [''],
      ['PERIOD COMPARISON'],
    ]

    if (previousPeriodMetrics) {
      rows.push(
        ['Previous Period Sales', formatCurrency(previousPeriodMetrics.totalRevenue)],
        ['Sales Growth', `${calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue).toFixed(2)}%`],
        ['Previous Period Profit', formatCurrency(previousPeriodMetrics.grossProfit)],
        ['Profit Growth', `${calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit).toFixed(2)}%`],
        ['Previous Period Margin', `${previousPeriodMetrics.profitMargin.toFixed(2)}%`],
        ['Margin Growth', `${calculateGrowth(metrics.profitMargin, previousPeriodMetrics.profitMargin).toFixed(2)}%`],
      )
    }

    rows.push([''], ['TOP PRODUCTS BY PROFITABILITY'])

    productData.slice(0, 10).forEach(product => {
      rows.push([
        product.name,
        formatCurrency(product.revenue),
        formatCurrency(product.profit),
        `${product.margin.toFixed(1)}%`,
        product.quantity,
        `${product.trend >= 0 ? '+' : ''}${product.trend.toFixed(1)}%`
      ])
    })

    const csvContent = rows.map(row => row.map(escapeCsvValue).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `profitability-report_${startDateStr}_to_${endDateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <DashboardShell
        title="Profitability Analytics"
        description="Advanced profitability analysis and insights"
        allowedRoles={['admin']}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profitability analytics...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (analyticsError || !metrics) {
    return (
      <DashboardShell
        title="Profitability Analytics"
        description="Advanced profitability analysis and insights"
        allowedRoles={['admin']}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{analyticsError || 'Failed to load analytics data'}</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Profitability Analytics"
      description="Advanced profitability analysis and business insights for Kakai's Kutkutin"
      allowedRoles={['admin']}
    >
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          )}
        </div>
        <Button variant="outline" onClick={handleExportReport}>
          <Download className="mr-2 size-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          trend={previousPeriodMetrics ? {
            value: `${calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue) >= 0 ? '+' : ''}${calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue).toFixed(1)}%`,
            positive: calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue) >= 0,
          } : undefined}
          description="vs previous period"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(metrics.grossProfit)}
          icon={TrendingUp}
          trend={previousPeriodMetrics ? {
            value: `${calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit) >= 0 ? '+' : ''}${calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit).toFixed(1)}%`,
            positive: calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit) >= 0,
          } : undefined}
          description="vs previous period"
        />
        <StatCard
          title="Profit Margin"
          value={`${metrics.profitMargin.toFixed(1)}%`}
          icon={Target}
          trend={previousPeriodMetrics ? {
            value: `${calculateGrowth(metrics.profitMargin, previousPeriodMetrics.profitMargin) >= 0 ? '+' : ''}${calculateGrowth(metrics.profitMargin, previousPeriodMetrics.profitMargin).toFixed(1)}%`,
            positive: calculateGrowth(metrics.profitMargin, previousPeriodMetrics.profitMargin) >= 0,
          } : undefined}
          description="vs previous period"
        />
      </div>

      {/* Advanced Metrics */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales vs Profit Overview</CardTitle>
            <CardDescription>Revenue and profit comparison for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.grossProfit)}</p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</p>
                  <Progress value={Math.min(metrics.profitMargin, 100)} className="flex-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Insights</CardTitle>
            <CardDescription>Key profitability indicators and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.profitMargin >= 20 ? (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Strong Profitability</p>
                    <p className="text-xs text-green-700">Your profit margin is healthy at {metrics.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              ) : metrics.profitMargin >= 10 ? (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Moderate Profitability</p>
                    <p className="text-xs text-yellow-700">Consider optimizing pricing or reducing costs</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Low Profitability</p>
                    <p className="text-xs text-red-700">Review pricing strategy and cost management</p>
                  </div>
                </div>
              )}

              {previousPeriodMetrics && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Period Comparison</span>
                    <div className="flex gap-2">
                      <Badge variant={calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue) >= 0 ? 'default' : 'destructive'}>
                        Sales: {calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue) >= 0 ? '+' : ''}{calculateGrowth(metrics.totalRevenue, previousPeriodMetrics.totalRevenue).toFixed(1)}%
                      </Badge>
                      <Badge variant={calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit) >= 0 ? 'default' : 'destructive'}>
                        Profit: {calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit) >= 0 ? '+' : ''}{calculateGrowth(metrics.grossProfit, previousPeriodMetrics.grossProfit).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-1 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Profit Trend Analysis</CardTitle>
            <CardDescription>Revenue and profit performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value: any) => formatPesoShort(Number(value))}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Sales"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.8}
                    name="Gross Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products by Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Profitability</CardTitle>
          <CardDescription>Most profitable products with performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.slice(0, 8).map((product, index) => (
              <div key={`${product.productId}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} units sold • {formatCurrency(product.revenue)} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCurrency(product.profit)}</span>
                    <Badge variant={product.margin >= 30 ? 'default' : product.margin >= 20 ? 'secondary' : 'destructive'}>
                      {product.margin.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {product.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${product.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.trend >= 0 ? '+' : ''}{product.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}