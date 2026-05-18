import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Glasses, Warehouse, Truck, Globe, Receipt, MessageCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/inventory', label: 'Inventory', icon: Warehouse },
  { path: '/purchase-orders', label: 'Purchases', icon: Truck },
  { path: '/sales', label: 'Sales', icon: Receipt },
  { path: '/online-orders', label: 'Online Orders', icon: Globe },
  { path: '/create-bill', label: 'Create Bill', icon: ShoppingCart, highlight: true },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/communication', label: 'Campaigns', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-900 text-white transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-surface-800 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Glasses className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold tracking-tight">OpticalCRM</h1>
            <p className="text-[10px] text-surface-400 leading-none">ERP System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                item.highlight && !isActive
                  ? 'bg-primary-600 hover:bg-primary-500 text-white'
                  : isActive
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-surface-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-surface-400 capitalize">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout & Collapse */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-surface-400 hover:text-danger-400 hover:bg-white/5 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-surface-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
