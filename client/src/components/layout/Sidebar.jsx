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
      className={`fixed left-4 top-4 bottom-4 z-40 flex flex-col bg-surface-950 text-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-400 ease-in-out overflow-hidden border border-surface-800/50 ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-20 px-6 border-b border-surface-800/50 ${collapsed ? 'justify-center' : 'gap-4'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgb(37,99,235,0.3)]">
          <Glasses className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fadeIn">
            <h1 className="text-xl font-black tracking-tight text-white">OpticalCRM</h1>
            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest leading-none mt-1">ERP System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
                item.highlight && !isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : isActive
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && !item.highlight && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgb(59,130,246,0.5)]"></div>
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-primary-400 scale-110' : 'group-hover:scale-110'}`} />
              {!collapsed && <span className="tracking-wide z-10">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-surface-800/50 bg-surface-900/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-700 to-surface-800 border border-surface-600 flex items-center justify-center text-sm font-bold shadow-inner">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs font-medium text-surface-400 capitalize">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout & Collapse */}
      <div className="p-4 space-y-2 bg-surface-900/50">
        <button
          onClick={logout}
          className={`flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-sm font-bold text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all cursor-pointer group ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-sm font-bold text-surface-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
