import type { UserRole, NavItem, RolePermissions } from '@/lib/types'

// Role-based navigation configuration
export const roleNavigations: Record<UserRole, NavItem[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { title: 'POS', href: '/admin/pos', icon: 'ShoppingCart' },
    { title: 'Orders', href: '/admin/orders', icon: 'ClipboardList' },
    { title: 'Transactions', href: '/admin/transactions', icon: 'Receipt' },
    {
      title: 'Inventory',
      href: '/admin/inventory',
      icon: 'Package',
      children: [
        { title: 'Products', href: '/admin/inventory/products' },
        { title: 'Categories', href: '/admin/inventory/categories' },
        { title: 'Stock Levels', href: '/admin/inventory/stock-levels' },
        { title: 'Expiry', href: '/admin/inventory/expiry' },
        { title: 'Forecast', href: '/admin/analytics/forecast' },
        {
          title: 'Operations',
          href: '/admin/inventory/receive',
          matchPaths: [
            '/admin/inventory/receive',
            '/admin/inventory/breakdown',
            '/admin/inventory/transfer',
            '/admin/inventory/adjustments',
            '/admin/inventory/movements',
          ],
        },
        { title: 'Suppliers', href: '/admin/inventory/suppliers' },
      ],
    },
    {
      title: 'Analytics and Reports',
      href: '/admin/analytics',
      icon: 'BarChart3',
      children: [
        { title: 'Profitability', href: '/admin/analytics' },
        { title: 'Sales Summary', href: '/admin/analytics/sales' },
        { title: 'Sales by Item', href: '/admin/analytics/items' },
        { title: 'Alerts', href: '/admin/analytics/alerts' },
        { title: 'Reports', href: '/admin/reports' },
      ],
    },
    { title: 'Users', href: '/admin/users', icon: 'Users' },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
      children: [
        { title: 'General', href: '/admin/settings' },
        { title: 'Activity Log', href: '/admin/settings/activity-log' },
      ],
    },
  ],
  stockman: [
    { title: 'Dashboard', href: '/stockman/dashboard', icon: 'LayoutDashboard' },
    { title: 'POS', href: '/stockman/pos', icon: 'ShoppingCart' },
    {
      title: 'Inventory',
      href: '/stockman/stock-levels',
      icon: 'Package',
      children: [
        { title: 'Products', href: '/stockman/products' },
        { title: 'Categories', href: '/stockman/categories' },
        { title: 'Stock Levels', href: '/stockman/stock-levels' },
        { title: 'Expiry', href: '/stockman/expiry' },
        { title: 'Forecast', href: '/admin/analytics/forecast' },
        {
          title: 'Operations',
          href: '/stockman/receiving',
          matchPaths: [
            '/stockman/receiving',
            '/stockman/breakdown',
            '/stockman/transfer',
            '/stockman/adjustments',
            '/stockman/movements',
          ],
        },
      ],
    },
    { title: 'Suppliers', href: '/stockman/suppliers', icon: 'Truck' },
    { title: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
    { title: 'Settings', href: '/admin/settings', icon: 'Settings' },
    { title: 'Users', href: '/admin/users', icon: 'Users' },
  ],
  cashier: [
    { title: 'Dashboard', href: '/cashier/dashboard', icon: 'LayoutDashboard' },
    { title: 'POS', href: '/cashier/pos', icon: 'ShoppingCart' },
    { title: 'Orders', href: '/cashier/orders', icon: 'ClipboardList' },
    { title: 'Transactions', href: '/cashier/transactions', icon: 'Receipt' },
    { title: 'Suppliers', href: '/admin/inventory/suppliers', icon: 'Truck' },
    { title: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
    { title: 'Settings', href: '/admin/settings', icon: 'Settings' },
    { title: 'Users', href: '/admin/users', icon: 'Users' },
  ],
}

// Get navigation items for a specific role
export function getNavigation(role: UserRole, permissions?: RolePermissions | null): NavItem[] {
  const baseNavigation = roleNavigations[role] || []
  
  if (!permissions) {
    return baseNavigation
  }

  // Filter navigation items based on permissions
  const filterNavigation = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      // Check if the item has a corresponding module permission
      const moduleKey = getModuleKeyFromHref(item.href)
      if (moduleKey && permissions[moduleKey]) {
        // For main navigation items, require view permission
        return permissions[moduleKey].view
      }
      
      // For items without direct module mapping, keep them if their parent is accessible
      // This handles sub-items that don't have direct permission mappings
      return true
    }).map(item => ({
      ...item,
      children: item.children ? filterNavigation(item.children) : undefined
    })).filter(item => {
      // Remove items that have no children after filtering (for parent items)
      if (item.children && item.children.length === 0) {
        return false
      }
      return true
    })
  }

  return filterNavigation(baseNavigation)
}

// Helper function to map href to module key
function getModuleKeyFromHref(href: string): keyof RolePermissions | null {
  if (href.includes('/pos')) return 'pos'
  if (href.includes('/inventory') || href.includes('/stock-levels') || href.includes('/products') || href.includes('/categories')) return 'inventory'
  if (href.includes('/suppliers')) return 'suppliers'
  if (href.includes('/reports') || href.includes('/analytics')) return 'reports'
  if (href.includes('/users')) return 'users'
  if (href.includes('/settings')) return 'settings'
  if (href.includes('/dashboard')) return 'dashboard'
  
  return null
}

// Get the default redirect path for a role after login
export function getDefaultPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'stockman':
      return '/stockman/dashboard'
    case 'cashier':
      return '/cashier/pos'
    default:
      return '/login'
  }
}

// Check if a role can access a specific path
export function canAccessPath(role: UserRole, path: string): boolean {
  const navigation = getNavigation(role)
  
  const checkItems = (items: NavItem[]): boolean => {
    for (const item of items) {
      if (path.startsWith(item.href)) return true
      if (item.matchPaths?.some(matchPath => path === matchPath || path.startsWith(matchPath + '/'))) {
        return true
      }
      if (item.children && checkItems(item.children)) return true
    }
    return false
  }
  
  return checkItems(navigation)
}

// Module permissions per role
export const modulePermissions: Record<UserRole, string[]> = {
  admin: ['dashboard', 'pos', 'orders', 'transactions', 'inventory', 'analytics', 'settings', 'users'],
  stockman: ['dashboard', 'inventory', 'suppliers'],
  cashier: ['dashboard', 'pos', 'transactions', 'history'],
}

export function hasModuleAccess(role: UserRole, module: string): boolean {
  return modulePermissions[role]?.includes(module) || false
}
