"use client"

import { useMemo, useState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/shared/date-range-picker"
import { SalesReportLive } from "@/components/reports/sales-report-live"
import { InventoryReportLive } from "@/components/reports/inventory-report-live"
import { Download, TrendingUp, Package, ShoppingCart, AlertTriangle } from "lucide-react"
import { addDays, endOfDay, format, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useTransactions } from "@/contexts/transaction-context"
import { useProducts } from "@/contexts/products-context"
import { useInventory } from "@/contexts/inventory-context"
import { formatCurrency } from "@/lib/utils/currency"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  dateRange: {
    fontSize: 12,
    marginBottom: 5,
  },
  generated: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #ccc',
    paddingBottom: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 2,
  },
  label: {
    fontWeight: 'bold',
  },
  value: {
    textAlign: 'right',
  },
})

const ReportDocument = ({ data, activeTab, dateRange }: { data: any, activeTab: string, dateRange: { from: Date, to: Date } }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Kakai's Kutkutin</Text>
        <Text style={styles.subtitle}>Business Report</Text>
        <Text style={styles.dateRange}>
          Report Period: {format(dateRange.from, "MMM dd, yyyy")} to {format(dateRange.to, "MMM dd, yyyy")}
        </Text>
        <Text style={styles.generated}>
          Generated: {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
        </Text>
      </View>

      {activeTab === "overview" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total Sales Revenue:</Text>
            <Text style={styles.value}>{formatCurrency(data.totalSales)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Number of Transactions:</Text>
            <Text style={styles.value}>{data.totalTransactions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Average Transaction Value:</Text>
            <Text style={styles.value}>{formatCurrency(data.avgTransactionValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total Inventory Value:</Text>
            <Text style={styles.value}>{formatCurrency(data.totalInventoryValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Items with Low Stock:</Text>
            <Text style={styles.value}>{data.lowStockItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Items Out of Stock:</Text>
            <Text style={styles.value}>{data.outOfStockItems}</Text>
          </View>
        </View>
      )}

      {activeTab === "sales" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Performance Report</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total Revenue:</Text>
            <Text style={styles.value}>{formatCurrency(data.totalSales)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Number of Transactions:</Text>
            <Text style={styles.value}>{data.totalTransactions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Average Order Value:</Text>
            <Text style={styles.value}>{formatCurrency(data.avgTransactionValue)}</Text>
          </View>
        </View>
      )}

      {activeTab === "inventory" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Status Report</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total Inventory Value:</Text>
            <Text style={styles.value}>{formatCurrency(data.totalInventoryValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Items with Low Stock:</Text>
            <Text style={styles.value}>{data.lowStockItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Items Out of Stock:</Text>
            <Text style={styles.value}>{data.outOfStockItems}</Text>
          </View>
        </View>
      )}
    </Page>
  </Document>
)

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")
  const { transactions } = useTransactions()
  const { products, categories } = useProducts()
  const { inventoryLevels } = useInventory()

  const effectiveRange = useMemo(() => {
    const from = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(addDays(new Date(), -30))
    const to = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date())
    return { from, to }
  }, [dateRange])

  const filteredTransactions = useMemo(
    () => transactions.filter(tx => {
      const createdAt = new Date(tx.createdAt)
      return createdAt >= effectiveRange.from && createdAt <= effectiveRange.to
    }),
    [transactions, effectiveRange]
  )

  const productById = useMemo(() => new Map(products.map(product => [product.id, product])), [products])
  const categoryNameById = useMemo(() => new Map(categories.map(category => [category.id, category.name])), [categories])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0)
    const totalTransactions = filteredTransactions.length
    const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

    const totalInventoryValue = inventoryLevels.reduce((sum, level) => {
      const product = productById.get(level.productId)
      const cost = product?.costPrice ?? 0
      return sum + ((level.wholesaleQty + level.retailQty + level.shelfQty) * cost)
    }, 0)

    const lowStockItems = inventoryLevels.filter(level => {
      const totalStock = level.wholesaleQty + level.retailQty + level.shelfQty
      return totalStock <= (level.shelfRestockLevel || 0)
    }).length

    const outOfStockItems = inventoryLevels.filter(level =>
      level.wholesaleQty + level.retailQty + level.shelfQty === 0
    ).length

    return {
      totalSales,
      totalTransactions,
      avgTransactionValue,
      totalInventoryValue,
      lowStockItems,
      outOfStockItems,
      totalProducts: products.length,
    }
  }, [filteredTransactions, inventoryLevels, productById, products.length])

  // Sales by category data for chart
  const salesByCategory = useMemo(() => {
    const categorySales = new Map<string, number>()

    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const product = productById.get(item.productId)
        if (product) {
          const categoryName = categoryNameById.get(product.categoryId) || 'Uncategorized'
          categorySales.set(categoryName, (categorySales.get(categoryName) || 0) + (item.subtotal || 0))
        }
      })
    })

    return Array.from(categorySales.entries())
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales)
  }, [filteredTransactions, productById, categoryNameById])

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()

    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const product = productById.get(item.productId)
        if (product) {
          const existing = productSales.get(product.id) || { name: product.name, quantity: 0, revenue: 0 }
          productSales.set(product.id, {
            name: product.name,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.subtotal || 0)
          })
        }
      })
    })

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredTransactions, productById])

  const handleExportPdf = async () => {
    const blob = await pdf(
      <ReportDocument
        data={summaryMetrics}
        activeTab={activeTab}
        dateRange={effectiveRange}
      />
    ).toBlob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeTab}-report_${format(effectiveRange.from, "yyyy-MM-dd")}_to_${format(effectiveRange.to, "yyyy-MM-dd")}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardShell title="Reports" description="Comprehensive inventory and sales reports for Kakai's Kutkutin" allowedRoles={["admin"]}>
      <div className="flex flex-col gap-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                {summaryMetrics.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.avgTransactionValue)}</div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalInventoryValue)}</div>
              <p className="text-xs text-muted-foreground">
                At cost price
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summaryMetrics.lowStockItems + summaryMetrics.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                {summaryMetrics.lowStockItems} low, {summaryMetrics.outOfStockItems} out
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Revenue distribution across product categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategory}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="sales"
                          label={({ category, sales }) => `${category}: ${formatCurrency(sales)}`}
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performing products by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.slice(0, 5).map((product, index) => (
                      <div key={`${product.name}-${index}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance Report</CardTitle>
                <CardDescription>
                  Comprehensive sales analysis for the selected period ({format(effectiveRange.from, "MMM d")} - {format(effectiveRange.to, "MMM d, yyyy")})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesReportLive dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status Report</CardTitle>
                <CardDescription>
                  Complete inventory overview and stock level analysis ({format(effectiveRange.from, "MMM d")} - {format(effectiveRange.to, "MMM d, yyyy")})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryReportLive dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
