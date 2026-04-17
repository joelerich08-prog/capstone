'use client'

import { Fragment, useState } from 'react'
import { StockmanShell } from '@/components/layout/stockman-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { Product } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useProducts } from '@/contexts/products-context'
import { useInventory } from '@/contexts/inventory-context'
import { formatPeso } from '@/lib/utils/currency'
import { apiFetch } from '@/lib/api-client'
import { Plus, Search, Package, Eye, Boxes, PackageOpen, ChevronDown, ChevronRight, MoreHorizontal, Edit } from 'lucide-react'
import { usePagination } from '@/hooks/use-pagination'
import { TablePagination } from '@/components/shared/table-pagination'
import { toast } from 'sonner'

export default function StockmanProductsPage() {
  const { permissions } = useAuth()
  const { inventoryLevels } = useInventory()
  const { products, categories, refreshProducts } = useProducts()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})

  // Add form state
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newCostPrice, setNewCostPrice] = useState('')
  const [newWholesalePrice, setNewWholesalePrice] = useState('')
  const [newRetailPrice, setNewRetailPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editCostPrice, setEditCostPrice] = useState('')
  const [editWholesalePrice, setEditWholesalePrice] = useState('')
  const [editRetailPrice, setEditRetailPrice] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter
    return matchesSearch && matchesCategory
  })

  const pagination = usePagination(filteredProducts, { itemsPerPage: 10 })

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsViewOpen(true)
  }

  const toggleProductVariants = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const getProductInventory = (productId: string) => {
    return inventoryLevels.find(inv => inv.productId === productId)
  }

  const getCategoryName = (categoryId: string) =>
    categories.find(category => category.id === categoryId)?.name ?? 'Unknown'

  const resetAddForm = () => {
    setNewName('')
    setNewDescription('')
    setNewCategory('')
    setNewCostPrice('')
    setNewWholesalePrice('')
    setNewRetailPrice('')
  }

  const handleAddProduct = async () => {
    if (!newName.trim() || !newCategory || !newCostPrice || !newWholesalePrice || !newRetailPrice) {
      toast.error('Please fill in all required fields')
      return
    }

    const costPrice = parseFloat(newCostPrice)
    const wholesalePrice = parseFloat(newWholesalePrice)
    const retailPrice = parseFloat(newRetailPrice)

    if (costPrice <= 0 || wholesalePrice <= 0 || retailPrice <= 0) {
      toast.error('Prices must be greater than 0')
      return
    }

    if (wholesalePrice < costPrice) {
      toast.error('Wholesale price must be greater than or equal to cost price')
      return
    }

    if (retailPrice < wholesalePrice) {
      toast.error('Retail price must be greater than or equal to wholesale price')
      return
    }

    setIsSubmitting(true)
    try {
      await apiFetch('products/create.php', {
        method: 'POST',
        body: {
          name: newName.trim(),
          description: newDescription.trim(),
          categoryId: newCategory,
          costPrice,
          wholesalePrice,
          retailPrice,
        },
      })

      toast.success('Product added successfully')
      setIsAddOpen(false)
      resetAddForm()
      refreshProducts()
    } catch (error) {
      const message = error instanceof Error ? error.message.replace('API request failed: ', '') : 'Failed to add product'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditName(product.name)
    setEditDescription(product.description || '')
    setEditCategory(product.categoryId)
    setEditCostPrice(product.costPrice.toString())
    setEditWholesalePrice(product.wholesalePrice.toString())
    setEditRetailPrice(product.retailPrice.toString())
    setEditIsActive(product.isActive)
    setIsEditOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !editName.trim() || !editCategory || !editCostPrice || !editWholesalePrice || !editRetailPrice) {
      toast.error('Please fill in all required fields')
      return
    }

    const costPrice = parseFloat(editCostPrice)
    const wholesalePrice = parseFloat(editWholesalePrice)
    const retailPrice = parseFloat(editRetailPrice)

    if (costPrice <= 0 || wholesalePrice <= 0 || retailPrice <= 0) {
      toast.error('Prices must be greater than 0')
      return
    }

    if (wholesalePrice < costPrice) {
      toast.error('Wholesale price must be greater than or equal to cost price')
      return
    }

    if (retailPrice < wholesalePrice) {
      toast.error('Retail price must be greater than or equal to wholesale price')
      return
    }

    setIsSubmitting(true)
    try {
      await apiFetch('products/update.php', {
        method: 'POST',
        body: {
          id: selectedProduct.id,
          name: editName.trim(),
          description: editDescription.trim(),
          categoryId: editCategory,
          costPrice,
          wholesalePrice,
          retailPrice,
          isActive: editIsActive,
        },
      })

      toast.success('Product updated successfully')
      setIsEditOpen(false)
      setSelectedProduct(null)
      refreshProducts()
    } catch (error) {
      const message = error instanceof Error ? error.message.replace('API request failed: ', '') : 'Failed to update product'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StockmanShell
      title="Products"
      description="View product catalog and stock information"
    >
      <Card>
        <CardContent className="p-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {permissions?.products?.create && (
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="size-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Wholesale Price</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => {
                return (
                  <Fragment key={product.id}>
                    <TableRow>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.variants.length > 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => toggleProductVariants(product.id)}
                              title={expandedProducts[product.id] ? 'Hide variants' : 'Show variants'}
                            >
                              {expandedProducts[product.id] ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          ) : (
                            <span className="flex items-center">
                              <Package className="size-4 text-muted-foreground" />
                            </span>
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {getCategoryName(product.categoryId)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPeso(product.costPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPeso(product.wholesalePrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatPeso(product.retailPrice)}
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              <Eye className="size-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {permissions?.products?.edit && (
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="size-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {expandedProducts[product.id] && product.variants.map((variant) => {
                      const variantWholesalePrice = product.wholesalePrice + variant.priceAdjustment
                      const variantRetailPrice = product.retailPrice + variant.priceAdjustment

                      return (
                        <TableRow key={variant.id} className="bg-muted/20">
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {variant.sku || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="ml-9 flex items-center">
                                <Package className="size-4 text-muted-foreground opacity-60" />
                              </span>
                              <div>
                                <div className="text-sm font-medium">{variant.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Variant of {product.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPeso(product.costPrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPeso(variantWholesalePrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatPeso(variantRetailPrice)}
                          </TableCell>
                          <TableCell>
                            {product.isActive ? (
                              <Badge className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleViewProduct(product)}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your criteria.
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5" />
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">SKU</span>
                  <p className="font-mono font-medium">{selectedProduct.sku}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium">{getCategoryName(selectedProduct.categoryId)}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <p className="font-medium">{selectedProduct.description}</p>
                </div>
              )}

              <Separator />

              <div>
                <span className="text-sm text-muted-foreground">Pricing</span>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-bold tabular-nums">{formatPeso(selectedProduct.costPrice)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Wholesale</p>
                    <p className="font-bold tabular-nums">{formatPeso(selectedProduct.wholesalePrice)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Retail</p>
                    <p className="font-bold tabular-nums">{formatPeso(selectedProduct.retailPrice)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {(() => {
                const inventory = getProductInventory(selectedProduct.id)
                if (!inventory) return null
                return (
                  <div>
                    <span className="text-sm text-muted-foreground">Stock Levels</span>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Boxes className="size-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">{inventory.wholesaleQty}</p>
                        <p className="text-xs text-muted-foreground">Wholesale ({inventory.wholesaleUnit})</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Package className="size-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">{inventory.retailQty}</p>
                        <p className="text-xs text-muted-foreground">Retail ({inventory.retailUnit})</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <PackageOpen className="size-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">{inventory.shelfQty}</p>
                        <p className="text-xs text-muted-foreground">Shelf ({inventory.shelfUnit})</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground text-center">
                      Packaging: {inventory.packsPerBox} packs/box
                    </div>
                  </div>
                )
              })()}

              {selectedProduct.variants.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Variants</span>
                    <div className="space-y-2 mt-2">
                      {selectedProduct.variants.map(v => (
                        <div key={v.id} className="rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {v.name}
                              {v.priceAdjustment !== 0 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({v.priceAdjustment > 0 ? '+' : ''}{formatPeso(v.priceAdjustment)})
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Generated SKU</p>
                          <p className="font-mono text-sm">{v.sku || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product in the catalog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter product description (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Wholesale Price *</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newWholesalePrice}
                  onChange={(e) => setNewWholesalePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail Price *</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRetailPrice}
                  onChange={(e) => setNewRetailPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Product Name *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter product description (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCostPrice">Cost Price *</Label>
                <Input
                  id="editCostPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWholesalePrice">Wholesale Price *</Label>
                <Input
                  id="editWholesalePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editWholesalePrice}
                  onChange={(e) => setEditWholesalePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRetailPrice">Retail Price *</Label>
                <Input
                  id="editRetailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRetailPrice}
                  onChange={(e) => setEditRetailPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StockmanShell>
  )
}
